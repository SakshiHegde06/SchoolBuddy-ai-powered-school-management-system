import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function OverallPassDonutWidget({
  title = 'Overall Pass Percentage',
  passRate = 84,
  failRate = 16,
  passLabel = 'Pass',
  failLabel = 'Needs Attention',
  passColor = '#6366f1', // Indigo / Purple
  failColor = '#38bdf8', // Cyan / Sky Blue
}) {
  const data = [
    { name: passLabel, value: passRate, color: passColor },
    { name: failLabel, value: failRate, color: failColor },
  ]

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h2>

        {/* Donut Chart with Center Metric */}
        <div className="relative h-48 w-full flex items-center justify-center mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val}%`, 'Rate']}
              />
              <Pie
                data={data}
                innerRadius={52}
                outerRadius={74}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Absolute Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900 font-display">
              {passRate}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pass Rate
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: passColor }}
            />
            <span>{passLabel} ({passRate}%)</span>
          </div>

          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: failColor }}
            />
            <span>{failLabel} ({failRate}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
