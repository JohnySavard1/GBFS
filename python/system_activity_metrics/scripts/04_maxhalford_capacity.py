import duckdb
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_FILE = BASE_DIR / "output" / "maxhalford_capacity_estimates.csv"

SYSTEMS = {
    "bixi": "montreal/bixi",
    "toronto": "toronto/bike-share-toronto",
    "ecobici": "mexico-city/ecobici",
    "divvy": "chicago/divvy",
    "indego": "philadelphia/indego",
    "baywheels": "san-francisco-bay-area/bay-wheels",
    "capital": "washington-d-c/capital-bikeshare",
    "citibike": "new-york-city/citibike",
}

con = duckdb.connect(":memory:")
con.execute("SET s3_endpoint='storage.googleapis.com'")

results = []

for system_id, path in SYSTEMS.items():
    print(f"Analyse: {system_id}")

    parquet_path = f"s3://bike-sharing-history/{path}/2025/*.parquet"

    query = f"""
        WITH station_capacity AS (
          SELECT
            station,
            MAX(bikes + stands) AS station_capacity
          FROM read_parquet('{parquet_path}')
          WHERE commit_at >= '2025-05-01'
            AND commit_at < '2025-11-01'
          GROUP BY station
        )
        SELECT
            COUNT(*) AS stations,
            SUM(station_capacity) AS total_station_capacity
        FROM station_capacity
    """

    result = con.execute(query).fetchone()

    results.append({
        "system_id": system_id,
        "stations": result[0],
        "total_station_capacity": result[1],
    })

df = pd.DataFrame(results)
df.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé: {OUTPUT_FILE}")