'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DocumentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [tour, setTour] = useState(null)
  const [docType, setDocType] = useState('order')
  const [previewHtml, setPreviewHtml] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  const [toEmails, setToEmails] = useState([])
  const [ccEmails, setCcEmails] = useState(['miel1983@gmail.com'])
  const [newTo, setNewTo] = useState('')
  const [newCc, setNewCc] = useState('')

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/tours/${id}`).then(r => r.json()).then(data => {
      setTour(data)
      if (data.contact_email) setToEmails([data.contact_email])
    })
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoadingPreview(true)
    fetch(`/api/documents/${id}/preview?type=${docType}`)
      .then(r => r.text())
      .then(html => { setPreviewHtml(html); setLoadingPreview(false) })
  }, [id, docType])

  const addEmail = (list, setList, val, setVal) => {
    const email = val.trim()
    if (!email || !email.includes('@')) return
    if (!list.includes(email)) setList([...list, email])
    setVal('')
  }

  const removeEmail = (list, setList, email) => {
    setList(list.filter(e => e !== email))
  }

  const handleSend = async () => {
    if (toEmails.length === 0) { setError('יש להוסיף לפחות נמען אחד'); return }
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/documents/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toEmails, cc: ccEmails, type: docType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה בשליחה')
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const EmailTag = ({ email, onRemove }) => (
    <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-xs px-2 py-1 rounded-full">
      {email}
      <button onClick={onRemove} className="text-stone-400 hover:text-red-500 text-sm leading-none">×</button>
    </span>
  )

  const EmailInput = ({ list, setList, val, setVal, placeholder }) => (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {list.map(e => (
          <EmailTag key={e} email={e} onRemove={() => removeEmail(list, setList, e)} />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder={placeholder}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addEmail(list, setList, val, setVal)}
          dir="ltr"
        />
        <button
          type="button"
          onClick={() => addEmail(list, setList, val, setVal)}
          className="btn-secondary text-xs px-3"
        >
          הוסף
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/tours/${id}`} className="text-stone-400 hover:text-stone-600 text-sm">← חזרה</Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-800">הפקת מסמך</h1>
          {tour && <p className="text-stone-400 text-sm mt-0.5">{tour.client_name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Right panel - settings + send */}
        <div className="space-y-4">

          {/* Doc type */}
          <div className="card p-5">
            <h3 className="font-semibold text-stone-700 text-sm mb-3">סוג מסמך</h3>
            <div className="flex gap-2">
              {[
                { value: 'order', label: 'הזמנה' },
                { value: 'quote', label: 'הצעת מחיר' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDocType(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    docType === opt.value
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-stone-700 text-sm">נמענים</h3>

            <div>
              <label className="label">אל (To)</label>
              <EmailInput
                list={toEmails} setList={setToEmails}
                val={newTo} setVal={setNewTo}
                placeholder="הוסף מייל..."
              />
            </div>

            <div>
              <label className="label">עותק (CC)</label>
              <EmailInput
                list={ccEmails} setList={setCcEmails}
                val={newCc} setVal={setNewCc}
                placeholder="הוסף מייל..."
              />
            </div>
          </div>

          {/* Send button */}
          <div className="card p-5">
            {sent ? (
              <div className="text-center space-y-3">
                <div className="text-2xl">✅</div>
                <div className="font-medium text-green-700 text-sm">המסמך נשלח בהצלחה!</div>
                <button onClick={() => setSent(false)} className="btn-secondary text-xs w-full">שלח שוב</button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg mb-3">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSend}
                  disabled={sending || toEmails.length === 0}
                  className="btn-primary w-full"
                >
                  {sending ? 'שולח...' : `📧 שלח ${docType === 'quote' ? 'הצעת מחיר' : 'הזמנה'}`}
                </button>
                {toEmails.length === 0 && (
                  <p className="text-stone-400 text-xs mt-2 text-center">יש להוסיף לפחות נמען אחד</p>
                )}
              </>
            )}
          </div>

          {/* Note about Gmail */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
            <div className="font-semibold">הגדרת מייל</div>
            <div>יש להגדיר את פרטי Gmail בקובץ</div>
            <code className="block bg-amber-100 px-2 py-1 rounded text-xs mt-1">.env.local</code>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-700 text-sm">תצוגה מקדימה</h3>
              {loadingPreview && <span className="text-stone-400 text-xs">טוען...</span>}
            </div>
            <div className="p-4 bg-stone-50 min-h-[600px]">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full bg-white rounded-lg shadow-sm"
                  style={{ height: '700px', border: 'none' }}
                  title="תצוגה מקדימה"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
                  טוען תצוגה מקדימה...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
