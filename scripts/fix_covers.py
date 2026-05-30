#!/usr/bin/env python3
import sys, time, re, requests
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
from database import SessionLocal
from models import Book

SESSION = requests.Session()
SESSION.headers["User-Agent"] = "kindle-search/1.0"


def clean_title(title):
    return re.sub(r"\s*\(.*?\)\s*$", "", title).strip()


def cover_by_search(title, author):
    try:
        r = SESSION.get(
            "https://openlibrary.org/search.json",
            params={"title": clean_title(title), "author": author, "limit": 1, "fields": "cover_i"},
            timeout=10,
        )
        docs = r.json().get("docs", [])
        if docs and docs[0].get("cover_i"):
            return f"https://covers.openlibrary.org/b/id/{docs[0]['cover_i']}-L.jpg"
    except Exception as e:
        print(f"  search error: {e}")
    return None


db = SessionLocal()
books = db.query(Book).all()

isbn_count = 0
search_count = 0
failed = 0

for book in books:
    if book.isbn13:
        book.cover_url = f"https://covers.openlibrary.org/b/isbn/{book.isbn13}-L.jpg"
        isbn_count += 1
    else:
        url = cover_by_search(book.title, book.author)
        if url:
            book.cover_url = url
            search_count += 1
            print(f"  ✓ {book.title}")
        else:
            failed += 1
            print(f"  ✗ {book.title}")
        time.sleep(0.5)

db.commit()
db.close()

print(f"\nDone. ISBN covers: {isbn_count}, search covers: {search_count}, failed: {failed}")
