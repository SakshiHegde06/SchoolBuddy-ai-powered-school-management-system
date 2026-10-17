import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Sparkles,
  UserPlus,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Bell,
  Upload,
  ClipboardCheck,
  Award,
  FileText,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Users,
  Compass,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../utils/constants'
import { roleNavConfig } from '../../utils/roleConfig'
import { searchService } from '../../services/searchService'

export default function CommandPaletteModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [backendResults, setBackendResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Focus input on open & clear query
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setBackendResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Global keydown listeners for Ctrl+K, Cmd+K, Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          window.dispatchEvent(new CustomEvent('sb-open-command-palette'))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Debounced search for admin
  useEffect(() => {
    if (!isOpen || !query.trim() || query.trim().length < 2 || user?.role !== ROLES.ADMIN) {
      setBackendResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await searchService.search(query.trim(), 'All')
        setBackendResults(res.data || [])
      } catch (err) {
        setBackendResults([])
      } finally {
        setIsSearching(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, isOpen, user?.role])

  // Define role-specific quick action triggers
  const quickActions = useMemo(() => {
    const role = user?.role
    const actions = []

    if (role === ROLES.ADMIN) {
      actions.push(
        {
          id: 'admin-timetable',
          title: 'Manage Timetable',
          subtitle: 'Create or update class period schedules & room assignments',
          icon: Clock,
          color: 'text-indigo-600 bg-indigo-50',
          action: () => navigate('/admin/timetable'),
        },
        {
          id: 'admin-add-student',
          title: 'Add New Student',
          subtitle: 'Register student profile and assign class',
          icon: UserPlus,
          color: 'text-emerald-600 bg-emerald-50',
          action: () => navigate('/admin/students'),
        },
        {
          id: 'admin-add-teacher',
          title: 'Add New Teacher',
          subtitle: 'Onboard faculty member and credentials',
          icon: Users,
          color: 'text-blue-600 bg-blue-50',
          action: () => navigate('/admin/teachers'),
        },
        {
          id: 'admin-announcement',
          title: 'Post School Announcement',
          subtitle: 'Broadcast alerts to teachers, students & parents',
          icon: Bell,
          color: 'text-amber-600 bg-amber-50',
          action: () => navigate('/admin/announcements'),
        },
        {
          id: 'admin-import',
          title: 'Bulk Import Users',
          subtitle: 'Upload CSV spreadsheet with student/staff roster',
          icon: Upload,
          color: 'text-purple-600 bg-purple-50',
          action: () => navigate('/admin/import'),
        }
      )
    } else if (role === ROLES.TEACHER) {
      actions.push(
        {
          id: 'teacher-attendance',
          title: 'Take Class Attendance',
          subtitle: 'Mark today’s roll call for your assigned sections',
          icon: ClipboardCheck,
          color: 'text-emerald-600 bg-emerald-50',
          action: () => navigate('/teacher/attendance'),
        },
        {
          id: 'teacher-marks',
          title: 'Record Exam Marks',
          subtitle: 'Submit subject scores and term exam grades',
          icon: Award,
          color: 'text-indigo-600 bg-indigo-50',
          action: () => navigate('/teacher/marks'),
        },
        {
          id: 'teacher-homework',
          title: 'Assign Homework',
          subtitle: 'Set due dates and instructions for students',
          icon: FileText,
          color: 'text-amber-600 bg-amber-50',
          action: () => navigate('/teacher/homework'),
        },
        {
          id: 'teacher-materials',
          title: 'Upload Study Materials',
          subtitle: 'Share PDF lectures, notes, and references',
          icon: BookOpen,
          color: 'text-blue-600 bg-blue-50',
          action: () => navigate('/teacher/materials'),
        }
      )
    } else if (role === ROLES.STUDENT) {
      actions.push(
        {
          id: 'student-materials',
          title: 'Access Study Materials',
          subtitle: 'Download course guides, PDFs, and notes',
          icon: BookOpen,
          color: 'text-blue-600 bg-blue-50',
          action: () => navigate('/student/materials'),
        },
        {
          id: 'student-calendar',
          title: 'View Academic Calendar',
          subtitle: 'Check upcoming exam dates, events, and holidays',
          icon: Calendar,
          color: 'text-purple-600 bg-purple-50',
          action: () => navigate('/calendar'),
        }
      )
    } else if (role === ROLES.PARENT) {
      actions.push(
        {
          id: 'parent-progress',
          title: 'Child Academic Progress',
          subtitle: 'View grades, attendance percentage, and remarks',
          icon: TrendingUp,
          color: 'text-emerald-600 bg-emerald-50',
          action: () => navigate('/parent/progress'),
        },
        {
          id: 'parent-calendar',
          title: 'School Calendar & Events',
          subtitle: 'Holidays, exam schedules, and parent meetings',
          icon: Calendar,
          color: 'text-purple-600 bg-purple-50',
          action: () => navigate('/calendar'),
        }
      )
    }

    return actions
  }, [user?.role, navigate])

  // Get navigation links from roleNavConfig
  const navLinks = useMemo(() => {
    const config = roleNavConfig[user?.role]
    if (!config?.links) return []
    return config.links.map((item) => ({
      id: `nav-${item.to}`,
      title: item.label,
      subtitle: `Navigate to ${item.label}`,
      to: item.to,
      icon: Compass,
      color: 'text-slate-600 bg-slate-100',
      action: () => navigate(item.to),
    }))
  }, [user?.role, navigate])

  // Filter based on search query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return quickActions
    const q = query.toLowerCase()
    return quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    )
  }, [quickActions, query])

  const filteredNav = useMemo(() => {
    if (!query.trim()) return navLinks.slice(0, 4)
    const q = query.toLowerCase()
    return navLinks.filter(
      (n) => n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)
    )
  }, [navLinks, query])

  // Combine flat list of selectable items for arrow-key navigation
  const flatItems = useMemo(() => {
    const items = []
    filteredActions.forEach((item) => items.push({ type: 'action', data: item }))
    backendResults.forEach((item) => items.push({ type: 'search', data: item }))
    filteredNav.forEach((item) => items.push({ type: 'nav', data: item }))
    return items
  }, [filteredActions, backendResults, filteredNav])

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(0)
    }
  }, [flatItems.length, selectedIndex])

  function handleSelect(item) {
    if (!item) return
    onClose()
    if (item.type === 'action' || item.type === 'nav') {
      item.data.action()
    } else if (item.type === 'search') {
      const res = item.data
      if (res.category === 'Students') {
        navigate('/admin/students')
      } else if (res.category === 'Teachers') {
        navigate('/admin/teachers')
      } else if (res.category === 'Classes') {
        navigate('/admin/classes')
      } else if (res.category === 'Subjects') {
        navigate('/admin/subjects')
      } else if (res.category === 'Parents') {
        navigate('/admin/parents')
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(flatItems.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + Math.max(flatItems.length, 1)) % Math.max(flatItems.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatItems[selectedIndex]) {
        handleSelect(flatItems[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-[10vh] sm:pt-[14vh] backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="relative flex items-center border-b border-slate-100 px-4 py-3 sm:px-5">
          <Search className="mr-3 h-5 w-5 shrink-0 text-blue-600" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search students, or jump to page..."
            className="w-full bg-transparent text-base text-slate-800 placeholder-slate-400 outline-none"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="mr-2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <kbd className="hidden rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 sm:inline-block shadow-xs">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results Area */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100">
          {flatItems.length === 0 && !isSearching && (
            <div className="py-12 text-center">
              <Compass className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">No matching commands or records found</p>
              <p className="text-xs text-slate-400">Try searching for &quot;timetable&quot;, &quot;students&quot;, or &quot;attendance&quot;</p>
            </div>
          )}

          {/* Quick Actions Group */}
          {filteredActions.length > 0 && (
            <div className="pb-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Actions
              </div>
              <div className="space-y-1">
                {filteredActions.map((action) => {
                  const itemIndex = flatItems.findIndex((it) => it.type === 'action' && it.data.id === action.id)
                  const isSelected = selectedIndex === itemIndex
                  const Icon = action.icon

                  return (
                    <button
                      key={action.id}
                      onClick={() => handleSelect({ type: 'action', data: action })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                        isSelected ? 'bg-blue-50 text-blue-900 shadow-xs' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{action.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{action.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-block rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-200">
                          Action
                        </span>
                        {isSelected && <ArrowRight size={14} className="text-blue-600" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Live Search Results (Admin) */}
          {backendResults.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Database Records</span>
                {isSearching && <span className="text-blue-600">Searching…</span>}
              </div>
              <div className="space-y-1">
                {backendResults.map((result) => {
                  const itemIndex = flatItems.findIndex((it) => it.type === 'search' && it.data.id === result.id)
                  const isSelected = selectedIndex === itemIndex

                  return (
                    <button
                      key={`search-${result.id}`}
                      onClick={() => handleSelect({ type: 'search', data: result })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                        isSelected ? 'bg-indigo-50 text-indigo-900 shadow-xs' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                          {result.category?.[0] || 'R'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{result.title}</p>
                          <p className="text-xs text-slate-500">{result.subtitle || result.category}</p>
                        </div>
                      </div>
                      <span className="rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-600">
                        {result.category}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {filteredNav.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </div>
              <div className="space-y-1">
                {filteredNav.map((link) => {
                  const itemIndex = flatItems.findIndex((it) => it.type === 'nav' && it.data.id === link.id)
                  const isSelected = selectedIndex === itemIndex

                  return (
                    <button
                      key={link.id}
                      onClick={() => handleSelect({ type: 'nav', data: link })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                        isSelected ? 'bg-slate-100 text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Compass size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{link.title}</p>
                          <p className="text-xs text-slate-400">{link.to}</p>
                        </div>
                      </div>
                      {isSelected && <ArrowRight size={14} className="text-slate-600" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-xs">↑</kbd>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-xs">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-xs">↵</kbd>
              to select
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles size={13} className="text-amber-500" />
            <span>SchoolBuddy Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  )
}
