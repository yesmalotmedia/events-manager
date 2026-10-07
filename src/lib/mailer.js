import nodemailer from 'nodemailer'

export function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
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
