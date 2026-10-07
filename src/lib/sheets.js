import { google } from "googleapis";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: "siurim",
      private_key_id: "0b85a3f04b0370c6ef5d58680b4b81d3b082136a",
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      client_id: "111616376855781113733",
      token_uri: "https://oauth2.googleapis.com/token",
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

function formatDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function getSheetName(sheets, spreadsheetId, sheetGid) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets.find(
    (s) => s.properties.sheetId === parseInt(sheetGid),
  );
  if (!sheet) throw new Error(`גיליון עם GID ${sheetGid} לא נמצא`);
  return sheet.properties.title;
}

export async function appendToSheet(spreadsheetId, sheetGid, values) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(sheets, spreadsheetId, sheetGid);

  // Get next request ID
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!B:B`,
  });
  const rows = existing.data.values || [];
  let maxNum = 0;
  for (const row of rows) {
    const m = String(row[0] || "").match(/^[Rr](\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  const nextId = `R${maxNum + 1}`;

  const row = [formatDate(), nextId, ...values];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:L`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  return nextId;
}

// עדכון עמודה K (קישור PDF) לפי requestId
export async function updatePdfLink(
  spreadsheetId,
  sheetGid,
  requestId,
  pdfUrl,
) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(sheets, spreadsheetId, sheetGid);

  // מצא את השורה לפי requestId בעמודה B
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!B:B`,
  });
  const rows = existing.data.values || [];
  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0] || "").trim() === requestId) {
      rowIndex = i + 1; // 1-based
      break;
    }
  }
  if (rowIndex === -1) throw new Error(`מזהה ${requestId} לא נמצא בטבלה`);

  // עדכן עמודה K (עמודה 11)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!K${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[pdfUrl]] },
  });
}
