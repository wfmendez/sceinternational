/**
 * Tipos de la base de datos.
 *
 * Este archivo es un PLACEHOLDER hasta provisionar el proyecto de Supabase.
 * Una vez creado, regenerar los tipos reales tras cada migración con:
 *
 *   npx supabase gen types typescript --project-id <PROJECT_ID> \
 *     --schema public > src/lib/supabase/database.types.ts
 *
 * Mantener los enums alineados con `supabase/migrations/0001_init.sql` y con
 * `src/lib/domain/*`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      user_role: "worker" | "admin" | "manager";
      budget_status:
        | "draft"
        | "pending_admin_review"
        | "returned_to_worker"
        | "validated_with_margin"
        | "pending_manager_approval"
        | "returned_by_manager"
        | "approved_sent_to_client"
        | "client_approved"
        | "in_execution"
        | "closed";
      notification_type:
        | "budget_submitted"
        | "budget_returned"
        | "budget_validated"
        | "budget_approved"
        | "client_approved"
        | "execution_enabled"
        | "expense_logged"
        | "expense_over_budget";
      budget_event_type: "status_change" | "margin_applied" | "expense_logged" | "comment";
    };
  };
};
