from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_DIR = BASE_DIR / "output/notNormalized"

OUTPUT_FILE = BASE_DIR / "output" / "bike_id_fleet_estimates.csv"

FILES = {
    "metro": {
        "file": INPUT_DIR / "metro_2025_05_to_10.csv",
        "bike_id_column": "bike_id",
        "start_station_column": "start_station",
        "end_station_column": "end_station",
        "start_time_column": "start_time",
        "end_time_column": "end_time",
    },
    "indego": {
        "file": INPUT_DIR / "indego_2025_05_to_10.csv",
        "bike_id_column": "bike_id",
        "start_station_column": "start_station",
        "end_station_column": "end_station",
        "start_time_column": "start_time",
        "end_time_column": "end_time",
    },
    "bikeshare": {
        "file": INPUT_DIR / "bikeshare_2025_05_to_10.csv",
        "bike_id_column": "Bike_Id",
        "start_station_column": "Start_Station_Name",
        "end_station_column": "End_Station_Name",
        "start_time_column": "Start_Time",
        "end_time_column": "End_Time",
    },
    "ecobici": {
        "file": INPUT_DIR / "ecobici_2025_05_to_10.csv",
        "bike_id_column": "Bici",
        "start_station_column": "Ciclo_Estacion_Retiro",
        "end_station_column": "Ciclo_EstacionArribo",
        "start_time_column": None,
        "end_time_column": None,
    },
}

results = []

for system_id, config in FILES.items():
    file = config["file"]
    bike_id_column = config["bike_id_column"]

    print(f"Analyse: {system_id}")

    if not file.exists():
        print(f"  Fichier manquant: {file}")
        continue

    bike_ids = set()
    total_rows = 0

    start_col = config["start_station_column"]
    end_col = config["end_station_column"]
    start_time_col = config["start_time_column"]
    end_time_col = config["end_time_column"]

    for chunk in pd.read_csv(
        file,
        chunksize=500_000,
        encoding="latin1",
        on_bad_lines="skip",
        low_memory=False,
    ):
        if bike_id_column not in chunk.columns:
            print(f"  Colonne absente: {bike_id_column}")
            break

        chunk[start_col] = chunk[start_col].fillna("").astype(str).str.strip()
        chunk[end_col] = chunk[end_col].fillna("").astype(str).str.strip()

        chunk = chunk[
            (chunk[start_col] != "") |
            (chunk[end_col] != "")
        ]

        if start_time_col and end_time_col:
            start_time = pd.to_datetime(chunk[start_time_col], errors="coerce")
            end_time = pd.to_datetime(chunk[end_time_col], errors="coerce")

            duration_minutes = (end_time - start_time).dt.total_seconds() / 60

            same_station_short = (
                (chunk[start_col] != "") &
                (chunk[end_col] != "") &
                (chunk[start_col] == chunk[end_col]) &
                (duration_minutes < 1)
            )

            chunk = chunk[~same_station_short]

        total_rows += len(chunk)

        bike_ids.update(
            chunk[bike_id_column]
            .dropna()
            .astype(str)
            .str.strip()
            .unique()
        )

    results.append({
        "system_id": system_id,
        "bike_id_column": bike_id_column,
        "unique_bike_ids": len(bike_ids),
        "rows_analyzed": total_rows,
    })

df = pd.DataFrame(results)
df.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé: {OUTPUT_FILE}")