"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import {
  BUDGET_STATUS_LABELS,
  type BudgetStatus,
} from "@/lib/domain/budget-status";

const ALL_STATUSES = Object.keys(BUDGET_STATUS_LABELS) as BudgetStatus[];

export default function BudgetFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <input
        type="search"
        value={q}
        onChange={(e) => update("q", e.target.value)}
        placeholder="Buscar por título o código…"
        className="h-9 min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <select
        value={status}
        onChange={(e) => update("status", e.target.value)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <option value="">Todos los estados</option>
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {BUDGET_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
