import { readCsv, writeCsv, getNextId } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const suppliers = readCsv("suppliers.csv");
    return Response.json(suppliers);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const suppliers = readCsv("suppliers.csv");
    const newSupplier = {
      id: getNextId(suppliers),
      name: body.name || "",
      type: body.type || "תוכן",
      role: body.role || "",
      phone: body.phone || "",
      email: body.email || "",
      default_rate: body.my_rate || body.default_rate || "",
      my_rate: body.my_rate || body.default_rate || "",
      client_rate: body.client_rate || body.my_rate || body.default_rate || "",
    };
    suppliers.push(newSupplier);
    writeCsv("suppliers.csv", suppliers);
    return Response.json(newSupplier, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
