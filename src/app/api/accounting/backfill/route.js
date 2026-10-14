import { readCsv } from "@/lib/csv";
import { updatePdfLink } from "@/lib/sheets";
import { savePdf } from "@/lib/pdfStorage";
import { renderToBuffer } from "@react-pdf/renderer";
import { TourPdfDocument } from "@/components/ui/TourPdf";
import { getLogoBuffer } from "@/lib/logoData";
import { createElement } from "react";

export const dynamic = "force-dynamic";

// One-off utility for accounting-sheet rows created before the self-hosted
// PDF link existed (column K): regenerates and saves the PDF under the
// row's existing requestId and writes the link, without touching anything
// else the normal /api/accounting flow does (no new sheet row, no
// duplicate transaction, no re-email, no status change).
export async function POST(request) {
  try {
    const { tourId, requestId } = await request.json();
    if (!tourId || !requestId) {
      return Response.json({ error: "חסר tourId או requestId" }, { status: 400 });
    }

    const tours = readCsv("tours.csv");
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return Response.json({ error: "סיור לא נמצא" }, { status: 404 });
    const allExpenses = readCsv("expenses.csv");
    const tourExpenses = allExpenses.filter((e) => e.tour_id === tourId);

    const logoBuffer = getLogoBuffer();
    const pdfBuffer = await renderToBuffer(
      createElement(TourPdfDocument, {
        tour,
        type: "order",
        logoBuffer,
        expenses: tourExpenses,
      }),
    );

    savePdf(requestId, pdfBuffer);
    const docUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/doc/${requestId}`;
    await updatePdfLink(
      process.env.ACCOUNTING_SPREADSHEET_ID,
      process.env.ACCOUNTING_SHEET_GID,
      requestId,
      docUrl,
    );

    return Response.json({ success: true, url: docUrl });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
