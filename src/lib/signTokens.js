import { readCsv, writeCsv, getNextId } from './csv'
import crypto from 'crypto'

export function createSignToken(tourId) {
  const tokens = readCsv('sign_tokens.csv')
  const token = crypto.randomBytes(24).toString('hex')
  const newToken = {
    id: getNextId(tokens),
    token,
    tour_id: String(tourId),
    created_at: new Date().toISOString(),
    signed_at: '',
    status: 'pending',
  }
  tokens.push(newToken)
  writeCsv('sign_tokens.csv', tokens)
  return token
}

export function getSignToken(token) {
  const tokens = readCsv('sign_tokens.csv')
  return tokens.find(t => t.token === token) || null
}

export function markTokenSigned(token) {
  const tokens = readCsv('sign_tokens.csv')
  const idx = tokens.findIndex(t => t.token === token)
  if (idx !== -1) {
    tokens[idx].signed_at = new Date().toISOString()
    tokens[idx].status = 'signed'
    writeCsv('sign_tokens.csv', tokens)
  }
}
