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
    <aside className="flex h-screen w-72 flex-col bg-slate-900 border-r border-slate-800 text-slate-100 shadow-2xl shrink-0">
      {/* Brand & Logo Header */}
      <div className="border-b border-slate-800/80 p-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
            <Icons.GraduationCap className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>SchoolBuddy</span>
            </h1>
            <p className="text-xs text-slate-400 capitalize font-medium truncate">
              {user?.role?.toLowerCase()} workspace
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-3.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {links.map((link) => {
          const Icon = iconFor(link.icon)

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to.split('/').length <= 2}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom User Profile & Sign Out */}
      <div className="border-t border-slate-800/80 p-4 space-y-3">
        <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Signed in as
          </p>
          <p className="text-sm font-semibold text-slate-200 truncate mt-0.5">
            {user?.name}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-medium capitalize text-indigo-400">
              {user?.role?.toLowerCase()}
            </span>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Active session" />
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-rose-500/30 hover:bg-rose-950/30 hover:text-rose-400 shadow-xs"
        >
          <Icons.LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}