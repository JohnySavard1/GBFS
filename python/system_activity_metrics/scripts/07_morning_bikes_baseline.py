import duckdb
import pandas as pd
from pathlib import Path

START_DATE = "2025-05-01"
END_DATE = "2025-11-01"  # exclusif, donc inclut tout octobre

INTERVAL_HOURS = 1        # teste un moment cible à chaque heure
MAX_AGE_HOURS = 24        # accepte le dernier snapshot connu dans les 24h précédentes

BASE_DIR = Path(__file__).resolve().parent.parent

SYSTEMS_FILE = BASE_DIR / "input" / "maxhalford_systems.csv"
OUTPUT_FILE = BASE_DIR / "output" / (
    f"max_bikes_available_last_snapshot_"
    f"{START_DATE}_to_2025-10-31_"
    f"{INTERVAL_HOURS}h_interval_{MAX_AGE_HOURS}h_max_age.csv"
)

systems = pd.read_csv(SYSTEMS_FILE)

con = duckdb.connect(":memory:")
con.execute("SET s3_endpoint='storage.googleapis.com'")

results = []

for _, system in systems.iterrows():
    system_id = system["system_id"]
    path = system["path"]

    print(f"Analyse: {system_id}")

    parquet_path = f"s3://bike-sharing-history/{path}/*/*.parquet"

    query = f"""
        WITH target_times AS (
            SELECT target_time
            FROM generate_series(
                TIMESTAMP '{START_DATE} 00:00:00',
                TIMESTAMP '{END_DATE} 00:00:00' - INTERVAL {INTERVAL_HOURS} HOUR,
                INTERVAL {INTERVAL_HOURS} HOUR
            ) AS t(target_time)
        ),

        normalized_snapshots AS (
            SELECT
                LOWER(
                    regexp_replace(
                        regexp_replace(station, '[^a-zA-Z0-9 ]', '', 'g'),
                        '\\s+',
                        ' ',
                        'g'
                    )
                ) AS station_normalized,
                bikes,
                commit_at
            FROM read_parquet('{parquet_path}')
            WHERE commit_at >= TIMESTAMP '{START_DATE} 00:00:00' - INTERVAL {MAX_AGE_HOURS} HOUR
              AND commit_at <  TIMESTAMP '{END_DATE} 00:00:00'
              AND bikes IS NOT NULL
        ),

        last_snapshot_per_station_time AS (
            SELECT
                target_time,
                station_normalized,
                bikes,
                commit_at,
                epoch(target_time) - epoch(commit_at) AS age_seconds,

                ROW_NUMBER() OVER (
                    PARTITION BY target_time, station_normalized
                    ORDER BY commit_at DESC
                ) AS rn

            FROM target_times
            JOIN normalized_snapshots
              ON commit_at <= target_time
             AND commit_at >= target_time - INTERVAL {MAX_AGE_HOURS} HOUR
        ),

        system_snapshots AS (
            SELECT
                target_time,
                COUNT(*) AS stations,
                SUM(bikes) AS bikes_available,
                AVG(age_seconds) / 60.0 AS avg_age_minutes,
                MAX(age_seconds) / 60.0 AS max_age_minutes
            FROM last_snapshot_per_station_time
            WHERE rn = 1
            GROUP BY target_time
        ),

        ranked_snapshots AS (
            SELECT
                target_time,
                stations,
                bikes_available,
                avg_age_minutes,
                max_age_minutes,

                ROW_NUMBER() OVER (
                    ORDER BY bikes_available DESC, target_time ASC
                ) AS rn

            FROM system_snapshots
        )

        SELECT
            target_time,
            stations,
            bikes_available,
            avg_age_minutes,
            max_age_minutes
        FROM ranked_snapshots
        WHERE rn = 1
    """

    try:
        row = con.execute(query).fetchone()

        if row is None:
            results.append({
                "system_id": system_id,
                "start_date": START_DATE,
                "end_date": "2025-10-31",
                "interval_hours": INTERVAL_HOURS,
                "max_age_hours": MAX_AGE_HOURS,
                "max_target_time": None,
                "stations": None,
                "max_bikes_available": None,
                "avg_age_minutes": None,
                "max_age_minutes": None,
            })
        else:
            results.append({
                "system_id": system_id,
                "start_date": START_DATE,
                "end_date": "2025-10-31",
                "interval_hours": INTERVAL_HOURS,
                "max_age_hours": MAX_AGE_HOURS,
                "max_target_time": row[0],
                "stations": row[1],
                "max_bikes_available": int(row[2]) if row[2] is not None else None,
                "avg_age_minutes": float(row[3]) if row[3] is not None else None,
                "max_age_minutes": float(row[4]) if row[4] is not None else None,
            })

    except Exception as error:
        print(f"  Erreur pour {system_id}: {error}")

        results.append({
            "system_id": system_id,
            "start_date": START_DATE,
            "end_date": "2025-10-31",
            "interval_hours": INTERVAL_HOURS,
            "max_age_hours": MAX_AGE_HOURS,
            "max_target_time": None,
            "stations": None,
            "max_bikes_available": None,
            "avg_age_minutes": None,
            "max_age_minutes": None,
            "error": str(error),
        })

df = pd.DataFrame(results)
df.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé: {OUTPUT_FILE}")