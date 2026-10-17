export default function Card({ title, action, className = '', children }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {title && <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}