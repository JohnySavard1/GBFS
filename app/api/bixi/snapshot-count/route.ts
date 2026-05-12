import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    const result = await pool.query(`
    SELECT COUNT(DISTINCT recorded_at) AS snapshot_count
    FROM station_snapshots
    WHERE city = 'Montreal'
  `);

    return NextResponse.json({
        snapshotCount: Number(result.rows[0].snapshot_count),
    });
}