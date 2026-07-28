export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 py-8 justify-center text-ink-400 text-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper-200 border-t-navy-900" />
      {label}
    </div>
  )
}