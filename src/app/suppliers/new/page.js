"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSupplierPage() {
  const router = useRouter();
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
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/suppliers");
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/suppliers"
          className="text-stone-400 hover:text-stone-600 text-sm"
        >
          ← חזרה
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">ספק חדש</h1>
      </div>
      <div className="card p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <input className="input" value={form.role} onChange={set("role")} />
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
            <label className="label">מייל</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <label className="label">סוג</label>
            <select className="input" value={form.type} onChange={set("type")}>
              <option value="תוכן">תוכן</option>
              <option value="ספק חיצוני">ספק חיצוני</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              ביטול
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "שומר..." : "שמור"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
