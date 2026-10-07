import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import path from "path";

const HIBA_EVENTS = ["הופעה להקת היבא", "הופעה להקת היבא דואו"];

function getDocTitle(eventType, docType) {
  return `רוח צפת | ${eventType} — ${docType}`;
}

Font.register({
  family: "Hebrew",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/RubikFull-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "public/fonts/RubikFull-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

function getColors(eventType) {
  if (HIBA_EVENTS.includes(eventType)) {
    return {
      accent: "#C4552A",
      accentLt: "#F3EDE4",
      bg: "#F3EDE4",
      stone: "#C9C1B3",
      text: "#1E1E1E",
      muted: "#5B544B",
      border: "#C9C1B3",
      headerBg: "#C4552A",
      badgeBg: "#5B544B",
      badgeTxt: "#F3EDE4",
      divider: "#C9C1B3",
    };
  }
  return {
    accent: "#2C4A7C",
    accentLt: "#eef3fa",
    bg: "#F5F0E8",
    stone: "#D4C5AD",
    text: "#2A1F14",
    muted: "#755F4D",
    border: "#adc5e5",
    headerBg: "#2C4A7C",
    badgeBg: "#2C4A7C",
    badgeTxt: "#ffffff",
    divider: "#B8860B",
  };
}

function getCancelTerms(eventType) {
  if (HIBA_EVENTS.includes(eventType)) {
    return [
      "עד 60 יום לפני האירוע — ללא תשלום",
      "בין 60 ל-30 יום לפני — 30 אחוז מסכום העסקה",
      "בין 30 ל-14 יום לפני — 50 אחוז מסכום העסקה",
      "פחות מ-14 יום ועד לאירוע — 100 אחוז מסכום העסקה",
    ];
  }
  return [
    "עד 21 ימי עסקים לפני האירוע - ללא תשלום",
    "בין 21 ל-14 ימי עסקים - 50 אחוז מסכום העסקה",
    "פחות מ-14 ימי עסקים ועד האירוע - 100 אחוז מהעסקה",
  ];
}

export function TourPdfDocument({
  tour,
  type = "order",
  signatureBuffer = null,
  logoBuffer = null,
  expenses = [],
}) {
  const C = getColors(tour.event_type);
  const isOrder = type === "order";
  const isSigned = !!signatureBuffer;
  const isHiba = HIBA_EVENTS.includes(tour.event_type);
  const docType = !isOrder ? "פרטי חיוב" : isSigned ? "הזמנה חתומה" : "הזמנה";
  const title = getDocTitle(tour.event_type, docType);

  const s = StyleSheet.create({
    page: { fontFamily: "Hebrew", backgroundColor: "#fff", padding: 0 },
    header: {
      backgroundColor: "#ffffff",
      paddingHorizontal: 36,
      paddingVertical: 16,
      borderBottomWidth: 2,
      borderBottomColor: C.accent,
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      alignItems: "center",
    },
    hLogo: { width: 110, height: 44, objectFit: "contain" },
    hTitle: {
      color: C.accent,
      fontSize: 18,
      fontWeight: 700,
      textAlign: "right",
    },
    hSub: { color: C.muted, fontSize: 9, marginTop: 3, textAlign: "right" },
    hBadge: {
      backgroundColor: C.accent,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 4,
    },
    hBadgeTxt: { color: C.badgeTxt, fontSize: 8, fontWeight: 700 },
    divBar: { height: 3, backgroundColor: C.divider },
    body: { paddingHorizontal: 36, paddingTop: 16, paddingBottom: 56 },
    secTitle: {
      fontSize: 10,
      fontWeight: 700,
      color: C.accent,
      marginBottom: 6,
      paddingBottom: 4,
      borderBottomWidth: 1.5,
      borderBottomColor: C.accentLt,
      textAlign: "right",
    },
    row: {
      flexDirection: "row-reverse",
      borderBottomWidth: 1,
      borderBottomColor: "#f1ebe0",
      paddingVertical: 5,
    },
    rowAlt: { backgroundColor: C.bg },
    lCell: {
      width: "35%",
      fontSize: 8,
      color: C.muted,
      textAlign: "right",
      paddingRight: 3,
    },
    vCell: {
      width: "65%",
      fontSize: 8.5,
      color: C.text,
      fontWeight: 700,
      textAlign: "right",
    },
    finBox: {
      backgroundColor: C.accentLt,
      borderRadius: 5,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    fRow: {
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    fLabel: { fontSize: 8, color: C.muted, textAlign: "right" },
    fValue: { fontSize: 8, fontWeight: 700, color: C.accent },
    infoBox: {
      borderWidth: 1,
      borderColor: C.stone,
      borderRadius: 5,
      padding: 10,
      marginBottom: 8,
      backgroundColor: C.bg,
    },
    iTitle: {
      fontSize: 8,
      fontWeight: 700,
      color: C.accent,
      marginBottom: 6,
      textAlign: "right",
    },
    iLine: {
      fontSize: 7.5,
      color: C.muted,
      textAlign: "right",
      marginBottom: 3,
    },
    signBox: {
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 5,
      padding: 10,
      marginBottom: 8,
      backgroundColor: "#f8f8f6",
    },
    signRow: {
      flexDirection: "row-reverse",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    signText: {
      fontSize: 8,
      color: C.text,
      textAlign: "right",
      flex: 1,
      paddingLeft: 16,
      lineHeight: 1.6,
    },
    signNote: { fontSize: 7, color: C.muted, marginTop: 6, textAlign: "right" },
    signImg: {
      width: 130,
      height: 55,
      objectFit: "contain",
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 3,
    },
    signEmpty: {
      fontSize: 8,
      color: C.text,
      textAlign: "right",
      lineHeight: 2,
    },
    footer: {
      backgroundColor: "#ffffff",
      borderTopWidth: 1,
      borderTopColor: C.stone,
      paddingHorizontal: 36,
      paddingVertical: 10,
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      alignItems: "center",
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    ftrTxt: { color: C.muted, fontSize: 7 },
    ftrName: { color: C.accent, fontSize: 7, fontWeight: 700 },
  });

  const rows = [
    { label: "שם המזמין", value: tour.client_name },
    { label: "ח.פ / מס עמותה", value: tour.client_id },
    { label: "שם איש קשר", value: tour.contact_name },
    { label: "טלפון", value: tour.contact_phone },
    { label: "מייל", value: tour.contact_email },
    { label: "תיאור משתתפים", value: tour.participants_desc },
    { label: "מספר משתתפים", value: tour.num_participants },
    { label: "סוג האירוע", value: tour.event_type },
    { label: "הערות", value: tour.notes },
    { label: "תאריך", value: tour.date },
    { label: "שעה", value: tour.time },
    { label: "מיקום", value: tour.location },
    { label: "אופן תשלום", value: tour.payment_method },
    {
      label: 'סה"כ תשלום',
      value: tour.total_amount
        ? parseFloat(tour.total_amount).toLocaleString("he-IL") + ' ש"ח'
        : "",
    },
  ].filter(
    (r) => r.value && String(r.value).trim() !== "" && String(r.value) !== "0",
  );

  const cancelTerms = getCancelTerms(tour.event_type);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            {logoBuffer && (
              <Image
                src={{ data: logoBuffer, format: "png" }}
                style={s.hLogo}
              />
            )}
            {!logoBuffer && <Text style={s.hTitle}>רוח צפת</Text>}
          </View>
          <View style={s.hBadge}>
            <Text style={s.hBadgeTxt}>{title}</Text>
          </View>
        </View>
        <View style={s.divBar} />

        <View style={s.body}>
          <Text style={s.secTitle}>פרטי ההזמנה</Text>
          <View style={{ marginBottom: 12 }}>
            {rows.map((row, idx) => (
              <View key={idx} style={[s.row, idx % 2 === 1 ? s.rowAlt : {}]}>
                <Text style={s.lCell}>{row.label}</Text>
                <Text style={s.vCell}>{String(row.value)}</Text>
              </View>
            ))}
          </View>

          <Text style={s.secTitle}>פרטי תשלום</Text>
          <View style={s.finBox}>
            <View style={s.fRow}>
              <Text style={s.fLabel}>סה"כ לתשלום</Text>
              <Text style={s.fValue}>
                {parseFloat(tour.total_amount || 0).toLocaleString("he-IL")} ש"ח
              </Text>
            </View>
          </View>

          {isOrder && (
            <View style={s.infoBox}>
              <Text style={s.iTitle}>תנאי ביטול (למעט כח עליון)</Text>
              {cancelTerms.map((line, i) => (
                <Text key={i} style={s.iLine}>
                  {line}
                </Text>
              ))}
            </View>
          )}

          <View style={s.infoBox}>
            <Text style={s.iTitle}>פרטי תשלום</Text>
            <Text style={s.iLine}>עד שוטף +30</Text>
            <Text style={s.iLine}>שיק לפקודת רוח צפת</Text>
            <Text style={s.iLine}>
              העברה בנקאית - בנק מזרחי סניף 562 חשבון 129637
            </Text>
          </View>

          {isOrder && (
            <View style={s.signBox}>
              <Text style={s.iTitle}>אישור הזמנה</Text>
              {isSigned ? (
                <View style={s.signRow}>
                  <View style={{ flex: 1, paddingLeft: 16 }}>
                    <Text style={s.signText}>
                      קראתי את פרטי ההזמנה ואני מאשר/ת אותה בחתימתי
                    </Text>
                    <Text style={s.signNote}>נחתם דיגיטלית</Text>
                  </View>
                  <Image
                    src={{ data: signatureBuffer, format: "png" }}
                    style={s.signImg}
                  />
                </View>
              ) : (
                <View>
                  <Text style={s.signEmpty}>
                    קראתי את פרטי ההזמנה ואני מאשר/ת אותה בחתימתי
                  </Text>
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      marginTop: 16,
                      gap: 40,
                    }}
                  >
                    <Text style={{ fontSize: 8, color: C.muted }}>
                      שם: ___________________
                    </Text>
                    <Text style={{ fontSize: 8, color: C.muted }}>
                      חתימה: ___________________
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.ftrTxt}>miel1983@gmail.com</Text>
          <Text style={s.ftrName}>רוח צפת</Text>
        </View>
      </Page>
    </Document>
  );
}
