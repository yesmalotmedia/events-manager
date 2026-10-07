export const HIBA_EVENTS = ['הופעה להקת היבא', 'הופעה להקת היבא דואו']

export function isHiba(eventType) {
  return HIBA_EVENTS.includes(eventType)
}

export const HIBA_THEME = {
  bg:        '#F3EDE4',
  bgLight:   '#E9E2D6',
  stone:     '#C9C1B3',
  text:      '#1E1E1E',
  textMuted: '#5B544B',
  accent:    '#C4552A',
  accentHover: '#A83D1E',
}

export const RUACH_THEME = {
  bg:        '#F5F0E8',
  bgLight:   '#eef3fa',
  stone:     '#E8DFD0',
  text:      '#2A1F14',
  textMuted: '#755F4D',
  accent:    '#2C4A7C',
  accentHover: '#1c3054',
}

export function getTheme(eventType) {
  return isHiba(eventType) ? HIBA_THEME : RUACH_THEME
}

export function getDocTitle(eventType, docType) {
  // docType: 'הזמנה' | 'הצעת מחיר' | 'הזמנה לחתימה' | 'הזמנה חתומה' | 'פרטי חיוב'
  return `רוח צפת | ${eventType} — ${docType}`
}

export function getEmailSubject(eventType, docType) {
  return getDocTitle(eventType, docType)
}
