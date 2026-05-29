from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_DIR = BASE_DIR / "input" / "citibike"
OUTPUT_DIR = BASE_DIR / "output/notNormalized"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / "citibike_2025_05_to_10.csv"

months = ["202505", "202506", "202507", "202508", "202509", "202510"]

files = []

for month in months:
    month_dir = INPUT_DIR / f"{month}-citibike-tripdata"
    files.extend(sorted(month_dir.glob("*.csv")))

if not files:
    raise FileNotFoundError(f"Aucun fichier trouvé dans {INPUT_DIR}")

print("Fichiers trouvés:", len(files))

first = True
total_rows = 0

for file in files:
    print(f"Ajout: {file.name}")

    for chunk in pd.read_csv(
        file,
        chunksize=100_000,
        encoding="utf-8",
        on_bad_lines="skip",
        low_memory=False,
    ):
        total_rows += len(chunk)

        chunk.to_csv(
            OUTPUT_FILE,
            mode="w" if first else "a",
            index=False,
            header=first,
        )

        first = False

print(f"Fichier combiné créé: {OUTPUT_FILE}")
print(f"Lignes totales: {total_rows}")