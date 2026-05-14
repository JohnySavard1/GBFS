import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

function escapeCsv(value: unknown) {
    if (value === null || value === undefined) return "";
    return `"${String(value).replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const systemId = searchParams.get("systemId");

    const query = systemId
        ? `
      SELECT *
      FROM station_snapshots
      WHERE system_id = $1
      ORDER BY system_id, station_id, recorded_at
    `
        : `
      SELECT *
      FROM station_snapshots
      ORDER BY system_id, station_id, recorded_at
    `;

    const values = systemId ? [systemId] : [];

    const result = await pool.query(query, values);

    const headers = [
        "id",
        "system_id",
        "city",
        "provider",
        "station_id",
        "station_name",
        "lat",
        "lon",
        "recorded_at",
        "bikes_available",
        "docks_available",
    ];

    const rows = result.rows.map((row) =>
        headers.map((header) => escapeCsv(row[header])).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    const filename = systemId
        ? `${systemId}_snapshots.csv`
        : "all_systems_snapshots.csv";

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}