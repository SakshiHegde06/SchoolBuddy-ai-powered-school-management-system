const variants = {
  primary: 'bg-navy-900 text-paper-50 hover:bg-navy-800',
  accent: 'bg-amber-500 text-navy-950 hover:bg-amber-600',
  ghost: 'bg-transparent text-navy-900 hover:bg-paper-200 border border-paper-200',
  danger: 'bg-danger-600 text-paper-50 hover:opacity-90',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}