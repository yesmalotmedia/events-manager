import { readCsv, writeCsv, getNextId } from "@/lib/csv";
import { markCheckboxInSheet } from "@/lib/sheetsSync";
import { appendToSheet } from "@/lib/sheets";
import { renderToBuffer } from "@react-pdf/renderer";
import { TourPdfDocument } from "@/components/ui/TourPdf";
import { getLogoBuffer } from "@/lib/logoData";
import { Resend } from "resend";
import { createElement } from "react";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { tourId } = await request.json();
    if (!tourId) return Response.json({ error: "חסר tourId" }, { status: 400 });

    const tours = readCsv("tours.csv");
    const tour = tours.find((t) => t.id === tourId);
    const allExpenses = readCsv("expenses.csv");
    const tourExpenses = allExpenses.filter((e) => e.tour_id === tourId);
    if (!tour) return Response.json({ error: "סיור לא נמצא" }, { status: 404 });

    // Generate PDF
    const logoBuffer = getLogoBuffer();
    const pdfBuffer = await renderToBuffer(
      createElement(TourPdfDocument, {
        tour,
        type: "order",
        logoBuffer,
        expenses: tourExpenses,
      }),
    );
    const fileName =
      `${tour.client_name}_${tour.date || "ללא_תאריך"}.pdf`.replace(
        /[\/\\:]/g,
        "",
      );

    // Send PDF by email to me only
    await resend.emails.send({
      from: process.env.RESEND_FROM || "onboarding@resend.dev",
      to: "miel1983@gmail.com",
      subject: `רוח צפת | ${tour.event_type} — פרטי חיוב`,
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <div style="background:white;padding:24px;border-radius:8px 8px 0 0;border-bottom:2px solid #2C4A7C;">
            <h2 style="color:#2C4A7C;margin:0;">רוח צפת</h2>
          </div>
          <div style="background:#F5F0E8;padding:24px;border:1px solid #E8DFD0;border-top:none;border-radius:0 0 8px 8px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="color:#755F4D;padding:6px 0;">שם לקוח</td><td style="font-weight:bold;">${tour.client_name}</td></tr>
              <tr><td style="color:#755F4D;padding:6px 0;">תאריך</td><td>${tour.date || "—"}</td></tr>
              <tr><td style="color:#755F4D;padding:6px 0;">סוג אירוע</td><td>${tour.event_type || "—"}</td></tr>
              <tr><td style="color:#755F4D;padding:6px 0;">נטו למיאל</td><td style="font-weight:bold;color:#2C4A7C;">₪${parseFloat(tour.net_payment || 0).toLocaleString("he-IL")}</td></tr>
            </table>
          </div>
        </div>
      `,
      attachments: [{ filename: fileName, content: pdfBuffer }],
    });

    // Mark checkbox in main sheet
    let sheetRow = -1;
    try {
      sheetRow = await markCheckboxInSheet(tour);
    } catch (e) {
      console.error("Sheet checkbox error:", e.message);
    }

    // Send to accounting sheet and get requestId
    let reqId = "";
    try {
      const values = [
        tour.client_name || "",
        tour.date || "",
        tour.event_type || "",
        "מיאל",
        tour.contact_phone || "",
        "",
        tour.total_amount || "",
        tour.contact_email || "",
        "",
        "",
      ];
      reqId = await appendToSheet(
        process.env.ACCOUNTING_SPREADSHEET_ID,
        process.env.ACCOUNTING_SHEET_GID,
        values,
      );
    } catch (e) {
      console.error("Accounting sheet error:", e.message);
    }

    // Add credit transaction
    const transactions = readCsv("transactions.csv");
    const netAmount = parseFloat(tour.net_payment || 0);
    if (netAmount > 0) {
      transactions.push({
        id: getNextId(transactions),
        date: tour.date || new Date().toLocaleDateString("he-IL"),
        type: "credit",
        description: `נטו סיור — ${tour.client_name}`,
        amount: String(netAmount),
        tour_id: tourId,
        created_at: new Date().toISOString(),
      });
      writeCsv("transactions.csv", transactions);
    }

    // Update tour status
    const idx = tours.findIndex((t) => t.id === tourId);
    tours[idx].sent_to_accounting = "true";
    tours[idx].accounting_request_id = reqId;
    tours[idx].status = 'נשלחו פרטים לנהח"ש';
    if (sheetRow > 0) tours[idx].sheets_row = String(sheetRow);
    writeCsv("tours.csv", tours);

    return Response.json({ success: true, requestId: reqId });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
