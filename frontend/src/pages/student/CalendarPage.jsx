import { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import { useFetch } from '../../hooks/useFetch'
import { holidayService } from '../../services/holidayService'

const getEventColor = (type) => {
  const colors = { event: 'info', exam: 'warning', holiday: 'success' }
  return colors[type] || 'info'
}

export default function CalendarPage() {
  const { data: holidays, isLoading, error } = useFetch(() => holidayService.list(), [])
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!holidays) return

    setEvents(
      holidays.map((holiday) => ({
        title: holiday.title || 'Holiday',
        date: holiday.date,
        type: 'holiday',
      }))
    )
  }, [holidays])

  return (
    <Card title="School calendar">
      {isLoading && <Spinner label="Loading calendar…" />}
      {error && <p className="text-sm text-red-600">Unable to load calendar events.</p>}
      {!isLoading && !error && (
        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-md border border-paper-200 p-3">
                <div>
                  <p className="font-medium text-navy-900">{event.title}</p>
                  <p className="text-xs text-ink-400">{event.date}</p>
                </div>
                <Badge tone={getEventColor(event.type)}>{event.type}</Badge>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No calendar events available yet.</p>
          )}
        </div>
      )}
    </Card>
  )
}
