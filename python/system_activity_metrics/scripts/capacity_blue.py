import pandas as pd

df = pd.read_csv("bluebikes_stations.csv", skiprows=1)

df["Total Docks"] = pd.to_numeric(df["Total Docks"], errors="coerce")

total_docks = df["Total Docks"].sum()
stations = df["Total Docks"].notna().sum()

print("Nombre de stations:", stations)
print("Nombre total de bornes:", int(total_docks))