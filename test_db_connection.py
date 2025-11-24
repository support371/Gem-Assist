import os
import psycopg2
import sys

try:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    print("DB connection OK")
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f"DB connection FAILED: {e}", file=sys.stderr)
    sys.exit(1)
