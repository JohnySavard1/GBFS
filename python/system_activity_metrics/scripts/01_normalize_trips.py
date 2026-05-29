import sys
from pathlib import Path
import pandas as pd

if len(sys.argv) < 3:
    print("Usage: python3 01_normalize_trips.py <system_id> <input_file.csv>")
    sys.exit(1)

SYSTEM_ID = sys.argv[1].lower()
INPUT_FILE = Path(sys.argv[2])

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "output" / "normalized"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / f"{SYSTEM_ID}_normalized.csv"

if not INPUT_FILE.exists():
    print(f"Erreur: fichier introuvable: {INPUT_FILE}")
    sys.exit(1)

print(f"Lecture: {INPUT_FILE}")
df = pd.read_csv(INPUT_FILE, encoding="latin1", on_bad_lines="skip", low_memory=False)

if SYSTEM_ID in [
    "bluebikes",
    "baywheels",
    "divvy",
    "citibike",
    "capital",
    "jccitibike",
]:
    normalized = pd.DataFrame({
        "system_id": SYSTEM_ID,
        "start_station": df["start_station_name"],
        "end_station": df["end_station_name"],
        "started_at": pd.to_datetime(df["started_at"], errors="coerce"),
        "ended_at": pd.to_datetime(df["ended_at"], errors="coerce"),
    })

elif SYSTEM_ID in ["metro", "indego"]:
    normalized = pd.DataFrame({
        "system_id": SYSTEM_ID,
        "start_station": df["start_station"],
        "end_station": df["end_station"],
        "started_at": pd.to_datetime(df["start_time"], errors="coerce"),
        "ended_at": pd.to_datetime(df["end_time"], errors="coerce"),
    })

elif SYSTEM_ID == "bixi":
    normalized = pd.DataFrame({
        "system_id": SYSTEM_ID,
        "start_station": df["STARTSTATIONNAME"],
        "end_station": df["ENDSTATIONNAME"],
        "started_at": pd.to_datetime(df["STARTTIMEMS"], unit="ms", errors="coerce"),
        "ended_at": pd.to_datetime(df["ENDTIMEMS"], unit="ms", errors="coerce"),
    })

elif SYSTEM_ID == "ecobici":
    normalized = pd.DataFrame({
        "system_id": SYSTEM_ID,
        "start_station": df["Ciclo_Estacion_Retiro"],
        "end_station": df["Ciclo_EstacionArribo"],
        "started_at": pd.to_datetime(
            df["Fecha_Retiro"].astype(str) + " " + df["Hora_Retiro"].astype(str),
            format="%d/%m/%Y %H:%M:%S",
            errors="coerce",
        ),
        "ended_at": pd.to_datetime(
            df["Fecha_Arribo"].astype(str) + " " + df["Hora_Arribo"].astype(str),
            format="%d/%m/%Y %H:%M:%S",
            errors="coerce",
        ),
    })

elif SYSTEM_ID == "toronto":
    normalized = pd.DataFrame({
        "system_id": SYSTEM_ID,
        "start_station": df["Start_Station_Name"],
        "end_station": df["End_Station_Name"],
        "started_at": pd.to_datetime(df["Start_Time"], errors="coerce"),
        "ended_at": pd.to_datetime(df["End_Time"], errors="coerce"),
    })

else:
    print(f"Erreur: system_id non supporté: {SYSTEM_ID}")
    sys.exit(1)

normalized = normalized.dropna(subset=["started_at"])
normalized = normalized[
    (normalized["started_at"] >= "2025-05-01")
    & (normalized["started_at"] < "2025-11-01")
]

normalized.to_csv(OUTPUT_FILE, index=False)

print(f"Fichier normalisé créé: {OUTPUT_FILE}")
print(f"Lignes conservées: {len(normalized)}")