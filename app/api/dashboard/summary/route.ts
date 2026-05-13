import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { bikeSystems } from "@/lib/systems";

export async function GET() {
    const result = await pool.query(`
    SELECT COUNT(DISTINCT recorded_at) AS snapshot_count
    FROM station_snapshots
  `);

    return NextResponse.json({
        snapshotCount: Number(result.rows[0].snapshot_count),
        systemCount: bikeSystems.length,
    });
}