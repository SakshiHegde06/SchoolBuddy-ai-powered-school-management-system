// Signature element: a "report card" stat tile — a folded amber corner tab,
// like the grade-summary box on a school report card.
export default function StatCard({ label, value, sublabel }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-paper-200 bg-paper-50 p-5">
      <div
        className="absolute right-0 top-0 h-0 w-0 border-b-[26px] border-l-[26px] border-b-transparent border-l-amber-500"
        aria-hidden="true"
      />
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-2 font-display text-3xl text-navy-900">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-ink-600">{sublabel}</p>}
    </div>
  )
}