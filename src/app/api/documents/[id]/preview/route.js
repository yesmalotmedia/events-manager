import { readCsv } from '@/lib/csv'
import { generateOrderHtml } from '@/lib/documentGenerator'

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'order'

    const tours = readCsv('tours.csv')
    const tour = tours.find(t => t.id === params.id)
    if (!tour) return Response.json({ error: 'לא נמצא' }, { status: 404 })

    const html = generateOrderHtml(tour, type)
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
