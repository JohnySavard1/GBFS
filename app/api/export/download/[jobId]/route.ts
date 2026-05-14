import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const EXPORT_DIR = "/app/exports";

export async function GET(
    request: Request,
    context: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await context.params;

    const result = await pool.query(
        `
    SELECT *
    FROM export_jobs
    WHERE id = $1
    `,
        [jobId]
    );

    const job = result.rows[0];

    if (!job) {
        return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
    }

    if (job.status !== "done" || !job.file_path) {
        return NextResponse.json(
            { error: "Export pas encore prêt" },
            { status: 400 }
        );
    }

    const fileName = path.basename(job.file_path);
    const filePath = path.join(EXPORT_DIR, fileName);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }

    const file = fs.readFileSync(filePath);

    return new Response(file, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${fileName}"`,
        },
    });
}