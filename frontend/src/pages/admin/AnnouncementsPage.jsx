import Card from "../../components/common/Card"
import { mockAnnouncements } from "../../data/mockData"

export default function AnnouncementsPage() {
  return (
    <Card title="Announcements">
      <div className="space-y-4">
        {mockAnnouncements.map((announcement) => (
          <div key={announcement.id} className="rounded-md border border-paper-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-navy-900">{announcement.title}</h3>
                <p className="mt-1 text-sm text-ink-600">{announcement.content}</p>
              </div>
              <span className="text-xs text-ink-400">{announcement.date}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}