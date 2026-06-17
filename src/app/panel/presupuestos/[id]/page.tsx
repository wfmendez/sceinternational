import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/badge";
import TransitionActions from "@/components/budgets/transition-actions";
import BalanceCard from "@/components/expenses/balance-card";
import ExpenseForm from "@/components/expenses/expense-form";
import ExpenseList from "@/components/expenses/expense-list";
import {
  BUDGET_STATUS_LABELS,
  type BudgetStatus,
} from "@/lib/domain/budget-status";
import type { Currency } from "@/lib/domain/currency";
import { isPrivileged, type UserRole } from "@/lib/domain/roles";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

/** Estados donde ya existe `budget_pricing` con datos reales. */
const PRICED_STATUSES: BudgetStatus[] = [
  "validated_with_margin",
  "pending_manager_approval",
  "returned_by_manager",
  "approved_sent_to_client",
  "client_approved",
  "in_execution",
  "closed",
];

/** Admin/manager pueden descargar PDF desde revisión (aunque no haya margen aún). */
const PDF_VISIBLE_STATUSES: BudgetStatus[] = [
  "pending_admin_review",
  "returned_to_worker",
  ...PRICED_STATUSES,
];

/** Estados donde aplica mostrar gastos y balance. */
const EXECUTION_STATUSES: BudgetStatus[] = ["in_execution", "closed"];

export const metadata: Metadata = { title: "Detalle del presupuesto" };

const EVENT_LABELS: Record<string, string> = {
  status_change: "Cambio de estado",
  margin_applied: "Margen aplicado",
  expense_logged: "Gasto registrado",
  comment: "Comentario",
};

