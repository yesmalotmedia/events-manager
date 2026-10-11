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

// How much this expense is currently adding on top of the tour's
// total_amount (0 if it isn't flagged as a separately-billed add-on).
function contribution(expense) {
  if (expense.add_to_total !== "true") return 0;
  return parseFloat(expense.quantity || 1) * parseFloat(expense.client_cost || 0);
}

function applyTourAdjustment(tours, tourIdx, expenses, totalAmountDelta) {
  const currentTotal = parseFloat(tours[tourIdx].total_amount) || 0;
  tours[tourIdx].total_amount = String(currentTotal + totalAmountDelta);
  const tourExpenses = expenses.filter(
    (e) => e.tour_id === tours[tourIdx].id,
  );
  const totalAmount = parseFloat(tours[tourIdx].total_amount) || 0;
  const { expTotal, commission, net } = calcNet(totalAmount, tourExpenses);
  tours[tourIdx].expenses_total = String(expTotal);
  tours[tourIdx].commission = String(commission);
  tours[tourIdx].net_payment = String(net);
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const expenses = readCsv("expenses.csv");
    const idx = expenses.findIndex((e) => e.id === params.id);
    if (idx === -1) return Response.json({ error: "לא נמצא" }, { status: 404 });

    const oldExpense = expenses[idx];
    const oldContribution = contribution(oldExpense);

    const updated = { ...oldExpense };
    for (const field of [
      "supplier_id",
      "supplier_name",
      "quantity",
      "my_cost",
      "client_cost",
      "notes",
      "add_to_total",
    ]) {
      if (body[field] !== undefined) updated[field] = body[field];
    }
    if (body.add_to_total !== undefined) {
      updated.add_to_total =
        body.add_to_total === true || body.add_to_total === "true"
          ? "true"
          : "false";
    }
    expenses[idx] = updated;
    writeCsv("expenses.csv", expenses);

    const tours = readCsv("tours.csv");
    const tourIdx = tours.findIndex((t) => t.id === updated.tour_id);
    if (tourIdx !== -1) {
      const newContribution = contribution(updated);
      applyTourAdjustment(
        tours,
        tourIdx,
        expenses,
        newContribution - oldContribution,
      );
      writeCsv("tours.csv", tours);
      syncTourToSheet(tours[tourIdx]).catch((e) =>
        console.error("Sheets sync error:", e.message),
      );
    }

    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
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
        applyTourAdjustment(tours, tourIdx, filtered, -contribution(expense));
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
