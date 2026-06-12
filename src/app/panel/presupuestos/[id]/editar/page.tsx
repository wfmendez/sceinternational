import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import BudgetForm from "@/components/budgets/budget-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar presupuesto" };

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: budget } = await supabase
    .from("budgets")
    .select(
      "id, title, description, currency, status, created_by, client_id, items:budget_items(description, quantity, unit_cost, unit, sort_order), client:clients!budgets_client_id_fkey(name)",
    )
    .eq("id", id)
    .single();

  if (!budget) notFound();

  if (
    budget.created_by !== user.id ||
    (budget.status !== "draft" && budget.status !== "returned_to_worker")
  ) {
    redirect(`/panel/presupuestos/${id}`);
  }

  const sortedItems = [...(budget.items ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const clientName =
    (budget.client as { name: string } | null)?.name ?? undefined;

  const defaultValues = {
    title: budget.title,
    description: budget.description ?? "",
    currency: budget.currency as "USD" | "VES",
    client_name: clientName ?? "",
    items: sortedItems.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unit_cost: i.unit_cost,
      unit: i.unit ?? "",
    })),
  };

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
        <Link
          href={`/panel/presupuestos/${id}`}
          className="hover:text-slate-900 dark:hover:text-white"
        >
          {budget.title}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">Editar</span>
      </nav>

      <h1 className="mb-8 text-xl font-semibold tracking-tight">
        Editar presupuesto
      </h1>

      <div className="max-w-4xl">
        <BudgetForm budgetId={id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
