/**
 * Roles de usuario del sistema.
 *
 * El control de acceso REAL se aplica en la base de datos (RLS) y en las
 * server actions. Estos valores deben mantenerse sincronizados con el enum
 * `user_role` de Postgres (ver `supabase/migrations/0001_init.sql`).
 */
export const USER_ROLES = {
  /** Trabajador por contrato. Crea presupuestos y registra gastos. */
  WORKER: "worker",
  /** Administración. Revisa, devuelve y aplica el margen de ganancia. */
  ADMIN: "admin",
  /** Gerencia / dueño. Aprobación final y relación con el cliente. */
  MANAGER: "manager",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  worker: "Trabajador",
  admin: "Administración",
  manager: "Gerencia",
};

/**
 * Roles con visibilidad total: ven todos los presupuestos y, a diferencia del
 * trabajador, el margen de ganancia y el precio al cliente.
 */
export const PRIVILEGED_ROLES: UserRole[] = [USER_ROLES.ADMIN, USER_ROLES.MANAGER];

export function isPrivileged(role: UserRole): boolean {
  return PRIVILEGED_ROLES.includes(role);
}
