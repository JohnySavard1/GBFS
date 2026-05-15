import pandas as pd
import re
import unicodedata

input_file = "bixi_2025_history.csv"
output_file = "bixi_2025_history_hourly_average.csv"

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

df["station"] = df["station"].apply(normalize_station_name)
df["commit_at"] = pd.to_datetime(df["commit_at"], utc=True).dt.tz_convert("America/Toronto")

results = []

for station_name, group in df.groupby("station"):
    group = group.sort_values("commit_at").set_index("commit_at")

    # Garde seulement bikes/stands
    values = group[["bikes", "stands"]]

    # Reconstruit une valeur toutes les 15 minutes avec la dernière valeur connue
    complete_15min = values.resample("15min").ffill()

    # Calcule la moyenne par heure
    hourly = complete_15min.resample("1h").mean()

    hourly = hourly.reset_index()
    hourly["station"] = station_name

    results.append(hourly)

final = pd.concat(results, ignore_index=True)

final = final.rename(columns={
    "commit_at": "hour",
    "bikes": "avg_bikes",
    "stands": "avg_stands",
})

final = final[["station", "hour", "avg_bikes", "avg_stands"]]

final.to_csv(output_file, index=False)

print("Fichier créé :", output_file)