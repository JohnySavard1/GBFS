import pandas as pd
from pathlib import Path

THRESHOLD = 10

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = BASE_DIR / "output" / f"delta_reconciliation_clean_threshold_{THRESHOLD}.csv"
OUTPUT_FILE = BASE_DIR / "output" / f"hourly_station_average_threshold_{THRESHOLD}.csv"

print("Lecture du fichier clean...")
df = pd.read_csv(INPUT_FILE)

print("Préparation des heures...")
df["hour"] = pd.to_datetime(df["hour"], utc=True)

df["hour_of_day"] = (
    df["hour"]
    .dt.tz_convert("America/Toronto")
    .dt.hour
)

print("Calcul des moyennes...")

result = (
    df.groupby(["station", "hour_of_day"], as_index=False)
    .agg(
        avg_bikes=("bikes_at_hour", "mean"),
        avg_stands=("stands_at_hour", "mean"),
        avg_departures=("departures", "mean"),
        avg_arrivals=("arrivals", "mean"),
        observations=("hour", "count"),
    )
)

result["avg_bikes"] = result["avg_bikes"].round(2)
result["avg_stands"] = result["avg_stands"].round(2)
result["avg_departures"] = result["avg_departures"].round(2)
result["avg_arrivals"] = result["avg_arrivals"].round(2)

result.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé : {OUTPUT_FILE}")
print(f"Nombre de lignes : {len(result)}")