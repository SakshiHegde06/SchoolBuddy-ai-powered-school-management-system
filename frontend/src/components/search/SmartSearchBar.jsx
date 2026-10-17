import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import SearchResultsDropdown from './SearchResultsDropdown'

const CATEGORIES = ['All', 'Students', 'Teachers', 'Classes', 'Subjects', 'Parents']

// Admin global search with instant debounced backend querying
export default function SmartSearchBar() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const debouncedQuery = useDebounce(query, 250)

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative w-full max-w-lg">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 shadow-sm">
        <Search size={16} className="shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search students, teachers, classes, subjects…"
          className="w-full bg-transparent text-xs sm:text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />

        {query && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded text-slate-400 hover:text-slate-600 focus:outline-none"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('sb-open-command-palette'))}
          className="hidden sm:inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-blue-600 hover:border-blue-300 transition shrink-0 shadow-xs"
          title="Open Command Palette (Ctrl + K)"
        >
          <kbd>Ctrl</kbd>+<kbd>K</kbd>
        </button>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="cursor-pointer rounded-lg bg-slate-200/70 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none transition"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {focused && debouncedQuery.trim().length > 0 && (
        <SearchResultsDropdown
          query={debouncedQuery}
          category={category}
          onClose={() => setFocused(false)}
        />
      )}
    </div>
  )
}