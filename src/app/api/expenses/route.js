import { syncTourToSheet } from "@/lib/sheetsSync";
import { readCsv, writeCsv, getNextId } from "@/lib/csv";

export const dynamic = "force-dynamic";

function calcNet(totalAmount, expenses) {
  // Net = (total - my costs) * 85%
  const myCosts = expenses.reduce((sum, e) => {
    const qty = parseFloat(e.quantity || 1);
    const cost = parseFloat(e.my_cost || e.amount || 0);
    return sum + qty * cost;
  }, 0);
  const gross = totalAmount - myCosts;
  const commission = Math.round(gross * 0.15);
  return { expTotal: myCosts, commission, net: Math.round(gross * 0.85) };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get("tour_id");
    let expenses = readCsv("expenses.csv");
    if (tourId) expenses = expenses.filter((e) => e.tour_id === tourId);
    return Response.json(expenses);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const expenses = readCsv("expenses.csv");
    const addToTotal =
      body.add_to_total === true || body.add_to_total === "true"
        ? "true"
        : "false";
    const newExpense = {
      id: getNextId(expenses),
      tour_id: body.tour_id || "",
      supplier_id: body.supplier_id || "",
      supplier_name: body.supplier_name || "",
      quantity: body.quantity || "1",
      my_cost: body.my_cost || body.amount || "0",
      client_cost: body.client_cost || body.my_cost || body.amount || "0",
      amount: body.my_cost || body.amount || "0", // backward compat
      notes: body.notes || "",
      // Does the client price of this expense get added on top of the
      // tour's total_amount (an à-la-carte add-on), or is it already
      // covered by a fixed package price? See src/app/suppliers/page.js
      // for the per-supplier default this is seeded from.
      add_to_total: addToTotal,
    };
    expenses.push(newExpense);
    writeCsv("expenses.csv", expenses);

    const tours = readCsv("tours.csv");
    const tourIdx = tours.findIndex((t) => t.id === body.tour_id);
    if (tourIdx !== -1) {
      if (addToTotal === "true") {
        const qty = parseFloat(newExpense.quantity || 1);
        const clientCost = parseFloat(newExpense.client_cost || 0);
        const currentTotal = parseFloat(tours[tourIdx].total_amount) || 0;
        tours[tourIdx].total_amount = String(currentTotal + qty * clientCost);
      }
      const tourExpenses = expenses.filter((e) => e.tour_id === body.tour_id);
      const totalAmount = parseFloat(tours[tourIdx].total_amount) || 0;
      const { expTotal, commission, net } = calcNet(totalAmount, tourExpenses);
      tours[tourIdx].expenses_total = String(expTotal);
      tours[tourIdx].commission = String(commission);
      tours[tourIdx].net_payment = String(net);
      writeCsv("tours.csv", tours);
      syncTourToSheet(tours[tourIdx]).catch((e) =>
        console.error("Sheets sync error:", e.message),
      );
    }

    return Response.json(newExpense, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
