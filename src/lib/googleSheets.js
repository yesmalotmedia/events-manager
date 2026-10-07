import { google } from 'googleapis'

const SPREADSHEET_ID = '1vZgL3BeNnfb0FRFmzWbFGOHGI-fZ0fKd28bRPpXNv-Y'
const SHEET_GID = 77933503

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: 'siurim',
      private_key_id: '0b85a3f04b0370c6ef5d58680b4b81d3b082136a',
      private_key: process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDmqI2p9TbM64Ov\nEseIW1X/uU/aIyuEzhuEe1q8hu3+AeLbu3POnaaPSpFUJneikFq9FAyCIWABKOiN\n76OsUwM8KkPNe1Sdu5vdr8F1moN9iwrhiyPlBEEm+zYzRUoczeFgd8U6dbGaSJLK\nYx3GYgL51GwUnN6IaYxvJBc5+Rf8a73PfMFF1dkQ1ytsQ37lRObCUqecRWYdSv/G\nVhmfM7Vxh/9V9RTnC+9IAHQe22esuIqDBQm3YPOZ/XKMPTBuvWM+SB5KuSnwhCK0\nOs3gLKOBRgaMVRXp+DIBgukwZ+3BXNyuxRqNyIhxbrk/uo2Wwm0vcMdarFM41Rf+\n92WEbcGtAgMBAAECggEAEMqADDl3Gfd3wxoVX2udY5EhwH9N7uGIJvP0ji6Dtbl9\nF8IvcyuOe/Y8L8mLF6ZK4g0gafq0VUadQ0kze4XMLFLmqQHg44ihl0OboYw0JUKm\nx0t3O0080Zx4/MYprSt0TC773b5tRY4h7Xdwq/KSRTiS/knQeKgNBUGLKqO4/Mgs\nYWfJNfWOkF+9iez+Vjv74MgonqOtz1dVFNqOcQqHH8TOQTGCjKR3XzDmCdFX/dii\nhg36bczaU08Bk34x4Ypd9xPjcPyF0oMIQRcUZblazf4unsOrGdpHeYR9NJpnQBJ8\nC4zsCkBraDVmvdr34R6b9j+pCKOhQ5QndR4+d4InUQKBgQD1hFGo9aoLSG7fabgS\nZzPQCXabQccdRDnJIXZ1caMvZNNcjvBBQlZxSmoyH2iCoczlnMl+pUDP6cebZNTd\ns1MdQZM+p4F9BnHvv4fnaxwNN3OjBCKp7d+gbXsRJOxCTOWNS5ScqYDVG6gnw2Ii\nsLsBXcqS2+TpNlqREthU6gne2QKBgQDwgdIIM8MRg34Pe2//qv1Bbf5p1sd81Xbk\nqQ+B7drHhBxHF2nKrtvSc3G4qbUaTGDOtS3KGMFX5jEWvYgtQZqceudEhiCIHHAv\n5AUJGJQIe9VFegiFZC8IzWvaYg6B8RhjqO41aA1EEMDNdpDT7FNc2wh3kj+gEbsx\nj/7Iv6Hc9QKBgFYm8VS9p8a/yxAgk9P5XOgSegkvAsTVTQWz9VJu5tlZowVmrw3n\nTlgAydT+yniUeEbWRqpnKKAMo9t2fW+yXmb0vMuOkdSib1a2ueTN5BELNUutxtAk\nRYWRBU9VyoXVX/O94s86d5fQVahmWkhcBbMMC2qPOPtQ9GTV3Q2m9oG5AoGBAMuf\nPfGP0XG8gDgfa/1sCSsiMynsm8zG9fg2YljAxl/xK/fMjNb7IEWXVAriM+BmFfgs\nUO4v81G2JI16PhcC2iHttGvBmz1hxmHljZXb50kffrtpzFkTLvcm5E9qgZnmQ53s\n4nD4/XJJNNM/tPKXvSR6lTqW6aNeH7ygizfvdt0ZAoGAMZdFcKF/RGGldmwPBRCv\n/mnCbqgg4GX3oVYH8yGTPlUdKCUzuv5u1Txc3DVOF50PK7FxP2Flbrya8NnbOq/J\nsnyzhK+r9kwmRkGzfAH3ug1pkd38jo2aD7qekLokKs5BnG+4hqCoqdYMSM+zq6VY\nL+bS3UXHVMY0A+lRDQhEOUw=\n-----END PRIVATE KEY-----\n',
      client_email: 'siurim-admin@siurim.iam.gserviceaccount.com',
      client_id: '111616376855781113733',
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getSheetName() {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID)
  return sheet ? sheet.properties.title : 'Sheet1'
}

async function getNextRequestId() {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetName = await getSheetName()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!B:B`,
  })

  const values = res.data.values || []
  let maxNum = 0
  for (const row of values) {
    const m = String(row[0] || '').trim().match(/^r(\d+)$/i)
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]))
  }
  return `r${maxNum + 1}`
}

export async function sendToAccounting(tour) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetName = await getSheetName()
  const nextId = await getNextRequestId()

  const row = [
    new Date().toLocaleString('he-IL'),   // A - חותמת זמן
    nextId,                                // B - מזהה דרישה
    tour.client_name || '',                // C - שם לקוח
    tour.date || '',                       // D - תאריך פעילות
    tour.event_type || '',                 // E - תיאור פעילות
    'מיאל',                               // F - שם העובד
    tour.contact_phone || '',              // G - טלפון
    '',                                    // H - ריק
    tour.total_amount || '',               // I - סכום
    tour.contact_email || '',              // J - מייל
    '',                                    // K - PDF (אין עדיין)
    '',                                    // L - ריק
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:L`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })

  return nextId
}
