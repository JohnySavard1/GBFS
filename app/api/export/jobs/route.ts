import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
    const body = await request.json();
    const systemId = body.systemId ?? null;
    const reportType = body.reportType ?? "full";

    const result = await pool.query(
        `
            INSERT INTO export_jobs (system_id, report_type)
            VALUES ($1, $2)
                RETURNING id, system_id, report_type, status, created_at
        `,
        [systemId, reportType]
    );

    return NextResponse.json({
        jobId: result.rows[0].id,
        job: result.rows[0],
    });
}

export async function GET() {
    const result = await pool.query(`
    SELECT *
    FROM export_jobs
    ORDER BY created_at DESC
    LIMIT 20
  `);

    return NextResponse.json({
        jobs: result.rows,
    });
}