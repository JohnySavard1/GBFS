import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
    request: Request,
    context: {
        params: Promise<{
            systemId: string;
            stationId: string;
        }>;
    }
) {
    const { systemId, stationId } = await context.params;

    try {
        const result = await pool.query(
            `
      SELECT
        recorded_at,
        bikes_available,
        docks_available
      FROM station_snapshots
      WHERE system_id = $1
        AND station_id = $2
      ORDER BY recorded_at ASC
      `,
            [systemId, stationId]
        );

        return NextResponse.json({
            systemId,
            stationId,
            count: result.rows.length,
            history: result.rows,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Erreur pendant le chargement de l'historique" },
            { status: 500 }
        );
    }
}