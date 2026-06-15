"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const LogExpenseSchema = z.object({
  budgetId: z.string().uuid(),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida"),
  invoice_ref: z.string().optional(),
  invoice_file_path: z.string().optional(),
  note: z.string().optional(),
});

export type LogExpenseInput = z.infer<typeof LogExpenseSchema>;

export async function logExpense(
  input: LogExpenseInput,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const parsed = LogExpenseSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const { budgetId, amount, description, invoice_ref, invoice_file_path, note } =
    parsed.data;

  const { data: budget } = await supabase
    .from("budgets")
    .select("status, created_by, title")
    .eq("id", budgetId)
    .single();

  if (!budget) return { error: "Presupuesto no encontrado" };
  if (budget.status !== "in_execution")
    return { error: "El presupuesto no está en ejecución" };
  if (budget.created_by !== user.id)
    return { error: "Solo el autor del presupuesto puede registrar gastos" };

  const { error: expenseError } = await supabase.from("expenses").insert({
    budget_id: budgetId,
    amount,
    description: description.trim(),
    invoice_ref: invoice_ref?.trim() || null,
    invoice_file_path: invoice_file_path || null,
    note: note?.trim() || null,
    created_by: user.id,
  });

  if (expenseError) return { error: expenseError.message };

  // Auditoría
  await supabase.from("budget_events").insert({
    budget_id: budgetId,
    actor_id: user.id,
    event_type: "expense_logged",
    comment: `${description.trim()} — ${amount}`,
  });

  // Verificar si se superó el techo de gasto
  const { data: balanceRow } = await supabase
    .from("budget_balances")
    .select("remaining_amount")
    .eq("budget_id", budgetId)
    .single();
  const isOverBudget = (balanceRow?.remaining_amount ?? 0) < 0;

  // Notificaciones
  try {
    const adminClient = createAdminClient();
    type NotifType = Database["public"]["Enums"]["notification_type"];

    const { data: privileged } = await adminClient
      .from("profiles")
      .select("id")
      .in("role", ["admin", "manager"]);

    const notifRows: {
      recipient_id: string;
      budget_id: string;
      type: NotifType;
      title: string;
      body: string;
    }[] = [];

    const expenseBody = `${description.trim()} — ${amount}`;

    // Siempre notificar a admin/manager del gasto
    for (const r of privileged ?? []) {
      notifRows.push({
        recipient_id: r.id,
        budget_id: budgetId,
        type: "expense_logged",
        title: `Gasto registrado: ${budget.title}`,
        body: expenseBody,
      });
    }

    // Si el saldo es negativo, notificar también al trabajador y a admin/manager
    if (isOverBudget) {
      notifRows.push({
        recipient_id: user.id,
        budget_id: budgetId,
        type: "expense_over_budget",
        title: `Saldo negativo: ${budget.title}`,
        body: "Los gastos acumulados superan el techo aprobado.",
      });
      for (const r of privileged ?? []) {
        notifRows.push({
          recipient_id: r.id,
          budget_id: budgetId,
          type: "expense_over_budget",
          title: `Saldo negativo: ${budget.title}`,
          body: "Los gastos superan el techo aprobado.",
        });
      }
    }

    if (notifRows.length) {
      await adminClient.from("notifications").insert(notifRows);
    }
  } catch {
    // las notificaciones no bloquean el registro
  }

  revalidatePath(`/panel/presupuestos/${budgetId}`);
  return {};
}
