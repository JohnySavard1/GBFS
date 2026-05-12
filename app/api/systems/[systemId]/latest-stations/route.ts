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
      WITH latest_snapshot AS (
        SELECT MAX(recorded_at) AS recorded_at
        FROM station_snapshots
        WHERE system_id = $1
      )
      SELECT
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
        AND recorded_at = (SELECT recorded_at FROM latest_snapshot)
        AND lat IS NOT NULL
        AND lon IS NOT NULL
      ORDER BY station_name ASC;
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