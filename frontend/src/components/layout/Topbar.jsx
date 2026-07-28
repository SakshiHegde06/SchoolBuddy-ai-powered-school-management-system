import { ROLES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'
import SmartSearchBar from '../search/SmartSearchBar'
import NotificationBell from './NotificationBell'
import { initials } from '../../utils/formatters'
import { CalendarDays } from 'lucide-react'

export default function Topbar() {
  const { user } = useAuth()

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="flex h-20 items-center justify-between border-b border-blue-200 bg-white px-8 shadow-sm">

      {/* Left Side */}

      <div className="flex flex-col">

        {user?.role === ROLES.ADMIN ? (
          <>
            <h1 className="text-2xl font-bold text-blue-700">
             SchoolBuddy Dashboard
            </h1>

            <div className="mt-3 w-96">
              <SmartSearchBar />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-blue-700">
              Welcome, {user?.name?.split(' ')[0]} 
            </h1>

            <p className="text-sm text-gray-500">
              Have a productive day!
            </p>
          </>
        )}

      </div>

      {/* Right Side */}

      <div className="flex items-center gap-6">

        <div className="hidden items-center gap-2 rounded-xl bg-sky-50 px-4 py-2 md:flex">
          <CalendarDays className="text-blue-600" size={18} />
          <span className="text-sm text-gray-700">
            {today}
          </span>
        </div>

        <NotificationBell notifications={[]} />

        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow">
            {initials(user?.name) || 'U'}
          </div>

          <div className="hidden md:block">

            <p className="font-semibold text-gray-800">
              {user?.name}
            </p>

            <p className="text-xs capitalize text-gray-500">
              {user?.role?.toLowerCase()}
            </p>

          </div>

        </div>

      </div>

    </header>
  )
}