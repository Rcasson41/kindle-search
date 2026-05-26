#!/usr/bin/env python3
"""
Run from the project root:
    python scripts/seed.py

Or from the scripts/ directory:
    python seed.py
"""
import sys
from pathlib import Path

# Allow imports from backend/
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from database import engine, SessionLocal, Base
from models import Book
from importer import import_csv

Base.metadata.create_all(bind=engine)

CSV_PATH = Path(__file__).parent.parent / "goodreads_library_export.csv"

if not CSV_PATH.exists():
    print(f"ERROR: CSV not found at {CSV_PATH}")
    print("Make sure your goodreads_library_export.csv is at the project root (kindle-search/)")
    sys.exit(1)

print(f"Reading from: {CSV_PATH}")
print("Starting import...\n")

db = SessionLocal()
try:
    stats = import_csv(str(CSV_PATH), db)
finally:
    db.close()

print("\n--- Import Summary ---")
print(f"Total books processed : {stats['total']}")
print(f"With description      : {stats['with_description']}")
print(f"Used fallback search  : {stats['used_fallback']}")
print(f"No description found  : {stats['no_description']}")
print(f"Errors                : {stats['errors']}")
print("\nDone! Run the backend with: uvicorn main:app --reload (from backend/)")
