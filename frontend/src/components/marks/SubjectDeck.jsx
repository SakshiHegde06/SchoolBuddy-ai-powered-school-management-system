import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Groups a flat list of mark entries by subject, shows one tappable "card"
// per subject (like a deck), and renders a bar chart of that subject's
// scores (as %) once tapped. Used by both the student and parent dashboards.
export default function SubjectDeck({ marks, subjects }) {
  const marksBySubject = useMemo(() => {
    const map = {}
    ;(marks || []).forEach((m) => {
      if (!map[m.subjectId]) map[m.subjectId] = []
      map[m.subjectId].push(m)
    })
    return map
  }, [marks])

  const subjectsWithData = (subjects || []).map((s) => {
    const subjectMarks = marksBySubject[s.id] || []
    const avgPct = subjectMarks.length > 0
      ? subjectMarks.reduce((sum, m) => sum + (m.marksObtained / m.maxMarks) * 100, 0) / subjectMarks.length
      : null
    return { ...s, marks: subjectMarks, avgPct }
  })

  const defaultSelected = subjectsWithData.find((s) => s.marks.length > 0)?.id || null
  const [selectedId, setSelectedId] = useState(defaultSelected)
  const selected = subjectsWithData.find((s) => s.id === selectedId)

  const chartData = (selected?.marks || [])
    .slice()
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((m) => ({
      label: `${m.term} · ${m.type.charAt(0)}${m.type.slice(1).toLowerCase()}`,
      pct: Math.round((m.marksObtained / m.maxMarks) * 100),
      score: `${m.marksObtained}/${m.maxMarks}`,
    }))

  if (subjectsWithData.length === 0) {
    return <p className="text-sm text-ink-400">No subjects set up yet.</p>
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {subjectsWithData.map((s) => {
          const isSelected = s.id === selectedId
          const hasData = s.marks.length > 0
          return (
            <button
              key={s.id}
              onClick={() => hasData && setSelectedId(s.id)}
              disabled={!hasData}
              className={`rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-amber-500 bg-amber-100/40'
                  : hasData
                  ? 'border-paper-200 bg-paper-50 hover:border-navy-700'
                  : 'border-paper-200 bg-paper-100 opacity-50'
              }`}
            >
              <p className="text-sm font-medium text-navy-900">{s.name}</p>
              <p className="text-xs text-ink-400">
                {hasData ? `Avg ${Math.round(s.avgPct)}%` : 'No marks yet'}
              </p>
            </button>
          )
        })}
      </div>

      {selected && chartData.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-navy-900">{selected.name} — scores over time</p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8C8A80' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8C8A80' }} />
                <Tooltip
                  formatter={(value, name, props) => [props.payload.score, 'Score']}
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E0D5' }}
                />
                <Bar dataKey="pct" fill="#1E2A47" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}