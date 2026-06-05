import type { Metadata } from "next";

import { StatusBadge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { BUDGET_STATUS, type BudgetStatus } from "@/lib/domain/budget-status";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Administración" };

// ---------------------------------------------------------------------------
// DATOS DE EJEMPLO. Se reemplazarán por consultas reales (vistas budget_profit
// y budget_balances) una vez provisionada la base de datos.
// ---------------------------------------------------------------------------
const METRICS = {
  monthProfit: 12480,
  monthRevenue: 58300,
  avgMargin: 27.4,
  activeBudgets: 14,
  pendingReview: 3,
  monthExpenses: 9120,
};

const PER_WORKER = [
  { name: "Carlos Rivas", budgets: 6, approved: 22400, expenses: 8100, profit: 5260 },
  { name: "Luisa Marcano", budgets: 4, approved: 15800, expenses: 1020, profit: 4115 },
  { name: "Jhonny Bravo", budgets: 3, approved: 9600, expenses: 0, profit: 2480 },
  { name: "Andrea Sosa", budgets: 1, approved: 3200, expenses: 0, profit: 625 },
];

const RECENT: {
  code: string;
  title: string;
  worker: string;
  status: BudgetStatus;
  total: number;
}[] = [
  { code: "PRE-2026-0014", title: "Remodelación de cocina — El Hatillo", worker: "Carlos Rivas", status: BUDGET_STATUS.PENDING_ADMIN_REVIEW, total: 7800 },
  { code: "PRE-2026-0013", title: "Paisajismo y riego — La Lagunita", worker: "Luisa Marcano", status: BUDGET_STATUS.IN_EXECUTION, total: 5240 },
  { code: "PRE-2026-0012", title: "Impermeabilización de terraza", worker: "Jhonny Bravo", status: BUDGET_STATUS.PENDING_MANAGER_APPROVAL, total: 2100 },
  { code: "PRE-2026-0011", title: "Mantenimiento de jardín (trimestral)", worker: "Andrea Sosa", status: BUDGET_STATUS.CLIENT_APPROVED, total: 3200 },
  { code: "PRE-2026-0010", title: "Reparación de fachada y pintura", worker: "Carlos Rivas", status: BUDGET_STATUS.RETURNED_TO_WORKER, total: 4600 },
];

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            SCE International
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Panel de Administración
          </h1>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
          Vista previa · datos de ejemplo
        </span>
      </header>

      {/* Métricas */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Ganancia del mes"
          value={formatMoney(METRICS.monthProfit)}
          hint="Precio al cliente − costo base"
          accent
        />
        <MetricCard label="Ingresos facturados" value={formatMoney(METRICS.monthRevenue)} hint="Total a clientes (con margen)" />
        <MetricCard label="Margen promedio" value={`${METRICS.avgMargin}%`} hint="Sobre el costo base" />
        <MetricCard label="Presupuestos activos" value={String(METRICS.activeBudgets)} hint="En cualquier etapa del pipeline" />
        <MetricCard label="En revisión" value={String(METRICS.pendingReview)} hint="Pendientes de Administración" />
        <MetricCard label="Gastos del mes" value={formatMoney(METRICS.monthExpenses)} hint="Registrados por los trabajadores" />
      </section>

      {/* Por trabajador */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Rendimiento por trabajador
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 font-medium">Trabajador</th>
                <th className="px-4 py-3 text-right font-medium">Presupuestos</th>
                <th className="px-4 py-3 text-right font-medium">Aprobado</th>
                <th className="px-4 py-3 text-right font-medium">Gastos</th>
                <th className="px-4 py-3 text-right font-medium">Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PER_WORKER.map((w) => (
                <tr key={w.name}>
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{w.budgets}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(w.approved)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(w.expenses)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-green-600">
                    {formatMoney(w.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Presupuestos recientes */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Presupuestos recientes
        </h2>
        <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {RECENT.map((b) => (
            <li key={b.code} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="font-mono text-xs text-slate-400">{b.code}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{b.title}</span>
              <span className="text-xs text-slate-500">{b.worker}</span>
              <StatusBadge status={b.status} />
              <span className="w-24 text-right font-medium tabular-nums">
                {formatMoney(b.total)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-xs text-slate-400">
        Las cifras son de ejemplo. En producción provienen de las vistas{" "}
        <code>budget_profit</code> y <code>budget_balances</code>, visibles solo
        para Administración y Gerencia.
      </p>
    </main>
  );
}
