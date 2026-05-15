import duckdb

con = duckdb.connect(":memory:")
con.execute("SET s3_endpoint='storage.googleapis.com'")

con.execute("""
COPY (
    SELECT *
    FROM read_parquet('s3://bike-sharing-history/montreal/bixi/2025/*.parquet')
    ORDER BY commit_at, station
)
TO 'bixi_2025_history.csv'
WITH (HEADER, DELIMITER ',');
""")

print("Export terminé.")