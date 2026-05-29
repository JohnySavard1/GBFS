from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_DIR = BASE_DIR / "output" / "normalized_clean"
OUTPUT_FILE = BASE_DIR / "output" / "system_metrics_2025_05_to_10.csv"

files = sorted(INPUT_DIR.glob("*_normalized.csv"))

if not files:
    raise FileNotFoundError(f"Aucun fichier trouvé dans {INPUT_DIR}")

results = []

for file in files:
    print(f"Analyse: {file.name}")

    total_trips = 0
    stations = set()
    days = set()
    system_id = file.stem.replace("_normalized", "")

    for chunk in pd.read_csv(file, chunksize=500_000):
        chunk["started_at"] = pd.to_datetime(chunk["started_at"], errors="coerce")

        chunk = chunk.dropna(subset=["started_at"])

        total_trips += len(chunk)

        stations.update(chunk["start_station"].dropna().astype(str).unique())
        stations.update(chunk["end_station"].dropna().astype(str).unique())

        days.update(chunk["started_at"].dt.date.unique())

    number_of_days = len(days)
    number_of_stations = len(stations)

    trips_per_day = total_trips / number_of_days if number_of_days else 0

    trips_per_station_per_day = (
        trips_per_day / number_of_stations
        if number_of_stations
        else 0
    )

    results.append({
        "system_id": system_id,
        "total_trips": total_trips,
        "days": number_of_days,
        "stations": number_of_stations,
        "trips_per_day": round(trips_per_day, 2),
        "trips_per_station_per_day": round(trips_per_station_per_day, 2),
    })

df = pd.DataFrame(results)

df = df.sort_values(
    "trips_per_station_per_day",
    ascending=False,
)

df.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé: {OUTPUT_FILE}")