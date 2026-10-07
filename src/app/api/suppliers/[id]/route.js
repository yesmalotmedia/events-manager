import { readCsv, writeCsv } from "@/lib/csv";

export async function PUT(request, { params }) {
  const body = await request.json();
  const suppliers = readCsv("suppliers.csv");
  const idx = suppliers.findIndex((s) => s.id === params.id);
  if (idx === -1) return Response.json({ error: "לא נמצא" }, { status: 404 });
  suppliers[idx] = {
    ...suppliers[idx],
    ...body,
    id: params.id,
    default_rate:
      body.my_rate || body.default_rate || suppliers[idx].default_rate,
    my_rate: body.my_rate || suppliers[idx].my_rate || "",
    client_rate: body.client_rate || suppliers[idx].client_rate || "",
  };
  writeCsv("suppliers.csv", suppliers);
  return Response.json(suppliers[idx]);
}

export async function DELETE(request, { params }) {
  const suppliers = readCsv("suppliers.csv");
  writeCsv(
    "suppliers.csv",
    suppliers.filter((s) => s.id !== params.id),
  );
  return Response.json({ success: true });
}
