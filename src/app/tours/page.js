'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_OPTIONS = ['הכל', 'ממתין', 'מושהה', 'נשלחה הזמנה', 'הזמנה אושרה', 'נשלחו פרטים לנהח"ש']

const statusBadge = (s) => {
  if (s === 'הזמנה אושרה')         return <span className="badge-green">{s}</span>
  if (s === 'נשלחה הזמנה')         return <span className="badge-blue">{s}</span>
  if (s === 'נשלחו פרטים לנהח"ש')  return <span className="badge-gold">{s}</span>
  if (s === 'מושהה')                return <span className="badge-red">{s}</span>
  return <span className="badge-yellow">{s || 'ממתין'}</span>
}

export default function ToursPage() {
  const router = useRouter()
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('הכל')
  const bottomRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const firstLoad = useRef(true)

  const load = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'הכל') params.set('status', statusFilter)
    fetch(`/api/tours?${params}`).then(r => r.json()).then(data => {
      setTours(Array.isArray(data) ? data : [])
      setLoading(false)
      if (firstLoad.current) {
        firstLoad.current = false
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 150)
      }
    })
  }

  useEffect(() => { load() }, [search, statusFilter])

  useEffect(() => {
    const onScroll = () => setShowScrollBtn(window.scrollY > 200)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const sorted = [...tours].sort((a, b) => {
    const da = (a.date || '').split('/').reverse().join('')
    const db = (b.date || '').split('/').reverse().join('')
    return da.localeCompare(db)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">סיורים</h1>
          <p className="text-stone-500 text-sm mt-1">{tours.length} רשומות</p>
        </div>
        <Link href="/tours/new" className="btn-primary">+ סיור חדש</Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input className="input max-w-xs" placeholder="חיפוש לפי שם לקוח, סוג, מיקום..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors border"
              style={statusFilter === s
                ? { background: '#2C4A7C', color: 'white', borderColor: '#2C4A7C' }
                : { background: 'white', color: '#57534e', borderColor: '#e7e5e4' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: card list (table below is sm:+ only — 7 columns don't fit a phone) */}
      <div className="sm:hidden space-y-2">
        {loading && <div className="card text-center py-8 text-stone-400 text-sm">טוען...</div>}
        {!loading && sorted.length === 0 && (
          <div className="card text-center py-8 text-stone-400 text-sm">לא נמצאו סיורים</div>
        )}
        {sorted.map(tour => (
          <div
            key={tour.id}
            onClick={() => router.push(`/tours/${tour.id}`)}
            className="card p-4 active:bg-stone-50 cursor-pointer space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-stone-900 truncate">{tour.client_name || '—'}</div>
                <div className="text-xs text-stone-500 truncate mt-0.5">{tour.event_type || '—'}</div>
              </div>
              <div className="shrink-0">{statusBadge(tour.status)}</div>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>{tour.date || '—'}{tour.time ? ` • ${tour.time}` : ''}</span>
              <span>{tour.location || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1 border-t border-stone-50">
              <span className="font-medium text-stone-900">
                {tour.total_amount ? `₪${parseFloat(tour.total_amount).toLocaleString('he-IL')}` : '—'}
              </span>
              <span className="font-medium text-green-700">
                {tour.net_payment ? `נטו: ₪${parseFloat(tour.net_payment).toLocaleString('he-IL')}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: full table */}
      <div className="hidden sm:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100" style={{ background: '#F5F0E8' }}>
                <th className="text-right px-4 py-3 font-medium text-stone-600">שם לקוח</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">סוג אירוע</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">תאריך</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">מיקום</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">סכום</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">נטו</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading && <tr><td colSpan={7} className="text-center py-8 text-stone-400">טוען...</td></tr>}
              {!loading && sorted.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-stone-400">לא נמצאו סיורים</td></tr>}
              {sorted.map(tour => (
                <tr key={tour.id} onClick={() => router.push(`/tours/${tour.id}`)}
                  className="hover:bg-stone-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900">{tour.client_name || '—'}</div>
                    {tour.contact_name && <div className="text-xs text-stone-400">{tour.contact_name}</div>}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{tour.event_type || '—'}</td>
                  <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                    <div>{tour.date || '—'}</div>
                    {tour.time && <div className="text-xs text-stone-400 mt-0.5">{tour.time}</div>}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{tour.location || '—'}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {tour.total_amount ? `₪${parseFloat(tour.total_amount).toLocaleString('he-IL')}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-green-700">
                    {tour.net_payment ? `₪${parseFloat(tour.net_payment).toLocaleString('he-IL')}` : '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(tour.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div ref={bottomRef} />

      {showScrollBtn && (
        <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-8 left-8 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-xl z-30"
          style={{ background: '#2C4A7C' }}>↓</button>
      )}
    </div>
  )
}
