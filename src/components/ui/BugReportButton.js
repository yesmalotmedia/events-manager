'use client'
import { useState } from 'react'

export default function BugReportButton({ variant = 'floating' }) {
  const [open, setOpen]         = useState(false)
  const [description, setDesc]  = useState('')
  const [status, setStatus]     = useState('idle') // idle | sending | done | error

  const handleSend = async () => {
    if (!description.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('done')
      setDesc('')
      setTimeout(() => { setOpen(false); setStatus('idle') }, 2000)
    } catch (e) {
      setStatus('error')
    }
  }

  return (
    <>
      {/* Trigger button — "inline" sits inside the mobile top bar (no safe
          floating spot exists there: every page puts its own "+ add" button
          in that same top-left corner on mobile). "floating" is the
          always-visible circle used on desktop, where there's no top bar
          competing for that corner. */}
      {variant === 'inline' ? (
        <button
          onClick={() => { setOpen(true); setStatus('idle') }}
          className="w-8 h-8 rounded-full shadow flex items-center justify-center shrink-0"
          style={{ background: '#dc2626' }}
          title="דווח על תקלה"
        >
          <span className="text-white text-sm leading-none">!</span>
        </button>
      ) : (
        <button
          onClick={() => { setOpen(true); setStatus('idle') }}
          className="hidden md:flex fixed top-6 left-6 z-40 w-11 h-11 rounded-full shadow-lg items-center justify-center transition-all hover:scale-110"
          style={{ background: '#dc2626' }}
          title="דווח על תקלה"
        >
          <span className="text-white text-lg leading-none">!</span>
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-start p-6 pointer-events-none">
          <div
            className="bg-white rounded-2xl shadow-2xl w-80 pointer-events-auto overflow-hidden"
            style={{ border: '1px solid #E8DFD0' }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#2C4A7C' }}>
              <span className="text-white font-semibold text-sm">דיווח על תקלה</span>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-lg leading-none">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {status === 'done' ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-sm font-medium" style={{ color: '#2C4A7C' }}>התקלה דווחה בהצלחה</div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label">תאר את התקלה</label>
                    <textarea
                      className="input"
                      rows={4}
                      placeholder="מה קרה? באיזה עמוד? מה ציפית שיקרה?"
                      value={description}
                      onChange={e => setDesc(e.target.value)}
                      disabled={status === 'sending'}
                    />
                  </div>
                  {status === 'error' && (
                    <div className="text-red-500 text-xs">שגיאה בשליחה — נסה שוב</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSend}
                      disabled={!description.trim() || status === 'sending'}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                      style={{
                        background: description.trim() && status !== 'sending' ? '#2C4A7C' : '#B8A48A',
                      }}
                    >
                      {status === 'sending' ? 'שולח...' : 'שלח דיווח'}
                    </button>
                    <button onClick={() => setOpen(false)} className="btn-secondary text-sm">ביטול</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
