import nodemailer from 'nodemailer'

export function createTransporter() {
  return nodemailer.createTransport({
    // `service: 'gmail'` defaults to port 465 (implicit TLS), which is
    // timing out at the TCP level from Railway's network (confirmed via
    // deploy logs: ETIMEDOUT / command: 'CONN' — the connection attempt
    // itself never completes, not a slow server). Using port 587
    // (STARTTLS) explicitly instead, in case 465 specifically is
    // filtered while 587 isn't.
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Without these, a blocked/unreliable connection hangs the request
    // indefinitely — the caller never gets a response to show an error
    // for, so the UI just spins forever with zero feedback. Fail fast
    // instead so a real error reaches the user.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
}

export async function sendOrderEmail({ to, cc, subject, htmlBody, attachmentHtml, filename }) {
  const transporter = createTransporter()

  const mailOptions = {
    from: `"מיאל - רוח צפת" <${process.env.GMAIL_USER}>`,
    to: to.join(', '),
    cc: cc && cc.length > 0 ? cc.join(', ') : undefined,
    subject,
    html: htmlBody,
    attachments: attachmentHtml ? [
      {
        filename: filename || 'הזמנה.html',
        content: attachmentHtml,
        contentType: 'text/html',
      }
    ] : [],
  }

  return transporter.sendMail(mailOptions)
}
