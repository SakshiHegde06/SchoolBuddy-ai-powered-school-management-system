import { useState } from 'react'
import { Bell } from 'lucide-react'

export default function NotificationBell({ notifications = [], onMarkRead = () => {} }) {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-navy-900 hover:bg-paper-200"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-600 text-[10px] text-paper-50">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-paper-200 bg-paper-50 shadow-lg">
          <div className="border-b border-paper-200 px-4 py-3 text-sm font-medium text-navy-900">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-400">You're all caught up</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && onMarkRead(n.id)}
                  className={`block w-full border-b border-paper-200/60 px-4 py-3 text-left text-sm last:border-0 ${
                    n.isRead ? 'opacity-60' : 'bg-amber-50/50'
                  }`}
                >
                  <p className="font-medium text-ink-900">{n.title}</p>
                  <p className="text-ink-700">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : ''}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}