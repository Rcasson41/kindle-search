import csv
import re
import json
from pathlib import Path

from sqlalchemy.orm import Session

from models import Book
from enricher import enrich
from embeddings import embed


def clean_isbn(raw: str) -> str | None:
    if not raw:
        return None
    cleaned = re.sub(r'[="\s]', "", raw)
    return cleaned if cleaned else None


def build_embed_text(title: str, author: str, description: str | None) -> str:
    if description:
        return f"Title: {title} by {author}. {description}"
    return f"Title: {title} by {author}"


def import_csv(csv_path: str, db: Session) -> dict:
    path = Path(csv_path)
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    total = len(rows)
    stats = {"total": total, "with_description": 0, "used_fallback": 0, "no_description": 0, "errors": 0}

    for idx, row in enumerate(rows, start=1):
        title = row.get("Title", "").strip()
        author = row.get("Author", "").strip()
        print(f"Importing book {idx} of {total}: {title}")

        try:
            goodreads_id = int(row.get("Book Id", 0)) or None
            isbn = clean_isbn(row.get("ISBN", ""))
            isbn13 = clean_isbn(row.get("ISBN13", ""))
            my_rating_raw = row.get("My Rating", "0")
            my_rating = float(my_rating_raw) if my_rating_raw else 0.0
            date_read = row.get("Date Read", "").strip() or None
            date_added = row.get("Date Added", "").strip() or None
            shelf = row.get("Exclusive Shelf", "").strip() or None

            metadata, used_fallback = enrich(isbn13, title, author)

            description = metadata.get("description")
            if description:
                stats["with_description"] += 1
            else:
                stats["no_description"] += 1
            if used_fallback:
                stats["used_fallback"] += 1

            embed_text = build_embed_text(title, author, description)
            embedding = embed(embed_text)

            existing = db.query(Book).filter(Book.goodreads_id == goodreads_id).first() if goodreads_id else None
            if existing:
                book = existing
            else:
                book = Book(goodreads_id=goodreads_id)
                db.add(book)

            book.title = title
            book.author = author
            book.isbn = isbn
            book.isbn13 = isbn13
            book.description = description
            book.genres = metadata.get("genres")
            book.cover_url = metadata.get("cover_url")
            book.page_count = metadata.get("page_count")
            book.published_date = metadata.get("published_date")
            book.publisher = metadata.get("publisher")
            book.my_rating = my_rating
            book.date_read = date_read
            book.date_added = date_added
            book.shelf = shelf
            book.embedding = embedding

            db.commit()

        except Exception as e:
            print(f"  ERROR importing '{title}': {e}")
            stats["errors"] += 1
            db.rollback()

    return stats
