import { readCsv, writeCsv } from "@/lib/csv";
import { getSignToken, markTokenSigned } from "@/lib/signTokens";
import { renderToBuffer } from "@react-pdf/renderer";
import { TourPdfDocument } from "@/components/ui/TourPdf";
import { getLogoBuffer } from "@/lib/logoData";
import { Resend } from "resend";
import { createElement } from "react";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { token, signatureDataUrl } = await request.json();
    if (!token || !signatureDataUrl) {
      return Response.json({ error: "חסרים נתונים" }, { status: 400 });
    }

    const tokenRecord = getSignToken(token);
    if (!tokenRecord)
      return Response.json({ error: "קישור לא תקין" }, { status: 404 });
    if (tokenRecord.status === "signed") {
      return Response.json({ error: "ההזמנה כבר נחתמה" }, { status: 400 });
    }

    const tours = readCsv("tours.csv");
    const tour = tours.find((t) => t.id === tokenRecord.tour_id);
    if (!tour) return Response.json({ error: "סיור לא נמצא" }, { status: 404 });

    const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const signatureBuffer = Buffer.from(base64Data, "base64");

    const logoBuffer = getLogoBuffer();
    const buffer = await renderToBuffer(
      createElement(TourPdfDocument, {
        tour,
        type: "order",
        signatureBuffer,
        logoBuffer,
      }),
    );

    const fileName =
      `${tour.client_name}_${tour.date || "ללא_תאריך"}_חתום.pdf`.replace(
        /[\/\\:]/g,
        "",
      );

    // Send to client + me
    const recipients = ["miel1983@gmail.com"];
    if (tour.contact_email) recipients.push(tour.contact_email);

    for (const to of recipients) {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "onboarding@resend.dev",
        to,
        subject: `רוח צפת | ${tour.event_type} — הזמנה חתומה`,
        html: (() => {
          const isHiba = ["הופעה להקת היבא", "הופעה להקת היבא דואו"].includes(
            tour.event_type,
          );
          const accent = isHiba ? "#C4552A" : "#2C4A7C";
          const title = `רוח צפת | ${tour.event_type} — הזמנה חתומה`;
          return `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
            <div style="background:${accent};padding:24px;border-radius:8px;">
              <h2 style="color:white;margin:0;font-size:18px;">${title}</h2>
            </div>
          </div>`;
        })(),
        attachments: [{ filename: fileName, content: buffer }],
      });
    }

    // If already sent to accounting — send signed PDF to me with note
    if (tour.accounting_request_id) {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "onboarding@resend.dev",
        to: "miel1983@gmail.com",
        subject: `רוח צפת | ${tour.event_type} — הזמנה חתומה [${tour.accounting_request_id}]`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
            <div style="background:#B8860B;padding:16px 24px;border-radius:8px 8px 0 0;">
              <h3 style="color:white;margin:0;">עדכון: הזמנה נחתמה</h3>
            </div>
            <div style="background:#F5F0E8;padding:24px;border:1px solid #E8DFD0;border-top:none;border-radius:0 0 8px 8px;">
              <p style="color:#2A1F14;">הלקוח <strong>${tour.client_name}</strong> חתם על ההזמנה.</p>
              <p style="color:#755F4D;">מזהה דרישה בנהח"ש: <strong>${tour.accounting_request_id}</strong></p>
              <p style="color:#755F4D;font-size:13px;">מצורף ה-PDF החתום לעדכון ידני בטבלה.</p>
            </div>
          </div>
        `,
        attachments: [{ filename: fileName, content: buffer }],
      });
    }

    markTokenSigned(token);

    const idx = tours.findIndex((t) => t.id === tokenRecord.tour_id);
    if (idx !== -1) {
      tours[idx].status = "הזמנה אושרה";
      writeCsv("tours.csv", tours);
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
