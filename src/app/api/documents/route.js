import { readCsv } from "@/lib/csv";
import { renderToBuffer } from "@react-pdf/renderer";
import { TourPdfDocument } from "@/components/ui/TourPdf";
import { getLogoBuffer } from "@/lib/logoData";
import { createElement } from "react";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get("tourId");
    const type = searchParams.get("type") || "order";

    if (!tourId) return Response.json({ error: "חסר tourId" }, { status: 400 });

    const tours = readCsv("tours.csv");
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return Response.json({ error: "סיור לא נמצא" }, { status: 404 });

    const logoBuffer = getLogoBuffer();

    const buffer = await renderToBuffer(
      createElement(TourPdfDocument, { tour, type, logoBuffer }),
    );

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="tour-${tourId}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
