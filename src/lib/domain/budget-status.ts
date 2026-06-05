import { USER_ROLES, type UserRole } from "./roles";

/**
 * Estados del presupuesto = pipeline de aprobación.
 *
 * El pipeline NO es arrastrable: el estado avanza solo mediante transiciones
 * válidas (abajo), disparadas por el rol correspondiente. Cada transición
 * además genera una entrada de auditoría (`budget_events`) y notificaciones.
 *
 * Sincronizar con el enum `budget_status` de Postgres.
 */
export const BUDGET_STATUS = {
  DRAFT: "draft",
  PENDING_ADMIN_REVIEW: "pending_admin_review",
  RETURNED_TO_WORKER: "returned_to_worker",
  VALIDATED_WITH_MARGIN: "validated_with_margin",
  PENDING_MANAGER_APPROVAL: "pending_manager_approval",
  RETURNED_BY_MANAGER: "returned_by_manager",
  APPROVED_SENT_TO_CLIENT: "approved_sent_to_client",
  CLIENT_APPROVED: "client_approved",
  IN_EXECUTION: "in_execution",
  CLOSED: "closed",
} as const;

export type BudgetStatus = (typeof BUDGET_STATUS)[keyof typeof BUDGET_STATUS];

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  draft: "Borrador",
  pending_admin_review: "En revisión · Administración",
  returned_to_worker: "Devuelto al trabajador",
  validated_with_margin: "Validado con margen",
  pending_manager_approval: "En aprobación · Gerencia",
  returned_by_manager: "Devuelto por Gerencia",
  approved_sent_to_client: "Aprobado · Enviado al cliente",
  client_approved: "Aprobado por el cliente",
  in_execution: "En ejecución",
  closed: "Cerrado",
};

/** Tono visual para los chips de estado (mapea a clases de Tailwind en la UI). */
export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

export const BUDGET_STATUS_TONE: Record<BudgetStatus, StatusTone> = {
  draft: "neutral",
  pending_admin_review: "info",
  returned_to_worker: "warning",
  validated_with_margin: "info",
  pending_manager_approval: "info",
  returned_by_manager: "warning",
  approved_sent_to_client: "info",
  client_approved: "success",
  in_execution: "success",
  closed: "neutral",
};

/** Orden del pipeline para vistas tipo línea de tiempo (excluye los "devuelto"). */
export const BUDGET_PIPELINE: BudgetStatus[] = [
  BUDGET_STATUS.DRAFT,
  BUDGET_STATUS.PENDING_ADMIN_REVIEW,
  BUDGET_STATUS.VALIDATED_WITH_MARGIN,
  BUDGET_STATUS.PENDING_MANAGER_APPROVAL,
  BUDGET_STATUS.APPROVED_SENT_TO_CLIENT,
  BUDGET_STATUS.CLIENT_APPROVED,
  BUDGET_STATUS.IN_EXECUTION,
  BUDGET_STATUS.CLOSED,
];

export interface BudgetTransition {
  /** Estado destino. */
  to: BudgetStatus;
  /** Etiqueta de la acción que dispara la transición. */
  action: string;
  /** Roles autorizados a ejecutarla. */
  roles: UserRole[];
  /** Si la transición exige un comentario (p. ej. motivo de devolución). */
  requiresComment?: boolean;
}

const { WORKER, ADMIN, MANAGER } = USER_ROLES;

/**
 * Grafo de transiciones del pipeline. Fuente única de verdad: la UI muestra
 * solo las acciones permitidas y las server actions validan contra este mapa
 * (además de la RLS en la base de datos).
 */
export const BUDGET_TRANSITIONS: Record<BudgetStatus, BudgetTransition[]> = {
  draft: [
    { to: BUDGET_STATUS.PENDING_ADMIN_REVIEW, action: "Enviar a Administración", roles: [WORKER] },
  ],
  pending_admin_review: [
    { to: BUDGET_STATUS.VALIDATED_WITH_MARGIN, action: "Validar y aplicar margen", roles: [ADMIN] },
    { to: BUDGET_STATUS.RETURNED_TO_WORKER, action: "Devolver al trabajador", roles: [ADMIN], requiresComment: true },
  ],
  returned_to_worker: [
    { to: BUDGET_STATUS.PENDING_ADMIN_REVIEW, action: "Reenviar a Administración", roles: [WORKER] },
  ],
  validated_with_margin: [
    { to: BUDGET_STATUS.PENDING_MANAGER_APPROVAL, action: "Enviar a Gerencia", roles: [ADMIN] },
  ],
  pending_manager_approval: [
    { to: BUDGET_STATUS.APPROVED_SENT_TO_CLIENT, action: "Aprobar y enviar al cliente", roles: [MANAGER] },
    { to: BUDGET_STATUS.RETURNED_BY_MANAGER, action: "Devolver a Administración", roles: [MANAGER], requiresComment: true },
  ],
  returned_by_manager: [
    { to: BUDGET_STATUS.VALIDATED_WITH_MARGIN, action: "Reajustar y reenviar", roles: [ADMIN] },
  ],
  approved_sent_to_client: [
    { to: BUDGET_STATUS.CLIENT_APPROVED, action: "Marcar aprobación del cliente", roles: [MANAGER] },
  ],
  client_approved: [
    { to: BUDGET_STATUS.IN_EXECUTION, action: "Habilitar ejecución de gastos", roles: [MANAGER] },
  ],
  in_execution: [
    { to: BUDGET_STATUS.CLOSED, action: "Cerrar presupuesto", roles: [ADMIN, MANAGER] },
  ],
  closed: [],
};

/** Transiciones que un rol concreto puede ejecutar desde un estado dado. */
export function allowedTransitions(status: BudgetStatus, role: UserRole): BudgetTransition[] {
  return BUDGET_TRANSITIONS[status].filter((t) => t.roles.includes(role));
}

/** ¿Puede `role` mover el presupuesto de `from` a `to`? */
export function canTransition(from: BudgetStatus, to: BudgetStatus, role: UserRole): boolean {
  return BUDGET_TRANSITIONS[from].some((t) => t.to === to && t.roles.includes(role));
}

/** El trabajador puede editar el contenido del presupuesto en estos estados. */
export function isEditableByWorker(status: BudgetStatus): boolean {
  return status === BUDGET_STATUS.DRAFT || status === BUDGET_STATUS.RETURNED_TO_WORKER;
}

/** Solo en ejecución el trabajador puede registrar gastos. */
export function canLogExpenses(status: BudgetStatus): boolean {
  return status === BUDGET_STATUS.IN_EXECUTION;
}
