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
export type AssessmentStatus = "ej_bedomd" | "uppfyller" | "behover_kompletteras";

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
      classes: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          year_level: string;
          school_year: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          year_level?: string;
          school_year?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          year_level?: string;
          school_year?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          class_id: string;
          name: string;
          code: string;
          revoked_at: string | null;
          created_at: string;
        };
        // Skrivs bara via RPC (koden genereras server-side) -- Insert/Update
        // finns ändå med för schemakonsekvens, klienten anropar dem aldrig direkt.
        Insert: {
          id?: string;
          class_id: string;
          name: string;
          code: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      student_links: {
        Row: {
          id: string;
          student_id: string;
          auth_uid: string;
          linked_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          auth_uid: string;
          linked_at?: string;
        };
        Update: never;
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
          year_level: string;
          course_code: string;
          skolverket_ref: string;
          is_template: boolean;
          assessment_visible: boolean;
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
          year_level?: string;
          course_code?: string;
          skolverket_ref?: string;
          is_template?: boolean;
          assessment_visible?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          status?: AssignmentStatus;
          reveal_mode?: RevealMode;
          ai_mode?: AiMode;
          steps?: AssignmentStep[];
          year_level?: string;
          course_code?: string;
          skolverket_ref?: string;
          is_template?: boolean;
          assessment_visible?: boolean;
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
      assignment_assignments: {
        Row: {
          id: string;
          assignment_id: string;
          class_id: string | null;
          student_id: string | null;
          assigned_by: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          class_id?: string | null;
          student_id?: string | null;
          assigned_by: string;
          assigned_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      assignment_participants: {
        Row: {
          id: string;
          assignment_id: string;
          session_id: string | null;
          auth_uid: string | null;
          student_id: string | null;
          joined_at: string;
          plan_submitted_at: string | null;
          plan_locked: boolean;
        };
        // Skrivs bara via RPC (join_session/open_assignment_as_student/
        // submit_material_plan/reopen_material_plan) -- ingen direkt
        // klient-insert/update, se RLS-kommentaren i migrationen.
        Insert: {
          id?: string;
          assignment_id: string;
          session_id?: string | null;
          auth_uid?: string | null;
          student_id?: string | null;
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
      assessment_criteria: {
        Row: {
          id: string;
          assignment_id: string;
          label: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          label: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      assessment_results: {
        Row: {
          id: string;
          criteria_id: string;
          student_id: string;
          status: AssessmentStatus;
          comment: string;
          assessed_by: string | null;
          assessed_at: string;
        };
        Insert: {
          id?: string;
          criteria_id: string;
          student_id: string;
          status?: AssessmentStatus;
          comment?: string;
          assessed_by?: string | null;
          assessed_at?: string;
        };
        Update: {
          status?: AssessmentStatus;
          comment?: string;
          assessed_by?: string | null;
          assessed_at?: string;
        };
        Relationships: [];
      };
      material_catalog: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          article_number: string;
          rsk_number: string;
          dimension: string;
          category: string;
          supplier: string;
          shelf_location: string;
          stock_quantity: number;
          min_quantity: number | null;
          reorder_quantity: number | null;
          image_url: string | null;
          note: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          article_number?: string;
          rsk_number?: string;
          dimension?: string;
          category?: string;
          supplier?: string;
          shelf_location?: string;
          stock_quantity?: number;
          min_quantity?: number | null;
          reorder_quantity?: number | null;
          image_url?: string | null;
          note?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          article_number?: string;
          rsk_number?: string;
          dimension?: string;
          category?: string;
          supplier?: string;
          shelf_location?: string;
          stock_quantity?: number;
          min_quantity?: number | null;
          reorder_quantity?: number | null;
          image_url?: string | null;
          note?: string;
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
      redeem_student_code: {
        Args: { p_code: string };
        Returns: {
          student_id: string;
          name: string;
          class_id: string;
          class_name: string;
        };
      };
      add_student: {
        Args: { p_class_id: string; p_name: string };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      regenerate_student_code: {
        Args: { p_student_id: string };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      remove_student: {
        Args: { p_student_id: string };
        Returns: undefined;
      };
      open_assignment_as_student: {
        Args: { p_assignment_id: string };
        Returns: {
          participant_id: string;
          session_expires_at: string | null;
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
      list_my_assignments: {
        Args: Record<string, never>;
        Returns: Array<{ id: string; title: string; description: string }>;
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
