import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts'

const DEFAULT_PERFORMANCE_DATA = [
  { name: 'Grade 10A', score: 92, color: '#0ea5e9' }, // Cyan / Sky Blue
  { name: 'Grade 10B', score: 84, color: '#6366f1' }, // Indigo / Royal Purple
  { name: 'Grade 9A', score: 78, color: '#14b8a6' },  // Teal
  { name: 'Grade 9B', score: 72, color: '#f43f5e' },  // Rose / Pink
  { name: 'Grade 8A', score: 65, color: '#f59e0b' },  // Amber / Warm Yellow
]

export default function SchoolPerformanceBarWidget({
  title = 'Top 5 School Performance',
  data = DEFAULT_PERFORMANCE_DATA,
}) {
  const displayData = data && data.length > 0 ? data : DEFAULT_PERFORMANCE_DATA

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h2>

        {/* Legend row with colored indicator dots */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pb-3 border-b border-slate-100 text-xs">
          {displayData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 font-medium text-slate-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Bar Chart Container */}
        <div className="h-52 w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                }}
                formatter={(val) => [`${val}% Score`, 'Performance']}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
