"use client";

import { useState, useTransition } from "react";

import { validateBudgetWithMargin } from "@/app/actions/budgets";
import type { Currency } from "@/lib/domain/currency";
import { formatMoney } from "@/lib/utils";

interface MarginFormProps {
  budgetId: string;
  baseTotal: number;
  currency: Currency;
  onCancel: () => void;
}

export default function MarginForm({
  budgetId,
  baseTotal,
  currency,
  onCancel,
}: MarginFormProps) {
  const [marginPct, setMarginPct] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clientTotal =
    Math.round(baseTotal * (1 + marginPct / 100) * 100) / 100;

  const confirm = () => {
    if (marginPct < 0 || marginPct > 200) {
      setError("El margen debe estar entre 0 y 200 %");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await validateBudgetWithMargin(budgetId, marginPct);
      if (result?.error) setError(result.error);
    });
  };

  const inputClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-white";

  return (
    <div className="w-full rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-900/40 dark:bg-green-950/20">
      <p className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Validar y aplicar margen
      </p>

      {/* Slider + input numérico */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Margen (%)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={200}
            step={0.5}
            value={marginPct}
            onChange={(e) => setMarginPct(parseFloat(e.target.value))}
            className="flex-1 accent-green-600"
            disabled={isPending}
          />
          <input
            type="number"
            min={0}
            max={200}
            step={0.1}
            value={marginPct}
            onChange={(e) =>
              setMarginPct(parseFloat(e.target.value) || 0)
            }
            className={`w-24 text-right ${inputClass}`}
            disabled={isPending}
          />
          <span className="text-sm text-slate-500">%</span>
        </div>
      </div>

      {/* Resumen de precios */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Costo base</span>
          <span className="text-slate-700 dark:text-slate-300">
            {formatMoney(baseTotal, currency)}
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Margen aplicado</span>
          <span className="text-slate-700 dark:text-slate-300">
            +{marginPct.toFixed(1)}&thinsp;%
          </span>
        </div>
        <div className="mt-1 flex justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            Precio al cliente
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {formatMoney(clientTotal, currency)}
          </span>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={confirm}
          disabled={isPending}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          {isPending ? "Procesando…" : "Confirmar validación"}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
