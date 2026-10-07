import { readCsv } from '@/lib/csv'
import { createSignToken } from '@/lib/signTokens'

export const dynamic = 'force-dynamic'

// Create a sign token for a tour
export async function POST(request) {
  try {
    const { tourId } = await request.json()
    const tours = readCsv('tours.csv')
    const tour = tours.find(t => t.id === tourId)
    if (!tour) return Response.json({ error: 'סיור לא נמצא' }, { status: 404 })

    const token = createSignToken(tourId)
    const signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${token}`

    return Response.json({ token, signUrl })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
