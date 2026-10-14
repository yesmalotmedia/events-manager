import nodemailer from 'nodemailer'

export function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Without these, a blocked/unreliable connection to Gmail's SMTP
    // servers hangs the request indefinitely — the caller never gets a
    // response to show an error for, so the UI just spins forever with
    // zero feedback. Fail fast instead so a real error reaches the user.
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
