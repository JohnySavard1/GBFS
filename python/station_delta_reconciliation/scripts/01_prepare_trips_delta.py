import os
import re
import unicodedata
import pandas as pd

INPUT_FILE = "../input/bixi_trips_2025.csv"
OUTPUT_FILE = "../output/trips_hourly_delta.csv"

os.makedirs("../output", exist_ok=True)


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


print("Lecture du fichier trips...")
df = pd.read_csv(INPUT_FILE)

print("Préparation des départs...")
departures = pd.DataFrame({
    "station": df["STARTSTATIONNAME"].apply(normalize_station_name),
    "datetime": pd.to_datetime(df["STARTTIMEMS"], unit="ms", utc=True).dt.tz_convert("America/Toronto"),
    "delta": -1,
    "departures": 1,
    "arrivals": 0,
})

print("Préparation des arrivées...")
arrivals = pd.DataFrame({
    "station": df["ENDSTATIONNAME"].apply(normalize_station_name),
    "datetime": pd.to_datetime(df["ENDTIMEMS"], unit="ms", utc=True).dt.tz_convert("America/Toronto"),
    "delta": 1,
    "departures": 0,
    "arrivals": 1,
})

events = pd.concat([departures, arrivals], ignore_index=True)

events["hour"] = (
    events["datetime"]
    .dt.tz_convert("UTC")
    .dt.floor("h")
    .dt.tz_convert("America/Toronto")
)

print("Agrégation par station + heure...")
hourly = (
    events
    .groupby(["station", "hour"], as_index=False)
    .agg(
        expected_delta_from_trips=("delta", "sum"),
        departures=("departures", "sum"),
        arrivals=("arrivals", "sum"),
    )
)

hourly.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé : {OUTPUT_FILE}")