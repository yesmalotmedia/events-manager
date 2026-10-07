'use client'

export default function ConfirmModal({ title, children, confirmLabel = 'אישור', confirmClass = 'btn-primary', onConfirm, onClose, loading = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-bold text-stone-800 text-lg">{title}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>ביטול</button>
          <button onClick={onConfirm} className={confirmClass} disabled={loading}>
            {loading ? 'מעבד...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
