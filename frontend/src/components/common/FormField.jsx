export default function FormField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-xs font-medium text-ink-600">{label}</label>
      {children}
    </div>
  )
}

export const inputClass =
  'w-full rounded-md border border-paper-200 px-3 py-2 text-sm outline-none focus:border-navy-700'