import { Megaphone } from 'lucide-react'
import Card from './Card'
import Spinner from './Spinner'
import { useFetch } from '../../hooks/useFetch'
import { announcementService } from '../../services/announcementService'

export default function AnnouncementsWidget({ limit = 3, title = 'Recent Announcements' }) {
  const { data: announcements, isLoading, error } = useFetch(
    () => announcementService.list({ limit }),
    []
  )

  return (
    <Card title={title}>
      {isLoading && <Spinner label="Loading announcements..." />}

      {error && (
        <p className="text-sm text-red-600">Unable to load announcements.</p>
      )}

      {!isLoading && !error && announcements && announcements.length === 0 && (
        <p className="text-sm text-slate-500">No announcements available yet.</p>
      )}

      {!isLoading && !error && announcements && announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.slice(0, limit).map((announcement) => (
            <div
              key={announcement.id}
              className="flex items-start gap-3 rounded-lg border border-slate-200 p-4"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Megaphone size={18} />
              </div>

              <div className="min-w-0">
                <h3 className="font-medium text-slate-900">{announcement.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{announcement.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
