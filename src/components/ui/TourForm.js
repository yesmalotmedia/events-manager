"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const EVENT_TYPES = [
  "סיור מוזיקלי",
  "הופעה להקת היבא",
  "הופעה להקת היבא דואו",
  "הופעה להקת רוח צפת",
  "מופע נודד - סיור מוזיקלי עם מיאל בליווי נגני רחוב",
  "חגיגת בר מצווה עם מיאל ולהקת רוח צפת",
  "אחר",
];
const PAYMENT_METHODS = ["מערכת גפן", "העברה בנקאית", "שיק", "מזומן", "אחר"];
const STATUS_OPTIONS = [
  "ממתין",
  "מושהה",
  "נשלחה הזמנה",
  "הזמנה אושרה",
  'נשלחו פרטים לנהח"ש',
];

export default function TourForm({ initial = {}, isEdit = false }) {
  const router = useRouter();
  const [form, setForm] = useState({
    client_name: "",
    client_id: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    participants_desc: "",
    num_participants: "",
    event_type: "",
    notes: "",
    date: "",
    time: "",
    location: "",
    payment_method: "",
    content_amount: "",
    status: "ממתין",
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Client autocomplete
  const [clientSearch, setClientSearch] = useState(initial.client_name || "");
  const [clientResults, setClientResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Suppliers for this tour
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [tourSuppliers, setTourSuppliers] = useState([]); // [{supplier, quantity, my_cost, client_cost}]
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [supForm, setSupForm] = useState({
    supplier_id: "",
    quantity: "",
    my_cost: "",
    client_cost: "",
    add_to_total: false,
  });

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((data) => {
        setAllSuppliers(Array.isArray(data) ? data : []);
      });
    // Load existing expenses if editing
    if (isEdit && initial.id) {
      fetch(`/api/expenses?tour_id=${initial.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTourSuppliers(
              data.map((e) => ({
                id: e.id,
                supplier_id: e.supplier_id,
                supplier_name: e.supplier_name,
                type: e.type || "תוכן",
                quantity: e.quantity || "1",
                my_cost: e.my_cost || e.amount || "",
                client_cost: e.client_cost || e.my_cost || e.amount || "",
                add_to_total: e.add_to_total === "true",
              })),
            );
          }
        });
    }
  }, []);

  // Client search
  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) {
      setClientResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
        .then((r) => r.json())
        .then((data) =>
          setClientResults(Array.isArray(data) ? data.slice(0, 8) : []),
        );
    }, 200);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  const selectClient = (c) => {
    setForm((f) => ({
      ...f,
      client_name: c.name,
      client_id: c.client_id || "",
      contact_name: c.contact_name || "",
      contact_phone: c.contact_phone || "",
      contact_email: c.contact_email || "",
      participants_desc: c.participants_desc || "",
      payment_method: c.payment_method || "",
    }));
    setClientSearch(c.name);
    setShowDropdown(false);
    setClientResults([]);
  };

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Supplier management — add_to_total decides whether a supplier's client
  // price is an à-la-carte add-on (added on top of content_amount) or
  // already covered by the fixed content price. Same flag used on the
  // tour detail page, seeded from the supplier's own bills_separately
  // default when selected below.
  const addOnSuppliers = tourSuppliers.filter((s) => s.add_to_total);
  const addOnTotal = addOnSuppliers.reduce((sum, s) => {
    return sum + parseFloat(s.quantity || 1) * parseFloat(s.client_cost || 0);
  }, 0);
  const contentAmount = parseFloat(form.content_amount || 0);
  const totalAmount = contentAmount + addOnTotal;

  const addSupplier = () => {
    const sup = allSuppliers.find((s) => s.id === supForm.supplier_id);
    if (!sup) return;
    setTourSuppliers((prev) => [
      ...prev,
      {
        supplier_id: sup.id,
        supplier_name: sup.name,
        type: sup.type || "תוכן",
        quantity: supForm.quantity || form.num_participants || "1",
        my_cost: supForm.my_cost || sup.my_rate || sup.default_rate || "",
        client_cost:
          supForm.client_cost || sup.client_rate || sup.default_rate || "",
        add_to_total: supForm.add_to_total,
      },
    ]);
    setSupForm({
      supplier_id: "",
      quantity: "",
      my_cost: "",
      client_cost: "",
      add_to_total: false,
    });
    setAddingSupplier(false);
  };

  const removeSupplier = (idx) =>
    setTourSuppliers((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // total_amount starts as just the base content price — each expense
      // POST below bumps it by its own client_cost when add_to_total is
      // set, exactly like the tour detail page does. Sending the already
      //-summed `totalAmount` (content + add-ons) here would double-count
      // once those same expenses get created.
      const tourData = {
        ...form,
        client_name: clientSearch || form.client_name,
        total_amount: String(contentAmount),
        content_amount: String(contentAmount),
      };

      const url = isEdit ? `/api/tours/${initial.id}` : "/api/tours";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tourData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");

      // Save client
      if (!isEdit) {
        await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clientSearch || form.client_name,
            client_id: form.client_id,
            contact_name: form.contact_name,
            contact_phone: form.contact_phone,
            contact_email: form.contact_email,
            participants_desc: form.participants_desc,
            payment_method: form.payment_method,
          }),
        });
      }

      // Save suppliers as expenses
      if (isEdit) {
        // Delete existing expenses. Each DELETE adjusts total_amount based
        // on *that expense's own* old contribution, so this can leave
        // total_amount anywhere depending on what existed before — reset
        // it explicitly to the (possibly just-edited) base content price
        // right after, before re-adding the current supplier list below.
        const existingRes = await fetch(`/api/expenses?tour_id=${initial.id}`);
        const existing = await existingRes.json();
        for (const exp of Array.isArray(existing) ? existing : []) {
          await fetch(`/api/expenses/${exp.id}`, { method: "DELETE" });
        }
        await fetch(`/api/tours/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ total_amount: String(contentAmount) }),
        });
      }
      for (const sup of tourSuppliers) {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tour_id: data.id,
            supplier_id: sup.supplier_id,
            supplier_name: sup.supplier_name,
            type: sup.type,
            quantity: sup.quantity,
            my_cost: sup.my_cost,
            client_cost: sup.client_cost,
            amount: sup.my_cost,
            notes: "",
            add_to_total: sup.add_to_total ? "true" : "false",
          }),
        });
      }

      router.push(`/tours/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* פרטי לקוח */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-stone-800 text-sm border-b border-stone-100 pb-3">
          פרטי לקוח
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 relative">
            <label className="label">שם המזמין *</label>
            <input
              className="input"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setForm((f) => ({ ...f, client_name: e.target.value }));
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="הקלד לחיפוש לקוח קיים..."
              required
            />
            {showDropdown && clientResults.length > 0 && (
              <div className="absolute z-20 w-full bg-white border border-stone-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {clientResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectClient(c)}
                    className="w-full text-right px-4 py-2.5 hover:bg-stone-50 text-sm border-b border-stone-50 last:border-0"
                  >
                    <div className="font-medium text-stone-800">{c.name}</div>
                    {c.contact_name && (
                      <div className="text-xs text-stone-400">
                        {c.contact_name} • {c.contact_phone}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="label">ח.פ / מס׳ עמותה</label>
            <input
              className="input"
              value={form.client_id}
              onChange={set("client_id")}
            />
          </div>
          <div>
            <label className="label">שם איש קשר</label>
            <input
              className="input"
              value={form.contact_name}
              onChange={set("contact_name")}
            />
          </div>
          <div>
            <label className="label">טלפון</label>
            <input
              className="input"
              type="tel"
              value={form.contact_phone}
              onChange={set("contact_phone")}
            />
          </div>
          <div>
            <label className="label">מייל</label>
            <input
              className="input"
              type="email"
              value={form.contact_email}
              onChange={set("contact_email")}
            />
          </div>
        </div>
      </div>

      {/* פרטי הפעילות */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-stone-800 text-sm border-b border-stone-100 pb-3">
          פרטי הפעילות
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">סוג האירוע</label>
            <select
              className="input"
              value={form.event_type}
              onChange={set("event_type")}
            >
              <option value="">בחר סוג אירוע...</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">מיקום</label>
            <input
              className="input"
              value={form.location}
              onChange={set("location")}
            />
          </div>
          <div>
            <label className="label">תאריך</label>
            <input
              className="input"
              type="date"
              value={form.date ? form.date.split("/").reverse().join("-") : ""}
              onChange={(e) => {
                const d = e.target.value.split("-").reverse().join("/");
                setForm((f) => ({ ...f, date: d }));
              }}
            />
          </div>
          <div>
            <label className="label">שעה</label>
            <input
              className="input"
              type="time"
              value={form.time}
              onChange={set("time")}
            />
          </div>
          <div>
            <label className="label">מספר משתתפים</label>
            <input
              className="input"
              type="number"
              value={form.num_participants}
              onChange={set("num_participants")}
            />
          </div>
          <div>
            <label className="label">תיאור המשתתפים</label>
            <input
              className="input"
              value={form.participants_desc}
              onChange={set("participants_desc")}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">הערות</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={set("notes")}
            />
          </div>
        </div>
      </div>

      {/* תשלום וספקים */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-stone-800 text-sm border-b border-stone-100 pb-3">
          תשלום וספקים
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">אופן תשלום</label>
            <select
              className="input"
              value={form.payment_method}
              onChange={set("payment_method")}
            >
              <option value="">בחר...</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">סכום תוכן (₪)</label>
            <input
              className="input"
              type="number"
              value={form.content_amount}
              onChange={set("content_amount")}
              placeholder="סכום עבור ההופעה/סיור"
            />
          </div>
          <div>
            <label className="label">סטטוס</label>
            <select
              className="input"
              value={form.status}
              onChange={set("status")}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Suppliers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-stone-700">הוספת ספקים</h3>
            <button
              type="button"
              onClick={() => setAddingSupplier(!addingSupplier)}
              className="btn-secondary text-xs"
            >
              + הוסף ספק
            </button>
          </div>

          {addingSupplier && (
            <div className="bg-stone-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">ספק</label>
                  <select
                    className="input"
                    value={supForm.supplier_id}
                    onChange={(e) => {
                      const sup = allSuppliers.find(
                        (s) => s.id === e.target.value,
                      );
                      setSupForm((f) => ({
                        ...f,
                        supplier_id: e.target.value,
                        my_cost: sup
                          ? sup.my_rate || sup.default_rate || ""
                          : "",
                        client_cost: sup
                          ? sup.client_rate || sup.default_rate || ""
                          : "",
                        quantity:
                          sup && sup.type === "ספק חיצוני"
                            ? form.num_participants || "1"
                            : "1",
                        add_to_total: sup
                          ? sup.bills_separately === "true"
                          : f.add_to_total,
                      }));
                    }}
                  >
                    <option value="">בחר ספק...</option>
                    {allSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type || "תוכן"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">כמות</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={supForm.quantity}
                    onChange={(e) =>
                      setSupForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">עלות לי (₪)</label>
                  <input
                    className="input"
                    type="number"
                    value={supForm.my_cost}
                    onChange={(e) =>
                      setSupForm((f) => ({ ...f, my_cost: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">עלות ללקוח (₪)</label>
                  <input
                    className="input"
                    type="number"
                    value={supForm.client_cost}
                    onChange={(e) =>
                      setSupForm((f) => ({ ...f, client_cost: e.target.value }))
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={supForm.add_to_total}
                  onChange={(e) =>
                    setSupForm((f) => ({
                      ...f,
                      add_to_total: e.target.checked,
                    }))
                  }
                />
                תוספת בתשלום נפרד (מתווסף לסכום הכולל ללקוח)
              </label>
              {supForm.supplier_id &&
                (parseFloat(supForm.my_cost) > 0 ||
                  parseFloat(supForm.client_cost) > 0) && (
                  <div className="text-xs text-stone-500 px-1">
                    סה"כ לי: ₪
                    {(
                      parseFloat(supForm.quantity || 1) *
                      parseFloat(supForm.my_cost || 0)
                    ).toLocaleString("he-IL")}{" "}
                    | סה"כ ללקוח: ₪
                    {(
                      parseFloat(supForm.quantity || 1) *
                      parseFloat(supForm.client_cost || 0)
                    ).toLocaleString("he-IL")}
                  </div>
                )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addSupplier}
                  className="btn-primary text-xs"
                >
                  הוסף
                </button>
                <button
                  type="button"
                  onClick={() => setAddingSupplier(false)}
                  className="btn-secondary text-xs"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          {tourSuppliers.length > 0 && (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{ background: "#F5F0E8" }}
                  className="border-b border-stone-100"
                >
                  <th className="text-right px-3 py-2 text-xs font-medium text-stone-500">
                    ספק
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-stone-500">
                    תוספת?
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-stone-500">
                    כמות
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-stone-500">
                    עלות לי
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-stone-500">
                    ללקוח
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-stone-500">
                    סה"כ ללקוח
                  </th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {tourSuppliers.map((s, idx) => {
                  const qty = parseFloat(s.quantity || 1);
                  const myCost = parseFloat(s.my_cost || 0);
                  const clCost = parseFloat(s.client_cost || 0);
                  return (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="px-3 py-2 font-medium text-stone-800">
                        {s.supplier_name}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setTourSuppliers((prev) =>
                              prev.map((row, i) =>
                                i === idx
                                  ? { ...row, add_to_total: !row.add_to_total }
                                  : row,
                              ),
                            )
                          }
                          className="px-1.5 py-0.5 rounded"
                          style={
                            s.add_to_total
                              ? { background: "#eef3fa", color: "#4A7FA5" }
                              : { background: "#F5F0E8", color: "#B8A48A" }
                          }
                          title="לחץ להחליף בין תוספת בתשלום נפרד לכלול במחיר"
                        >
                          {s.add_to_total ? "תוספת" : "כלול במחיר"}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-stone-600">{qty}</td>
                      <td className="px-3 py-2 text-stone-600">
                        ₪{myCost.toLocaleString("he-IL")}
                      </td>
                      <td className="px-3 py-2 text-stone-600">
                        ₪{clCost.toLocaleString("he-IL")}
                      </td>
                      <td className="px-3 py-2 font-medium text-stone-800">
                        ₪{(qty * clCost).toLocaleString("he-IL")}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeSupplier(idx)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          מחק
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}

          {/* Summary */}
          <div
            className="rounded-lg p-4 space-y-2 text-sm"
            style={{ background: "#eef3fa" }}
          >
            <div className="flex justify-between">
              <span className="text-stone-500">תוכן</span>
              <span className="font-medium">
                ₪{contentAmount.toLocaleString("he-IL")}
              </span>
            </div>
            {addOnSuppliers.map((s, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-stone-500">{s.supplier_name}</span>
                <span>
                  ₪
                  {(
                    parseFloat(s.quantity || 1) * parseFloat(s.client_cost || 0)
                  ).toLocaleString("he-IL")}
                </span>
              </div>
            ))}
            <div
              className="border-t border-stone-200 pt-2 flex justify-between font-bold"
              style={{ color: "#2C4A7C" }}
            >
              <span>סה"כ ללקוח</span>
              <span>₪{totalAmount.toLocaleString("he-IL")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          ביטול
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "שומר..." : isEdit ? "עדכן סיור" : "צור סיור"}
        </button>
      </div>
    </form>
  );
}
