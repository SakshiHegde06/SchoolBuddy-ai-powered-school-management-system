export default function Table({ columns, rows, emptyLabel = 'No records yet' }) {
  if (!rows || rows.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-400">{emptyLabel}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-paper-200 text-xs uppercase tracking-wide text-ink-400">
            {columns.map((col) => (
              <th key={col.key} className="py-2 pr-4 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-paper-200/60 last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="py-3 pr-4 text-ink-900">
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