import { BUDGET_PIPELINE, BUDGET_STATUS_LABELS } from "@/lib/domain/budget-status";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-12 px-6 py-16">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          SCE International
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Panel de Presupuestos
        </h1>
        <p className="max-w-prose text-pretty text-slate-600 dark:text-slate-400">
          Plataforma interna para crear, aprobar y ejecutar presupuestos, con
          control de gastos en tiempo real y notificaciones. MVP en construcción.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-500">
          Flujo de aprobación (pipeline)
        </h2>
        <ol className="flex flex-wrap items-center gap-2">
          {BUDGET_PIPELINE.map((status, index) => (
            <li
              key={status}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <span className="grid size-5 place-items-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">
                {index + 1}
              </span>
              {BUDGET_STATUS_LABELS[status]}
            </li>
          ))}
        </ol>
      </section>

      <footer className="text-xs text-slate-400">
        Fase 0 · Cimientos · Next.js · Supabase · Vercel
      </footer>
    </main>
  );
}
