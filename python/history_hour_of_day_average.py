import pandas as pd

input_file = "bixi_2025_history_hourly_average.csv"
output_file = "bixi_2025_history_hour_of_day_average.csv"

df = pd.read_csv(input_file)

df["hour"] = pd.to_datetime(df["hour"], utc=True).dt.tz_convert("America/Toronto")
df["hour_of_day"] = df["hour"].dt.hour

result = (
    df.groupby(["station", "hour_of_day"], as_index=False)
    .agg(
        avg_bikes=("avg_bikes", "mean"),
        avg_stands=("avg_stands", "mean"),
        start_date=("hour", "min"),
        end_date=("hour", "max"),
        observations=("hour", "count"),
    )
)

result["avg_bikes"] = result["avg_bikes"].round(2)
result["avg_stands"] = result["avg_stands"].round(2)

result.to_csv(output_file, index=False)

print("Fichier créé :", output_file)