import { X } from 'lucide-react'

export default function Modal({ title, isOpen, onClose, children, footer }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-paper-50 shadow-xl">
        <div className="flex items-center justify-between border-b border-paper-200 px-5 py-4">
          <h3 className="font-display text-lg text-navy-900">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-paper-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}