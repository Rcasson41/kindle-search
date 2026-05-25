from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import json

from database import engine, get_db, Base
from models import Book
from embeddings import embed, rank_by_similarity

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kindle Library Search")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def book_to_dict(book: Book, similarity: float | None = None) -> dict:
    d = {
        "id": book.id,
        "goodreads_id": book.goodreads_id,
        "title": book.title,
        "author": book.author,
        "isbn": book.isbn,
        "isbn13": book.isbn13,
        "description": book.description,
        "genres": book.genres,
        "cover_url": book.cover_url,
        "page_count": book.page_count,
        "published_date": book.published_date,
        "publisher": book.publisher,
        "my_rating": book.my_rating,
        "date_read": book.date_read,
        "date_added": book.date_added,
        "shelf": book.shelf,
    }
    if similarity is not None:
        d["similarity"] = round(similarity * 100, 1)
    return d


@app.get("/search")
def search(
    q: str = Query(..., min_length=1),
    mode: str = Query("text", pattern="^(text|semantic)$"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if mode == "text":
        term = f"%{q}%"
        books = (
            db.query(Book)
            .filter((Book.title.ilike(term)) | (Book.author.ilike(term)))
            .limit(limit)
            .all()
        )
        return [book_to_dict(b) for b in books]

    # semantic mode
    query_embedding = embed(q)
    all_books = db.query(Book).all()
    pairs = [(b, b.embedding) for b in all_books if b.embedding]
    ranked = rank_by_similarity(query_embedding, pairs)
    return [book_to_dict(book, score) for book, score in ranked[:limit]]


@app.get("/books")
def list_books(
    shelf: Optional[str] = Query(None),
    sort: Optional[str] = Query("date_added"),
    db: Session = Depends(get_db),
):
    q = db.query(Book)
    if shelf:
        q = q.filter(Book.shelf == shelf)

    sort_map = {
        "date_added": Book.date_added.desc(),
        "title": Book.title.asc(),
        "author": Book.author.asc(),
        "my_rating": Book.my_rating.desc(),
    }
    order = sort_map.get(sort, Book.date_added.desc())
    books = q.order_by(order).all()
    return [book_to_dict(b) for b in books]


@app.get("/books/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book_to_dict(book)


@app.get("/stats")
def stats(db: Session = Depends(get_db)):
    total = db.query(Book).count()
    shelves = {}
    for shelf_name in ["read", "to-read", "currently-reading"]:
        shelves[shelf_name] = db.query(Book).filter(Book.shelf == shelf_name).count()
    with_desc = db.query(Book).filter(Book.description.isnot(None)).count()
    without_desc = total - with_desc
    return {
        "total": total,
        "shelves": shelves,
        "with_description": with_desc,
        "without_description": without_desc,
    }
