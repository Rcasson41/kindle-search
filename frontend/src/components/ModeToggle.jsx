export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-700 w-fit">
      <button
        onClick={() => onChange("text")}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          mode === "text"
            ? "bg-indigo-600 text-white"
            : "bg-gray-800 text-gray-400 hover:text-gray-200"
        }`}
      >
        Title / Author
      </button>
      <button
        onClick={() => onChange("semantic")}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          mode === "semantic"
            ? "bg-indigo-600 text-white"
            : "bg-gray-800 text-gray-400 hover:text-gray-200"
        }`}
      >
        Mood Search
      </button>
    </div>
  );
}
