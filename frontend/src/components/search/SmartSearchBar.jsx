import { useState } from 'react'
import { Search } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import SearchResultsDropdown from './SearchResultsDropdown'

const CATEGORIES = ['All', 'Students', 'Teachers', 'Parents', 'Classes', 'Subjects']

// Admin-only global search. Wired to a debounced query; the actual
// API call + result rendering lives in SearchResultsDropdown so this
// component only owns input state and category filtering.
export default function SmartSearchBar() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [focused, setFocused] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-md border border-paper-200 bg-paper-50 px-3 py-2">
        <Search size={16} className="text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search students, teachers, classes…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded bg-paper-200 px-2 py-1 text-xs text-ink-600 outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {focused && debouncedQuery.length > 0 && (
        <SearchResultsDropdown query={debouncedQuery} category={category} />
      )}
    </div>
  )
}