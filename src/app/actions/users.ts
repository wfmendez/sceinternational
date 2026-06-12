"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { USER_ROLES, type UserRole } from "@/lib/domain/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const InviteSchema = z.object({
  email: z.string().email("Correo inválido"),
  role: z.enum([USER_ROLES.WORKER, USER_ROLES.ADMIN, USER_ROLES.MANAGER]),
});

export async function inviteUser(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
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
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return { error: "Sin permiso para invitar usuarios" };
  }

  const parsed = InviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const adminClient = createAdminClient();
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      parsed.data.email,
    );
    if (inviteError) return { error: inviteError.message };

    // El trigger crea el perfil con role=worker; ajustamos al rol deseado
    if (parsed.data.role !== USER_ROLES.WORKER) {
      const { data: invited } = await adminClient.auth.admin.listUsers();
      const invitedUser = invited.users.find(
        (u) => u.email === parsed.data.email,
      );
      if (invitedUser) {
        await adminClient
          .from("profiles")
          .update({ role: parsed.data.role as UserRole })
          .eq("id", invitedUser.id);
      }
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al invitar usuario",
    };
  }

  revalidatePath("/panel/admin/usuarios");
  return { success: true };
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (
    !callerProfile ||
    !["admin", "manager"].includes(callerProfile.role)
  ) {
    return { error: "Sin permiso" };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error" };
  }

  revalidatePath("/panel/admin/usuarios");
  return {};
}
