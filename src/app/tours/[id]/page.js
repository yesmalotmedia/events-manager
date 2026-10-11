"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SendDocumentModal from "@/components/ui/SendDocumentModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

const STATUSES = [
  "ממתין",
  "מושהה",
  "נשלחה הזמנה",
  "הזמנה אושרה",
  'נשלחו פרטים לנהח"ש',
];

const statusBadge = (s) => {
  if (s === "הזמנה אושרה") return <span className="badge-green">{s}</span>;
  if (s === "מושהה") return <span className="badge-red">{s}</span>;
  if (s === "נשלחה הזמנה") return <span className="badge-blue">{s}</span>;
  if (s === 'נשלחו פרטים לנהח"ש')
    return <span className="badge-gold">{s}</span>;
  return <span className="badge-yellow">{s || "ממתין"}</span>;
};

const EMPTY_EXPENSE = {
  supplier_id: "",
  supplier_name: "",
  quantity: "",
  my_cost: "",
  client_cost: "",
  notes: "",
  add_to_total: false,
};

export default function TourDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tour, setTour] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showAccountingModal, setShowAccountingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountingLoading, setAccountingLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [addingExpense, setAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);

  const load = () => {
    Promise.all([
      fetch(`/api/tours/${id}`).then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ]).then(([tourData, suppliersData]) => {
      setTour(tourData);
      setExpenses(tourData.expenses || []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [id]);

  // When opening expense form — set default quantity to num_participants
  const openExpenseForm = () => {
    setExpenseForm({
      ...EMPTY_EXPENSE,
      quantity: tour?.num_participants || "1",
    });
    setAddingExpense(true);
  };

  const addExpense = async (e) => {
    e.preventDefault();
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...expenseForm,
        add_to_total: expenseForm.add_to_total ? "true" : "false",
        tour_id: id,
      }),
    });
    setAddingExpense(false);
    setExpenseForm(EMPTY_EXPENSE);
    load();
  };

  const deleteExpense = async (expId) => {
    await fetch(`/api/expenses/${expId}`, { method: "DELETE" });
    load();
  };

  const sendToAccounting = async () => {
    setAccountingLoading(true);
    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetch(`/api/tours/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: 'נשלחו פרטים לנהח"ש',
          sent_to_accounting: "true",
        }),
      });
      setSuccessMsg(`נשלח בהצלחה — מזהה: ${data.requestId}`);
      load();
    } catch (e) {
      alert("שגיאה: " + e.message);
    } finally {
      setAccountingLoading(false);
      setShowAccountingModal(false);
    }
  };

  const duplicateTour = async () => {
    setDuplicating(true);
    const res = await fetch(`/api/tours/${id}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (res.ok) router.push(`/tours/${data.id}/edit`);
    setDuplicating(false);
  };

  const deleteTour = async () => {
    setDeleteLoading(true);
    await fetch(`/api/tours/${id}`, { method: "DELETE" });
    router.push("/tours");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-400 text-sm">טוען...</div>
      </div>
    );
  if (!tour || tour.error)
    return (
      <div className="text-center py-16">
        <div className="text-stone-400">הסיור לא נמצא</div>
        <Link
          href="/tours"
          className="text-brand-500 text-sm mt-2 inline-block"
        >
          חזרה לרשימה
        </Link>
      </div>
    );

  const totalAmount = parseFloat(tour.total_amount) || 0;
  const expensesTotal = parseFloat(tour.expenses_total) || 0;
  const commission = parseFloat(tour.commission) || 0;
  const netPayment = parseFloat(tour.net_payment) || 0;

  const canSendAccounting =
    tour.status === "הזמנה אושרה" || tour.status === "אושר";
  const alreadySentAccounting = tour.status === 'נשלחו פרטים לנהח"ש';

  // Expense form calculations
  const fQty = parseFloat(expenseForm.quantity || 1);
  const fMy = parseFloat(expenseForm.my_cost || 0);
  const fClient = parseFloat(expenseForm.client_cost || 0);
  const fTotalMy = fQty * fMy;
  const fTotalClient = fQty * fClient;

  return (
    <div className="space-y-6 max-w-4xl">
      {showSendModal && (
        <SendDocumentModal
          tour={tour}
          onClose={() => setShowSendModal(false)}
          onSent={() => {
            load();
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="מחיקת סיור"
          confirmLabel="מחק"
          confirmClass="btn-danger"
          loading={deleteLoading}
          onConfirm={deleteTour}
          onClose={() => setShowDeleteModal(false)}
        >
          <p className="text-stone-600 text-sm">
            האם למחוק את הסיור של <strong>{tour.client_name}</strong>?
          </p>
          <p className="text-red-500 text-xs mt-2">פעולה זו אינה הפיכה.</p>
        </ConfirmModal>
      )}

      {showAccountingModal && (
        <ConfirmModal
          title='שליחת פרטים לנהח"ש'
          confirmLabel="שלח"
          loading={accountingLoading}
          onConfirm={sendToAccounting}
          onClose={() => setShowAccountingModal(false)}
        >
          <p className="text-stone-600 text-sm mb-4">
            הפרטים הבאים יישלחו לטבלת הנהלת חשבונות:
          </p>
          <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
            {[
              ["שם לקוח", tour.client_name],
              ["תאריך פעילות", tour.date],
              ["תיאור", tour.event_type],
              [
                "סכום לתשלום",
                tour.total_amount
                  ? `₪${parseFloat(tour.total_amount).toLocaleString("he-IL")}`
                  : "—",
              ],
              ["שם העובד", "מיאל"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-stone-500">{label}</span>
                <span className="font-medium text-stone-800">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        </ConfirmModal>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="text-green-800 text-sm font-medium">{successMsg}</div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-green-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/tours"
            className="text-stone-400 hover:text-stone-600 text-sm"
          >
            ← חזרה
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {tour.client_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {statusBadge(tour.status || "ממתין")}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowSendModal(true)}
            className="btn-primary text-xs"
          >
            📄 שלח הזמנה
          </button>
          {!alreadySentAccounting && (
            <button
              onClick={() => setShowAccountingModal(true)}
              disabled={!canSendAccounting}
              className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              style={{
                background: canSendAccounting ? "#B8860B" : "#E8DFD0",
                color: canSendAccounting ? "white" : "#B8A48A",
                cursor: canSendAccounting ? "pointer" : "not-allowed",
              }}
              title={canSendAccounting ? "" : "זמין רק לאחר אישור ההזמנה"}
            >
              📊 שלח לנהח"ש
            </button>
          )}
          {alreadySentAccounting && (
            <span className="badge-gold flex items-center text-xs px-3 py-2">
              ✓ נשלח לנהח"ש
            </span>
          )}
          <button
            onClick={duplicateTour}
            disabled={duplicating}
            className="btn-secondary text-xs"
          >
            {duplicating ? "משכפל..." : "שכפל"}
          </button>
          <Link href={`/tours/${id}/edit`} className="btn-secondary text-xs">
            עריכה
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-danger text-xs"
          >
            מחיקה
          </button>
        </div>
      </div>

      {/* Status flow */}
      <div className="card p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUSES.map((s, idx) => {
            const current = (tour.status || "ממתין") === s;
            const passed = STATUSES.indexOf(tour.status || "ממתין") > idx;
            return (
              <div key={s} className="flex items-center gap-2 shrink-0">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: current
                      ? "#2C4A7C"
                      : passed
                        ? "#eef3fa"
                        : "#F5F0E8",
                    color: current ? "white" : passed ? "#4A7FA5" : "#B8A48A",
                  }}
                >
                  {s}
                </div>
                {idx < STATUSES.length - 1 && (
                  <span className="text-stone-300 text-xs">←</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Client */}
          <div className="card p-5">
            <h3 className="font-semibold text-stone-700 text-sm mb-4">
              פרטי לקוח
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["שם מזמין", tour.client_name],
                ["ח.פ / עמותה", tour.client_id],
                ["איש קשר", tour.contact_name],
                ["טלפון", tour.contact_phone],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-stone-400 text-xs">{label}</div>
                  <div className="text-stone-800 font-medium">
                    {value || "—"}
                  </div>
                </div>
              ))}
              <div className="col-span-2">
                <div className="text-stone-400 text-xs">מייל</div>
                <div className="text-stone-800">
                  {tour.contact_email || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Event */}
          <div className="card p-5">
            <h3 className="font-semibold text-stone-700 text-sm mb-4">
              פרטי הפעילות
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["סוג האירוע", tour.event_type],
                ["מיקום", tour.location],
                ["תאריך", tour.date],
                ["שעה", tour.time],
                ["מספר משתתפים", tour.num_participants],
                ["תיאור משתתפים", tour.participants_desc],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-stone-400 text-xs">{label}</div>
                  <div className="text-stone-800">{value || "—"}</div>
                </div>
              ))}
              {tour.notes && (
                <div className="col-span-2">
                  <div className="text-stone-400 text-xs">הערות</div>
                  <div className="text-stone-800">{tour.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Expenses */}
          <div className="card">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-700 text-sm">
                הוספת ספקים
              </h3>
              {!addingExpense && (
                <button
                  onClick={openExpenseForm}
                  className="btn-secondary text-xs"
                >
                  + הוסף
                </button>
              )}
            </div>

            {addingExpense && (
              <form
                onSubmit={addExpense}
                className="px-5 py-4 bg-stone-50 border-b border-stone-100 space-y-3"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">ספק</label>
                    <select
                      className="input"
                      value={expenseForm.supplier_id}
                      onChange={(e) => {
                        const sup = suppliers.find(
                          (s) => s.id === e.target.value,
                        );
                        setExpenseForm((f) => ({
                          ...f,
                          supplier_id: e.target.value,
                          supplier_name: sup ? sup.name : "",
                          quantity: sup
                            ? sup.type === "ספק חיצוני"
                              ? tour?.num_participants || "1"
                              : "1"
                            : f.quantity,
                          my_cost: sup
                            ? String(sup.my_rate || sup.default_rate || "")
                            : f.my_cost,
                          client_cost: sup
                            ? String(
                                sup.client_rate ||
                                  sup.my_rate ||
                                  sup.default_rate ||
                                  "",
                              )
                            : f.client_cost,
                          add_to_total: sup
                            ? sup.bills_separately === "true"
                            : f.add_to_total,
                        }));
                      }}
                    >
                      <option value="">בחר ספק...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      <option value="other">אחר</option>
                    </select>
                  </div>
                  {expenseForm.supplier_id === "other" && (
                    <div>
                      <label className="label">שם ספק</label>
                      <input
                        className="input"
                        value={expenseForm.supplier_name}
                        onChange={(e) =>
                          setExpenseForm((f) => ({
                            ...f,
                            supplier_name: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                  <div>
                    <label className="label">כמות</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={expenseForm.quantity}
                      onChange={(e) =>
                        setExpenseForm((f) => ({
                          ...f,
                          quantity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">עלות לי ליחידה (₪)</label>
                    <input
                      className="input"
                      type="number"
                      value={expenseForm.my_cost}
                      onChange={(e) =>
                        setExpenseForm((f) => ({
                          ...f,
                          my_cost: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">עלות ללקוח ליחידה (₪)</label>
                    <input
                      className="input"
                      type="number"
                      value={expenseForm.client_cost}
                      onChange={(e) =>
                        setExpenseForm((f) => ({
                          ...f,
                          client_cost: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">הערה</label>
                    <input
                      className="input"
                      value={expenseForm.notes}
                      onChange={(e) =>
                        setExpenseForm((f) => ({ ...f, notes: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs text-stone-600">
                      <input
                        type="checkbox"
                        checked={expenseForm.add_to_total}
                        onChange={(e) =>
                          setExpenseForm((f) => ({
                            ...f,
                            add_to_total: e.target.checked,
                          }))
                        }
                      />
                      תוספת בתשלום נפרד (מתווסף לסכום הכולל)
                    </label>
                  </div>
                </div>

                {/* Live calculation preview */}
                {(fMy > 0 || fClient > 0) && (
                  <div
                    className="rounded-lg px-4 py-3 text-xs flex gap-6"
                    style={{ background: "#eef3fa" }}
                  >
                    <span className="text-stone-500">
                      כמות: <strong>{fQty}</strong>
                    </span>
                    {fMy > 0 && (
                      <span className="text-stone-500">
                        סה"כ לי:{" "}
                        <strong className="text-stone-800">
                          ₪{fTotalMy.toLocaleString("he-IL")}
                        </strong>
                      </span>
                    )}
                    {fClient > 0 && (
                      <span className="text-stone-500">
                        סה"כ ללקוח:{" "}
                        <strong className="text-stone-800">
                          ₪{fTotalClient.toLocaleString("he-IL")}
                        </strong>
                      </span>
                    )}
                    {expenseForm.add_to_total && fClient > 0 && (
                      <span className="text-stone-500">
                        סכום הסיור יעלה ל-
                        <strong className="text-stone-800">
                          ₪
                          {(totalAmount + fTotalClient).toLocaleString(
                            "he-IL",
                          )}
                        </strong>
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-xs">
                    שמור
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingExpense(false)}
                    className="btn-secondary text-xs"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            )}

            {expenses.length === 0 && !addingExpense ? (
              <div className="px-5 py-6 text-center text-stone-400 text-sm">
                אין הוצאות רשומות
              </div>
            ) : (
              expenses.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{ background: "#F5F0E8" }}
                      className="border-b border-stone-100"
                    >
                      <th className="text-right px-4 py-2 font-medium text-stone-500 text-xs">
                        ספק
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-stone-500 text-xs">
                        כמות
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-stone-500 text-xs">
                        עלות לי
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-stone-500 text-xs">
                        ללקוח
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-stone-500 text-xs">
                        סה"כ לי
                      </th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {expenses.map((exp) => {
                      const qty = parseFloat(exp.quantity || 1);
                      const myCost = parseFloat(exp.my_cost || exp.amount || 0);
                      const clientCost = parseFloat(
                        exp.client_cost || exp.my_cost || exp.amount || 0,
                      );
                      return (
                        <tr key={exp.id} className="hover:bg-stone-50">
                          <td className="px-4 py-2 font-medium text-stone-800">
                            {exp.supplier_name}
                            {exp.add_to_total === "true" && (
                              <span
                                className="text-xs mr-1 px-1.5 py-0.5 rounded"
                                style={{ background: "#eef3fa", color: "#4A7FA5" }}
                                title="מתווסף לסכום הכולל של הסיור"
                              >
                                תוספת
                              </span>
                            )}
                            {exp.notes && (
                              <span className="text-stone-400 text-xs mr-1">
                                {" "}
                                ({exp.notes})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-stone-600">{qty}</td>
                          <td className="px-4 py-2 text-stone-600">
                            ₪{myCost.toLocaleString("he-IL")}
                          </td>
                          <td className="px-4 py-2 text-stone-500">
                            ₪{clientCost.toLocaleString("he-IL")}
                          </td>
                          <td className="px-4 py-2 font-medium text-stone-800">
                            ₪{(qty * myCost).toLocaleString("he-IL")}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => deleteExpense(exp.id)}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              מחק
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr
                      className="border-t-2 border-stone-200"
                      style={{ background: "#F5F0E8" }}
                    >
                      <td
                        className="px-4 py-2 font-bold text-stone-700 text-xs"
                        colSpan={4}
                      >
                        סה"כ הוצאות
                      </td>
                      <td className="px-4 py-2 font-bold text-stone-800">
                        ₪
                        {expenses
                          .reduce(
                            (sum, e) =>
                              sum +
                              parseFloat(e.quantity || "1") *
                                parseFloat(e.my_cost || e.amount || 0),
                            0,
                          )
                          .toLocaleString("he-IL")}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

        {/* Finance */}
        <div className="card p-5 space-y-3 h-fit">
          <h3 className="font-semibold text-stone-700 text-sm mb-2">
            סיכום פיננסי
          </h3>
          {[
            ["אופן תשלום", tour.payment_method || "—"],
            ["סה״כ תשלום", `₪${totalAmount.toLocaleString("he-IL")}`],
            ["הוצאות ספקים", `-₪${expensesTotal.toLocaleString("he-IL")}`],
            ["עמלה (15%)", `-₪${commission.toLocaleString("he-IL")}`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-stone-500">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
          <div className="border-t border-stone-100 pt-3 flex justify-between text-sm">
            <span className="font-semibold text-stone-700">נטו למיאל</span>
            <span className="font-bold text-green-700 text-base">
              ₪{netPayment.toLocaleString("he-IL")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
