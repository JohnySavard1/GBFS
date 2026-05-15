import pandas as pd
from pathlib import Path

THRESHOLD = 5

BASE_DIR = Path(__file__).resolve().parent.parent

TRIPS_FILE = BASE_DIR / "output" / "trips_hourly_delta.csv"
HISTORY_FILE = BASE_DIR / "output" / "history_hourly_delta.csv"
OUTPUT_FILE = BASE_DIR / "output" / "delta_reconciliation.csv"

print("Lecture des fichiers...")
trips = pd.read_csv(TRIPS_FILE)
history = pd.read_csv(HISTORY_FILE)

trips["hour"] = pd.to_datetime(trips["hour"], utc=True)
history["hour"] = pd.to_datetime(history["hour"], utc=True)

print("Fusion trips + history...")
merged = history.merge(
    trips,
    on=["station", "hour"],
    how="left",
)

merged["expected_delta_from_trips"] = merged["expected_delta_from_trips"].fillna(0)
merged["departures"] = merged["departures"].fillna(0)
merged["arrivals"] = merged["arrivals"].fillna(0)

merged["unexplained_delta"] = (
    merged["observed_delta_bikes"] - merged["expected_delta_from_trips"]
)

def classify_action(delta):
    if pd.isna(delta):
        return "unknown"
    if delta >= THRESHOLD:
        return "probable_deposit"
    if delta <= -THRESHOLD:
        return "probable_pickup"
    return "normal"

merged["classification"] = merged["unexplained_delta"].apply(classify_action)

merged = merged[
    [
        "station",
        "hour",
        "bikes_at_hour",
        "stands_at_hour",
        "observed_delta_bikes",
        "expected_delta_from_trips",
        "unexplained_delta",
        "departures",
        "arrivals",
        "classification",
    ]
]

merged.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé : {OUTPUT_FILE}")