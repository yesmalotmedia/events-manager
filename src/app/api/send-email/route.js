import { readCsv } from "@/lib/csv";
import { renderToBuffer } from "@react-pdf/renderer";
import { TourPdfDocument } from "@/components/ui/TourPdf";
import { getLogoBuffer } from "@/lib/logoData";
import { createTransporter } from "@/lib/mailer";
import { createElement } from "react";

export const dynamic = "force-dynamic";

const HIBA_EVENTS = ["הופעה להקת היבא", "הופעה להקת היבא דואו"];

function getEmailTheme(eventType) {
  if (HIBA_EVENTS.includes(eventType)) {
    return { accent: "#C4552A", bg: "#F3EDE4", border: "#C9C1B3" };
  }
  return { accent: "#2C4A7C", bg: "#F5F0E8", border: "#E8DFD0" };
}

export async function POST(request) {
  // Sent via Gmail SMTP (lib/mailer.js), not Resend: Resend's shared
  // onboarding@resend.dev sender domain only delivers to the Resend
  // account owner's own address, silently dropping mail to anyone
  // else (every real client) without an error. Gmail delivers to any
  // recipient since it's a real, already-verified sending domain.
  const transporter = createTransporter();
  try {
    const body = await request.json();
    const {
      tourId,
      type,
      toClient,
      toMe,
      subject,
      message,
      skipPdf,
      isSignEmail,
    } = body;

    if (!tourId) return Response.json({ error: "חסר tourId" }, { status: 400 });

    const tours = readCsv("tours.csv");
    const tour = tours.find((t) => t.id === tourId);
    const allExpenses = readCsv("expenses.csv");
    const tourExpenses = allExpenses.filter((e) => e.tour_id === tourId);
    if (!tour) return Response.json({ error: "סיור לא נמצא" }, { status: 404 });

    const theme = getEmailTheme(tour.event_type);
    const fileName =
      `${tour.client_name}_${tour.date || "ללא_תאריך"}.pdf`.replace(
        /[\/\\:]/g,
        "",
      );

    // Build HTML body
    const titleLine = subject || `רוח צפת | ${tour.event_type} — הזמנה`;

    // For sign email — special body with instructions
    const signSubtitle = isSignEmail
      ? `לאישור ההזמנה וחתימה דיגיטלית לחץ/י על הקישור המצורף בהודעה.<br>לאחר החתימה יישלח אליך עותק חתום במייל.`
      : null;

    const htmlBody = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <div style="background:${theme.accent};padding:24px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;font-size:18px;">${titleLine}</h2>
          ${signSubtitle ? `<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;line-height:1.6;">${signSubtitle}</p>` : ""}
        </div>
        <div style="background:${theme.bg};padding:24px;border:1px solid ${theme.border};border-top:none;border-radius:0 0 8px 8px;">
          <p style="color:#2A1F14;white-space:pre-line;margin:0;">${message || ""}</p>
        </div>
      </div>
    `;

    const recipients = [];
    if (toClient && toClient.trim()) recipients.push(toClient.trim());
    if (toMe && toMe.trim()) recipients.push(toMe.trim());

    if (recipients.length === 0) {
      return Response.json({ error: "לא הוזנו כתובות מייל" }, { status: 400 });
    }

    // Generate PDF only if needed
    let buffer = null;
    if (!skipPdf) {
      const logoBuffer = getLogoBuffer();
      buffer = await renderToBuffer(
        createElement(TourPdfDocument, {
          tour,
          type,
          logoBuffer,
          expenses: tourExpenses,
        }),
      );
    }

    for (const to of recipients) {
      const mailOptions = {
        from: `"רוח צפת" <${process.env.GMAIL_USER}>`,
        to,
        subject: titleLine,
        html: htmlBody,
      };
      if (buffer) {
        mailOptions.attachments = [{ filename: fileName, content: buffer }];
      }
      await transporter.sendMail(mailOptions);
    }

    return Response.json({ success: true, sent: recipients.length });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
