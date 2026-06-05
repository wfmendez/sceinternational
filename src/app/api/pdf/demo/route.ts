import {
  renderBudgetToBuffer,
  type BudgetDocLineItem,
  type BudgetDocumentData,
} from "@/lib/pdf/budget-document";

// @react-pdf/renderer requiere el runtime de Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Datos de MUESTRA (se reemplazarán por los reales del presupuesto). Los
// precios ya son precios al cliente (con margen incluido); el PDF nunca expone
// el costo base ni el porcentaje de margen.
function buildSampleData(): BudgetDocumentData {
  const rawItems: Omit<BudgetDocLineItem, "total">[] = [
    {
      description: "Demolición y retiro de escombros — área de cocina",
      quantity: 1,
      unit: "Servicio",
      unitPrice: 850,
    },
    {
      description: "Remodelación integral de cocina (obra civil y acabados)",
      quantity: 1,
      unit: "Proyecto",
      unitPrice: 6400,
    },
    {
      description: "Impermeabilización de terraza (manto asfáltico)",
      quantity: 75,
      unit: "m²",
      unitPrice: 28,
    },
    {
      description: "Diseño y siembra de jardín ornamental",
      quantity: 120,
      unit: "m²",
      unitPrice: 22,
    },
    {
      description: "Sistema de riego automatizado por goteo",
      quantity: 1,
      unit: "Instalación",
      unitPrice: 1450,
    },
    {
      description: "Mantenimiento de jardinería (plan mensual)",
      quantity: 3,
      unit: "Mes",
      unitPrice: 180,
    },
  ];

  const items: BudgetDocLineItem[] = rawItems.map((it) => ({
    ...it,
    total: Math.round(it.quantity * it.unitPrice * 100) / 100,
  }));

  const subtotal = items.reduce((sum, it) => sum + it.total, 0);

  return {
    company: {
      name: "SCE International",
      tagline: "Construcción · Remodelación · Jardinería",
      rif: "J-12345678-9",
      address: "Av. Principal, Caracas, Venezuela",
      email: "presupuestos@sceinternational.com",
      phone: "+58 212 555 0000",
    },
    documentCode: "PRE-2026-0001",
    issuedAt: new Date().toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    validityDays: 15,
    client: {
      name: "Residencias El Hatillo, C.A.",
      contact: "Ing. María Pérez",
      email: "compras@residencias-elhatillo.com",
      address: "Urb. La Lagunita, Caracas",
    },
    title: "Remodelación de cocina, impermeabilización y paisajismo",
    currency: "USD",
    items,
    subtotal,
    total: subtotal,
    notes:
      "Precios expresados en dólares (USD). No incluye permisos municipales. " +
      "Anticipo del 50% para inicio de obra; saldo contra entrega. " +
      "Validez de la oferta: 15 días.",
  };
}

export async function GET() {
  const buffer = await renderBudgetToBuffer(buildSampleData());

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="presupuesto-demo.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
