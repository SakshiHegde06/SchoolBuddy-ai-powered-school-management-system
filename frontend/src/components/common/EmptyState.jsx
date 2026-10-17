export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-paper-200 py-12 text-center">
      <p className="font-display text-lg text-navy-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-600">{description}</p>}
      {action}
    </div>
  )
}