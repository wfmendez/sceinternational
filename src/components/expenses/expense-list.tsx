import type { Currency } from "@/lib/domain/currency";
import { formatMoney } from "@/lib/utils";

interface Expense {
  id: string;
  description: string;
  amount: number;
  invoice_ref: string | null;
  note: string | null;
  created_at: string;
  invoice_url: string | null; // URL firmada pre-generada
  creator_name: string | null;
}

interface ExpenseListProps {
  expenses: Expense[];
  currency: Currency;
  showCreator?: boolean;
}

export default function ExpenseList({
  expenses,
  currency,
  showCreator = false,
}: ExpenseListProps) {
  if (!expenses.length) {
    return (
      <p className="text-sm text-slate-400">
        No hay gastos registrados aún.
      </p>
    );
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
              Descripción
            </th>
            {showCreator && (
              <th className="w-28 px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                Registrado por
              </th>
            )}
            <th className="w-24 px-3 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
              Factura
            </th>
            <th className="w-28 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
              Monto
            </th>
            <th className="w-24 px-3 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {expenses.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {e.description}
                </p>
                {e.note && (
                  <p className="mt-0.5 text-xs text-slate-400">{e.note}</p>
                )}
              </td>
              {showCreator && (
                <td className="px-3 py-3 text-xs text-slate-500">
                  {e.creator_name ?? "—"}
                </td>
              )}
              <td className="px-3 py-3">
                {e.invoice_ref && (
                  <span className="text-xs text-slate-500">{e.invoice_ref}</span>
                )}
                {e.invoice_url && (
                  <a
                    href={e.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Ver
                  </a>
                )}
                {!e.invoice_ref && !e.invoice_url && (
                  <span className="text-xs text-slate-300 dark:text-slate-600">
                    —
                  </span>
                )}
              </td>
              <td className="px-3 py-3 text-right font-medium">
                {formatMoney(e.amount, currency)}
              </td>
              <td className="px-3 py-3 text-right text-xs text-slate-400">
                {new Date(e.created_at).toLocaleDateString("es-VE", {
                  day: "2-digit",
                  month: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 dark:border-slate-700">
            <td
              colSpan={showCreator ? 3 : 2}
              className="px-4 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Total gastos
            </td>
            <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
              {formatMoney(total, currency)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
