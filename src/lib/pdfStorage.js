import fs from "fs";
import path from "path";

// Stored on the same persistent volume as the CSVs (data/), under its own
// subfolder — survives deploys/restarts just like the rest of data/.
const PDF_DIR = path.join(process.cwd(), "data", "accounting_pdfs");

export function savePdf(requestId, buffer) {
  console.log("[pdfStorage] savePdf start", { requestId, PDF_DIR, cwd: process.cwd() });
  if (!fs.existsSync(PDF_DIR)) {
    console.log("[pdfStorage] creating dir", PDF_DIR);
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }
  const filePath = path.join(PDF_DIR, `${requestId}.pdf`);
  fs.writeFileSync(filePath, buffer);
  console.log("[pdfStorage] wrote file", filePath, "exists after write:", fs.existsSync(filePath));
}

export function readPdf(requestId) {
  const filePath = path.join(PDF_DIR, `${requestId}.pdf`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}
