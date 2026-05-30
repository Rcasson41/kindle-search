import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Recommendations() {
  const navigate = useNavigate();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  async function fetchRecs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/recommendations");
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Something went wrong.");
      } else {
        setRecs(data);
        setFetched(true);
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-lg font-bold text-gray-100">Book Recommendations</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-400">
            Gemini analyzes your ratings and notes to suggest books you'll enjoy.
            Rate books 4–5 stars or add notes to get better recommendations.
          </p>
          <button
            onClick={fetchRecs}
            disabled={loading}
            className="self-start px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? "Asking Gemini…" : fetched ? "Refresh recommendations" : "Get recommendations"}
          </button>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
            <p className="font-medium mb-1">Error</p>
            <p>{error}</p>
            {error.includes("GEMINI_API_KEY") && (
              <p className="mt-2 text-red-400">
                Get a free key at{" "}
                <span className="font-mono">ai.google.dev</span>, then restart the backend with:{" "}
                <span className="font-mono">GEMINI_API_KEY=your_key uvicorn main:app --reload</span>
              </p>
            )}
          </div>
        )}

        {recs.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{recs.length} recommendations</p>
            {recs.map((rec, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-gray-100 font-semibold text-sm">{rec.title}</h3>
                    <p className="text-gray-400 text-xs">{rec.author}</p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">#{i + 1}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{rec.reason}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
