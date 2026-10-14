import { readPdf } from "@/lib/pdfStorage";

export const dynamic = "force-dynamic";

// Public by design (not in middleware's matcher) — this is the link that
// lands in column K of the accounting sheet, opened by whoever handles
// bookkeeping, who isn't a logged-in user of this app.
export async function GET(request, { params }) {
  const reqId = params.reqId || "";
  // Request IDs are always our own "R<number>" format — reject anything
  // else outright rather than touching the filesystem with it.
  if (!/^[A-Za-z0-9]+$/.test(reqId)) {
    return new Response("Not found", { status: 404 });
  }
  const buffer = readPdf(reqId);
  if (!buffer) return new Response("Not found", { status: 404 });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${reqId}.pdf"`,
    },
  });
}
