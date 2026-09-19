// Handskrivna typer som speglar supabase/migrations/0001_init.sql.
// Byt ut mot `supabase gen types typescript` när Supabase CLI är länkad
// mot projektet -- håll strukturen identisk tills dess.
//
// VIKTIGT: skriv Insert/Update som platta objektlitteraler (precis som
// `supabase gen types` faktiskt genererar), ANVÄND INTE `Partial<Row>`.
// Ett mappat `Partial<>`-typ här får postgrest-js (2.116) typinferens för
// `.rpc()` att kollapsa till `undefined` för ALLA funktioner i hela
// schemat -- verifierat empiriskt, se git-historik för detaljerad felsökning.

export type ProfileRole = "admin" | "teacher";
export type ProfileStatus = "pending" | "approved";
export type AssignmentStatus = "draft" | "active" | "archived";
export type RevealMode = "hidden" | "count" | "full";
export type AiMode = "off" | "app_help_only" | "general" | "full";

export interface AssignmentStep {
  key: string;
  label: string;
  open: boolean;
}

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string;
          name: string;
          join_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          join_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          join_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          org_id: string;
          full_name: string;
          role: ProfileRole;
          status: ProfileStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          org_id: string;
          full_name?: string;
          role?: ProfileRole;
          status?: ProfileStatus;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          role?: ProfileRole;
          status?: ProfileStatus;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          org_id: string;
          created_by: string;
          title: string;
          description: string;
          status: AssignmentStatus;
          reveal_mode: RevealMode;
          ai_mode: AiMode;
          steps: AssignmentStep[];
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          created_by: string;
          title: string;
          description?: string;
          status?: AssignmentStatus;
          reveal_mode?: RevealMode;
          ai_mode?: AiMode;
          steps?: AssignmentStep[];
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          status?: AssignmentStatus;
          reveal_mode?: RevealMode;
          ai_mode?: AiMode;
          steps?: AssignmentStep[];
        };
        Relationships: [];
      };
      material_requirements: {
        Row: {
          id: string;
          assignment_id: string;
          component: string;
          dimension: string;
          quantity: number;
          note: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          component: string;
          dimension?: string;
          quantity?: number;
          note?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          component?: string;
          dimension?: string;
          quantity?: number;
          note?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      student_sessions: {
        Row: {
          id: string;
          assignment_id: string;
          code: string;
          created_by: string;
          expires_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          code: string;
          created_by: string;
          expires_at: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          revoked_at?: string | null;
          expires_at?: string;
        };
        Relationships: [];
      };
      session_participants: {
        Row: {
          id: string;
          session_id: string;
          auth_uid: string;
          joined_at: string;
          plan_submitted_at: string | null;
          plan_locked: boolean;
        };
        Insert: {
          id?: string;
          session_id: string;
          auth_uid: string;
          joined_at?: string;
          plan_submitted_at?: string | null;
          plan_locked?: boolean;
        };
        Update: {
          plan_submitted_at?: string | null;
          plan_locked?: boolean;
        };
        Relationships: [];
      };
      material_plan_items: {
        Row: {
          id: string;
          participant_id: string;
          component: string;
          dimension: string;
          quantity: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          component: string;
          dimension?: string;
          quantity?: number;
          comment?: string;
          created_at?: string;
        };
        Update: {
          component?: string;
          dimension?: string;
          quantity?: number;
          comment?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_org_and_admin: {
        Args: { org_name: string; teacher_name: string };
        Returns: Database["public"]["Tables"]["orgs"]["Row"];
      };
      join_org: {
        Args: { code: string; teacher_name: string };
        Returns: Database["public"]["Tables"]["orgs"]["Row"];
      };
      join_session: {
        Args: { session_code: string };
        Returns: {
          participant_id: string;
          session_expires_at: string;
          assignment: {
            id: string;
            title: string;
            description: string;
            reveal_mode: RevealMode;
            ai_mode: AiMode;
            steps: AssignmentStep[];
          };
          plan_locked: boolean;
          plan_submitted_at: string | null;
        };
      };
      get_requirements_view: {
        Args: { p_participant_id: string };
        Returns:
          | { hidden: true; count: number | null }
          | Array<{ component: string; dimension: string; quantity: number; note: string }>;
      };
      submit_material_plan: {
        Args: { p_participant_id: string };
        Returns: undefined;
      };
      reopen_material_plan: {
        Args: { p_participant_id: string };
        Returns: undefined;
      };
    };
  };
}
