import { readCsv, writeCsv } from '@/lib/csv'

export async function PUT(request, { params }) {
  const body = await request.json()
  const clients = readCsv('clients.csv')
  const idx = clients.findIndex(c => c.id === params.id)
  if (idx === -1) return Response.json({ error: 'לא נמצא' }, { status: 404 })
  clients[idx] = { ...clients[idx], ...body, id: params.id }
  writeCsv('clients.csv', clients)
  return Response.json(clients[idx])
}

export async function DELETE(request, { params }) {
  const clients = readCsv('clients.csv')
  writeCsv('clients.csv', clients.filter(c => c.id !== params.id))
  return Response.json({ success: true })
}
