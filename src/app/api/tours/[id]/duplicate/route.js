import { readCsv, writeCsv, getNextId } from '@/lib/csv'

export async function POST(request, { params }) {
  try {
    const tours = readCsv('tours.csv')
    const original = tours.find(t => t.id === params.id)
    if (!original) return Response.json({ error: 'סיור לא נמצא' }, { status: 404 })

    const duplicate = {
      ...original,
      id: getNextId(tours),
      timestamp: new Date().toLocaleString('he-IL'),
      date: '',
      time: '',
      status: 'ממתין',
      sent_to_accounting: 'false',
      accounting_request_id: '',
      expenses_total: '0',
      commission: '0',
      net_payment: '0',
      balance: '0',
    }

    tours.push(duplicate)
    writeCsv('tours.csv', tours)
    return Response.json(duplicate, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
