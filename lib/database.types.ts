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
export type AssignmentKind = "uppdrag" | "quiz";

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
      // ---------------------------------------------------------------
      // NB: Relationships nedan speglar migrationens FK:ar exakt (namn,
      // kolumner, mål) -- postgrest-js använder dem för att typa embeddade
      // selects som `.select("*, students(name)")`. Håll i synk vid
      // schemaändringar, annars faller embed-typning tillbaka på
      // SelectQueryError trots att anropet fungerar fint i praktiken.
      // ---------------------------------------------------------------
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
        Relationships: [
          { foreignKeyName: "profiles_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "classes_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
          { foreignKeyName: "classes_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "students_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "student_links_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ];
      };
      assignments: {
        Row: {
          id: string;
          org_id: string;
          created_by: string;
          title: string;
          description: string;
          status: AssignmentStatus;
          kind: AssignmentKind;
          reveal_mode: RevealMode;
          ai_mode: AiMode;
          steps: AssignmentStep[];
          year_level: string;
          course_code: string;
          skolverket_ref: string;
          is_template: boolean;
          assessment_visible: boolean;
          reference_image_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          created_by: string;
          title: string;
          description?: string;
          status?: AssignmentStatus;
          kind?: AssignmentKind;
          reveal_mode?: RevealMode;
          ai_mode?: AiMode;
          steps?: AssignmentStep[];
          year_level?: string;
          course_code?: string;
          skolverket_ref?: string;
          is_template?: boolean;
          assessment_visible?: boolean;
          reference_image_path?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          status?: AssignmentStatus;
          kind?: AssignmentKind;
          reveal_mode?: RevealMode;
          ai_mode?: AiMode;
          steps?: AssignmentStep[];
          year_level?: string;
          course_code?: string;
          skolverket_ref?: string;
          is_template?: boolean;
          assessment_visible?: boolean;
          reference_image_path?: string | null;
        };
        Relationships: [
          { foreignKeyName: "assignments_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
          { foreignKeyName: "assignments_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "material_requirements_assignment_id_fkey"; columns: ["assignment_id"]; isOneToOne: false; referencedRelation: "assignments"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "student_sessions_assignment_id_fkey"; columns: ["assignment_id"]; isOneToOne: false; referencedRelation: "assignments"; referencedColumns: ["id"] },
          { foreignKeyName: "student_sessions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "assignment_assignments_assignment_id_fkey"; columns: ["assignment_id"]; isOneToOne: false; referencedRelation: "assignments"; referencedColumns: ["id"] },
          { foreignKeyName: "assignment_assignments_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "assignment_assignments_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "assignment_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "assignment_participants_assignment_id_fkey"; columns: ["assignment_id"]; isOneToOne: false; referencedRelation: "assignments"; referencedColumns: ["id"] },
          { foreignKeyName: "assignment_participants_session_id_fkey"; columns: ["session_id"]; isOneToOne: false; referencedRelation: "student_sessions"; referencedColumns: ["id"] },
          { foreignKeyName: "assignment_participants_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "material_plan_items_participant_id_fkey"; columns: ["participant_id"]; isOneToOne: false; referencedRelation: "assignment_participants"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "assessment_criteria_assignment_id_fkey"; columns: ["assignment_id"]; isOneToOne: false; referencedRelation: "assignments"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "assessment_results_criteria_id_fkey"; columns: ["criteria_id"]; isOneToOne: false; referencedRelation: "assessment_criteria"; referencedColumns: ["id"] },
          { foreignKeyName: "assessment_results_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
          { foreignKeyName: "assessment_results_assessed_by_fkey"; columns: ["assessed_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
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
        Relationships: [
          { foreignKeyName: "material_catalog_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
          { foreignKeyName: "material_catalog_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          assignment_id: string;
          image_path: string;
          prompt: string;
          correct_answer: string;
          wrong_answers: string[];
          sort_order: number;
          created_at: string;
        };
        // Ingen SELECT-policy för elevrollen -- se kommentaren högst upp i
        // 0002_quiz.sql. Eleven når frågorna enbart via get_quiz_view.
        Insert: {
          id?: string;
          assignment_id: string;
          image_path: string;
          prompt?: string;
          correct_answer: string;
          wrong_answers: string[];
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          image_path?: string;
          prompt?: string;
          correct_answer?: string;
          wrong_answers?: string[];
          sort_order?: number;
        };
        Relationships: [
          { foreignKeyName: "quiz_questions_assignment_id_fkey"; columns: ["assignment_id"]; isOneToOne: false; referencedRelation: "assignments"; referencedColumns: ["id"] },
        ];
      };
      quiz_answers: {
        Row: {
          id: string;
          participant_id: string;
          question_id: string;
          selected_answer: string;
          is_correct: boolean;
          answered_at: string;
        };
        // Skrivs bara via submit_quiz_answer (SECURITY DEFINER) -- klienten
        // insertar aldrig direkt hit.
        Insert: {
          id?: string;
          participant_id: string;
          question_id: string;
          selected_answer: string;
          is_correct: boolean;
          answered_at?: string;
        };
        Update: never;
        Relationships: [
          { foreignKeyName: "quiz_answers_participant_id_fkey"; columns: ["participant_id"]; isOneToOne: false; referencedRelation: "assignment_participants"; referencedColumns: ["id"] },
          { foreignKeyName: "quiz_answers_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "quiz_questions"; referencedColumns: ["id"] },
        ];
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
            kind: AssignmentKind;
            reveal_mode: RevealMode;
            ai_mode: AiMode;
            steps: AssignmentStep[];
            reference_image_path: string | null;
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
            kind: AssignmentKind;
            reveal_mode: RevealMode;
            ai_mode: AiMode;
            steps: AssignmentStep[];
            reference_image_path: string | null;
          };
          plan_locked: boolean;
          plan_submitted_at: string | null;
        };
      };
      list_my_assignments: {
        Args: Record<string, never>;
        Returns: Array<{ id: string; title: string; description: string; kind: AssignmentKind }>;
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
      get_quiz_view: {
        Args: { p_participant_id: string };
        Returns: {
          assignment_title: string;
          questions: Array<{
            id: string;
            image_path: string;
            prompt: string;
            options: string[];
            answered_correct: boolean | null;
          }>;
        };
      };
      submit_quiz_answer: {
        Args: { p_participant_id: string; p_question_id: string; p_selected_answer: string };
        Returns: { correct: boolean; correct_answer: string };
      };
      get_quiz_results: {
        Args: { p_assignment_id: string };
        Returns: Array<{
          participant_id: string;
          student_name: string | null;
          answered_count: number;
          correct_count: number;
          total_questions: number;
        }>;
      };
      get_my_assessment_view: {
        Args: { p_participant_id: string };
        Returns: {
          visible: boolean;
          results: Array<{ criteria_label: string; status: AssessmentStatus; comment: string }>;
        };
      };
    };
  };
}
