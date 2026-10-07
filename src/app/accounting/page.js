'use client'
import { useEffect, useState } from 'react'

const DEBIT_TYPES = [
  'תשלום עבור פעילות',
  'תשלום עבור רכישה',
  'תלוש משכורת',
  'אחר',
]

const MONTHS_HE = ['', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function getMonthKey(dateStr) {
  if (!dateStr) return 'לא ידוע'
  const parts = dateStr.split('/')
  if (parts.length >= 2) return `${parts[1]}/${parts[2] || new Date().getFullYear()}`
  return 'לא ידוע'
}

function getMonthLabel(key) {
  const [m, y] = key.split('/')
  return `${MONTHS_HE[parseInt(m)] || m} ${y}`
}

export default function AccountingPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', type: 'debit', description: '', amount: '' })
  const [saving, setSaving] = useState(false)
  const [activeMonth, setActiveMonth] = useState('all')

  const load = () => {
    fetch('/api/transactions').then(r => r.json()).then(data => {
      setTransactions(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    const dateFormatted = form.date
      ? form.date.split('-').reverse().join('/')
      : new Date().toLocaleDateString('he-IL')
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, date: dateFormatted }),
    })
    setForm({ date: '', type: 'debit', description: '', amount: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('למחוק תנועה זו?')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    load()
  }

  // Calculations
  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const totalDebit  = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)
  const balance     = totalCredit - totalDebit

  // Group by month
  const months = {}
  transactions.forEach(t => {
    const key = getMonthKey(t.date)
    if (!months[key]) months[key] = { credit: 0, debit: 0, items: [] }
    const amt = parseFloat(t.amount) || 0
    if (t.type === 'credit') months[key].credit += amt
    else months[key].debit += amt
    months[key].items.push(t)
  })

  const sortedMonths = Object.keys(months).sort((a, b) => {
    const [ma, ya] = a.split('/')
    const [mb, yb] = b.split('/')
    return (parseInt(ya) * 12 + parseInt(ma)) - (parseInt(yb) * 12 + parseInt(mb))
  })

  const displayTx = activeMonth === 'all'
    ? [...transactions].sort((a, b) => b.id - a.id)
    : (months[activeMonth]?.items || []).sort((a, b) => b.id - a.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">חשבונאות</h1>
          <p className="text-stone-500 text-sm mt-1">מעקב תשלומים ויתרות</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ הוסף תנועה</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className="text-2xl font-bold text-green-700">₪{totalCredit.toLocaleString('he-IL')}</div>
          <div className="text-sm text-stone-500 mt-1">סה"כ מגיע לי</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-2xl font-bold text-red-600">₪{totalDebit.toLocaleString('he-IL')}</div>
          <div className="text-sm text-stone-500 mt-1">סה"כ שולם לי</div>
        </div>
        <div className="card p-5 text-center" style={{ background: balance >= 0 ? '#eef3fa' : '#fff0f0' }}>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-brand-600' : 'text-red-600'}`}
            style={{ color: balance >= 0 ? '#2C4A7C' : '#dc2626' }}>
            ₪{Math.abs(balance).toLocaleString('he-IL')}
          </div>
          <div className="text-sm text-stone-500 mt-1">
            {balance >= 0 ? 'יתרה לגבייה' : 'שולם יותר מהמגיע'}
          </div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-700 text-sm">נטו לפי חודש</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100" style={{ background: '#F5F0E8' }}>
                <th className="text-right px-4 py-3 font-medium text-stone-600">חודש</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">מגיע לי</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">שולם</th>
                <th className="text-right px-4 py-3 font-medium text-stone-600">נטו חודשי</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {sortedMonths.length === 0 && (
                <tr><td colSpan={4} className="text-center py-6 text-stone-400">אין נתונים</td></tr>
              )}
              {sortedMonths.map(key => {
                const m = months[key]
                const net = m.credit - m.debit
                return (
                  <tr key={key}
                    onClick={() => setActiveMonth(activeMonth === key ? 'all' : key)}
                    className="cursor-pointer hover:bg-stone-50"
                    style={activeMonth === key ? { background: '#eef3fa' } : {}}>
                    <td className="px-4 py-3 font-medium text-stone-800">{getMonthLabel(key)}</td>
                    <td className="px-4 py-3 text-green-700">₪{m.credit.toLocaleString('he-IL')}</td>
                    <td className="px-4 py-3 text-red-600">₪{m.debit.toLocaleString('he-IL')}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: net >= 0 ? '#2C4A7C' : '#dc2626' }}>
                      ₪{Math.abs(net).toLocaleString('he-IL')} {net < 0 ? '(חוב)' : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add transaction form */}
      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold text-stone-700 text-sm mb-4">הוספת תנועה</h3>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="label">תאריך</label>
                <input className="input" type="date" value={form.date} onChange={set('date')} required />
              </div>
              <div>
                <label className="label">סוג</label>
                <select className="input" value={form.type} onChange={set('type')}>
                  <option value="debit">תשלום שהתקבל</option>
                </select>
              </div>
              <div>
                <label className="label">תיאור</label>
                <select className="input" value={form.description} onChange={set('description')} required>
                  <option value="">בחר...</option>
                  {DEBIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">סכום (₪)</label>
                <input className="input" type="number" value={form.amount} onChange={set('amount')} required />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={saving} className="btn-primary text-xs">
                  {saving ? 'שומר...' : 'שמור'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">ביטול</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Transactions list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-semibold text-stone-700 text-sm">
            {activeMonth === 'all' ? 'כל התנועות' : `תנועות — ${getMonthLabel(activeMonth)}`}
          </h3>
          {activeMonth !== 'all' && (
            <button onClick={() => setActiveMonth('all')} className="text-xs text-stone-400 hover:text-stone-600">
              הצג הכל
            </button>
          )}
        </div>
        <div className="divide-y divide-stone-50">
          {loading && <div className="text-center py-8 text-stone-400 text-sm">טוען...</div>}
          {!loading && displayTx.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">אין תנועות</div>
          )}
          {displayTx.map(tx => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full shrink-0 ${tx.type === 'credit' ? 'bg-green-500' : 'bg-red-400'}`} />
                <div>
                  <div className="font-medium text-stone-800">{tx.description}</div>
                  <div className="text-xs text-stone-400">{tx.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold text-base ${tx.type === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₪{parseFloat(tx.amount).toLocaleString('he-IL')}
                </span>
                <button onClick={() => handleDelete(tx.id)} className="text-stone-300 hover:text-red-500 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
