import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

type BixiStation = {
    station_id: string;
    num_bikes_available: number;
    num_docks_available: number;
};

export async function GET() {
    try {
        const response = await fetch(
            "https://gbfs.velobixi.com/gbfs/en/station_status.json",
            { cache: "no-store" }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: "Erreur en récupérant les données BIXI" },
                { status: 500 }
            );
        }

        const data = await response.json();

        const stations: BixiStation[] = data.data.stations;
        const recordedAt = new Date(data.last_updated * 1000);

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            for (const station of stations) {
                await client.query(
                    `
          INSERT INTO station_snapshots
            (city, station_id, recorded_at, bikes_available, docks_available)
          VALUES
            ($1, $2, $3, $4, $5)
          `,
                    [
                        "Montreal",
                        station.station_id,
                        recordedAt,
                        station.num_bikes_available,
                        station.num_docks_available,
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
            city: "Montreal",
            recordedAt,
            stationsSaved: stations.length,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Erreur pendant la sauvegarde BIXI" },
            { status: 500 }
        );
    }
}