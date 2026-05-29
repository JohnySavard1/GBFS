import duckdb
import pandas as pd
from pathlib import Path

START_DATE = "2025-05-01"
END_DATE = "2025-11-01"  # exclusif, donc inclut tout octobre

BASE_DIR = Path(__file__).resolve().parent.parent

SYSTEMS_FILE = BASE_DIR / "input" / "maxhalford_systems.csv"
OUTPUT_FILE = BASE_DIR / "output" / f"fleet_estimate_delta_algo_{START_DATE}_to_2025-10-31.csv"

systems = pd.read_csv(SYSTEMS_FILE)

con = duckdb.connect(":memory:")
con.execute("SET s3_endpoint='storage.googleapis.com'")

def estimate_initial_final_inventory(deltas):
    """
    Estime l'inventaire initial minimal nécessaire pour expliquer
    une séquence de variations sans jamais tomber sous zéro.

    Exemple:
    deltas = [-3, +1, -2, +5]

    cumulative:
    -3, -2, -4, +1

    minimum = -4
    donc inventory_initial = 4
    inventory_final = 4 + 1 = 5
    """

    cumulative = 0
    min_cumulative = 0

    for delta in deltas:
        cumulative += delta
        min_cumulative = min(min_cumulative, cumulative)

    inventory_initial = -min_cumulative
    inventory_final = inventory_initial + cumulative

    return inventory_initial, inventory_final


results = []

for _, system in systems.iterrows():
    system_id = system["system_id"]
    path = system["path"]

    print(f"Analyse: {system_id}")

    parquet_path = f"s3://bike-sharing-history/{path}/*/*.parquet"

    query = f"""
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
        ORDER BY station_normalized, commit_at
    """

    try:
        df = con.execute(query).df()

        if df.empty:
            results.append({
                "system_id": system_id,
                "start_date": START_DATE,
                "end_date": "2025-10-31",
                "stations": 0,
                "fleet_estimate_delta_initial": None,
                "fleet_estimate_delta_final": None,
                "net_delta": None,
            })
            continue

        system_initial_total = 0
        system_final_total = 0
        station_count = 0
        observation_count = len(df)

        for station, group in df.groupby("station_normalized"):
            group = group.sort_values("commit_at")

            deltas = group["bikes"].diff().dropna().tolist()

            if len(deltas) == 0:
                continue

            initial_inventory, final_inventory = estimate_initial_final_inventory(deltas)

            system_initial_total += initial_inventory
            system_final_total += final_inventory
            station_count += 1

        results.append({
            "system_id": system_id,
            "start_date": START_DATE,
            "end_date": "2025-10-31",
            "stations": station_count,
            "observations": observation_count,
            "fleet_estimate_delta_initial": int(system_initial_total),
            "fleet_estimate_delta_final": int(system_final_total),
            "net_delta": int(system_final_total - system_initial_total),
        })

    except Exception as error:
        print(f"  Erreur pour {system_id}: {error}")

        results.append({
            "system_id": system_id,
            "start_date": START_DATE,
            "end_date": "2025-10-31",
            "stations": None,
            "observations": None,
            "fleet_estimate_delta_initial": None,
            "fleet_estimate_delta_final": None,
            "net_delta": None,
            "error": str(error),
        })

df_result = pd.DataFrame(results)
df_result.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé: {OUTPUT_FILE}")