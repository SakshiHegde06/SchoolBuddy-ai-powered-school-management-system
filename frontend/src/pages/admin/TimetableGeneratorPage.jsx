import Card from "../../components/common/Card"
import { mockTimetable } from "../../data/mockData"

export default function TimetableGeneratorPage() {
  return (
    <Card title="Timetable">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper-200">
              <th className="px-4 py-2 text-left font-medium">Period</th>
              <th className="px-4 py-2 text-left font-medium">Time</th>
              <th className="px-4 py-2 text-left font-medium">Mon</th>
              <th className="px-4 py-2 text-left font-medium">Tue</th>
              <th className="px-4 py-2 text-left font-medium">Wed</th>
              <th className="px-4 py-2 text-left font-medium">Thu</th>
              <th className="px-4 py-2 text-left font-medium">Fri</th>
            </tr>
          </thead>
          <tbody>
            {mockTimetable.map((row) => (
              <tr key={row.period} className="border-b border-paper-100">
                <td className="px-4 py-2">{row.period}</td>
                <td className="px-4 py-2 text-xs text-ink-600">{row.time}</td>
                <td className="px-4 py-2">{row.monday}</td>
                <td className="px-4 py-2">{row.tuesday}</td>
                <td className="px-4 py-2">{row.wednesday}</td>
                <td className="px-4 py-2">{row.thursday}</td>
                <td className="px-4 py-2">{row.friday}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}