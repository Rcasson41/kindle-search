import { useState } from "react";
import ModeToggle from "./ModeToggle";

export default function SearchBar({ onSearch, mode, onModeChange }) {
  const [query, setQuery] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <ModeToggle mode={mode} onChange={onModeChange} />
        {mode === "text" && (
          <span className="text-xs text-gray-500">Search by title or author name</span>
        )}
        {mode === "semantic" && (
          <span className="text-xs text-gray-500">Describe the vibe you're looking for</span>
        )}
      </div>

      {mode === "text" ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or author..."
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. A slow cozy mystery set in a small English village..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
          />
          <button
            type="submit"
            className="self-end px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Find matching books
          </button>
        </div>
      )}
    </form>
  );
}
