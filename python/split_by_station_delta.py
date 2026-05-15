import pandas as pd
import os
import re

input_file = "bixi_trip_hourly_station_delta.csv"
output_dir = "bixi_trip_hourly_delta_by_station"

os.makedirs(output_dir, exist_ok=True)

df = pd.read_csv(input_file)

def safe_filename(name):
    name = str(name)
    name = re.sub(r'[\\/*?:"<>|]', "_", name)
    return name[:100]

for station_name, group in df.groupby("station"):
    output_file = f"{output_dir}/{safe_filename(station_name)}.csv"
    group.to_csv(output_file, index=False)

print("Split terminé.")