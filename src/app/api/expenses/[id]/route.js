import { readCsv, writeCsv } from "@/lib/csv";
import { syncTourToSheet } from "@/lib/sheetsSync";

function calcNet(totalAmount, expenses) {
  const myCosts = expenses.reduce((sum, e) => {
    const qty = parseFloat(e.quantity || 1);
    const cost = parseFloat(e.my_cost || e.amount || 0);
    return sum + qty * cost;
  }, 0);
  const gross = totalAmount - myCosts;
  return {
    expTotal: myCosts,
    commission: Math.round(gross * 0.15),
    net: Math.round(gross * 0.85),
  };
}

export async function DELETE(request, { params }) {
  try {
    const expenses = readCsv("expenses.csv");
    const expense = expenses.find((e) => e.id === params.id);
    const filtered = expenses.filter((e) => e.id !== params.id);
    writeCsv("expenses.csv", filtered);

    if (expense) {
      const tours = readCsv("tours.csv");
      const tourIdx = tours.findIndex((t) => t.id === expense.tour_id);
      if (tourIdx !== -1) {
        const remaining = filtered.filter((e) => e.tour_id === expense.tour_id);
        const totalAmount = parseFloat(tours[tourIdx].total_amount) || 0;
        const { expTotal, commission, net } = calcNet(totalAmount, remaining);
        tours[tourIdx].expenses_total = String(expTotal);
        tours[tourIdx].commission = String(commission);
        tours[tourIdx].net_payment = String(net);
        writeCsv("tours.csv", tours);
        syncTourToSheet(tours[tourIdx]).catch((e) =>
          console.error("Sheets sync error:", e.message),
        );
      }
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
