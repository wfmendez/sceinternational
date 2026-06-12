"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  BUDGET_TRANSITIONS,
  canTransition,
  type BudgetStatus,
} from "@/lib/domain/budget-status";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, TablesUpdate } from "@/lib/supabase/database.types";

// ─── Schemas ────────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.coerce.number().positive("Debe ser positivo"),
  unit_cost: z.coerce.number().min(0, "No puede ser negativo"),
  unit: z.string().optional(),
});

const CreateBudgetSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(255),
  description: z.string().optional(),
  currency: z.enum(["USD", "VES"]),
  client_name: z.string().optional(),
  items: z.array(ItemSchema).min(1, "Agrega al menos un ítem"),
});

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;

const UpdateBudgetSchema = CreateBudgetSchema;
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function notifyTransition(
  budgetId: string,
  budgetTitle: string,
  createdBy: string,
  toStatus: BudgetStatus,
) {
  try {
    const adminClient = createAdminClient();
    type NotifType = Database["public"]["Enums"]["notification_type"];
    let type: NotifType;
    let recipientIds: string[] = [];

    if (toStatus === "pending_admin_review") {
      type = "budget_submitted";
      const { data } = await adminClient
        .from("profiles")
        .select("id")
        .in("role", ["admin", "manager"]);
      recipientIds = data?.map((p) => p.id) ?? [];
    } else if (toStatus === "returned_to_worker") {
      type = "budget_returned";
      recipientIds = [createdBy];
    } else if (toStatus === "returned_by_manager") {
      type = "budget_returned";
      const { data } = await adminClient
        .from("profiles")
        .select("id")
        .eq("role", "admin");
      recipientIds = data?.map((p) => p.id) ?? [];
    } else if (
      toStatus === "validated_with_margin" ||
      toStatus === "pending_manager_approval"
    ) {
      type = "budget_validated";
      const { data } = await adminClient
        .from("profiles")
        .select("id")
        .eq("role", "manager");
      recipientIds = data?.map((p) => p.id) ?? [];
    } else if (toStatus === "approved_sent_to_client") {
      type = "budget_approved";
      recipientIds = [createdBy];
    } else if (toStatus === "in_execution") {
      type = "execution_enabled";
      recipientIds = [createdBy];
    } else {
      return;
    }

    if (!recipientIds.length) return;

    await adminClient.from("notifications").insert(
      recipientIds.map((recipient_id) => ({
        recipient_id,
        budget_id: budgetId,
        type,
        title: `Presupuesto: ${budgetTitle}`,
      })),
    );
  } catch {
    // Notificaciones no bloquean la transición
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createBudget(
  input: CreateBudgetInput,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const parsed = CreateBudgetSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const { title, description, currency, client_name, items } = parsed.data;

  let client_id: string | null = null;
  if (client_name?.trim()) {
    const { data: client } = await supabase
      .from("clients")
      .insert({ name: client_name.trim(), created_by: user.id })
      .select("id")
      .single();
    client_id = client?.id ?? null;
  }

  const base_total = items.reduce(
    (sum, i) => sum + i.quantity * i.unit_cost,
    0,
  );

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .insert({
      title,
      description: description || null,
      currency,
      client_id,
      created_by: user.id,
      base_total,
    })
    .select("id")
    .single();

  if (budgetError || !budget)
    return { error: budgetError?.message ?? "Error al crear el presupuesto" };

  const { error: itemsError } = await supabase.from("budget_items").insert(
    items.map((item, i) => ({
      budget_id: budget.id,
      description: item.description,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      unit: item.unit || null,
      sort_order: i,
    })),
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/panel/presupuestos");
  return { id: budget.id };
}

export async function updateBudget(
  budgetId: string,
  input: UpdateBudgetInput,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const parsed = UpdateBudgetSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const { title, description, currency, client_name, items } = parsed.data;

  // Verificar que el presupuesto existe y que el usuario tiene acceso (RLS)
  const { data: existing } = await supabase
    .from("budgets")
    .select("status, client_id")
    .eq("id", budgetId)
    .single();

  if (!existing) return { error: "Presupuesto no encontrado" };
  if (
    existing.status !== "draft" &&
    existing.status !== "returned_to_worker"
  ) {
    return { error: "Este presupuesto ya no puede editarse" };
  }

  let client_id = existing.client_id;
  if (client_name?.trim()) {
    const { data: client } = await supabase
      .from("clients")
      .insert({ name: client_name.trim(), created_by: user.id })
      .select("id")
      .single();
    client_id = client?.id ?? client_id;
  }

  const base_total = items.reduce(
    (sum, i) => sum + i.quantity * i.unit_cost,
    0,
  );

  const { error: updateError } = await supabase
    .from("budgets")
    .update({ title, description: description || null, currency, client_id, base_total })
    .eq("id", budgetId);

  if (updateError) return { error: updateError.message };

  // Reemplazar ítems
  await supabase.from("budget_items").delete().eq("budget_id", budgetId);
  const { error: itemsError } = await supabase.from("budget_items").insert(
    items.map((item, i) => ({
      budget_id: budgetId,
      description: item.description,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      unit: item.unit || null,
      sort_order: i,
    })),
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/panel/presupuestos");
  revalidatePath(`/panel/presupuestos/${budgetId}`);
  return {};
}

export async function transitionBudget(
  budgetId: string,
  toStatus: BudgetStatus,
  comment?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Perfil no encontrado" };

  const { data: budget } = await supabase
    .from("budgets")
    .select("status, created_by, title, base_total")
    .eq("id", budgetId)
    .single();
  if (!budget) return { error: "Presupuesto no encontrado" };

  if (!canTransition(budget.status, toStatus, profile.role)) {
    return { error: "Esta transición no está permitida para tu rol" };
  }

  const transition = BUDGET_TRANSITIONS[budget.status].find(
    (t) => t.to === toStatus,
  );
  if (transition?.requiresComment && !comment?.trim()) {
    return { error: "Se requiere un comentario para esta acción" };
  }

  const updates: TablesUpdate<"budgets"> = { status: toStatus };
  if (toStatus === "pending_admin_review")
    updates.submitted_at = new Date().toISOString();
  if (toStatus === "validated_with_margin")
    updates.validated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("budgets")
    .update(updates)
    .eq("id", budgetId);
  if (updateError) return { error: updateError.message };

  // Si se valida, crear entrada de budget_pricing con margen 0 (Fase 2 añade el input)
  if (toStatus === "validated_with_margin") {
    await supabase
      .from("budget_pricing")
      .upsert(
        {
          budget_id: budgetId,
          margin_pct: 0,
          client_total: budget.base_total,
          updated_by: user.id,
        },
        { onConflict: "budget_id" },
      );
  }

  // Registro de auditoría
  await supabase.from("budget_events").insert({
    budget_id: budgetId,
    actor_id: user.id,
    event_type: "status_change",
    from_status: budget.status,
    to_status: toStatus,
    comment: comment?.trim() || null,
  });

  // Notificaciones in-app
  await notifyTransition(budgetId, budget.title, budget.created_by, toStatus);

  revalidatePath("/panel/presupuestos");
  revalidatePath(`/panel/presupuestos/${budgetId}`);
  return {};
}
