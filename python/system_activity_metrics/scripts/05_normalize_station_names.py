from pathlib import Path
import pandas as pd
import re
import unicodedata

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_DIR = BASE_DIR / "output" / "normalized"
OUTPUT_DIR = BASE_DIR / "output" / "normalized_clean"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def normalize_station_name(name):
    if pd.isna(name):
        return ""

    name = str(name).lower()

    # Enlever les accents
    name = unicodedata.normalize("NFD", name)
    name = "".join(char for char in name if unicodedata.category(char) != "Mn")

    # Remplacer séparateurs par espaces
    name = re.sub(r"[-_/\\|]+", " ", name)

    # Enlever ponctuation restante
    name = re.sub(r"[^\w\s]", "", name)

    # Espaces multiples -> un seul
    name = re.sub(r"\s+", " ", name).strip()

    return name


files = sorted(INPUT_DIR.glob("*_normalized.csv"))

if not files:
    raise FileNotFoundError(f"Aucun fichier trouvé dans {INPUT_DIR}")

for file in files:
    print(f"Nettoyage: {file.name}")

    output_file = OUTPUT_DIR / file.name

    first = True

    for chunk in pd.read_csv(file, chunksize=500_000):
        chunk["start_station"] = chunk["start_station"].apply(normalize_station_name)
        chunk["end_station"] = chunk["end_station"].apply(normalize_station_name)
        chunk["started_at_dt"] = pd.to_datetime(chunk["started_at"], errors="coerce")
        chunk["ended_at_dt"] = pd.to_datetime(chunk["ended_at"], errors="coerce")
        chunk["duration_minutes"] = (
            chunk["ended_at_dt"] - chunk["started_at_dt"]
        ).dt.total_seconds() / 60

        short_same_station = (
            (chunk["start_station"] != "") &
            (chunk["end_station"] != "") &
            (chunk["start_station"] == chunk["end_station"]) &
            (chunk["duration_minutes"] < 1)
        )

        chunk = chunk[~short_same_station]

        chunk = chunk[
            (chunk["start_station"] != "") |
            (chunk["end_station"] != "")
        ]

        chunk = chunk.drop(columns=["started_at_dt", "ended_at_dt", "duration_minutes"])

        chunk.to_csv(
            output_file,
            mode="w" if first else "a",
            index=False,
            header=first,
        )

        first = False

print("Normalisation terminée.")