/**
 * Hand-written stub matching supabase/migrations/0001_initial_schema.sql.
 * Replace by running:
 *   npx supabase gen types typescript --project-id <PROJECT_ID> --schema public > src/lib/supabase/types.ts
 * once the Supabase project is live.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      lease_uploads: {
        Row: {
          id: string;
          storage_path: string;
          email: string;
          bundesland: string;
          base_rent_eur: number;
          lease_start_date: string | null;
          uploaded_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          storage_path: string;
          email: string;
          bundesland: string;
          base_rent_eur: number;
          lease_start_date?: string | null;
          uploaded_at?: string;
          expires_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lease_uploads"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          stripe_session_id: string;
          stripe_payment_intent: string | null;
          email: string;
          amount_eur: number;
          product: "lease_review_oneshot" | "pro_monthly" | "pro_annual";
          lease_upload_id: string | null;
          status: "pending" | "paid" | "refunded" | "failed";
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          stripe_session_id: string;
          stripe_payment_intent?: string | null;
          email: string;
          amount_eur: number;
          product: "lease_review_oneshot" | "pro_monthly" | "pro_annual";
          lease_upload_id?: string | null;
          status?: "pending" | "paid" | "refunded" | "failed";
          created_at?: string;
          paid_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      reports: {
        Row: {
          id: string;
          order_id: string;
          status: "queued" | "processing" | "completed" | "failed";
          risk_score: "GREEN" | "YELLOW" | "RED" | null;
          payload: Json | null;
          pdf_storage_path: string | null;
          model_used: string | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          status?: "queued" | "processing" | "completed" | "failed";
          risk_score?: "GREEN" | "YELLOW" | "RED" | null;
          payload?: Json | null;
          pdf_storage_path?: string | null;
          model_used?: string | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
