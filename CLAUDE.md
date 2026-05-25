# Kindle Library Search Engine — Project Context

## What this is
A local web app to search a personal Kindle/Goodreads book library two ways:
1. Text search by title or author
2. Semantic "mood" search using AI embeddings (sentence-transformers, no API key)

Built from a Goodreads CSV export at `../MyLibrary/goodreads_library_export.csv` (34 books).

## Stack
- **Backend**: Python, FastAPI, SQLite (SQLAlchemy), sentence-transformers (all-MiniLM-L6-v2), requests
- **Frontend**: React 18, Vite, Tailwind CSS
- **Embeddings**: stored as JSON arrays in SQLite, cosine similarity via numpy (no vector DB)
- **Metadata**: Google Books API (ISBN13 lookup, fallback to title+author search)

## Project structure
```
kindle-search/
├── backend/
│   ├── main.py        # FastAPI app, endpoints: /search /books /books/{id} /stats
│   ├── models.py      # SQLAlchemy Book model
│   ├── database.py    # SQLite engine + session
│   ├── embeddings.py  # SentenceTransformer wrapper + cosine similarity
│   ├── enricher.py    # Google Books API calls
│   ├── importer.py    # CSV parser + enrichment + embedding pipeline
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx                    # Main app, tabs: Library / Search
│       └── components/
│           ├── SearchBar.jsx          # Text input or mood textarea + mode toggle
│           ├── ModeToggle.jsx         # "Title/Author" vs "Mood Search" toggle
│           ├── BookCard.jsx           # Cover, title, shelf badge, stars, genres, description
│           └── BookGrid.jsx           # Responsive card grid with loading skeleton
├── scripts/
│   └── seed.py        # Run once to import CSV → SQLite (takes ~3-5 min)
└── CLAUDE.md          # This file
```

## How to run
```bash
# 1. Install Python deps
cd backend && pip install -r requirements.txt

# 2. Seed the database (first time only — fetches metadata + builds embeddings)
cd .. && python scripts/seed.py

# 3. Start backend
cd backend && uvicorn main:app --reload   # → localhost:8000

# 4. Start frontend
cd frontend && npm install && npm run dev  # → localhost:5173
```

## Key data notes
- Goodreads CSV has ISBNs wrapped in `=""...""`  — cleaned in `importer.py:clean_isbn()`
- The CSV has no `Average Rating` column (spec assumed it; we skip it)
- `Number of Pages` is the column name (not `Page Count`)
- Shelf values: `read`, `to-read`, `currently-reading`

## GitHub
https://github.com/Rcasson41/kindle-search
