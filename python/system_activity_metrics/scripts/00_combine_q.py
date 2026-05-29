import sys
from pathlib import Path
import pandas as pd

if len(sys.argv) < 2:
    print("Usage: python3 00_combine_q.py <system_folder>")
    sys.exit(1)

BASE_DIR = Path(__file__).resolve().parent.parent
SYSTEM_NAME = sys.argv[1]

INPUT_DIR = BASE_DIR / "input" / SYSTEM_NAME
OUTPUT_DIR = BASE_DIR / "output/notNormalized"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / f"{SYSTEM_NAME}_2025_05_to_10.csv"

DATE_COLUMN = "start_time"

START_DATE = pd.Timestamp("2025-05-01")
END_DATE = pd.Timestamp("2025-11-01")

files = sorted(INPUT_DIR.glob("2025-q*.csv"))

if not files:
    print(f"Aucun fichier trouvé dans {INPUT_DIR}")
    sys.exit(1)

print("Fichiers trouvés:")
for file in files:
    print("-", file.name)

first = True

for file in files:
    print(f"Ajout: {file.name}")

    for chunk in pd.read_csv(
        file,
        chunksize=100_000,
        encoding="latin1",
        on_bad_lines="skip",
    ):
        chunk[DATE_COLUMN] = pd.to_datetime(
            chunk[DATE_COLUMN],
            errors="coerce",
        )

        chunk = chunk[
            (chunk[DATE_COLUMN] >= START_DATE)
            & (chunk[DATE_COLUMN] < END_DATE)
        ]

        if chunk.empty:
            continue

        chunk.to_csv(
            OUTPUT_FILE,
            mode="w" if first else "a",
            index=False,
            header=first,
        )

        first = False

print(f"Fichier combiné créé: {OUTPUT_FILE}")