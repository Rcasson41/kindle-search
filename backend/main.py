from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from pathlib import Path
import json
import os
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from database import engine, get_db, Base
from models import Book
from embeddings import embed, rank_by_similarity

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kindle Library Search")

_static = Path(__file__).parent / "static"
if _static.exists():
    app.mount("/static", StaticFiles(directory=str(_static)), name="static")

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
        "notes": book.notes,
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


class BookUpdate(BaseModel):
    shelf: Optional[str] = None
    my_rating: Optional[float] = None
    notes: Optional[str] = None


@app.patch("/books/{book_id}")
def update_book(book_id: int, payload: BookUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if payload.shelf is not None:
        book.shelf = payload.shelf
    if payload.my_rating is not None:
        book.my_rating = payload.my_rating
    if payload.notes is not None:
        book.notes = payload.notes
    db.commit()
    return book_to_dict(book)


@app.get("/recommendations")
def recommendations(db: Session = Depends(get_db)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY not set. Start the server with: GEMINI_API_KEY=your_key uvicorn main:app --reload",
        )

    rated = db.query(Book).filter(
        (Book.my_rating >= 4) | (Book.notes.isnot(None))
    ).all()

    if not rated:
        raise HTTPException(status_code=400, detail="Rate some books first to get recommendations.")

    book_lines = []
    for b in rated:
        line = f'- "{b.title}" by {b.author}'
        if b.my_rating:
            line += f" (rated {int(b.my_rating)}/5)"
        if b.notes:
            line += f" — my notes: {b.notes}"
        book_lines.append(line)

    prompt = (
        "I'm building a personal book recommendation system. "
        "Here are books from my library that I've rated highly or written notes about:\n\n"
        + "\n".join(book_lines)
        + "\n\nBased on my reading preferences, recommend exactly 10 books I haven't read yet. "
        "For each recommendation respond with ONLY a JSON array (no markdown, no code fences) like:\n"
        '[{"title": "...", "author": "...", "reason": "one sentence why I\'d enjoy it"}, ...]'
    )

    from google import genai
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
    text = response.text.strip()

    try:
        recs = json.loads(text)
    except json.JSONDecodeError:
        import re
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            recs = json.loads(match.group())
        else:
            raise HTTPException(status_code=500, detail="Could not parse Gemini response.")

    return recs


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
