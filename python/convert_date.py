import pandas as pd

input_file = "Bixi_trips_2025.csv"
output_file = "Bixi_trips_2025_dates.csv"

df = pd.read_csv(input_file)

df["START_DATE"] = (
    pd.to_datetime(df["STARTTIMEMS"], unit="ms", utc=True)
    .dt.tz_convert("America/Toronto")
    .dt.strftime("%Y-%m-%d %H:%M:%S%z")
)

df["END_DATE"] = (
    pd.to_datetime(df["ENDTIMEMS"], unit="ms", utc=True)
    .dt.tz_convert("America/Toronto")
    .dt.strftime("%Y-%m-%d %H:%M:%S%z")
)

# Ajoute le ":" dans le timezone (-05:00 au lieu de -0500)
df["START_DATE"] = (
    df["START_DATE"].str.slice(0, -2)
    + ":"
    + df["START_DATE"].str.slice(-2)
)

df["END_DATE"] = (
    df["END_DATE"].str.slice(0, -2)
    + ":"
    + df["END_DATE"].str.slice(-2)
)

df.to_csv(output_file, index=False)

print("Fichier créé :", output_file)