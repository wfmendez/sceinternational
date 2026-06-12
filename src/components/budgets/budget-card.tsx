import Link from "next/link";

import {
  BUDGET_STATUS_LABELS,
  type BudgetStatus,
} from "@/lib/domain/budget-status";
import { formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";

interface BudgetCardProps {
  budget: {
    id: string;
    code: string | null;
    title: string;
    status: BudgetStatus;
    base_total: number;
    currency: string;
    updated_at: string;
  };
}

export default function BudgetCard({ budget }: BudgetCardProps) {
  return (
    <Link
      href={`/panel/presupuestos/${budget.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {budget.code && (
            <p className="mb-1 text-[11px] font-medium tracking-wide text-slate-400">
              {budget.code}
            </p>
          )}
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {budget.title}
          </p>
        </div>
        <StatusBadge status={budget.status} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {formatMoney(
            budget.base_total,
            budget.currency as "USD" | "VES",
          )}
        </span>
        <span className="text-xs text-slate-400">
          {new Date(budget.updated_at).toLocaleDateString("es-VE", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>

      <div className="mt-2">
        <p className="text-xs text-slate-500">
          {BUDGET_STATUS_LABELS[budget.status]}
        </p>
      </div>
    </Link>
  );
}
