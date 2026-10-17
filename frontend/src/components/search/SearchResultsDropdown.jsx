import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchService } from '../../services/searchService'
import api from '../../services/api'
import {
  User,
  GraduationCap,
  Users,
  School,
  BookOpen,
  ArrowRight,
  Loader2,
  SearchX,
} from 'lucide-react'

const CATEGORY_ICONS = {
  Students: { icon: User, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  Teachers: { icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  Parents: { icon: Users, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  Classes: { icon: School, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  Subjects: { icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
}

export default function SearchResultsDropdown({ query, category, onClose }) {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query || !query.trim()) {
      setResults([])
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setError(null)

    // Call unified backend search endpoint
    searchService
      .search(query.trim(), category)
      .then((res) => {
        if (!isCancelled) {
          setResults(res.data || [])
        }
      })
      .catch(async (err) => {
        // Fallback to client-side search across REST endpoints if needed
        try {
          const lowerQ = query.trim().toLowerCase()
          const fallbackResults = []

          if (category === 'All' || category === 'Students') {
            const { data } = await api.get('/students').catch(() => ({ data: [] }))
            ;(data || []).forEach((s) => {
              if (
                s.name?.toLowerCase().includes(lowerQ) ||
                s.email?.toLowerCase().includes(lowerQ) ||
                s.rollNumber?.toLowerCase().includes(lowerQ)
              ) {
                fallbackResults.push({
                  id: s.id,
                  category: 'Students',
                  title: s.name,
                  subtitle: s.email || `Roll #${s.rollNumber || '-'}`,
                  link: '/admin/students',
                })
              }
            })
          }

          if (category === 'All' || category === 'Teachers') {
            const { data } = await api.get('/teachers').catch(() => ({ data: [] }))
            ;(data || []).forEach((t) => {
              if (
                t.name?.toLowerCase().includes(lowerQ) ||
                t.email?.toLowerCase().includes(lowerQ) ||
                t.phone?.toLowerCase().includes(lowerQ)
              ) {
                fallbackResults.push({
                  id: t.id,
                  category: 'Teachers',
                  title: t.name,
                  subtitle: t.email || t.phone || 'Teacher',
                  link: '/admin/teachers',
                })
              }
            })
          }

          if (category === 'All' || category === 'Classes') {
            const { data } = await api.get('/classes').catch(() => ({ data: [] }))
            ;(data || []).forEach((c) => {
              if (c.name?.toLowerCase().includes(lowerQ) || c.section?.toLowerCase().includes(lowerQ)) {
                fallbackResults.push({
                  id: c.id,
                  category: 'Classes',
                  title: `${c.name}${c.section ? ` - Section ${c.section}` : ''}`,
                  subtitle: `${c.studentCount || 0} Students`,
                  link: '/admin/classes',
                })
              }
            })
          }

          if (category === 'All' || category === 'Subjects') {
            const { data } = await api.get('/subjects').catch(() => ({ data: [] }))
            ;(data || []).forEach((sub) => {
              if (sub.name?.toLowerCase().includes(lowerQ) || sub.code?.toLowerCase().includes(lowerQ)) {
                fallbackResults.push({
                  id: sub.id,
                  category: 'Subjects',
                  title: `${sub.name}${sub.code ? ` (${sub.code})` : ''}`,
                  subtitle: `${sub.weeklyFrequency || 0} periods/week`,
                  link: '/admin/subjects',
                })
              }
            })
          }

          if (!isCancelled) {
            setResults(fallbackResults)
          }
        } catch (fallbackErr) {
          if (!isCancelled) {
            console.error('Search error:', fallbackErr)
            setError('Failed to fetch search results.')
          }
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [query, category])

  const handleSelect = (item) => {
    if (item.link) {
      navigate(item.link)
    }
    if (onClose) onClose()
  }

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-2xl transition-all"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
        <span>
          Search results for "<span className="text-blue-600 font-bold">{query}</span>" in{' '}
          <span className="text-slate-700">{category}</span>
        </span>
        {results.length > 0 && (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 font-medium">
            {results.length} found
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Searching {category.toLowerCase()}…</span>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-xs text-red-600">{error}</div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
          <SearchX className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-xs font-medium text-slate-600">No matching records found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different name, roll number, or class.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 py-1">
          {results.map((item) => {
            const config = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Students
            const Icon = config.icon

            return (
              <button
                key={`${item.category}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.bg} ${config.color}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                        {item.title}
                      </span>
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="truncate text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                </div>

                <ArrowRight
                  size={14}
                  className="shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:text-blue-600"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}