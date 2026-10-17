import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Groups a flat list of mark entries by subject, shows one tappable "card"
// per subject (like a deck), and renders a bar chart of that subject's
// scores (as %) once tapped. Used by both the student and parent dashboards.
export default function SubjectDeck({ marks, subjects, teacherMap = {} }) {
  const marksBySubject = useMemo(() => {
    const map = {}
    ;(marks || []).forEach((m) => {
      if (!map[m.subjectId]) map[m.subjectId] = []
      map[m.subjectId].push(m)
    })
    return map
  }, [marks])

  const knownSubjectIds = new Set((subjects || []).map((s) => s.id))
  const extraSubjects = Object.keys(marksBySubject)
    .filter((id) => !knownSubjectIds.has(id))
    .map((id) => ({ id, name: `Subject (${id.slice(0, 5)})` }))

  const allSubjects = [...(subjects || []), ...extraSubjects]

  const subjectsWithData = allSubjects.map((s) => {
    const subjectMarks = marksBySubject[s.id] || []
    const avgPct = subjectMarks.length > 0
      ? subjectMarks.reduce((sum, m) => sum + (m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0), 0) / subjectMarks.length
      : null
    const teacherName = s.teacherName || teacherMap[s.id] || null
    return { ...s, marks: subjectMarks, avgPct, teacherName }
  })

  const defaultSelected = subjectsWithData.find((s) => s.marks.length > 0)?.id || null
  const [selectedId, setSelectedId] = useState(defaultSelected)

  // Ensure selectedId updates once async marks load
  useEffect(() => {
    if (!selectedId && defaultSelected) {
      setSelectedId(defaultSelected)
    }
  }, [defaultSelected, selectedId])

  const selected = subjectsWithData.find((s) => s.id === selectedId)

  const chartData = (selected?.marks || [])
    .slice()
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((m) => {
      const typeStr = m.type ? `${m.type.charAt(0)}${m.type.slice(1).toLowerCase()}` : 'Exam'
      return {
        label: `${m.term || 'Exam'} · ${typeStr}`,
        pct: m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0,
        score: `${m.marksObtained}/${m.maxMarks}`,
      }
    })

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
              className={`rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500'
                  : hasData
                  ? 'border-paper-200 bg-white hover:border-blue-400 hover:shadow'
                  : 'border-paper-200 bg-paper-100 opacity-60'
              }`}
            >
              <p className="text-sm font-semibold text-navy-900 truncate">{s.name}</p>
              {s.teacherName && (
                <p className="mt-0.5 text-xs font-medium text-blue-600 truncate flex items-center gap-1">
                  <span>👨‍🏫</span>
                  <span>{s.teacherName}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-ink-500 font-medium">
                {hasData ? `Avg ${Math.round(s.avgPct)}%` : 'No marks yet'}
              </p>
            </button>
          )
        })}
      </div>

      {selected && chartData.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-navy-900">
            {selected.name} {selected.teacherName ? `(Teacher: ${selected.teacherName})` : ''} — scores over time
          </p>
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