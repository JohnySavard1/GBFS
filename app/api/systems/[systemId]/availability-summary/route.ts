import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
    request: Request,
    context: { params: Promise<{ systemId: string }> }
) {
    const { systemId } = await context.params;

    const result = await pool.query(
        `
            WITH latest_per_station AS (
                SELECT DISTINCT ON (station_id)
                station_id,
                bikes_available
            FROM station_snapshots
            WHERE system_id = $1
            ORDER BY station_id, recorded_at DESC
                )
            SELECT
                COUNT(*) FILTER (WHERE bikes_available = 0) AS red_count,
                COUNT(*) FILTER (WHERE bikes_available > 0 AND bikes_available <= 3) AS orange_count,
                COUNT(*) FILTER (WHERE bikes_available > 3) AS green_count
            FROM latest_per_station;
    WHERE system_id = $1
      AND recorded_at = (SELECT recorded_at FROM latest_snapshot)
    `,
        [systemId]
    );

    return NextResponse.json({
        red: Number(result.rows[0].red_count),
        orange: Number(result.rows[0].orange_count),
        green: Number(result.rows[0].green_count),
    });
}