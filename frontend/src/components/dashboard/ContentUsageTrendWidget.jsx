import React from 'react'
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'

const DEFAULT_TREND_DATA = [
  { day: 'Mon', value: 35 },
  { day: 'Tue', value: 48 },
  { day: 'Wed', value: 42 },
  { day: 'Thu', value: 65 },
  { day: 'Fri', value: 58 },
  { day: 'Sat', value: 75 },
  { day: 'Sun', value: 88 },
]

export default function ContentUsageTrendWidget({
  title = 'Content Usage',
  trendText = '2.5% higher than last month',
  trendDirection = 'up',
  data = DEFAULT_TREND_DATA,
}) {
  const displayData = data && data.length > 0 ? data : DEFAULT_TREND_DATA

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h2>

        {/* Growth pill */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <TrendingUp size={13} />
            <span>{trendText}</span>
          </div>
        </div>

        {/* Sparkline Curve */}
        <div className="h-44 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val} Activity Index`, 'Usage']}
              />
              <Line
                type="natural"
                dataKey="value"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#0284c7' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
