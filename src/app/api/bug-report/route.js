import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: 'siurim',
      private_key_id: '0b85a3f04b0370c6ef5d58680b4b81d3b082136a',
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      client_id: '111616376855781113733',
      token_uri: 'https://oauth2.googleapis.com/token',
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function formatDate() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function POST(request) {
  try {
    const { description } = await request.json()
    if (!description?.trim()) {
      return Response.json({ error: 'תיאור התקלה חסר' }, { status: 400 })
    }

    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    const SPREADSHEET_ID = '1W1OGFiTSaOkDejQSWSSZIucQyAgGj1wOYlupvGYy65o'
    const SHEET_GID = 906495436

    // Get sheet name from GID
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
    const sheet = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID)
    if (!sheet) throw new Error('גיליון לא נמצא')
    const sheetName = sheet.properties.title

    // Append row: תאריך | תיאור תקלה | סטטוס | הערות
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[formatDate(), description.trim(), 'חדש', '']],
      },
    })

    return Response.json({ success: true })
  } catch (e) {
    console.error(e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
