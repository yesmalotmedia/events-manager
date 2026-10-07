import { readCsv } from '@/lib/csv'
import { getSignToken } from '@/lib/signTokens'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return Response.json({ error: 'קישור לא תקין' }, { status: 400 })

    const tokenRecord = getSignToken(token)
    if (!tokenRecord) return Response.json({ error: 'קישור לא תקין או פג תוקף' }, { status: 404 })
    if (tokenRecord.status === 'signed') return Response.json({ error: 'ההזמנה כבר נחתמה' }, { status: 400 })

    const tours = readCsv('tours.csv')
    const tour = tours.find(t => t.id === tokenRecord.tour_id)
    if (!tour) return Response.json({ error: 'סיור לא נמצא' }, { status: 404 })

    return Response.json({ tour })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
