from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_DIR = BASE_DIR / "output" / "normalized_clean"

NY_FILE = INPUT_DIR / "citibike_normalized.csv"
JC_FILE = INPUT_DIR / "jccitibike_normalized.csv"

def get_stations(file):
    stations = set()

    for chunk in pd.read_csv(file, chunksize=500_000):
        stations.update(chunk["start_station"].dropna().astype(str))
        stations.update(chunk["end_station"].dropna().astype(str))

    stations.discard("")
    return stations

ny_stations = get_stations(NY_FILE)
jc_stations = get_stations(JC_FILE)

overlap = ny_stations.intersection(jc_stations)

print("NY stations:", len(ny_stations))
print("JC stations:", len(jc_stations))
print("Overlap:", len(overlap))

print("\nStations présentes dans les deux fichiers:")
for station in sorted(overlap):
    print("-", station)