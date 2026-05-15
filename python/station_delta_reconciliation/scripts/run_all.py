import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

scripts = [
    "01_prepare_trips_delta.py",
    "02_prepare_history_delta.py",
    "03_compare_deltas.py",
]

for script in scripts:
    script_path = BASE_DIR / script

    print(f"\n=== Running {script} ===")

    result = subprocess.run(
        [sys.executable, str(script_path)],
        check=False,
    )

    if result.returncode != 0:
        print(f"\nErreur dans {script}. Arrêt du pipeline.")
        sys.exit(result.returncode)

print("\nPipeline terminé avec succès.")