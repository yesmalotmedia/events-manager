"use client";
import { useState } from "react";
import { getTheme, isHiba, HIBA_EVENTS } from "@/lib/theme";

const ALL_EVENT_TYPES = [
  "סיור מוזיקלי",
  "הופעה להקת היבא",
  "הופעה להקת היבא דואו",
  "הופעה להקת רוח צפת",
  "מופע נודד - סיור מוזיקלי עם מיאל בליווי נגני רחוב",
  "חגיגת בר מצווה עם מיאל ולהקת רוח צפת",
  "אחר",
];

export default function BookPage() {
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
  });
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");

  const theme = getTheme(form.event_type);
  const hiba = isHiba(form.event_type);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep("submitting");
    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: "ממתין",
          source: "client_form",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");

      await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.client_name,
          client_id: form.client_id,
          contact_name: form.contact_name,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          participants_desc: form.participants_desc,
        }),
      });

      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: data.id,
          type: "internal",
          toClient: "",
          toMe: "miel1983@gmail.com",
          subject: `פנייה חדשה מ-${form.client_name}`,
          message: `התקבלה פנייה חדשה דרך הטופס מ-${form.client_name}.\n\nסוג אירוע: ${form.event_type}\nתאריך: ${form.date}\nמיקום: ${form.location}\nטלפון: ${form.contact_phone}`,
        }),
      });

      setStep("done");
    } catch (e) {
      setError(e.message);
      setStep("error");
    }
  };

  const inputStyle = {
    width: "100%",
    border: `1px solid ${theme.stone}`,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    background: "white",
    outline: "none",
    fontFamily: "inherit",
    direction: "rtl",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "500",
    marginBottom: "4px",
    color: theme.textMuted,
  };

  if (step === "done")
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: theme.bg }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">🎵</div>
          <h2 className="text-2xl font-bold" style={{ color: theme.accent }}>
            תודה!
          </h2>
          <p style={{ color: theme.textMuted }}>
            הפרטים התקבלו. נחזור אליך בהקדם.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: theme.bg }}>
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <div className="px-8 py-6 text-center bg-white">
            <div className="text-2xl font-bold" style={{ color: theme.accent }}>
              רוח צפת
            </div>
            {form.event_type && (
              <div className="text-sm mt-1" style={{ color: theme.textMuted }}>
                {form.event_type}
              </div>
            )}
          </div>
          <div className="h-1" style={{ background: theme.accent }} />
          <div className="px-8 py-5 bg-white text-center">
            <h1 className="font-bold text-lg" style={{ color: theme.accent }}>
              בקשת הזמנה
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
              מלא/י את הפרטים ונחזור אליך בהקדם
            </p>
          </div>
        </div>

        {step === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error} —{" "}
            <button onClick={() => setStep("form")} className="underline">
              נסה שוב
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* סוג האירוע - ראשון כדי לקבוע theme */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2
              className="font-semibold text-sm pb-2 border-b"
              style={{ color: theme.accent, borderColor: theme.bgLight }}
            >
              סוג האירוע
            </h2>
            <div>
              <label style={labelStyle}>סוג האירוע *</label>
              <select
                style={inputStyle}
                value={form.event_type}
                onChange={set("event_type")}
                required
              >
                <option value="">בחר...</option>
                {ALL_EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* פרטי מזמין */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2
              className="font-semibold text-sm pb-2 border-b"
              style={{ color: theme.accent, borderColor: theme.bgLight }}
            >
              פרטי המזמין
            </h2>
            <div>
              <label style={labelStyle}>שם המזמין / הארגון *</label>
              <input
                style={inputStyle}
                value={form.client_name}
                onChange={set("client_name")}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>ח.פ / מס׳ עמותה / קוד מוסד</label>
              <input
                style={inputStyle}
                value={form.client_id}
                onChange={set("client_id")}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>שם איש קשר *</label>
                <input
                  style={inputStyle}
                  value={form.contact_name}
                  onChange={set("contact_name")}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>טלפון *</label>
                <input
                  style={inputStyle}
                  type="tel"
                  value={form.contact_phone}
                  onChange={set("contact_phone")}
                  required
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>מייל</label>
              <input
                style={inputStyle}
                type="email"
                value={form.contact_email}
                onChange={set("contact_email")}
              />
            </div>
          </div>

          {/* פרטי האירוע */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2
              className="font-semibold text-sm pb-2 border-b"
              style={{ color: theme.accent, borderColor: theme.bgLight }}
            >
              פרטי האירוע
            </h2>
            <div>
              <label style={labelStyle}>מיקום *</label>
              <input
                style={inputStyle}
                value={form.location}
                onChange={set("location")}
                required
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>תאריך מועדף *</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={
                    form.date ? form.date.split("/").reverse().join("-") : ""
                  }
                  onChange={(e) => {
                    const d = e.target.value.split("-").reverse().join("/");
                    setForm((f) => ({ ...f, date: d }));
                  }}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>שעה</label>
                <input
                  style={inputStyle}
                  type="time"
                  value={form.time}
                  onChange={set("time")}
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>מספר משתתפים</label>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.num_participants}
                  onChange={set("num_participants")}
                />
              </div>
              <div>
                <label style={labelStyle}>תיאור המשתתפים</label>
                <input
                  style={inputStyle}
                  value={form.participants_desc}
                  onChange={set("participants_desc")}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>הערות / בקשות מיוחדות</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical" }}
                rows={3}
                value={form.notes}
                onChange={set("notes")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={step === "submitting"}
            className="w-full py-4 rounded-xl font-bold text-white text-base transition-all"
            style={{
              background: step === "submitting" ? theme.stone : theme.accent,
            }}
          >
            {step === "submitting" ? "שולח..." : "שלח בקשת הזמנה"}
          </button>

          <p className="text-center text-xs" style={{ color: theme.stone }}>
            לאחר קבלת הפרטים נחזור אליך לאישור ותיאום סופי
          </p>
        </form>
      </div>
    </div>
  );
}
