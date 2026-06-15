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
    { data: allBudgetsByWorker },
    { data: workerExpenses },
  ] = await Promise.all([
    supabase.from("budget_profit").select("profit, client_total, base_total, margin_pct"),
    supabase.from("budget_balances").select("total_expenses, remaining_amount"),
    supabase.from("budgets").select("status"),
    supabase
      .from("budgets")
      .select(
        "id, code, title, status, base_total, currency, updated_at, creator:profiles!budgets_created_by_fkey(full_name)",
      )
      .order("updated_at", { ascending: false })
      .limit(8),
    // Rendimiento por trabajador: todos los presupuestos con creador
    supabase
      .from("budgets")
      .select("status, base_total, created_by, creator:profiles!budgets_created_by_fkey(full_name, role)")
      .order("created_by"),
    // Gastos totales por trabajador (a través del presupuesto)
    supabase
      .from("expenses")
      .select("amount, budget:budgets!expenses_budget_id_fkey(created_by)"),
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

  // ── Rendimiento por trabajador ───────────────────────────────────────────
  type WorkerStat = {
    name: string;
    total: number;
    active: number;
    closed: number;
    baseTotal: number;
    totalSpent: number;
  };

  // Mapa de gastos totales por creador del presupuesto
  const spentByWorker: Record<string, number> = {};
  for (const e of workerExpenses ?? []) {
    const createdBy = (e.budget as { created_by: string } | null)?.created_by;
    if (createdBy) {
      spentByWorker[createdBy] = (spentByWorker[createdBy] ?? 0) + (e.amount ?? 0);
    }
  }

  const workerMap: Record<string, WorkerStat> = {};
  for (const b of allBudgetsByWorker ?? []) {
    const creator = b.creator as { full_name: string; role: string } | null;
    if (!creator || creator.role !== "worker") continue;
    const key = b.created_by;
    if (!workerMap[key]) {
      workerMap[key] = {
        name: creator.full_name,
        total: 0,
        active: 0,
        closed: 0,
        baseTotal: 0,
        totalSpent: 0,
      };
    }
    workerMap[key].total += 1;
    workerMap[key].baseTotal += b.base_total ?? 0;
    if (b.status === "closed") workerMap[key].closed += 1;
    else if (b.status !== "draft") workerMap[key].active += 1;
  }
  for (const [id, stat] of Object.entries(workerMap)) {
    stat.totalSpent = spentByWorker[id] ?? 0;
  }
  const workerStats = Object.values(workerMap).sort((a, b) => b.total - a.total);

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

      {/* ── Rendimiento por trabajador ──────────────────────────── */}
      {workerStats.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Rendimiento por trabajador
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                    Trabajador
                  </th>
                  <th className="w-20 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Total
                  </th>
                  <th className="w-20 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Activos
                  </th>
                  <th className="w-20 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Cerrados
                  </th>
                  <th className="w-32 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Costo base
                  </th>
                  <th className="w-32 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    Gastos reales
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {workerStats.map((w) => (
                  <tr
                    key={w.name}
                    className="bg-white dark:bg-slate-950"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {w.name}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {w.total}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {w.active}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {w.closed}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {formatMoney(w.baseTotal)}
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums font-medium ${w.totalSpent > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                      {w.totalSpent > 0 ? formatMoney(w.totalSpent) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
