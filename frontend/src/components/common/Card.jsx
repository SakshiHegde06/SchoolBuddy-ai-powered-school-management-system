export default function Card({ title, action, className = '', children }) {
  return (
    <div className={`rounded-lg border border-paper-200 bg-paper-50 p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-display text-lg text-navy-900">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}