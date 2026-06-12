import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import BudgetForm from "@/components/budgets/budget-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nuevo presupuesto" };

export default async function NuevoPresupuestoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-6 sm:p-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/panel/presupuestos"
          className="hover:text-slate-900 dark:hover:text-white"
        >
          Presupuestos
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">Nuevo</span>
      </nav>

      <h1 className="mb-8 text-xl font-semibold tracking-tight">
        Nuevo presupuesto
      </h1>

      <div className="max-w-4xl">
        <BudgetForm />
      </div>
    </div>
  );
}
