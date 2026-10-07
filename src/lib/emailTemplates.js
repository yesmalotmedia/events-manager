const HIBA_EVENTS = ['הופעה להקת היבא', 'הופעה להקת היבא דואו']

export function getEmailHtml(tour, message) {
  const isHiba = HIBA_EVENTS.includes(tour.event_type)
  const bg     = isHiba ? '#F3EDE4' : '#F5F0E8'
  const accent = isHiba ? '#C4552A' : '#2C4A7C'
  const gold   = isHiba ? '#5B544B' : '#B8860B'
  const border = isHiba ? '#C9C1B3' : '#E8DFD0'
  const name   = isHiba ? 'להקת היבא' : 'רוח צפת'
  const sub    = isHiba ? 'מוזיקה תימנית־שורשית' : 'מיאל אומן — סיורים, הופעות ואירועים'

  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <div style="background:${accent};padding:24px;border-radius:8px 8px 0 0;">
        <h2 style="color:white;margin:0;">${name}</h2>
        <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px;">${sub}</p>
      </div>
      <div style="background:${bg};padding:24px;border:1px solid ${border};border-top:none;border-radius:0 0 8px 8px;">
        <p style="color:#2A1F14;white-space:pre-line;">${message || ''}</p>
      </div>
    </div>
  `
}
