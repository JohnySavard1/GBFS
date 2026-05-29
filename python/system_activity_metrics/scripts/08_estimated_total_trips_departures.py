import duckdb
import pandas as pd
from pathlib import Path

START_DATE = "2025-05-01"
END_DATE = "2025-11-01"  # exclusif, donc inclut tout octobre
DAYS = 184

BASE_DIR = Path(__file__).resolve().parent.parent

SYSTEMS_FILE = BASE_DIR / "input" / "maxhalford_systems.csv"
OUTPUT_FILE = BASE_DIR / "output" / f"estimated_trips_from_maxhalford_{START_DATE}_to_2025-10-31.csv"

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
        WITH snapshots AS (
            SELECT
                LOWER(
                    regexp_replace(
                        regexp_replace(station, '[^a-zA-Z0-9 ]', '', 'g'),
                        '\\s+',
                        ' ',
                        'g'
                    )
                ) AS station_normalized,
                commit_at,
                bikes
            FROM read_parquet('{parquet_path}')
            WHERE commit_at >= TIMESTAMP '{START_DATE} 00:00:00'
              AND commit_at <  TIMESTAMP '{END_DATE} 00:00:00'
              AND bikes IS NOT NULL
        ),

        station_deltas AS (
            SELECT
                station_normalized,
                commit_at,
                bikes,
                bikes - LAG(bikes) OVER (
                    PARTITION BY station_normalized
                    ORDER BY commit_at
                ) AS delta
            FROM snapshots
        )

        SELECT
            COUNT(DISTINCT station_normalized) AS stations,
            COUNT(*) AS observations,

            SUM(
                CASE
                    WHEN delta < 0 THEN -delta
                    ELSE 0
                END
            ) AS estimated_total_trips_from_departures,

            SUM(
                CASE
                    WHEN delta > 0 THEN delta
                    ELSE 0
                END
            ) AS estimated_total_trips_from_arrivals,

            SUM(ABS(delta)) / 2.0 AS estimated_total_trips_from_half_movements

        FROM station_deltas
        WHERE delta IS NOT NULL
    """

    try:
        row = con.execute(query).fetchone()

        stations = row[0]
        observations = row[1]
        estimated_departures = row[2]
        estimated_arrivals = row[3]
        estimated_half_movements = row[4]

        results.append({
            "system_id": system_id,
            "start_date": START_DATE,
            "end_date": "2025-10-31",
            "days": DAYS,
            "stations": stations,
            "observations": observations,
            "estimated_total_trips_departures": int(estimated_departures) if estimated_departures is not None else None,
            "estimated_total_trips_arrivals": int(estimated_arrivals) if estimated_arrivals is not None else None,
            "estimated_total_trips_half_movements": float(estimated_half_movements) if estimated_half_movements is not None else None,
            "estimated_trips_per_day_departures": estimated_departures / DAYS if estimated_departures is not None else None,
            "estimated_trips_per_station_per_day_departures": estimated_departures / DAYS / stations if estimated_departures is not None and stations else None,
        })

    except Exception as error:
        print(f"  Erreur pour {system_id}: {error}")

        results.append({
            "system_id": system_id,
            "start_date": START_DATE,
            "end_date": "2025-10-31",
            "days": DAYS,
            "stations": None,
            "observations": None,
            "estimated_total_trips_departures": None,
            "estimated_total_trips_arrivals": None,
            "estimated_total_trips_half_movements": None,
            "estimated_trips_per_day_departures": None,
            "estimated_trips_per_station_per_day_departures": None,
            "error": str(error),
        })

df = pd.DataFrame(results)
df.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé: {OUTPUT_FILE}")