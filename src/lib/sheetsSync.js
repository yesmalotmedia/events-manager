import { google } from "googleapis";
import { readCsv } from "./csv";
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

export async function markCheckboxInSheet(tour) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(sheets);

  let rowNum = -1;
  if (tour.timestamp) {
    rowNum = await findRowByTimestamp(sheets, sheetName, tour.timestamp);
  }

  if (rowNum === -1) {
    const newRow = buildSheetRow(tour);
    const lastRow = await getLastRow(sheets, sheetName);
    const nextRow = lastRow + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: MAIN_SHEET_ID,
      range: `${sheetName}!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });
    rowNum = nextRow;
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
  // Load expenses for this tour
  const allExpenses = readCsv("expenses.csv");
  const expenses = allExpenses.filter((e) => e.tour_id === String(tour.id));
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(sheets);

  let rowNum = -1;
  if (tour.timestamp) {
    rowNum = await findRowByTimestamp(sheets, sheetName, tour.timestamp);
  }

  const rowData = buildSheetRow(tour);

  if (rowNum === -1) {
    // Find actual last row and write after it
    const lastRow = await getLastRow(sheets, sheetName);
    const nextRow = lastRow + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: MAIN_SHEET_ID,
      range: `${sheetName}!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowData] },
    });
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: MAIN_SHEET_ID,
      range: `${sheetName}!A${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowData] },
    });
  }
}

const SUPPLIER_COLS = {
  15: "סער",
  16: "לביא",
  17: "אסי",
  18: "דן קידר",
  19: "עומרי",
  20: "סאונדמן",
  21: "שמוליק הגברה",
  22: "דן דן",
  23: "מאיר",
  24: "אביעד מתופף",
  25: "נגן מחליף",
  26: "לבנות מנהרות",
  27: "גאיה עוזרת הפקה",
  28: "פלאפל",
  29: "לחוח",
  30: "אוירא",
  31: "מזקקה",
  32: "בלה",
  33: "מאיהיה",
  34: "רויטל",
  35: "מדריכים",
  36: "בית כנסת",
  37: "מרק - ישיבה",
};

function buildSheetRow(tour, expenses = []) {
  const row = new Array(45).fill("");
  row[0] = tour.timestamp || "";
  row[1] = tour.client_name || "";
  row[2] = tour.client_id || "";
  row[3] = tour.contact_name || "";
  row[4] = tour.contact_phone || "";
  row[5] = tour.contact_email || "";
  row[6] = tour.participants_desc || "";
  row[7] = tour.num_participants || "";
  row[8] = tour.event_type || "";
  row[9] = tour.notes || "";
  row[10] = tour.date || "";
  row[11] = tour.time || "";
  row[12] = tour.location || "";
  row[13] = tour.payment_method || "";
  row[14] = tour.total_amount || "";
  row[38] = tour.expenses_total || "";
  row[39] = tour.commission || "";
  row[40] = tour.net_payment || "";
  row[44] = tour.sent_to_accounting === "true";
  return row;
}

function colToLetter(col) {
  let letter = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}
