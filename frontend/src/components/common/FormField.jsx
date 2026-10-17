export default function FormField({ label, children }) {
  return (
    <div className="mb-4 space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 shadow-xs'