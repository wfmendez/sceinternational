import type { Metadata } from "next";
import { redirect } from "next/navigation";

import InviteForm from "@/components/admin/invite-form";
import RoleEditor from "@/components/admin/role-editor";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsuariosPage() {
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
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/panel/presupuestos");
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>

      {/* Invitar */}
      <section className="mt-8 max-w-lg">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Invitar nuevo usuario
        </h2>
        <InviteForm />
      </section>

      {/* Lista */}
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Equipo
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="w-32 px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(users ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {USER_ROLE_LABELS[u.role as UserRole]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== user.id && (
                      <RoleEditor userId={u.id} currentRole={u.role as UserRole} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
