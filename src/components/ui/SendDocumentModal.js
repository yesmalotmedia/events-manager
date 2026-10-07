"use client";
import { useState } from "react";

export default function SendDocumentModal({ tour, onClose, onSent }) {
  const [step, setStep] = useState("preview");
  const [error, setError] = useState("");
  const [signUrl, setSignUrl] = useState("");

  const toClient = tour.contact_email || "";
  const toMe = "miel1983@gmail.com";

  const handleSend = async () => {
    setStep("sending");
    try {
      // 1. Create sign link
      const signRes = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId: tour.id }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) throw new Error(signData.error);
      const url = signData.signUrl;
      setSignUrl(url);

      // 2. Send sign link ONLY to client (no PDF)
      if (toClient) {
        const clientRes = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tourId: tour.id,
            type: "order",
            toClient,
            toMe: "",
            subject: `רוח צפת | ${tour.event_type} — הזמנה לחתימה`,
            message: `שלום,\n\nלאישור וחתימה על ההזמנה לחץ/י על הקישור:\n${url}\n\nבברכה,\nרוח צפת`,
            skipPdf: true,
          }),
        });
        const clientData = await clientRes.json();
        if (!clientRes.ok) throw new Error(clientData.error);
      }

      // PDF to me disabled temporarily

      // 4. Update tour status
      await fetch(`/api/tours/${tour.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "נשלחה הזמנה" }),
      });

      setStep("done");
      if (onSent) onSent();
    } catch (e) {
      setError(e.message);
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 text-white" style={{ background: "#2C4A7C" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">שליחת הזמנה</h2>
              <p className="text-xs mt-0.5" style={{ color: "#B8860B" }}>
                {tour.client_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === "preview" && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">הפעולות הבאות יתבצעו:</p>
              <div className="space-y-2">
                {[
                  { icon: "✍️", text: "קישור לחתימה ישלח ללקוח" },
                  { icon: "📄", text: "PDF של ההזמנה ישלח אליך בלבד" },
                  { icon: "📊", text: 'סטטוס יתעדכן ל"נשלחה הזמנה"' },
                ].map(({ icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 bg-stone-50 rounded-lg px-4 py-3 text-sm text-stone-700"
                  >
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div
                className="rounded-lg px-4 py-3 space-y-1 text-sm"
                style={{ background: "#eef3fa" }}
              >
                {toClient ? (
                  <div className="flex justify-between">
                    <span className="text-stone-500">קישור ללקוח</span>
                    <span className="font-medium" style={{ color: "#2C4A7C" }}>
                      {toClient}
                    </span>
                  </div>
                ) : (
                  <div className="text-amber-700 text-sm">
                    ⚠️ אין מייל ללקוח — קישור לא ישלח
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">PDF אליי</span>
                  <span className="font-medium" style={{ color: "#2C4A7C" }}>
                    {toMe}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSend}
                  className="flex-1 py-3 rounded-lg font-medium text-sm text-white"
                  style={{ background: "#2C4A7C" }}
                >
                  שלח הזמנה
                </button>
                <button onClick={onClose} className="btn-secondary">
                  ביטול
                </button>
              </div>
            </div>
          )}

          {step === "sending" && (
            <div className="py-8 text-center space-y-3">
              <div className="text-3xl animate-pulse">📤</div>
              <p className="text-stone-600 text-sm">שולח הזמנה...</p>
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center space-y-4">
              <div className="text-4xl">✅</div>
              <div>
                <div className="font-bold text-lg" style={{ color: "#2C4A7C" }}>
                  ההזמנה נשלחה!
                </div>
                <p className="text-stone-500 text-sm mt-1">
                  קישור חתימה נשלח ללקוח, PDF נשלח אליך
                </p>
              </div>
              {signUrl && (
                <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-500 break-all">
                  {signUrl}
                </div>
              )}
              <button onClick={onClose} className="btn-primary">
                סגור
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="py-6 text-center space-y-4">
              <div className="text-4xl">❌</div>
              <p className="text-red-600 text-sm">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setStep("preview")}
                  className="btn-secondary"
                >
                  נסה שוב
                </button>
                <button onClick={onClose} className="btn-danger">
                  סגור
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
