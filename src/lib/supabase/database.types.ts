// Tipos de la base de datos generados por Supabase.
//
// Regenerar tras cada migración con:
//   npx supabase gen types typescript --project-id jeytiekmuxmhtwjumlty \
//     --schema public > src/lib/supabase/database.types.ts
// (o vía el conector de Supabase).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      budget_events: {
        Row: {
          actor_id: string | null
          budget_id: string
          comment: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["budget_event_type"]
          from_status: Database["public"]["Enums"]["budget_status"] | null
          id: string
          payload: Json | null
          to_status: Database["public"]["Enums"]["budget_status"] | null
        }
        Insert: {
          actor_id?: string | null
          budget_id: string
          comment?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["budget_event_type"]
          from_status?: Database["public"]["Enums"]["budget_status"] | null
          id?: string
          payload?: Json | null
          to_status?: Database["public"]["Enums"]["budget_status"] | null
        }
        Update: {
          actor_id?: string | null
          budget_id?: string
          comment?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["budget_event_type"]
          from_status?: Database["public"]["Enums"]["budget_status"] | null
          id?: string
          payload?: Json | null
          to_status?: Database["public"]["Enums"]["budget_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_events_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budget_id: string
          created_at: string
          description: string
          id: string
          line_total: number | null
          quantity: number
          sort_order: number
          unit: string | null
          unit_cost: number
        }
        Insert: {
          budget_id: string
          created_at?: string
          description: string
          id?: string
          line_total?: number | null
          quantity?: number
          sort_order?: number
          unit?: string | null
          unit_cost?: number
        }
        Update: {
          budget_id?: string
          created_at?: string
          description?: string
          id?: string
          line_total?: number | null
          quantity?: number
          sort_order?: number
          unit?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_pricing: {
        Row: {
          budget_id: string
          client_total: number
          margin_pct: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          budget_id: string
          client_total?: number
          margin_pct?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          budget_id?: string
          client_total?: number
          margin_pct?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_pricing_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: true
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_pricing_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_purchase_amount: number | null
          base_total: number
          client_approved_at: string | null
          client_id: string | null
          code: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          exchange_rate: number | null
          id: string
          manager_approved_at: string | null
          status: Database["public"]["Enums"]["budget_status"]
          submitted_at: string | null
          title: string
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          approved_purchase_amount?: number | null
          base_total?: number
          client_approved_at?: string | null
          client_id?: string | null
          code?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          exchange_rate?: number | null
          id?: string
          manager_approved_at?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          submitted_at?: string | null
          title: string
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          approved_purchase_amount?: number | null
          base_total?: number
          client_approved_at?: string | null
          client_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          exchange_rate?: number | null
          id?: string
          manager_approved_at?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          submitted_at?: string | null
          title?: string
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          budget_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          invoice_file_path: string | null
          invoice_ref: string | null
          note: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          budget_id: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          invoice_file_path?: string | null
          invoice_ref?: string | null
          note?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          budget_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          invoice_file_path?: string | null
          invoice_ref?: string | null
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          budget_id: string | null
          created_at: string
          email_sent: boolean
          id: string
          is_read: boolean
          recipient_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body?: string | null
          budget_id?: string | null
          created_at?: string
          email_sent?: boolean
          id?: string
          is_read?: boolean
          recipient_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string | null
          budget_id?: string | null
          created_at?: string
          email_sent?: boolean
          id?: string
          is_read?: boolean
          recipient_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      budget_balances: {
        Row: {
          approved_purchase_amount: number | null
          budget_id: string | null
          remaining_amount: number | null
          total_expenses: number | null
        }
        Relationships: []
      }
      budget_profit: {
        Row: {
          base_total: number | null
          budget_id: string | null
          client_total: number | null
          code: string | null
          created_by: string | null
          currency: string | null
          margin_pct: number | null
          profit: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_privileged: { Args: never; Returns: boolean }
    }
    Enums: {
      budget_event_type:
        | "status_change"
        | "margin_applied"
        | "expense_logged"
        | "comment"
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
        | "closed"
      notification_type:
        | "budget_submitted"
        | "budget_returned"
        | "budget_validated"
        | "budget_approved"
        | "client_approved"
        | "execution_enabled"
        | "expense_logged"
        | "expense_over_budget"
      user_role: "worker" | "admin" | "manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      budget_event_type: [
        "status_change",
        "margin_applied",
        "expense_logged",
        "comment",
      ],
      budget_status: [
        "draft",
        "pending_admin_review",
        "returned_to_worker",
        "validated_with_margin",
        "pending_manager_approval",
        "returned_by_manager",
        "approved_sent_to_client",
        "client_approved",
        "in_execution",
        "closed",
      ],
      notification_type: [
        "budget_submitted",
        "budget_returned",
        "budget_validated",
        "budget_approved",
        "client_approved",
        "execution_enabled",
        "expense_logged",
        "expense_over_budget",
      ],
      user_role: ["worker", "admin", "manager"],
    },
  },
} as const