export default async function PresupuestoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: budget } = await supabase
    .from("budgets")
    .select(
      `
      id, code, title, status, currency, base_total, description,
      created_at, submitted_at, validated_at, created_by,
      creator:profiles!budgets_created_by_fkey(full_name),
      client:clients!budgets_client_id_fkey(name, contact_email),
      items:budget_items(id, description, quantity, unit_cost, unit, line_total, sort_order),
      events:budget_events(id, event_type, from_status, to_status, comment, created_at, actor:profiles!budget_events_actor_id_fkey(full_name)),
      pricing:budget_pricing(client_total, margin_pct)
    `,
    )
    .eq("id", id)
    .single();

  if (!budget) notFound();

  const items = [...(budget.items ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const events = [...(budget.events ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const status = budget.status as BudgetStatus;
  const currency = budget.currency as Currency;
  const isEditable =
    (status === "draft" || status === "returned_to_worker") &&
    budget.created_by === user.id;

  const creatorName =
    (budget.creator as { full_name: string } | null)?.full_name ?? "—";
  const clientRaw = budget.client as
    | { name: string; contact_email: string | null }
    | null;
  const clientName = clientRaw?.name ?? null;
  const clientEmail = clientRaw?.contact_email ?? null;

  // Precio al cliente (solo admin/manager, solo cuando existe pricing)
  const pricingArr = budget.pricing as
    | { client_total: number; margin_pct: number }[]
    | null;
  const pricing = pricingArr?.[0] ?? null;
  const showPricing =
    isPrivileged(profile.role as UserRole) &&
    PRICED_STATUSES.includes(status) &&
    pricing !== null;

  const showPdfButton =
    isPrivileged(profile.role as UserRole) &&
    PDF_VISIBLE_STATUSES.includes(status);

  const isInExecution = EXECUTION_STATUSES.includes(status);
  const canRegisterExpense =
    status === "in_execution" && budget.created_by === user.id;

  // Balance y gastos (solo cuando el presupuesto está en ejecución o cerrado)
  const [balanceResult, expensesResult] = isInExecution
    ? await Promise.all([
        supabase
          .from("budget_balances")
          .select("approved_purchase_amount, total_expenses, remaining_amount")
          .eq("budget_id", id)
          .single(),
        supabase
          .from("expenses")
          .select(
            "id, description, amount, invoice_ref, invoice_file_path, note, created_at, creator:profiles!expenses_created_by_fkey(full_name)",
          )
          .eq("budget_id", id)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: null }, { data: [] }];

  const balance = balanceResult.data;
  const rawExpenses = expensesResult.data ?? [];

  // Generar URLs firmadas para facturas adjuntas (expiran en 1h)
  const expensesWithUrls = await Promise.all(
    rawExpenses.map(async (e) => {
      let invoice_url: string | null = null;
      if (e.invoice_file_path) {
        const { data } = await supabase.storage
          .from("invoices")
          .createSignedUrl(e.invoice_file_path, 3600);
        invoice_url = data?.signedUrl ?? null;
      }
      return {
        ...e,
        invoice_url,
        creator_name:
          (e.creator as { full_name: string } | null)?.full_name ?? null,
      };
    }),
  );

  return (
    <div className="p-6 sm:p-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/panel/presupuestos"
          className="hover:text-slate-900 dark:hover:text-white"
        >
          Presupuestos
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">
          {budget.code ?? budget.id.slice(0, 8)}
        </span>
      </nav>

      <div className="max-w-4xl space-y-8">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {budget.code && (
              <p className="mb-1 text-xs font-medium tracking-widest text-slate-400">
                {budget.code}
              </p>
            )}
            <h1 className="text-xl font-semibold tracking-tight">
              {budget.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>Por: {creatorName}</span>
              {clientName && <span>· Cliente: {clientName}</span>}
              <span>
                · Creado:{" "}
                {new Date(budget.created_at).toLocaleDateString("es-VE")}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={status} />
            <div className="flex gap-2">
              {isEditable && (
                <Link
                  href={`/panel/presupuestos/${id}/editar`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Editar
                </Link>
              )}
              {showPdfButton && (
                <a
                  href={`/api/pdf/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Descargar PDF
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Descripción */}
        {budget.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {budget.description}
          </p>
        )}

        {/* Ítems */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Ítems
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                    Descripción
                  </th>
                  <th className="w-24 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Cant.
                  </th>
                  <th className="w-20 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Unidad
                  </th>
                  <th className="w-32 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Costo unit.
                  </th>
                  <th className="w-32 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-3 py-3 text-right">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-slate-500">
                      {item.unit ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatMoney(item.unit_cost, currency)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      {formatMoney(item.line_total ?? 0, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-sm text-slate-500"
                  >
                    Costo base
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-slate-500">
                    {formatMoney(budget.base_total, currency)}
                  </td>
                </tr>
                {showPricing && pricing && (
                  <>
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-1.5 text-right text-xs text-slate-400"
                      >
                        Margen ({pricing.margin_pct.toFixed(1)}&thinsp;%)
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs text-slate-400">
                        +
                        {formatMoney(
                          pricing.client_total - budget.base_total,
                          currency,
                        )}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-right text-sm font-semibold text-green-700 dark:text-green-400"
                      >
                        Precio al cliente
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-green-700 dark:text-green-400">
                        {formatMoney(pricing.client_total, currency)}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
        </section>

        {/* Balance de ejecución */}
        {isInExecution && balance && (
          <BalanceCard
            approvedAmount={balance.approved_purchase_amount ?? budget.base_total}
            totalExpenses={balance.total_expenses ?? 0}
            remainingAmount={balance.remaining_amount ?? 0}
            currency={currency}
          />
        )}

        {/* Acciones de transición */}
        <TransitionActions
          budgetId={id}
          status={status}
          role={profile.role as UserRole}
          baseTotal={budget.base_total}
          currency={currency}
          clientEmail={clientEmail}
        />

        {/* Sección de gastos */}
        {isInExecution && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Gastos
            </h2>

            {canRegisterExpense && (
              <ExpenseForm budgetId={id} currency={currency} />
            )}

            <ExpenseList
              expenses={expensesWithUrls}
              currency={currency}
              showCreator={isPrivileged(profile.role as UserRole)}
            />
          </section>
        )}

        {/* Bitácora de eventos */}
        {events.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Historial
            </h2>
            <ul className="space-y-2">
              {events.map((ev) => {
                const actorName =
                  (ev.actor as { full_name: string } | null)?.full_name ??
                  "Sistema";
                return (
                  <li
                    key={ev.id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                        {ev.from_status && ev.to_status && (
                          <span className="ml-1 font-normal text-slate-500">
                            {BUDGET_STATUS_LABELS[ev.from_status as BudgetStatus]}{" "}
                            →{" "}
                            {BUDGET_STATUS_LABELS[ev.to_status as BudgetStatus]}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ev.created_at).toLocaleString("es-VE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-500">por {actorName}</p>
                    {ev.comment && (
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        &ldquo;{ev.comment}&rdquo;
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
