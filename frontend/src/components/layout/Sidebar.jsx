import { NavLink } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

function iconFor(name) {
  const pascal = name
    .split('-')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('')

  return Icons[pascal] || Icons.Circle
}

export default function Sidebar({ links }) {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-72 flex-col bg-gradient-to-b from-sky-100 via-blue-50 to-white border-r border-blue-200 shadow-lg">

      {/* Logo */}

      <div className="border-b border-blue-200 p-6">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-lg">
            🎓
          </div>

          <div>

            <h1 className="text-2xl font-bold text-blue-700">
              SchoolBuddy
            </h1>

            <p className="text-sm text-gray-500 capitalize">
              {user?.role?.toLowerCase()} Portal
            </p>

          </div>

        </div>

      </div>

      {/* Navigation */}

      <nav className="flex-1 space-y-2 p-4 overflow-y-auto">

        {links.map((link) => {

          const Icon = iconFor(link.icon)

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to.split('/').length <= 2}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                }`
              }
            >
              <Icon size={20} />

              <span className="font-medium">
                {link.label}
              </span>

            </NavLink>
          )

        })}

      </nav>

      {/* Bottom */}

      <div className="border-t border-blue-200 p-4">

        <div className="mb-4 rounded-xl bg-blue-50 p-3">

          <p className="font-semibold text-blue-700">
            Logged in as
          </p>

          <p className="text-sm text-gray-600">
            {user?.name}
          </p>

          <p className="text-xs text-gray-500 capitalize">
            {user?.role?.toLowerCase()}
          </p>

        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-500 px-4 py-3 text-white transition hover:bg-red-600"
        >
          <Icons.LogOut size={18} />
          Sign Out
        </button>

      </div>

    </aside>
  )
}