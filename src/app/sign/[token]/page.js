"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getTheme, isHiba } from "@/lib/theme";

export default function SignPage() {
  const { token } = useParams();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [status, setStatus] = useState("idle");
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const lastPos = useRef(null);

  useEffect(() => {
    fetch(`/api/sign/info?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErrorMsg(data.error);
        else setTour(data.tour);
        setLoading(false);
      });
  }, [token]);

  const theme = tour ? getTheme(tour.event_type) : getTheme("");
  const hiba = tour ? isHiba(tour.event_type) : false;

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches)
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!hasSignature) return;
    setStatus("submitting");
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL("image/png");
      const res = await fetch("/api/sign/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signatureDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("done");
    } catch (e) {
      setErrorMsg(e.message);
      setStatus("error");
    }
  };

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.bg }}
      >
        <div className="text-sm" style={{ color: theme.textMuted }}>
          טוען...
        </div>
      </div>
    );

  if (status === "done")
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: theme.bg }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="font-bold text-xl" style={{ color: theme.accent }}>
            ההזמנה נחתמה!
          </h2>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            העתק ישלח אליך במייל בקרוב.
          </p>
        </div>
      </div>
    );

  if (errorMsg)
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: theme.bg }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-sm text-red-600">{errorMsg}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: theme.bg }}>
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div
          className="rounded-xl overflow-hidden shadow-sm border"
          style={{ borderColor: theme.stone }}
        >
          <div className="px-6 py-5 text-center bg-white">
            <div className="font-bold text-xl" style={{ color: theme.accent }}>
              רוח צפת
            </div>
            {tour && (
              <div className="text-sm mt-1" style={{ color: theme.textMuted }}>
                {tour.event_type} — הזמנה לחתימה
              </div>
            )}
          </div>
          <div className="h-1" style={{ background: theme.accent }} />
        </div>

        {/* Tour details */}
        {tour && (
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 text-sm">
            <h3
              className="font-semibold text-sm mb-3"
              style={{ color: theme.accent }}
            >
              פרטי ההזמנה
            </h3>
            {[
              ["שם המזמין", tour.client_name],
              ["סוג האירוע", tour.event_type],
              ["תאריך", tour.date],
              ["שעה", tour.time],
              ["מיקום", tour.location],
              [
                'סה"כ לתשלום',
                tour.total_amount
                  ? parseFloat(tour.total_amount).toLocaleString("he-IL") + " ₪"
                  : "",
              ],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b pb-2"
                  style={{ borderColor: theme.bgLight }}
                >
                  <span style={{ color: theme.textMuted }}>{label}</span>
                  <span className="font-medium" style={{ color: theme.text }}>
                    {value}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Signature pad */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-semibold text-sm"
              style={{ color: theme.accent }}
            >
              חתימה דיגיטלית
            </h3>
            {hasSignature && (
              <button
                onClick={clearCanvas}
                className="text-xs"
                style={{ color: theme.textMuted }}
              >
                נקה
              </button>
            )}
          </div>
          <div
            className="border-2 border-dashed rounded-lg overflow-hidden"
            style={{
              borderColor: hasSignature ? theme.accent : theme.stone,
              background: "#FAFAF8",
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={180}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <p
            className="text-xs mt-2 text-center"
            style={{ color: theme.stone }}
          >
            {hasSignature ? "חתימה התקבלה" : "חתום/י כאן עם העכבר או האצבע"}
          </p>
        </div>

        {/* Cancel terms */}
        <div
          className="bg-white rounded-xl shadow-sm p-4 text-xs"
          style={{ color: theme.textMuted }}
        >
          {hiba ? (
            <>
              <strong style={{ color: theme.accent }}>תנאי ביטול:</strong>
              <span>
                {" "}
                עד 60 יום — ללא תשלום | 60–30 יום — 30% | 30–14 יום — 50% | פחות
                מ-14 יום — 100%
              </span>
            </>
          ) : (
            <>
              <strong style={{ color: theme.accent }}>תנאי ביטול:</strong>
              <span>
                {" "}
                עד 21 ימי עסקים — ללא תשלום | 21–14 ימים — 50% | פחות מ-14 ימים
                — 100%
              </span>
            </>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!hasSignature || status === "submitting"}
          className="w-full py-4 rounded-xl font-bold text-white transition-all"
          style={{
            background: hasSignature ? theme.accent : theme.stone,
            cursor: hasSignature ? "pointer" : "not-allowed",
          }}
        >
          {status === "submitting"
            ? "שולח..."
            : "אני מאשר/ת את ההזמנה ואת חתימתי"}
        </button>
      </div>
    </div>
  );
}
