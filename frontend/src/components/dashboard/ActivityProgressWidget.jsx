import React, { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ArrowRight, MoreHorizontal, Calendar, TrendingUp } from 'lucide-react'

const DEFAULT_ACTIVITY_DATA = [
  { month: 'Jan', progress: 30, hours: 240 },
  { month: 'Feb', progress: 42, hours: 320 },
  { month: 'Mar', progress: 38, hours: 290 },
  { month: 'Apr', progress: 55, hours: 410 },
  { month: 'May', progress: 68, hours: 500 },
  { month: 'Jun', progress: 62, hours: 470 },
  { month: 'Jul', progress: 85, hours: 620 },
  { month: 'Aug', progress: 92, hours: 710 },
]

export default function ActivityProgressWidget({
  title = 'Current Activity',
  chartSubtitle = 'Monthly Progress',
  chartData = DEFAULT_ACTIVITY_DATA,
  stat1 = {
    value: '4500+',
    label: 'Hours Completed',
    bgColor: 'from-amber-400 to-amber-500',
    btnBg: 'bg-amber-600/30 text-white hover:bg-amber-600/50',
    onClick: () => {},
  },
  stat2 = {
    value: '200K+',
    label: 'Total Enrolled',
    bgColor: 'from-rose-500 to-rose-600',
    btnBg: 'bg-rose-700/30 text-white hover:bg-rose-700/50',
    onClick: () => {},
  },
}) {
  const [selectedRange, setSelectedRange] = useState('This Year')

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-400 font-medium">{chartSubtitle}</p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <Calendar size={13} className="text-slate-400" />
            <span>{selectedRange}</span>
          </div>
        </div>

        {/* Smooth Area Chart */}
        <div className="h-44 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorActivityProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
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
                itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                formatter={(val) => [`${val}% Progress`, 'Activity']}
              />
              <Area
                type="monotone"
                dataKey="progress"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorActivityProgress)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Vibrant Colored Stat Cards Side-by-Side */}
      <div className="grid grid-cols-2 gap-3.5 mt-5">
        {/* Yellow Card */}
        <div
          onClick={stat1.onClick}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
            stat1.bgColor || 'from-amber-400 to-amber-500'
          } p-4 text-white shadow-md shadow-amber-500/20 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-display">
              {stat1.value}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-xs">
              <ArrowRight size={14} />
            </div>
          </div>
          <p className="mt-1 text-xs font-semibold text-amber-100">
            {stat1.label}
          </p>
        </div>

        {/* Pink Card */}
        <div
          onClick={stat2.onClick}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
            stat2.bgColor || 'from-rose-500 to-rose-600'
          } p-4 text-white shadow-md shadow-rose-500/20 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-display">
              {stat2.value}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-xs">
              <ArrowRight size={14} />
            </div>
          </div>
          <p className="mt-1 text-xs font-semibold text-rose-100">
            {stat2.label}
          </p>
        </div>
      </div>
    </div>
  )
}
