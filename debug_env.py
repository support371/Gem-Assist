import sys
import os

print("Python executable:", sys.executable)
print("sys.path:")
for p in sys.path:
    print(f"  - {p}")

try:
    import flask
    print("\\nFlask found at:", flask.__file__)
except ImportError:
    print("\\nFlask not found.")

print("\\nPYTHONPATH:", os.environ.get("PYTHONPATH"))
