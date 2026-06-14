import type { SupabaseClient } from "@supabase/supabase-js";

import type { Currency } from "@/lib/domain/currency";
import type { Database } from "@/lib/supabase/database.types";
import {
  renderBudgetToBuffer,
  type BudgetDocLineItem,
  type BudgetDocumentData,
} from "./budget-document";

/**
 * Construye y renderiza el PDF de un presupuesto a partir de su ID.
 * Usa el margen de `budget_pricing` si existe; si no, muestra los costos base
 * (sin margen). El PDF NUNCA expone el costo base ni el porcentaje de margen.
 *
 * Requiere runtime Node.js (usa @react-pdf/renderer).
 */
export async function renderBudgetPdfById(
  supabase: SupabaseClient<Database>,
  budgetId: string,
): Promise<{ buffer: Buffer; filename: string } | null> {
  const { data: budget } = await supabase
    .from("budgets")
    .select(
      `id, code, title, description, currency, base_total, created_at,
       client:clients!budgets_client_id_fkey(name, contact_email),
       items:budget_items(description, quantity, unit_cost, unit, line_total, sort_order),
       pricing:budget_pricing(client_total, margin_pct)`,
    )
    .eq("id", budgetId)
    .single();

  if (!budget) return null;

  const currency = budget.currency as Currency;

  // budget_pricing se devuelve como array (relación 1→many desde budgets)
  const pricingArr = budget.pricing as
    | { client_total: number; margin_pct: number }[]
    | null;
  const pricing = pricingArr?.[0] ?? null;
  const clientTotal = pricing?.client_total ?? budget.base_total;

  // Factor de margen para distribuirlo proporcionalmente entre las partidas
  const factor = budget.base_total > 0 ? clientTotal / budget.base_total : 1;

  const sortedItems = [...(budget.items ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const items: BudgetDocLineItem[] = sortedItems.map((item) => {
    const unitPrice = Math.round(item.unit_cost * factor * 100) / 100;
    return {
      description: item.description,
      quantity: item.quantity,
      unit: item.unit ?? undefined,
      unitPrice,
      total: Math.round(item.quantity * unitPrice * 100) / 100,
    };
  });

  // clients es join muchos→uno: Supabase devuelve objeto, no array
  const clientRaw = budget.client as
    | { name: string; contact_email?: string | null }
    | null;

  const data: BudgetDocumentData = {
    company: {
      name: "SCE International",
      tagline: "Construcción · Remodelación · Jardinería",
      rif: process.env.COMPANY_RIF ?? undefined,
      email:
        process.env.COMPANY_EMAIL ?? "presupuestos@sceinternational.com",
      phone: process.env.COMPANY_PHONE ?? undefined,
    },
    documentCode: budget.code ?? budget.id.slice(0, 8).toUpperCase(),
    issuedAt: new Date(budget.created_at).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    validityDays: 15,
    client: {
      name: clientRaw?.name ?? "Cliente",
      email: clientRaw?.contact_email ?? undefined,
    },
    title: budget.title,
    currency,
    items,
    subtotal: clientTotal,
    total: clientTotal,
    notes: budget.description ?? undefined,
  };

  const buffer = await renderBudgetToBuffer(data);
  const filename = `presupuesto-${budget.code ?? budgetId}.pdf`;
  return { buffer, filename };
}
