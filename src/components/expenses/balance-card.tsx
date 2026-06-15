import { formatMoney } from "@/lib/utils";
import type { Currency } from "@/lib/domain/currency";

interface BalanceCardProps {
  approvedAmount: number;
  totalExpenses: number;
  remainingAmount: number;
  currency: Currency;
}

export default function BalanceCard({
  approvedAmount,
  totalExpenses,
  remainingAmount,
  currency,
}: BalanceCardProps) {
  const pct = approvedAmount > 0 ? (totalExpenses / approvedAmount) * 100 : 0;
  const isOver = remainingAmount < 0;
  const isNear = !isOver && pct >= 80;

  const barColor = isOver
    ? "bg-red-500"
    : isNear
      ? "bg-amber-400"
      : "bg-green-500";

  const remainingColor = isOver
    ? "text-red-600 dark:text-red-400"
    : isNear
      ? "text-amber-600 dark:text-amber-400"
      : "text-green-700 dark:text-green-400";

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Balance de ejecución
      </h2>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {/* Tres métricas */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Techo aprobado</p>
            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
              {formatMoney(approvedAmount, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total gastado</p>
            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
              {formatMoney(totalExpenses, currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Saldo restante</p>
            <p className={`mt-0.5 font-semibold ${remainingColor}`}>
              {isOver ? "−" : ""}
              {formatMoney(Math.abs(remainingAmount), currency)}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-slate-400">
            {pct.toFixed(1)}&thinsp;% utilizado
            {isOver && (
              <span className="ml-1 font-medium text-red-500">
                · Excede el techo
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
