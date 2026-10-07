import { readCsv, writeCsv, getNextId } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  let clients = readCsv('clients.csv')
  if (search) {
    const q = search.toLowerCase()
    clients = clients.filter(c => (c.name || '').toLowerCase().includes(q))
  }
  return Response.json(clients)
}

export async function POST(request) {
  const body = await request.json()
  const clients = readCsv('clients.csv')
  const existing = clients.find(c => c.name?.trim().toLowerCase() === body.name?.trim().toLowerCase())
  if (existing) {
    const idx = clients.findIndex(c => c.id === existing.id)
    clients[idx] = { ...clients[idx], ...body, id: existing.id }
    writeCsv('clients.csv', clients)
    return Response.json(clients[idx])
  }
  const newClient = { id: getNextId(clients), ...body }
  clients.push(newClient)
  writeCsv('clients.csv', clients)
  return Response.json(newClient, { status: 201 })
}
