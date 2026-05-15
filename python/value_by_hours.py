import pandas as pd
import re
import unicodedata

input_file = "bixi_trips_2025_dates.csv"
output_file = "bixi_trip_hourly_station_delta.csv"

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

df = pd.read_csv(input_file)

departures = pd.DataFrame({
    "station": df["STARTSTATIONNAME"].apply(normalize_station_name),
    "datetime": pd.to_datetime(df["START_DATE"], utc=True).dt.tz_convert("America/Toronto"),
    "delta": -1,
})

arrivals = pd.DataFrame({
    "station": df["ENDSTATIONNAME"].apply(normalize_station_name),
    "datetime": pd.to_datetime(df["END_DATE"], utc=True).dt.tz_convert("America/Toronto"),
    "delta": 1,
})

events = pd.concat([departures, arrivals], ignore_index=True)

events["hour"] = (
    events["datetime"]
    .dt.tz_convert("UTC")
    .dt.floor("h")
    .dt.tz_convert("America/Toronto")
)

hourly = (
    events
    .groupby(["station", "hour"], as_index=False)
    .agg(
        expected_delta_from_trips=("delta", "sum"),
        departures=("delta", lambda x: (x == -1).sum()),
        arrivals=("delta", lambda x: (x == 1).sum()),
    )
)

hourly.to_csv(output_file, index=False)

print("Fichier créé :", output_file)