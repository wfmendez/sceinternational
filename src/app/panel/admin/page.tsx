import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { BUDGET_STATUS_LABELS, type BudgetStatus } from "@/lib/domain/budget-status";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Administración" };

export default async function AdminDashboardPage() {
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
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/panel/presupuestos");
  }

  // ── Métricas globales ────────────────────────────────────────────────────
  const [
    { data: profits },
    { data: balances },
    { data: budgetCounts },
    { data: recentBudgets },
  ] = await Promise.all([
    // Ganancia por presupuesto (solo los que tienen pricing)
    supabase.from("budget_profit").select("profit, client_total, base_total, margin_pct"),
    // Balance por presupuesto en ejecución
    supabase.from("budget_balances").select("total_expenses, remaining_amount"),
    // Conteo por estado
    supabase.from("budgets").select("status"),
    // Presupuestos recientes con info de creador y cliente
    supabase
      .from("budgets")
      .select(
        "id, code, title, status, base_total, currency, updated_at, creator:profiles!budgets_created_by_fkey(full_name)",
      )
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const totalProfit = (profits ?? []).reduce((s, p) => s + (p.profit ?? 0), 0);
  const totalRevenue = (profits ?? []).reduce((s, p) => s + (p.client_total ?? 0), 0);
  const avgMargin =
    (profits ?? []).length > 0
      ? (profits ?? []).reduce((s, p) => s + (p.margin_pct ?? 0), 0) /
        (profits ?? []).length
      : 0;
  const totalExpenses = (balances ?? []).reduce(
    (s, b) => s + (b.total_expenses ?? 0),
    0,
  );

  const statusCounts = (budgetCounts ?? []).reduce<Record<string, number>>(
    (acc, b) => ({ ...acc, [b.status]: (acc[b.status] ?? 0) + 1 }),
    {},
  );
  const pendingReview = statusCounts["pending_admin_review"] ?? 0;
  const pendingManager = statusCounts["pending_manager_approval"] ?? 0;
  const inExecution = statusCounts["in_execution"] ?? 0;
  const totalActive = Object.entries(statusCounts)
    .filter(([s]) => !["closed", "draft"].includes(s))
    .reduce((sum, [, n]) => sum + n, 0);

  return (
    <div className="p-6 sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          Panel de Administración
        </h1>
        <Link
          href="/panel/presupuestos"
          className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          Ver presupuestos →
        </Link>
      </header>

      {/* ── Métricas ──────────────────────────────────────────────── */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Ganancia acumulada"
          value={formatMoney(totalProfit)}
          hint="Precio al cliente − costo base (presupuestos con margen)"
          accent
        />
        <MetricCard
          label="Ingresos facturados"
          value={formatMoney(totalRevenue)}
          hint="Total a clientes con margen aplicado"
        />
        <MetricCard
          label="Margen promedio"
          value={`${avgMargin.toFixed(1)}%`}
          hint="Sobre el costo base (presupuestos validados)"
        />
        <MetricCard
          label="Presupuestos activos"
          value={String(totalActive)}
          hint="En cualquier etapa del pipeline (excluye borradores y cerrados)"
        />
        <MetricCard
          label="En revisión"
          value={String(pendingReview + pendingManager)}
          hint={`${pendingReview} en Administración · ${pendingManager} en Gerencia`}
        />
        <MetricCard
          label="Gastos en ejecución"
          value={formatMoney(totalExpenses)}
          hint={`${inExecution} presupuesto${inExecution !== 1 ? "s" : ""} activo${inExecution !== 1 ? "s" : ""}`}
        />
      </section>

      {/* ── Distribución por estado ──────────────────────────────── */}
      {Object.keys(statusCounts).length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Distribución por estado
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <StatusBadge status={status as BudgetStatus} />
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {count}
                  </span>
                  <span className="text-slate-400">
                    {BUDGET_STATUS_LABELS[status as BudgetStatus]}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── Presupuestos recientes ───────────────────────────────── */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Presupuestos recientes
          </h2>
          <Link
            href="/panel/presupuestos"
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Ver todos
          </Link>
        </div>
        {(recentBudgets ?? []).length === 0 ? (
          <p className="text-sm text-slate-400">No hay presupuestos aún.</p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {(recentBudgets ?? []).map((b) => {
              const creatorName =
                (b.creator as { full_name: string } | null)?.full_name ?? "—";
              return (
                <li key={b.id}>
                  <Link
                    href={`/panel/presupuestos/${b.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="font-mono text-xs text-slate-400">
                      {b.code ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">
                      {b.title}
                    </span>
                    <span className="hidden text-xs text-slate-500 sm:block">
                      {creatorName}
                    </span>
                    <StatusBadge status={b.status as BudgetStatus} />
                    <span className="w-24 text-right text-sm font-medium tabular-nums text-slate-700 dark:text-slate-200">
                      {formatMoney(b.base_total, b.currency as "USD" | "VES")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
