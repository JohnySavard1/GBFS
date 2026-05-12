import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    try {
        const result = await pool.query(`
      SELECT
        station_id,
        date_trunc('hour', recorded_at) AS hour,
        AVG(bikes_available) AS avg_bikes
      FROM station_snapshots
      WHERE city = 'Montreal'
      GROUP BY station_id, date_trunc('hour', recorded_at)
      ORDER BY hour ASC, station_id ASC;
    `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Erreur lors du calcul des moyennes horaires" },
            { status: 500 }
        );
    }
}