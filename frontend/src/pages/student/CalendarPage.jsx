import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import { mockCalendarEvents } from '../../data/mockData'

const getEventColor = (type) => {
  const colors = { event: 'info', exam: 'warning', holiday: 'success' }
  return colors[type] || 'info'
}

export default function CalendarPage() {
  return (
    <Card title="School calendar">
      <div className="space-y-3">
        {mockCalendarEvents.map((event, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-md border border-paper-200 p-3">
            <div>
              <p className="font-medium text-navy-900">{event.title}</p>
              <p className="text-xs text-ink-400">{event.date}</p>
            </div>
            <Badge tone={getEventColor(event.type)}>{event.type}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}