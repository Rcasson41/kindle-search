# Kindle Library Search Engine

A local web app to search your Kindle/Goodreads library by title, author, or mood.

## Prerequisites

- Python 3.11+
- Node.js 18+

## Setup

### 1. Install Python dependencies

```bash
cd kindle-search/backend
pip install -r requirements.txt
```

> First run downloads the `all-MiniLM-L6-v2` model (~90 MB). Subsequent runs are instant.

### 2. Seed the database

Run from the `kindle-search/` directory:

```bash
python scripts/seed.py
```

This reads `../MyLibrary/goodreads_library_export.csv`, fetches metadata from Google Books, generates embeddings, and saves everything to `backend/library.db`.

Takes ~3–5 minutes for 34 books (rate-limited to 0.5s per request).

### 3. Start the backend

```bash
cd backend
uvicorn main:app --reload
```

Runs at `http://localhost:8000`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

## Usage

- **Library tab** — browse all books, filter by shelf (Read / Want to Read / Currently Reading), sort by date, title, author, or rating
- **Search tab** — toggle between:
  - **Title / Author** — fast case-insensitive text search
  - **Mood Search** — describe what you're in the mood for, get AI-ranked results with similarity %

Click any book card to expand the full description.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /search?q=...&mode=text\|semantic&limit=20` | Search books |
| `GET /books?shelf=read\|to-read\|currently-reading&sort=date_added` | List all books |
| `GET /books/{id}` | Single book detail |
| `GET /stats` | Library counts by shelf |
