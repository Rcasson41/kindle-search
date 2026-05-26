import { useState } from "react";

const SHELF_STYLES = {
  read: "bg-emerald-900 text-emerald-300",
  "to-read": "bg-blue-900 text-blue-300",
  "currently-reading": "bg-amber-900 text-amber-300",
};

const SHELF_LABELS = {
  read: "Read",
  "to-read": "Want to Read",
  "currently-reading": "Currently Reading",
};

function Stars({ rating }) {
  if (!rating || rating === 0) return null;
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "text-yellow-400" : "text-gray-700"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.38 2.456c-.784.57-1.838-.197-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.624 9.394c-.783-.57-.38-1.81.588-1.81H7.38a1 1 0 00.951-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
}

function CoverPlaceholder({ title }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-2">
      <svg className="w-8 h-8 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <span className="text-gray-500 text-xs text-center line-clamp-3 leading-tight">{title}</span>
    </div>
  );
}

function getCoverUrl(book) {
  if (book.cover_url) return book.cover_url;
  if (book.isbn13) return `https://covers.openlibrary.org/b/isbn/${book.isbn13}-M.jpg`;
  if (book.isbn) return `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`;
  return null;
}

export default function BookCard({ book, showSimilarity = false }) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const coverUrl = getCoverUrl(book);

  const genres = book.genres
    ? book.genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-gray-600 transition-colors"
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Cover */}
      <div className="relative w-full" style={{ paddingTop: "140%" }}>
        <div className="absolute inset-0">
          {coverUrl && !imgError ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <CoverPlaceholder title={book.title} />
          )}
        </div>
        {showSimilarity && book.similarity != null && (
          <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {book.similarity}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-1">
          <div>
            <h3 className="text-sm font-semibold text-gray-100 leading-tight line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {book.shelf && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                SHELF_STYLES[book.shelf] || "bg-gray-800 text-gray-400"
              }`}
            >
              {SHELF_LABELS[book.shelf] || book.shelf}
            </span>
          )}
          <Stars rating={book.my_rating} />
        </div>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.map((g) => (
              <span key={g} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>
        )}

        {book.description && (
          <p
            className={`text-xs text-gray-400 leading-relaxed ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {book.description}
          </p>
        )}

        {!book.description && (
          <p className="text-xs text-amber-700 italic">Description coming soon</p>
        )}
      </div>
    </div>
  );
}
