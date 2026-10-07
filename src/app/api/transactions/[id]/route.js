import { readCsv, writeCsv } from '@/lib/csv'

export async function DELETE(request, { params }) {
  try {
    const transactions = readCsv('transactions.csv')
    writeCsv('transactions.csv', transactions.filter(t => t.id !== params.id))
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
