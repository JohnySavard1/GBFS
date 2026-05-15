import os
import re
import unicodedata
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = BASE_DIR / "input" / "bixi_history_2025.csv"
OUTPUT_FILE = BASE_DIR / "output" / "history_hourly_delta.csv"

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

def normalize_station_name(name):
    name = str(name).lower()
    name = unicodedata.normalize("NFD", name)
    name = "".join(char for char in name if unicodedata.category(char) != "Mn")

    name = name.replace("’", "'")
    name = name.replace("–", "-").replace("—", "-")

    name = re.sub(r"\s*/\s*", " / ", name)
    name = re.sub(r"\s*-\s*", "-", name)
    name = re.sub(r"\s+", " ", name).strip()

    return name

print("Lecture du fichier history...")
df = pd.read_csv(INPUT_FILE)

df["station"] = df["station"].apply(normalize_station_name)
df["commit_at"] = pd.to_datetime(df["commit_at"], utc=True).dt.tz_convert("America/Toronto")

results = []

print("Reconstruction par station avec forward fill...")

for station_name, group in df.groupby("station"):
    group = group.sort_values("commit_at").set_index("commit_at")

    values = group[["bikes", "stands"]]

    complete_15min = values.resample("15min").ffill()

    hourly_last = complete_15min.resample("1h").last()

    hourly_last["observed_delta_bikes"] = hourly_last["bikes"].diff()
    hourly_last["observed_delta_stands"] = hourly_last["stands"].diff()

    hourly_last = hourly_last.reset_index()
    hourly_last["station"] = station_name

    results.append(hourly_last)

final = pd.concat(results, ignore_index=True)

final = final.rename(columns={
    "commit_at": "hour",
    "bikes": "bikes_at_hour",
    "stands": "stands_at_hour",
})

final = final[
    [
        "station",
        "hour",
        "bikes_at_hour",
        "stands_at_hour",
        "observed_delta_bikes",
        "observed_delta_stands",
    ]
]

final.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé : {OUTPUT_FILE}")