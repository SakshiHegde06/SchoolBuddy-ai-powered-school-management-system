import { ROLES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import SmartSearchBar from '../search/SmartSearchBar'
import NotificationBell from './NotificationBell'
import { notificationService } from '../../services/notificationService'
import { initials } from '../../utils/formatters'
import { CalendarDays, Search } from 'lucide-react'

export default function Topbar() {
  const { user } = useAuth()

  const { data: notifications, refetch: refetchNotifications } = useFetch(
    () => (user ? notificationService.list() : Promise.resolve({ data: [] })),
    [user?.id]
  )

  async function handleMarkRead(id) {
    await notificationService.markRead(id)
    refetchNotifications()
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-8 shadow-xs backdrop-blur-md">
      {/* Left Side */}
      <div className="flex flex-col">
        {user?.role === ROLES.ADMIN ? (
          <>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Institution Overview
            </h1>
            <div className="mt-2.5 w-96">
              <SmartSearchBar />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h1 className="text-base font-bold tracking-tight text-slate-900">
                  {user?.role === ROLES.STUDENT
                    ? 'Student Portal'
                    : user?.role === ROLES.TEACHER
                    ? 'Faculty Portal'
                    : user?.role === ROLES.PARENT
                    ? 'Parent Portal'
                    : 'Academic Portal'}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Active Session • SchoolBuddy LMS
              </p>
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('sb-open-command-palette'))}
              className="hidden lg:flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-medium text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-700 transition shadow-xs"
              title="Open Spotlight Commands (Ctrl + K)"
            >
              <Search size={14} className="text-slate-400" />
              <span>Search or type Ctrl + K...</span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-xs">
                Ctrl+K
              </kbd>
            </button>
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 md:flex shadow-xs">
          <CalendarDays className="text-indigo-600" size={16} />
          <span>{today}</span>
        </div>

        <NotificationBell notifications={notifications || []} onMarkRead={handleMarkRead} />

        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/90 px-3 py-1.5 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-xs font-bold text-white shadow-sm shadow-indigo-600/30">
            {initials(user?.name) || 'U'}
          </div>

          <div className="hidden md:block">
            <p className="font-semibold text-xs text-slate-900 leading-tight">
              {user?.name}
            </p>
            <p className="text-[11px] capitalize text-indigo-600 font-medium leading-tight mt-0.5">
              {user?.role?.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}