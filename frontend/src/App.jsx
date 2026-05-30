import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import SearchBar from "./components/SearchBar";
import BookGrid from "./components/BookGrid";
import BookDetail from "./components/BookDetail";
import Recommendations from "./components/Recommendations";

const SHELVES = [
  { key: null, label: "All" },
  { key: "read", label: "Read" },
  { key: "to-read", label: "Want to Read" },
  { key: "currently-reading", label: "Currently Reading" },
];

const SORT_OPTIONS = [
  { key: "date_added", label: "Date Added" },
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "my_rating", label: "My Rating" },
];

function App() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("library"); // "library" | "search"
  const [mode, setMode] = useState("text");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [allBooks, setAllBooks] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [activeShelf, setActiveShelf] = useState(null);
  const [sort, setSort] = useState("date_added");
  const [stats, setStats] = useState(null);

  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (activeShelf) params.set("shelf", activeShelf);
      const res = await fetch(`/books?${params}`);
      const data = await res.json();
      setAllBooks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLibraryLoading(false);
    }
  }, [activeShelf, sort]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  useEffect(() => {
    fetch("/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  async function handleSearch(query) {
    setSearchQuery(query);
    setTab("search");
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const params = new URLSearchParams({ q: query, mode, limit: 20 });
      const res = await fetch(`/search?${params}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h1 className="text-lg font-bold text-gray-100">Kindle Library</h1>
            {stats && (
              <span className="text-xs text-gray-500 ml-1">{stats.total} books</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab("library")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "library"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Library
            </button>
            <button
              onClick={() => setTab("search")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "search"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Search
            </button>
            <button
              onClick={() => navigate("/recommendations")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
            >
              For You
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Search box — always visible */}
        <SearchBar onSearch={handleSearch} mode={mode} onModeChange={setMode} />

        {/* Library tab */}
        {tab === "library" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Shelf filter chips */}
              <div className="flex gap-2 flex-wrap">
                {SHELVES.map(({ key, label }) => (
                  <button
                    key={String(key)}
                    onClick={() => setActiveShelf(key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeShelf === key
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {label}
                    {stats && key === null && (
                      <span className="ml-1 text-xs opacity-70">({stats.total})</span>
                    )}
                    {stats && key === "read" && (
                      <span className="ml-1 text-xs opacity-70">({stats.shelves?.read || 0})</span>
                    )}
                    {stats && key === "to-read" && (
                      <span className="ml-1 text-xs opacity-70">({stats.shelves?.["to-read"] || 0})</span>
                    )}
                    {stats && key === "currently-reading" && (
                      <span className="ml-1 text-xs opacity-70">({stats.shelves?.["currently-reading"] || 0})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <BookGrid books={allBooks} loading={libraryLoading} />
          </div>
        )}

        {/* Search tab */}
        {tab === "search" && (
          <div className="flex flex-col gap-4">
            {searchQuery && !searchLoading && (
              <p className="text-sm text-gray-400">
                {mode === "semantic" ? "Semantic results" : "Results"} for{" "}
                <span className="text-gray-200">"{searchQuery}"</span>
                {" — "}
                <span>{searchResults.length} books</span>
              </p>
            )}
            <BookGrid
              books={searchResults}
              loading={searchLoading}
              showSimilarity={mode === "semantic"}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/books/:id" element={<BookDetail />} />
      <Route path="/recommendations" element={<Recommendations />} />
    </Routes>
  );
}
