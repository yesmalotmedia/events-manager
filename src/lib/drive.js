import { google } from "googleapis";
import { Readable } from "stream";

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

export async function uploadPdfToDrive(pdfBuffer, fileName) {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const stream = new Readable();
  stream.push(pdfBuffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.DRIVE_FOLDER_ID],
      mimeType: "application/pdf",
    },
    media: {
      mimeType: "application/pdf",
      body: stream,
    },
    supportsAllDrives: true,
    fields: "id",
  });

  await drive.permissions.create({
    fileId: res.data.id,
    supportsAllDrives: true,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId: res.data.id,
    url: `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}
