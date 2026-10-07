export function generateOrderHtml(tour, type = 'order') {
  const isQuote = type === 'quote'
  const title = isQuote ? 'הצעת מחיר' : 'הזמנה'

  const logoUrl = 'https://tsfat.org.il/wp-content/uploads/2022/07/logo_tansperency-tsfat.png'

  const fields = [
    { label: 'שם המזמין', value: tour.client_name },
    { label: 'ח.פ / מס׳ עמותה / קוד מוסד', value: tour.client_id },
    { label: 'שם איש קשר', value: tour.contact_name },
    { label: 'טלפון איש קשר', value: tour.contact_phone },
    { label: 'מייל איש קשר', value: tour.contact_email },
    { label: 'תיאור המשתתפים', value: tour.participants_desc },
    { label: 'מספר משתתפים', value: tour.num_participants },
    { label: 'סוג האירוע', value: tour.event_type },
    { label: 'תוספות / הערות', value: tour.notes },
    { label: 'תאריך', value: tour.date },
    { label: 'שעה', value: tour.time },
    { label: 'מיקום', value: tour.location },
    { label: 'אופן תשלום', value: tour.payment_method },
    { label: 'סה״כ תשלום', value: tour.total_amount ? `₪${parseFloat(tour.total_amount).toLocaleString('he-IL')}` : '' },
  ]

  const rows = fields
    .filter(f => f.value && String(f.value).trim() !== '' && String(f.value) !== '0')
    .map(f => `
      <tr>
        <td style="padding:8px 12px; border:1px solid #ddd; font-weight:bold; background:#f9f7f4; width:35%; text-align:right;">${f.label}</td>
        <td style="padding:8px 12px; border:1px solid #ddd; text-align:right;">${f.value}</td>
      </tr>
    `).join('')

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      direction: rtl;
      color: #1c1917;
      background: #fff;
      padding: 40px;
      font-size: 14px;
      line-height: 1.6;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #d97418;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .logo { height: 60px; }
    .doc-title {
      font-size: 22px;
      font-weight: bold;
      color: #d97418;
    }
    .doc-subtitle {
      font-size: 13px;
      color: #78716c;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #78716c;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
      margin-top: 24px;
    }
    .footer-box {
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 16px;
      font-size: 12px;
      color: #57534e;
      line-height: 1.8;
    }
    .footer-box b { color: #1c1917; }
    .signature-box {
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 12px;
      font-size: 13px;
    }
    .sig-line {
      display: inline-block;
      border-bottom: 1px solid #aaa;
      width: 160px;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" class="logo" alt="רוח צפת" onerror="this.style.display='none'" />
    <div style="text-align:left">
      <div class="doc-title">רוח צפת | ${title}</div>
      <div class="doc-subtitle">תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}</div>
    </div>
  </div>

  <table>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer-box">
    <b>תנאי ביטול (למעט כח עליון):</b><br>
    עד 21 ימי עסקים קודם האירוע – ללא תשלום &nbsp;|&nbsp;
    21–14 ימי עסקים – 50% מסכום העסקה &nbsp;|&nbsp;
    מ-14 ימי עסקים ועד האירוע – 100% מהעסקה
  </div>

  <div class="footer-box" style="margin-top:10px">
    <b>פרטי תשלום:</b><br>
    שוטף +30 &nbsp;|&nbsp;
    שיק – לפקודת "רוח צפת" &nbsp;|&nbsp;
    העברה בנקאית – בנק מזרחי, סניף 562, חשבון 129637
  </div>

  <div class="signature-box" style="margin-top:12px">
    <b>אישור הזמנה:</b> קראתי את פרטי ההזמנה ואני מאשר/ת אותה בחתימתי<br><br>
    שם: <span class="sig-line"></span> &nbsp;&nbsp;
    חתימה: <span class="sig-line"></span>
  </div>
</body>
</html>`
}
