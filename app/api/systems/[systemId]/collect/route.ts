import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { bikeSystems } from "@/lib/systems";
import { getGbfsFeedUrl } from "@/lib/gbfs";

type StationStatus = {
    station_id: string;
    num_bikes_available?: number;
    num_docks_available?: number;
    num_bikes_disabled?: number;
    num_docks_disabled?: number;
    vehicle_types_available?: {
        vehicle_type_id: string;
        count: number;
    }[];
};

type StationInformation = {
    station_id: string;
    name?: unknown;
    lat?: number;
    lon?: number;
    capacity?: number;
};

function getAvailableBikes(station: StationStatus) {
    if (typeof station.num_bikes_available === "number") {
        if (station.num_bikes_available > 0) {
            return station.num_bikes_available;
        }
    }

    const vehicleTypes = (station as any).vehicle_types_available;

    if (Array.isArray(vehicleTypes)) {
        return vehicleTypes.reduce((total, vehicleType) => {
            return total + (vehicleType.count ?? 0);
        }, 0);
    }

    return station.num_bikes_available ?? 0;
}

function getStationName(name: unknown): string | null {
    if (!name) return null;

    if (typeof name === "string") {
        try {
            const parsed = JSON.parse(name);

            if (Array.isArray(parsed)) {
                const frenchName = parsed.find((item) => item.language === "fr");
                const englishName = parsed.find((item) => item.language === "en");

                return frenchName?.text ?? englishName?.text ?? parsed[0]?.text ?? name;
            }
        } catch {
            return name;
        }

        return name;
    }

    if (Array.isArray(name)) {
        const frenchName = name.find((item) => item.language === "fr");
        const englishName = name.find((item) => item.language === "en");

        return frenchName?.text ?? englishName?.text ?? name[0]?.text ?? null;
    }

    return String(name);
}

export async function GET(
    request: Request,
    context: { params: Promise<{ systemId: string }> }
) {
    const { systemId } = await context.params;

    const system = bikeSystems.find((s) => s.id === systemId);

    if (!system) {
        return NextResponse.json(
            { error: `Système inconnu: ${systemId}` },
            { status: 404 }
        );
    }

    try {
        const stationStatusUrl =
            system.stationStatusUrl ?? (await getGbfsFeedUrl(system, "station_status"));
        const stationInformationUrl =
            system.stationInformationUrl ??
            (await getGbfsFeedUrl(system, "station_information"));

        const response = await fetch(stationStatusUrl, { cache: "no-store" });
        const infoResponse = await fetch(stationInformationUrl, {
            cache: "no-store",
        });

        if (!infoResponse.ok) {
            return NextResponse.json(
                { error: `Erreur station_information pour ${system.id}` },
                { status: infoResponse.status }
            );
        }

        const infoData = await infoResponse.json();

        const infoById = new Map<string, StationInformation>(
            (infoData.data.stations ?? []).map((station: StationInformation) => [
                station.station_id,
                station,
            ])
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Erreur station_status pour ${system.id}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        const stations: StationStatus[] = data.data.stations ?? [];
        const timestamp =
            typeof data.last_updated === "number"
                ? data.last_updated
                : Math.floor(Date.now() / 1000);

        const recordedAt = new Date(timestamp * 1000);

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            for (const station of stations) {
                const info = infoById.get(station.station_id);
                const bikesAvailable = getAvailableBikes(station);
                const docksAvailable = station.num_docks_available ?? 0;

                const lastSnapshot = await client.query(
                    `
                SELECT bikes_available, docks_available
                FROM station_snapshots
                WHERE system_id = $1
                  AND station_id = $2
                ORDER BY recorded_at DESC
                LIMIT 1
                `,
                                [system.id, station.station_id]
                );

                const last = lastSnapshot.rows[0];

                if (
                    last &&
                    last.bikes_available === bikesAvailable &&
                    last.docks_available === docksAvailable
                ) {
                    continue;
                }

                await client.query(
                    `
                        INSERT INTO station_snapshots
                        (
                            system_id,
                            city,
                            provider,
                            station_id,
                            station_name,
                            lat,
                            lon,
                            recorded_at,
                            bikes_available,
                            docks_available,
                            capacity,
                            bikes_disabled,
                            docks_disabled
                        )
                        VALUES
                            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    `,
                    [
                        system.id,
                        system.city,
                        system.provider,
                        station.station_id,
                        getStationName(info?.name),
                        info?.lat ?? null,
                        info?.lon ?? null,
                        recordedAt,
                        bikesAvailable,
                        docksAvailable,
                        info?.capacity ?? null,
                        station.num_bikes_disabled ?? 0,
                        station.num_docks_disabled ?? 0,
                    ]
                );
            }

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

        return NextResponse.json({
            success: true,
            systemId: system.id,
            city: system.city,
            provider: system.provider,
            recordedAt,
            stationsSaved: stations.length,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: `Erreur pendant la collecte de ${system.id}` },
            { status: 500 }
        );
    }
}
