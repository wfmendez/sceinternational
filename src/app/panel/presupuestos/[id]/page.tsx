import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/badge";
import TransitionActions from "@/components/budgets/transition-actions";
import {
  BUDGET_STATUS_LABELS,
  type BudgetStatus,
} from "@/lib/domain/budget-status";
import type { UserRole } from "@/lib/domain/roles";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

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
      client:clients!budgets_client_id_fkey(name),
      items:budget_items(id, description, quantity, unit_cost, unit, line_total, sort_order),
      events:budget_events(id, event_type, from_status, to_status, comment, created_at, actor:profiles!budget_events_actor_id_fkey(full_name))
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
  const currency = budget.currency as "USD" | "VES";
  const isEditable =
    (status === "draft" || status === "returned_to_worker") &&
    budget.created_by === user.id;

  const creatorName =
    (budget.creator as { full_name: string } | null)?.full_name ?? "—";
  const clientName =
    (budget.client as { name: string } | null)?.name ?? null;

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
            {isEditable && (
              <Link
                href={`/panel/presupuestos/${id}/editar`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Editar
              </Link>
            )}
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
                <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-sm font-semibold"
                  >
                    Total estimado
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold">
                    {formatMoney(budget.base_total, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Acciones de transición */}
        <TransitionActions
          budgetId={id}
          status={status}
          role={profile.role as UserRole}
        />

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
