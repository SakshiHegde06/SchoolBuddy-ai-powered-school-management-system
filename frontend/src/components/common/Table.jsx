export default function Table({ columns, rows, emptyLabel = 'No records yet' }) {
  if (!rows || rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">{emptyLabel}</p>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="hover:bg-slate-50/60 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-800 font-medium">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}