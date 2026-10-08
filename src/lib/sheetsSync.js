import { google } from "googleapis";
const MAIN_SHEET_ID = "1W1OGFiTSaOkDejQSWSSZIucQyAgGj1wOYlupvGYy65o";
const MAIN_SHEET_GID = 123815026;
const CHECKBOX_COL = 45;

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
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheetName(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: MAIN_SHEET_ID });
  const sheet = meta.data.sheets.find(
    (s) => s.properties.sheetId === MAIN_SHEET_GID,
  );
  if (!sheet) throw new Error("גיליון לא נמצא");
  return sheet.properties.title;
}

async function findRowByTimestamp(sheets, sheetName, timestamp) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MAIN_SHEET_ID,
    range: `${sheetName}!A:A`,
  });
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if ((rows[i][0] || "").trim() === timestamp.trim()) {
      return i + 1;
    }
  }
  return -1;
}

async function getLastRow(sheets, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MAIN_SHEET_ID,
    range: `${sheetName}!A:A`,
  });
  const rows = res.data.values || [];
  return rows.length;
}

// Columns the app is allowed to write. Everything else in the row —
// the per-supplier cost columns (P:AL) and the "יתרה" column (AP) — is
// maintained by hand directly in the sheet and must never be touched by
// a sync. A previous version of this file wrote one 45-wide range
// (A:AS) on every sync, which silently blanked out those hand-entered
// columns on every tour save. Writing only these three narrow ranges
// keeps the sync additive instead of destructive.
async function writeOwnedColumns(sheets, sheetName, rowNum, tour) {
  const basicFields = [
    tour.timestamp || "",
    tour.client_name || "",
    tour.client_id || "",
    tour.contact_name || "",
    tour.contact_phone || "",
    tour.contact_email || "",
    tour.participants_desc || "",
    tour.num_participants || "",
    tour.event_type || "",
    tour.notes || "",
    tour.date || "",
    tour.time || "",
    tour.location || "",
    tour.payment_method || "",
    tour.total_amount || "",
  ];
  const financeFields = [
    tour.expenses_total || "",
    tour.commission || "",
    tour.net_payment || "",
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: MAIN_SHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `${sheetName}!A${rowNum}:O${rowNum}`, values: [basicFields] },
        { range: `${sheetName}!AM${rowNum}:AO${rowNum}`, values: [financeFields] },
        {
          range: `${sheetName}!AS${rowNum}`,
          values: [[tour.sent_to_accounting === "true"]],
        },
      ],
    },
  });
  return rowNum;
}

export async function markCheckboxInSheet(tour) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(sheets);

  let rowNum = -1;
  if (tour.timestamp) {
    rowNum = await findRowByTimestamp(sheets, sheetName, tour.timestamp);
  }

  if (rowNum === -1) {
    const lastRow = await getLastRow(sheets, sheetName);
    rowNum = lastRow + 1;
    await writeOwnedColumns(sheets, sheetName, rowNum, tour);
  }

  const colLetter = colToLetter(CHECKBOX_COL);
  await sheets.spreadsheets.values.update({
    spreadsheetId: MAIN_SHEET_ID,
    range: `${sheetName}!${colLetter}${rowNum}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[true]] },
  });

  return rowNum;
}

export async function syncTourToSheet(tour) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(sheets);

  let rowNum = -1;
  if (tour.timestamp) {
    rowNum = await findRowByTimestamp(sheets, sheetName, tour.timestamp);
  }

  if (rowNum === -1) {
    const lastRow = await getLastRow(sheets, sheetName);
    rowNum = lastRow + 1;
  }

  await writeOwnedColumns(sheets, sheetName, rowNum, tour);
}

// Reference only — NOT used by any sync code (sheet columns P:AL,
// 1-based 16:38 / 0-based 15:37). Hand-filled by whoever is editing the
// sheet directly. Kept here as the known column layout in case a future
// feature auto-fills supplier costs from the app's expense records —
// note col 20 ("סאונדמן") has drifted from the sheet's current header
// ("שחקן/רב"), so re-verify against the live header before relying on it.
// const SUPPLIER_COLS = {
//   15: "סער", 16: "לביא", 17: "אסי", 18: "דן קידר", 19: "עומרי",
//   20: "סאונדמן", 21: "שמוליק הגברה", 22: "דן דן", 23: "מאיר",
//   24: "אביעד מתופף", 25: "נגן מחליף", 26: "לבנות מנהרות",
//   27: "גאיה עוזרת הפקה", 28: "פלאפל", 29: "לחוח", 30: "אוירא",
//   31: "מזקקה", 32: "בלה", 33: "מאיהיה", 34: "רויטל", 35: "מדריכים",
//   36: "בית כנסת", 37: "מרק - ישיבה",
// };

function colToLetter(col) {
  let letter = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}
