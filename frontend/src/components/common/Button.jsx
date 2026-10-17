const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20',
  accent: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-slate-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}