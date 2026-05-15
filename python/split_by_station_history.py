import pandas as pd
import os
import re
import unicodedata

input_file = "bixi_2025_history.csv"
output_dir = "history_by_station"

os.makedirs(output_dir, exist_ok=True)

def normalize_station_name(name):
    name = str(name).lower()

    name = unicodedata.normalize("NFD", name)
    name = "".join(char for char in name if unicodedata.category(char) != "Mn")

    name = name.replace("’", "'")
    name = name.replace("–", "-").replace("—", "-")

    name = re.sub(r"\s*/\s*", " / ", name)
    name = re.sub(r"\s*-\s*", "-", name)

    name = re.sub(r"\s+", " ", name).strip()

    name = re.sub(r'[\\/*?:"<>|]', "_", name)
    name = re.sub(r"\s*_\s*", " _ ", name)

    name = re.sub(r"\s+", " ", name).strip()

    return name[:100]

for chunk in pd.read_csv(input_file, chunksize=100_000):
    chunk["station_normalized"] = chunk["station"].apply(normalize_station_name)

    for station_name, group in chunk.groupby("station_normalized"):
        output_file = f"{output_dir}/{station_name}.csv"

        group.to_csv(
            output_file,
            mode="a",
            index=False,
            header=not os.path.exists(output_file),
        )

print("Split terminé.")