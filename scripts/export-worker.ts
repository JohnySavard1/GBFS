import fs from "fs";
import path from "path";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const EXPORT_DIR = "/app/exports";

function escapeCsv(value: unknown) {
    if (value === null || value === undefined) return "";
    return `"${String(value).replaceAll('"', '""')}"`;
}

async function processJob() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const jobResult = await client.query(`
      SELECT *
      FROM export_jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

        const job = jobResult.rows[0];

        if (!job) {
            await client.query("COMMIT");
            return;
        }

        await client.query(
            `
      UPDATE export_jobs
      SET status = 'processing',
          started_at = now()
      WHERE id = $1
      `,
            [job.id]
        );

        await client.query("COMMIT");

        fs.mkdirSync(EXPORT_DIR, { recursive: true });

        const fileName = job.system_id
            ? `${job.system_id}_${job.report_type}_${job.id}.csv`
            : `all_systems_${job.report_type}_${job.id}.csv`;

        const filePath = path.join(EXPORT_DIR, fileName);

        let query: string;

        if (job.report_type === "hourly-average") {
            query = job.system_id
                ? `
      SELECT
        system_id AS "system",
        station_id AS "station_id",
        station_name AS "station_name",

        date_trunc(
          'hour',
          recorded_at AT TIME ZONE 'America/Toronto'
        ) AS "hour",

        ROUND(AVG(bikes_available)::numeric, 2) AS "avg_bikes_available",
        ROUND(AVG(docks_available)::numeric, 2) AS "avg_docks_available",
        ROUND(AVG(bikes_disabled)::numeric, 2) AS "avg_bikes_disabled",
        ROUND(AVG(docks_disabled)::numeric, 2) AS "avg_docks_disabled",

        MAX(capacity) AS "capacity"

      FROM station_snapshots

      WHERE system_id = $1

      GROUP BY
        system_id,
        station_id,
        station_name,
        hour

      ORDER BY
        system_id,
        station_id,
        hour
    `
                : `
      SELECT
        system_id AS "system",
        station_id AS "station_id",
        station_name AS "station_name",

        date_trunc(
          'hour',
          recorded_at AT TIME ZONE 'America/Toronto'
        ) AS "hour",

        ROUND(AVG(bikes_available)::numeric, 2) AS "avg_bikes_available",
        ROUND(AVG(docks_available)::numeric, 2) AS "avg_docks_available",
        ROUND(AVG(bikes_disabled)::numeric, 2) AS "avg_bikes_disabled",
        ROUND(AVG(docks_disabled)::numeric, 2) AS "avg_docks_disabled",

        MAX(capacity) AS "capacity"

      FROM station_snapshots

      GROUP BY
        system_id,
        station_id,
        station_name,
        hour

      ORDER BY
        system_id,
        station_id,
        hour
    `;
        } else if (job.report_type === "short") {
            query = job.system_id
                ? `
      SELECT
        system_id AS "Nom System",
        station_id AS "ID_Station",
        capacity,
        bikes_available AS "bike available",
        bikes_disabled AS "bike disable",
        docks_available AS "dock available",
        docks_disabled AS "dock disable",
        recorded_at AT TIME ZONE 'America/Toronto' AS datetime
      FROM station_snapshots
      WHERE system_id = $1
      ORDER BY system_id, recorded_at, station_id
    `
                : `
      SELECT
        system_id AS "Nom System",
        station_id AS "ID_Station",
        capacity,
        bikes_available AS "bike available",
        bikes_disabled AS "bike disable",
        docks_available AS "dock available",
        docks_disabled AS "dock disable",
        recorded_at AT TIME ZONE 'America/Toronto' AS datetime
      FROM station_snapshots
      ORDER BY system_id, recorded_at, station_id
    `;
        } else {
            query = job.system_id
                ? `
      SELECT *
      FROM station_snapshots
      WHERE system_id = $1
      ORDER BY system_id, recorded_at, station_id
    `
                : `
      SELECT *
      FROM station_snapshots
      ORDER BY system_id, recorded_at, station_id
    `;
        }

        const values = job.system_id ? [job.system_id] : [];

        const result = await pool.query(query, values);

        const headers = Object.keys(result.rows[0] ?? {});

        const csvRows = [
            headers.join(","),
            ...result.rows.map((row) =>
                headers.map((header) => escapeCsv(row[header])).join(",")
            ),
        ];

        fs.writeFileSync(filePath, csvRows.join("\n"));
        console.log(`CSV écrit: ${filePath}`);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        await pool.query(
            `
      UPDATE export_jobs
      SET status = 'done',
          file_path = $2,
          finished_at = now()
      WHERE id = $1
      `,
            [job.id, `/exports/${fileName}`]
        );

        console.log(`Export terminé: ${fileName}`);
    } catch (error) {
        console.error(error);
    } finally {
        client.release();
    }
}

console.log("Export worker started");

setInterval(processJob, 10_000);
processJob();