import { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'
import { Award, CheckCircle, AlertTriangle, BookOpen, Calendar, CheckCircle2 } from 'lucide-react'

function computeGrade(pct) {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
}

export default function SubjectDeck({ marks, subjects, teacherMap = {}, attendance = [], onOpenTranscript }) {
  const [activeView, setActiveView] = useState('table') // 'table' | 'chart'
  const [chartMetric, setChartMetric] = useState('marks') // 'marks' | 'percentage'

  const allSubjects = useMemo(() => {
    const list = [...(subjects || [])]
    ;(marks || []).forEach((m) => {
      if (!m.subjectId) return
      const found = list.find(
        (s) => s.id === m.subjectId || s.name?.toLowerCase() === m.subjectId?.toLowerCase()
      )
      if (!found) {
        list.push({
          id: m.subjectId,
          name: m.subjectName || `Subject (${m.subjectId.slice(0, 5)})`,
        })
      }
    })
    return list
  }, [subjects, marks])

  const marksBySubject = useMemo(() => {
    const map = {}
    ;(marks || []).forEach((m) => {
      const match = allSubjects.find(
        (s) => s.id === m.subjectId || s.name?.toLowerCase() === m.subjectId?.toLowerCase()
      )
      const key = match ? match.id : m.subjectId
      if (!map[key]) map[key] = []
      map[key].push(m)
    })
    return map
  }, [marks, allSubjects])

  const attendanceBySubject = useMemo(() => {
    const map = {}
    ;(attendance || []).forEach((a) => {
      const sId = a.subjectId || 'GENERAL'
      if (!map[sId]) map[sId] = { total: 0, present: 0 }
      map[sId].total += 1
      if (a.status === 'PRESENT') map[sId].present += 1
    })
    return map
  }, [attendance])

  const subjectsWithData = allSubjects.map((s) => {
    const subjectMarks = marksBySubject[s.id] || []
    const avgPct = subjectMarks.length > 0
      ? subjectMarks.reduce((sum, m) => sum + (m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0), 0) / subjectMarks.length
      : null
    const teacherName = s.teacherName || teacherMap[s.id] || null

    // Per-subject attendance (min 75% rule)
    const attStat = attendanceBySubject[s.id]
    const attTotal = attStat?.total || 0
    const attPresent = attStat?.present || 0
    const attPct = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : null
    const isAttEligible = attPct !== null ? attPct >= 75 : true

    return {
      ...s,
      marks: subjectMarks,
      avgPct,
      teacherName,
      attPct,
      attTotal,
      attPresent,
      isAttEligible,
    }
  })

  const defaultSelected = subjectsWithData.find((s) => s.marks.length > 0)?.id || allSubjects[0]?.id || null
  const [selectedId, setSelectedId] = useState(defaultSelected)

  useEffect(() => {
    if (!selectedId && defaultSelected) {
      setSelectedId(defaultSelected)
    }
  }, [defaultSelected, selectedId])

  const selected = subjectsWithData.find((s) => s.id === selectedId)

  // Chart data for selected subject
  const chartData = (selected?.marks || [])
    .slice()
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((m) => {
      const typeStr = m.type ? `${m.type.charAt(0)}${m.type.slice(1).toLowerCase()}` : 'Exam'
      const marksObtained = Number(m.marksObtained ?? 0)
      const maxMarks = Number(m.maxMarks ?? 0)
      const pct = maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 100) : 0
      return {
        label: `${m.term || 'Exam'} · ${typeStr}`,
        marksObtained,
        maxMarks,
        marksScoreText: `${marksObtained} / ${maxMarks}`,
        pct,
        grade: computeGrade(pct),
        date: m.date,
      }
    })

  const maxPossibleMarks = useMemo(() => {
    if (!chartData || chartData.length === 0) return 25
    const highest = Math.max(...chartData.map((d) => d.maxMarks || 0), 20)
    if (highest <= 20) return 20
    if (highest <= 25) return 25
    if (highest <= 50) return 50
    if (highest <= 100) return 100
    return Math.ceil(highest / 10) * 10
  }, [chartData])

  // Flat list of all published mark entries across all subjects
  const allMarkEntries = useMemo(() => {
    const list = []
    ;(marks || []).forEach((m) => {
      const sub = allSubjects.find(
        (s) => s.id === m.subjectId || s.name?.toLowerCase() === m.subjectId?.toLowerCase()
      )
      const subName = sub ? sub.name : (m.subjectName || `Subject (${m.subjectId?.slice(0, 5)})`)
      const pct = m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0
      const grade = computeGrade(pct)
      const teacher = sub?.teacherName || teacherMap[m.subjectId] || (sub ? teacherMap[sub.id] : null)
      list.push({
        ...m,
        subjectName: subName,
        percentage: pct,
        grade,
        teacherName: teacher,
      })
    })
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [marks, allSubjects, teacherMap])

  return (
    <div className="space-y-6">
      {/* Subject Selector Deck with Attendance & Average Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {subjectsWithData.map((s) => {
          const isSelected = s.id === selectedId
          const hasData = s.marks.length > 0
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                {s.attPct !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      s.isAttEligible
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                    title={`Attendance: ${s.attPct}% (${s.isAttEligible ? '>= 75% Eligible' : '< 75% Shortage'})`}
                  >
                    {s.attPct}% Att
                  </span>
                )}
              </div>

              {s.teacherName && (
                <p className="mt-1 text-xs font-medium text-blue-600 truncate flex items-center gap-1">
                  <span>👨‍🏫</span>
                  <span>{s.teacherName}</span>
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-medium">
                  {hasData ? `${s.marks.length} Exam(s)` : 'No marks yet'}
                </span>
                <span className={`font-bold ${hasData ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {hasData ? `Avg ${Math.round(s.avgPct)}%` : '—'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* View Toggle Bar (Detailed Table vs Trend Chart) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('table')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'table'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 All Exam Marks ({allMarkEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('chart')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'chart'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📊 Performance Chart
          </button>
        </div>

        {onOpenTranscript && (
          <button
            type="button"
            onClick={onOpenTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition"
          >
            <Award size={14} className="text-amber-600" />
            <span>Official Academic Transcript</span>
          </button>
        )}
      </div>

      {/* 1. All Marks Table View */}
      {activeView === 'table' && (
        <div className="space-y-3">
          {allMarkEntries.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
              <BookOpen size={36} className="mx-auto text-slate-400" />
              <h4 className="mt-2 text-sm font-bold text-slate-700">No marks entered yet</h4>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Once teachers enter scores for tests and exams (e.g., FA1, Unit Tests, Term Exams), they will be listed here with individual subject scores, percentages, and grades.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Assessment / Exam</th>
                    <th className="py-3 px-4 text-center">Marks Scored</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                    <th className="py-3 px-4 text-center">Subject Attendance (≥75%)</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allMarkEntries.map((row) => {
                    const subStat = subjectsWithData.find((s) => s.name === row.subjectName || s.id === row.subjectId)
                    return (
                      <tr key={row.id || Math.random()} className="hover:bg-blue-50/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {row.subjectName}
                          {row.teacherName && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Faculty: {row.teacherName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                            {row.term || 'Assessment'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {row.marksObtained} <span className="text-slate-400 font-normal">/ {row.maxMarks}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-blue-700">
                          {row.percentage}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              row.percentage >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.percentage >= 60
                                ? 'bg-blue-100 text-blue-800'
                                : row.percentage >= 40
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {row.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {subStat && subStat.attPct !== null ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                subStat.isAttEligible
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {subStat.isAttEligible ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                              <span>{subStat.attPct}% {subStat.isAttEligible ? '(Eligible)' : '(Shortage)'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {row.date ? new Date(row.date + (row.date.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Visual Bar Chart View */}
      {activeView === 'chart' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          {selected && chartData.length > 0 ? (
            <div>
              {/* Header with Title, Mode Toggle, Attendance Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900 font-display">
                      {selected.name} — Exam Marks Progression
                    </h4>
                    <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                      {chartData.length} Assessment{chartData.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {chartMetric === 'marks'
                      ? 'Displaying actual marks scored out of maximum possible marks.'
                      : 'Displaying normalized percentage scores (0% to 100%).'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mode Selector: Marks (Default) vs Percentage */}
                  <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setChartMetric('marks')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        chartMetric === 'marks'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🎯 Marks Scored
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric('percentage')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        chartMetric === 'percentage'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📈 Percentage (%)
                    </button>
                  </div>

                  {selected.attPct !== null && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-xl font-bold border ${
                        selected.isAttEligible
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      Att: {selected.attPct}% ({selected.isAttEligible ? 'Eligible' : 'Shortage'})
                    </span>
                  )}
                </div>
              </div>

              {/* Chart Canvas */}
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 25, right: 25, left: -10, bottom: 5 }}
                    barGap={8}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={chartMetric === 'marks' ? [0, maxPossibleMarks] : [0, 100]}
                      tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      unit={chartMetric === 'marks' ? '' : '%'}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload
                          return (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 text-white p-3.5 shadow-xl text-xs space-y-1.5 min-w-[180px]">
                              <p className="font-bold text-slate-300 text-xs border-b border-slate-800 pb-1">
                                {d.label}
                              </p>
                              <div className="pt-0.5">
                                <p className="text-blue-400 font-extrabold text-sm">
                                  Marks Scored: {d.marksObtained} / {d.maxMarks}
                                </p>
                                <p className="text-slate-300 font-medium">
                                  Percentage: {d.pct}% • Grade {d.grade}
                                </p>
                                {d.date && (
                                  <p className="text-slate-400 text-[10px] mt-1">
                                    Date: {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    {/* The Bar: Fixed width (barSize={44}), rounded top corners, never stretches */}
                    <Bar
                      dataKey={chartMetric === 'marks' ? 'marksObtained' : 'pct'}
                      fill="#2563EB"
                      barSize={44}
                      radius={[8, 8, 0, 0]}
                    >
                      {/* Bold Label directly on top of the bar showing actual marks (e.g. 20 / 20) */}
                      <LabelList
                        dataKey={chartMetric === 'marks' ? 'marksScoreText' : 'pct'}
                        position="top"
                        offset={8}
                        fill="#0F172A"
                        fontSize={12}
                        fontWeight={700}
                        formatter={(val) => (chartMetric === 'marks' ? val : `${val}%`)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Legend & Summary Pill */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-md bg-blue-600" />
                  <span className="font-semibold text-slate-700">
                    {chartMetric === 'marks' ? 'Marks Scored (Out of Total Marks)' : 'Percentage Score (%)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {chartData.map((d, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold"
                    >
                      <span>{d.label.split('·')[0].trim()}:</span>
                      <span className="text-blue-700 font-extrabold">{d.marksScoreText}</span>
                      <span className="text-blue-500 font-medium">({d.pct}%)</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-xs text-slate-500">
              Select a subject card above to view its exam scores progression chart.
            </p>
          )}
        </div>
      )}
    </div>
  )
}