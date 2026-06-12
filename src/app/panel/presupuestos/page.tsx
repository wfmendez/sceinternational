import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import BudgetCard from "@/components/budgets/budget-card";
import { type BudgetStatus } from "@/lib/domain/budget-status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Presupuestos" };

export default async function PresupuestosPage() {
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

  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, code, title, status, base_total, currency, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Presupuestos</h1>
        <Link
          href="/panel/presupuestos/nuevo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Nuevo presupuesto
        </Link>
      </div>

      {!budgets?.length ? (
        <div className="mt-20 flex flex-col items-center gap-3 text-center">
          <p className="text-slate-500">No hay presupuestos todavía.</p>
          {profile?.role === "worker" && (
            <Link
              href="/panel/presupuestos/nuevo"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Crear el primero →
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <li key={b.id}>
              <BudgetCard
                budget={{
                  ...b,
                  status: b.status as BudgetStatus,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
