export function formatDate(dateInput) {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value)}%`
}

export function initials(name) {
  if (!name) return ''
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function riskLevelStyle(level) {
  switch (level) {
    case 'HIGH':
      return { label: 'High risk', tone: 'danger' }
    case 'MEDIUM':
      return { label: 'Medium risk', tone: 'warning' }
    default:
      return { label: 'Low risk', tone: 'success' }
  }
}