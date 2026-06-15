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

  // Notificación a admin/manager
  try {
    const adminClient = createAdminClient();
    type NotifType = Database["public"]["Enums"]["notification_type"];

    const { data: recipients } = await adminClient
      .from("profiles")
      .select("id")
      .in("role", ["admin", "manager"]);

    if (recipients?.length) {
      await adminClient.from("notifications").insert(
        recipients.map((r) => ({
          recipient_id: r.id,
          budget_id: budgetId,
          type: "expense_logged" as NotifType,
          title: `Gasto registrado: ${budget.title}`,
          body: `${description.trim()} — ${amount}`,
        })),
      );
    }
  } catch {
    // las notificaciones no bloquean el registro
  }

  revalidatePath(`/panel/presupuestos/${budgetId}`);
  return {};
}
