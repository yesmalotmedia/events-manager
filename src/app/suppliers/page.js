"use client";
import { useEffect, useState } from "react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    my_rate: "",
    client_rate: "",
    type: "תוכן",
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((data) => {
        setSuppliers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };
  useEffect(() => {
    load();
  }, []);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name || "",
      role: s.role || "",
      phone: s.phone || "",
      email: s.email || "",
      my_rate: s.my_rate || s.default_rate || "",
      client_rate: s.client_rate || s.default_rate || "",
      type: s.type || "תוכן",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      role: "",
      phone: "",
      email: "",
      my_rate: "",
      client_rate: "",
      type: "תוכן",
    });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    resetForm();
    setSaving(false);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`למחוק את ${name}?`)) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">ספקים</h1>
          <p className="text-stone-500 text-sm mt-1">
            {suppliers.length} ספקים
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary"
        >
          + ספק חדש
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold text-stone-700 text-sm mb-4">
            {editingId ? "עריכת ספק" : "ספק חדש"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div>
                <label className="label">שם *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={set("name")}
                  required
                />
              </div>
              <div>
                <label className="label">תפקיד</label>
                <input
                  className="input"
                  value={form.role}
                  onChange={set("role")}
                />
              </div>
              <div>
                <label className="label">טלפון</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
              <div>
                <label className="label">עלות לי (₪)</label>
                <input
                  className="input"
                  type="number"
                  value={form.my_rate}
                  onChange={set("my_rate")}
                />
              </div>
              <div>
                <label className="label">עלות ללקוח (₪)</label>
                <input
                  className="input"
                  type="number"
                  value={form.client_rate}
                  onChange={set("client_rate")}
                />
              </div>
              <div>
                <label className="label">סוג</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={set("type")}
                >
                  <option value="תוכן">תוכן</option>
                  <option value="ספק חיצוני">ספק חיצוני</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs"
                >
                  {saving ? "שומר..." : editingId ? "עדכן" : "שמור"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary text-xs"
                >
                  ביטול
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b border-stone-100"
              style={{ background: "#F5F0E8" }}
            >
              <th className="text-right px-4 py-3 font-medium text-stone-600">
                שם
              </th>
              <th className="text-right px-4 py-3 font-medium text-stone-600">
                תפקיד
              </th>
              <th className="text-right px-4 py-3 font-medium text-stone-600">
                טלפון
              </th>
              <th className="text-right px-4 py-3 font-medium text-stone-600">
                עלות לי
              </th>
              <th className="text-right px-4 py-3 font-medium text-stone-600">
                עלות ללקוח
              </th>
              <th className="text-right px-4 py-3 font-medium text-stone-600">
                סוג
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-stone-400">
                  טוען...
                </td>
              </tr>
            )}
            {!loading && suppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-stone-400">
                  אין ספקים
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-800">
                  {s.name}
                </td>
                <td className="px-4 py-3 text-stone-500">{s.role || "—"}</td>
                <td className="px-4 py-3 text-stone-500">{s.phone || "—"}</td>
                <td className="px-4 py-3 text-stone-600">
                  {s.my_rate || s.default_rate
                    ? `₪${parseFloat(s.my_rate || s.default_rate).toLocaleString("he-IL")}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {s.client_rate
                    ? `₪${parseFloat(s.client_rate).toLocaleString("he-IL")}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {s.type || "תוכן"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => startEdit(s)}
                      className="btn-secondary text-xs"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="btn-danger text-xs"
                    >
                      מחק
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
