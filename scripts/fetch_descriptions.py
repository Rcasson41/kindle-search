#!/usr/bin/env python3
"""
Fetch descriptions from Open Library for all books missing them.
Run from project root: python scripts/fetch_descriptions.py
"""
import sys
import time
import requests
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from database import SessionLocal
from models import Book

SESSION = requests.Session()
SESSION.headers["User-Agent"] = "kindle-search/1.0 (personal library app)"


def get_description_by_isbn(isbn13: str) -> str | None:
    try:
        r = SESSION.get(f"https://openlibrary.org/isbn/{isbn13}.json", timeout=10, allow_redirects=True)
        if r.status_code != 200:
            return None
        work_keys = r.json().get("works", [])
        if not work_keys:
            return None
        work_id = work_keys[0]["key"]
        time.sleep(0.3)
        wr = SESSION.get(f"https://openlibrary.org{work_id}.json", timeout=10)
        if wr.status_code != 200:
            return None
        desc = wr.json().get("description")
        if isinstance(desc, str):
            return desc.strip() or None
        if isinstance(desc, dict):
            return desc.get("value", "").strip() or None
    except Exception as e:
        print(f"    ISBN lookup error: {e}")
    return None


def get_description_by_title_author(title: str, author: str) -> str | None:
    try:
        r = SESSION.get(
            "https://openlibrary.org/search.json",
            params={"title": title, "author": author, "limit": 1, "fields": "key,title"},
            timeout=10,
        )
        if r.status_code != 200:
            return None
        docs = r.json().get("docs", [])
        if not docs:
            return None
        work_key = docs[0].get("key")
        if not work_key:
            return None
        time.sleep(0.3)
        wr = SESSION.get(f"https://openlibrary.org{work_key}.json", timeout=10)
        if wr.status_code != 200:
            return None
        desc = wr.json().get("description")
        if isinstance(desc, str):
            return desc.strip() or None
        if isinstance(desc, dict):
            return desc.get("value", "").strip() or None
    except Exception as e:
        print(f"    Title/author lookup error: {e}")
    return None


db = SessionLocal()
try:
    books = db.query(Book).filter(Book.description.is_(None)).all()
    print(f"Found {len(books)} books without descriptions.\n")

    found = 0
    for i, book in enumerate(books, 1):
        print(f"[{i}/{len(books)}] {book.title}")
        desc = None

        if book.isbn13:
            desc = get_description_by_isbn(book.isbn13)
            if desc:
                print(f"  ✓ Found via ISBN13")

        if not desc:
            time.sleep(0.3)
            desc = get_description_by_title_author(book.title, book.author)
            if desc:
                print(f"  ✓ Found via title/author search")

        if desc:
            book.description = desc
            db.commit()
            found += 1
        else:
            print(f"  — No description found")

        time.sleep(0.5)

    print(f"\nDone. Updated {found}/{len(books)} books with descriptions.")
finally:
    db.close()
