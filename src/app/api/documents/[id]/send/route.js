import { readCsv } from '@/lib/csv'
import { generateOrderHtml } from '@/lib/documentGenerator'
import { sendOrderEmail } from '@/lib/mailer'

export async function POST(request, { params }) {
  try {
    const body = await request.json()
    const { to, cc, type } = body

    const tours = readCsv('tours.csv')
    const tour = tours.find(t => t.id === params.id)
    if (!tour) return Response.json({ error: 'לא נמצא' }, { status: 404 })

    const html = generateOrderHtml(tour, type || 'order')
    const docTitle = type === 'quote' ? 'הצעת מחיר' : 'הזמנה'
    const filename = `${tour.client_name}_${tour.date || ''}_${docTitle}.html`.replace(/\//g, '')

    const emailBody = `
      <div dir="rtl" style="font-family:Arial,sans-serif; font-size:14px; color:#1c1917;">
        <p>היי 😊</p>
        <p>מצורפת ${docTitle} עבור: <strong>${tour.event_type || 'הפעילות'}</strong></p>
        <p>תאריך: ${tour.date || '—'} | מיקום: ${tour.location || '—'}</p>
        <br>
        <p>לפרטים נוספים ניתן לפנות אלינו.</p>
        <br>
        <p style="color:#78716c; font-size:12px;">מיאל | רוח צפת</p>
      </div>
    `

    await sendOrderEmail({
      to,
      cc,
      subject: `רוח צפת | ${docTitle} - ${tour.client_name}`,
      htmlBody: emailBody,
      attachmentHtml: html,
      filename,
    })

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
