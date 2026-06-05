import {
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_TONE,
  type BudgetStatus,
  type StatusTone,
} from "@/lib/domain/budget-status";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  success: "bg-green-50 text-green-700 ring-green-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status }: { status: BudgetStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASSES[BUDGET_STATUS_TONE[status]],
      )}
    >
      {BUDGET_STATUS_LABELS[status]}
    </span>
  );
}
