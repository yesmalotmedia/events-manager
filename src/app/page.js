'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card p-6">
      <div className={`text-3xl font-bold ${color || 'text-stone-900'}`}>{value}</div>
      <div className="text-sm font-medium text-stone-700 mt-1">{label}</div>
      {sub && <div className="text-xs text-stone-600 mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tours').then(r => r.json()).then(data => {
      setTours(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  const total = tours.length
  const approved = tours.filter(t => t.status === 'אושר').length
  const pending = tours.filter(t => t.status === 'ממתין').length
  const totalRevenue = tours.reduce((s, t) => s + (parseFloat(t.total_amount) || 0), 0)
  const totalNet = tours.reduce((s, t) => s + (parseFloat(t.net_payment) || 0), 0)
  const notSent = tours.filter(t => t.sent_to_accounting === 'false' && t.status === 'אושר')

  const upcoming = tours
    .filter(t => t.date)
    .sort((a, b) => {
      const da = a.date.split('/').reverse().join('')
      const db = b.date.split('/').reverse().join('')
      return da.localeCompare(db)
    })
    .slice(0, 5)

  const statusBadge = (s) => {
    if (s === 'אושר') return <span className="badge-green">{s}</span>
    if (s === 'ממתין') return <span className="badge-yellow">{s}</span>
    if (s === 'בוטל') return <span className="badge-red">{s}</span>
    return <span className="badge-blue">{s}</span>
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-stone-600 text-sm">טוען...</div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">לוח בקרה</h1>
        <p className="text-stone-600 text-sm mt-1">סקירה כללית של הפעילות</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="סה״כ סיורים" value={total} />
        <StatCard label="אושרו" value={approved} color="text-green-600" />
        <StatCard label="ממתינים" value={pending} color="text-amber-600" />
        <StatCard label="הכנסות" value={`₪${totalRevenue.toLocaleString('he-IL')}`} sub={`נטו: ₪${totalNet.toLocaleString('he-IL')}`} color="text-brand-600" />
      </div>

      {/* Alert */}
      {notSent.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-medium text-amber-800 text-sm">
              {notSent.length} סיורים לא נשלחו להנהלת חשבונות
            </div>
            <div className="text-amber-600 text-xs mt-0.5">יש לשלוח את הפרטים לפני סוף החודש</div>
          </div>
          <Link href="/tours" className="btn-primary text-xs">
            עבור לסיורים
          </Link>
        </div>
      )}

      {/* Upcoming */}
      <div className="card">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">סיורים קרובים</h2>
          <Link href="/tours" className="text-brand-500 text-xs hover:underline">הכל</Link>
        </div>
        <div className="divide-y divide-stone-50">
          {upcoming.length === 0 && (
            <div className="px-6 py-8 text-center text-stone-600 text-sm">אין סיורים קרובים</div>
          )}
          {upcoming.map(tour => (
            <Link key={tour.id} href={`/tours/${tour.id}`} className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="text-center bg-brand-50 rounded-lg px-3 py-2 min-w-[52px] shrink-0">
                  <div className="text-brand-600 font-bold text-sm leading-none">
                    {tour.date ? tour.date.split('/')[0] : '—'}
                  </div>
                  <div className="text-brand-400 text-xs mt-0.5">
                    {tour.date ? ['', 'ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'][parseInt(tour.date.split('/')[1])] || '' : ''}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-stone-900 text-sm truncate">{tour.client_name}</div>
                  <div className="text-stone-600 text-xs mt-0.5 truncate">{tour.event_type} • {tour.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="text-stone-700 text-sm font-medium whitespace-nowrap">₪{parseFloat(tour.total_amount || 0).toLocaleString('he-IL')}</div>
                {statusBadge(tour.status)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
