import duckdb

con = duckdb.connect(":memory:")
con.execute("SET s3_endpoint='storage.googleapis.com'")

columns = con.execute("""
DESCRIBE SELECT *
FROM read_parquet('s3://bike-sharing-history/montreal/bixi/2025/*.parquet')
""").fetchall()

for col in columns:
    print(col)