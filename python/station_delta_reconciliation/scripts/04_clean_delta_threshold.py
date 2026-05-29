import pandas as pd
from pathlib import Path

THRESHOLD = 10

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = BASE_DIR / "output" / "delta_reconciliation.csv"
OUTPUT_FILE = BASE_DIR / "output" / f"delta_reconciliation_clean_threshold_{THRESHOLD}.csv"

print("Lecture du fichier delta reconciliation...")
df = pd.read_csv(INPUT_FILE)

print("Nettoyage des données invalides...")
df["unexplained_delta"] = pd.to_numeric(df["unexplained_delta"], errors="coerce")

clean = df.dropna(subset=["unexplained_delta"])
clean = clean[clean["classification"] != "unknown"]

print("Application du seuil...")
clean = clean[clean["unexplained_delta"].abs() <= THRESHOLD]

clean.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier créé : {OUTPUT_FILE}")
print(f"Lignes originales : {len(df)}")
print(f"Lignes conservées : {len(clean)}")
print(f"Lignes retirées : {len(df) - len(clean)}")