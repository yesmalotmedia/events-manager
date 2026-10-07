import { readCsv, writeCsv, getNextId } from '@/lib/csv'
import { syncTourToSheet } from '@/lib/sheetsSync'

function makeTimestamp() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const tours = readCsv('tours.csv')
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    let filtered = tours
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(t =>
        (t.client_name || '').toLowerCase().includes(q) ||
        (t.event_type || '').toLowerCase().includes(q) ||
        (t.location || '').toLowerCase().includes(q)
      )
    }
    if (status) filtered = filtered.filter(t => t.status === status)

    return Response.json(filtered)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const tours = readCsv('tours.csv')
    const timestamp = makeTimestamp()

    const newTour = {
      id: getNextId(tours),
      timestamp,
      client_name: body.client_name || '',
      client_id: body.client_id || '',
      contact_name: body.contact_name || '',
      contact_phone: body.contact_phone || '',
      contact_email: body.contact_email || '',
      participants_desc: body.participants_desc || '',
      num_participants: body.num_participants || '',
      event_type: body.event_type || '',
      notes: body.notes || '',
      date: body.date || '',
      time: body.time || '',
      location: body.location || '',
      payment_method: body.payment_method || '',
      total_amount: body.total_amount || '0',
      content_amount: body.content_amount || body.total_amount || '0',
      expenses_total: '0',
      commission: '0',
      net_payment: '0',
      balance: '',
      status: body.status || 'ממתין',
      sent_to_accounting: 'false',
      accounting_request_id: '',
      sheets_row: '',
    }
    tours.push(newTour)
    writeCsv('tours.csv', tours)

    // Sync to sheet in background (don't block response)
    syncTourToSheet(newTour).catch(e => console.error('Sheets sync error:', e.message))

    return Response.json(newTour, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
