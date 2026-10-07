import { syncTourToSheet } from '@/lib/sheetsSync'
import { readCsv, writeCsv } from '@/lib/csv'

export async function GET(request, { params }) {
  try {
    const tours = readCsv('tours.csv')
    const tour = tours.find(t => t.id === params.id)
    if (!tour) return Response.json({ error: 'לא נמצא' }, { status: 404 })

    const expenses = readCsv('expenses.csv').filter(e => e.tour_id === params.id)
    return Response.json({ ...tour, expenses })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json()
    const tours = readCsv('tours.csv')
    const idx = tours.findIndex(t => t.id === params.id)
    if (idx === -1) return Response.json({ error: 'לא נמצא' }, { status: 404 })
    tours[idx] = { ...tours[idx], ...body, id: params.id }
    writeCsv('tours.csv', tours)
    syncTourToSheet(tours[idx]).catch(e => console.error('Sheets sync error:', e.message))
    return Response.json(tours[idx])
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const tours = readCsv('tours.csv')
    const filtered = tours.filter(t => t.id !== params.id)
    writeCsv('tours.csv', filtered)

    const expenses = readCsv('expenses.csv')
    writeCsv('expenses.csv', expenses.filter(e => e.tour_id !== params.id))

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
