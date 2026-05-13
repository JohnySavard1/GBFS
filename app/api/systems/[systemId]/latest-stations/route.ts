import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { bikeSystems } from "@/lib/systems";

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
        const result = await pool.query(
            `
                SELECT DISTINCT ON (station_id)
                    system_id,
                    city,
                    provider,
                    station_id,
                    station_name,
                    lat,
                    lon,
                    recorded_at,
                    bikes_available,
                    docks_available
                FROM station_snapshots
                WHERE system_id = $1
                  AND lat IS NOT NULL
                  AND lon IS NOT NULL
                ORDER BY station_id, recorded_at DESC;
            `,
            [systemId]
        );

        return NextResponse.json({
            system,
            count: result.rows.length,
            stations: result.rows,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: `Erreur pendant le chargement des stations de ${systemId}` },
            { status: 500 }
        );
    }
}