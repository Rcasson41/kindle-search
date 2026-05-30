import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SHELF_OPTIONS = [
  { value: "", label: "No shelf" },
  { value: "read", label: "Read" },
  { value: "to-read", label: "Want to Read" },
  { value: "currently-reading", label: "Currently Reading" },
];

const SHELF_STYLES = {
  read: "bg-emerald-900 text-emerald-300",
  "to-read": "bg-blue-900 text-blue-300",
  "currently-reading": "bg-amber-900 text-amber-300",
};

function StarRating({ rating, onRate }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || rating || 0;
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onRate(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <svg
            className={`w-7 h-7 transition-colors ${n <= active ? "text-yellow-400" : "text-gray-700"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.38 2.456c-.784.57-1.838-.197-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.624 9.394c-.783-.57-.38-1.81.588-1.81H7.38a1 1 0 00.951-.69L9.049 2.927z" />
          </svg>
        </button>
      ))}
      {rating > 0 && (
        <button
          type="button"
          onClick={() => onRate(0)}
          className="ml-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          clear
        </button>
      )}
    </div>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/books/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setBook(data);
          setNotes(data.notes || "");
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function patch(fields) {
    const res = await fetch(`/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    return res.json();
  }

  async function handleShelfChange(e) {
    const updated = await patch({ shelf: e.target.value || null });
    setBook(updated);
  }

  async function handleRate(stars) {
    const updated = await patch({ my_rating: stars || null });
    setBook(updated);
  }

  const handleNotesChange = useCallback((e) => {
    const value = e.target.value;
    setNotes(value);
    setNotesSaved(false);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await patch({ notes: value || null });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }, 500);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !book) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-gray-400">
        <p>Book not found.</p>
        <button onClick={() => navigate("/")} className="text-indigo-400 hover:text-indigo-300 text-sm">
          ← Back to library
        </button>
      </div>
    );
  }

  const genres = book.genres
    ? book.genres.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to library
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0 w-48 mx-auto sm:mx-0">
            {book.cover_url && !imgError ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full rounded-xl shadow-2xl"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl bg-gray-800 flex flex-col items-center justify-center p-4">
                <svg className="w-10 h-10 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-gray-500 text-xs text-center">{book.title}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 leading-tight">{book.title}</h1>
              <p className="text-gray-400 mt-1">{book.author}</p>
            </div>

            {book.shelf && (
              <span className={`w-fit text-sm px-3 py-1 rounded-full font-medium ${SHELF_STYLES[book.shelf] || "bg-gray-800 text-gray-400"}`}>
                {SHELF_OPTIONS.find((o) => o.value === book.shelf)?.label || book.shelf}
              </span>
            )}

            {/* Star rating */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">My rating</label>
              <StarRating rating={book.my_rating || 0} onRate={handleRate} />
            </div>

            {/* Shelf dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Reading status</label>
              <select
                value={book.shelf || ""}
                onChange={handleShelfChange}
                className="w-fit bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                {SHELF_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span key={g} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{g}</span>
                ))}
              </div>
            )}

            {book.page_count && (
              <p className="text-xs text-gray-500">
                {book.page_count} pages
                {book.published_date ? ` · ${book.published_date}` : ""}
                {book.publisher ? ` · ${book.publisher}` : ""}
              </p>
            )}

            <div>
              {book.description ? (
                <p className="text-gray-300 text-sm leading-relaxed">{book.description}</p>
              ) : (
                <p className="text-amber-700 italic text-sm">Description coming soon</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-800 pt-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">My notes</label>
            {notesSaved && <span className="text-xs text-emerald-500">Saved</span>}
          </div>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Write your thoughts, favourite quotes, or anything you want to remember..."
            rows={5}
            className="w-full bg-gray-900 border border-gray-800 text-gray-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder-gray-600 resize-y"
          />
        </div>
      </main>
    </div>
  );
}
