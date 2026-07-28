// Placeholder result renderer — Phase 3 wires this to
// GET /api/search?q=&category= once the backend endpoint exists.
export default function SearchResultsDropdown({ query, category }) {
  return (
    <div className="absolute z-10 mt-2 w-full rounded-lg border border-paper-200 bg-paper-50 p-3 text-sm shadow-lg">
      <p className="text-ink-400">
        Searching {category.toLowerCase()} for "{query}"…
      </p>
      <p className="mt-1 text-xs text-ink-400">Connect to the backend search endpoint to see live results.</p>
    </div>
  )
}