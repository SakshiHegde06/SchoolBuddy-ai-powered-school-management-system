// Upgraded SaaS Metric Stat Card with accent gradients, dynamic trend badges, and icons
export default function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  color = 'blue',
  onClick,
}) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50/60 hover:bg-blue-50',
      iconBg: 'bg-blue-600 text-white shadow-blue-500/20',
      border: 'border-blue-100/80 hover:border-blue-300',
      glow: 'group-hover:text-blue-600',
      tab: 'border-l-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50/60 hover:bg-emerald-50',
      iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20',
      border: 'border-emerald-100/80 hover:border-emerald-300',
      glow: 'group-hover:text-emerald-600',
      tab: 'border-l-emerald-600',
    },
    purple: {
      bg: 'bg-purple-50/60 hover:bg-purple-50',
      iconBg: 'bg-purple-600 text-white shadow-purple-500/20',
      border: 'border-purple-100/80 hover:border-purple-300',
      glow: 'group-hover:text-purple-600',
      tab: 'border-l-purple-600',
    },
    amber: {
      bg: 'bg-amber-50/60 hover:bg-amber-50',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/20',
      border: 'border-amber-100/80 hover:border-amber-300',
      glow: 'group-hover:text-amber-600',
      tab: 'border-l-amber-500',
    },
    indigo: {
      bg: 'bg-indigo-50/60 hover:bg-indigo-50',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-500/20',
      border: 'border-indigo-100/80 hover:border-indigo-300',
      glow: 'group-hover:text-indigo-600',
      tab: 'border-l-indigo-600',
    },
  }

  const activeColor = colorStyles[color] || colorStyles.blue

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border ${activeColor.border} bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Decorative accent corner tab */}
      <div
        className={`absolute right-0 top-0 h-0 w-0 border-b-[24px] border-l-[24px] border-b-transparent ${activeColor.tab}`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className={`font-display text-3xl font-bold tracking-tight text-slate-900 transition-colors ${activeColor.glow}`}>
              {value ?? 0}
            </p>
          </div>
        </div>

        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${activeColor.iconBg} shadow-md transition-transform group-hover:scale-105`}>
            <Icon size={20} strokeWidth={2.2} />
          </div>
        )}
      </div>

      {(sublabel || trend) && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                trendType === 'up'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : trendType === 'down'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {trend}
            </span>
          )}
          {sublabel && <span className="text-slate-500 truncate">{sublabel}</span>}
        </div>
      )}
    </div>
  )
}