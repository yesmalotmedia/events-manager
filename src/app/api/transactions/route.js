import { readCsv, writeCsv, getNextId } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const transactions = readCsv('transactions.csv')
    return Response.json(transactions)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const transactions = readCsv('transactions.csv')
    const newTx = {
      id: getNextId(transactions),
      date: body.date || new Date().toLocaleDateString('he-IL'),
      type: body.type || 'debit',        // credit = מגיע לי, debit = שולם לי
      description: body.description || '',
      amount: body.amount || '0',
      tour_id: body.tour_id || '',
      created_at: new Date().toISOString(),
    }
    transactions.push(newTx)
    writeCsv('transactions.csv', transactions)
    return Response.json(newTx, { status: 201 })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
