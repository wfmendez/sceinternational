"use client";

import { useActionState } from "react";

import { inviteUser } from "@/app/actions/users";
import { USER_ROLE_LABELS, USER_ROLES } from "@/lib/domain/roles";

export default function InviteForm() {
  const [state, formAction, isPending] = useActionState(inviteUser, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Invitación enviada. El usuario recibirá un correo para activar su cuenta.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Correo electrónico
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="colaborador@empresa.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Rol</label>
          <select
            name="role"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {Object.values(USER_ROLES).map((r) => (
              <option key={r} value={r}>
                {USER_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900"
      >
        {isPending ? "Enviando invitación…" : "Invitar usuario"}
      </button>
    </form>
  );
}
