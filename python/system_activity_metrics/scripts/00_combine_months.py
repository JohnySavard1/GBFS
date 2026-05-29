import sys
from pathlib import Path
import pandas as pd

if len(sys.argv) < 2:
    print("Usage: python3 00_combine_months.py <system_folder>")
    sys.exit(1)

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_DIR = BASE_DIR / "input" / sys.argv[1]
OUTPUT_DIR = BASE_DIR / "output/notNormalized"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / f"{sys.argv[1]}_2025_05_to_10.csv"

months = ["05", "06", "07", "08", "09", "10"]

files = []
for month in months:
    files.extend(sorted(INPUT_DIR.glob(f"*2025-{month}*.csv")))
    files.extend(sorted(INPUT_DIR.glob(f"*2025{month}*.csv")))
    files.extend(sorted(INPUT_DIR.glob(f"*{month}-2025*.csv")))

if not files:
    print(f"Aucun fichier trouvé dans {INPUT_DIR}")
    sys.exit(1)

print("Fichiers trouvés:")
for file in files:
    print("-", file.name)

first = True

for file in files:
    print(f"Ajout: {file.name}")

    for chunk in pd.read_csv(file, chunksize=100_000, encoding="latin1"):
        chunk.to_csv(
            OUTPUT_FILE,
            mode="w" if first else "a",
            index=False,
            header=first,
        )
        first = False

print(f"Fichier combiné créé: {OUTPUT_FILE}")