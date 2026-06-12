"use client";

import { useState, useTransition } from "react";

import { updateUserRole } from "@/app/actions/users";
import { USER_ROLE_LABELS, USER_ROLES, type UserRole } from "@/lib/domain/roles";

interface RoleEditorProps {
  userId: string;
  currentRole: UserRole;
}

export default function RoleEditor({ userId, currentRole }: RoleEditorProps) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newRole: UserRole) => {
    setRole(newRole);
    setSaved(false);
  };

  const handleSave = () => {
    if (role === currentRole) return;
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      >
        {Object.values(USER_ROLES).map((r) => (
          <option key={r} value={r}>
            {USER_ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {role !== currentRole && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900"
        >
          {isPending ? "…" : "Guardar"}
        </button>
      )}
      {saved && <span className="text-xs text-green-600">✓</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
