import type {
  AiMode,
  AssignmentKind,
  AssignmentStep,
  Json,
  RevealMode,
  UppdragsbankStatus,
} from "./database.types";
import { supabase } from "./supabase";

export interface BankPayload {
  assignment: {
    title: string;
    description: string;
    kind: AssignmentKind;
    reveal_mode: RevealMode;
    ai_mode: AiMode;
    steps: AssignmentStep[];
    year_level: string;
    course_code: string;
    skolverket_ref: string;
    assessment_visible: boolean;
    reference_image_path: string | null;
    goal: string;
    self_check_items: string[];
    reflection_questions: string[];
    rule_refs: string[];
  };
  material_requirements: Array<{
    component: string;
    dimension: string;
    quantity: number;
    note: string;
    sort_order: number;
  }>;
  quiz_questions: Array<{
    image_path: string;
    prompt: string;
    correct_answer: string;
    wrong_answers: string[];
    sort_order: number;
  }>;
  assessment_criteria: Array<{ label: string; sort_order: number }>;
}

export interface UppdragsbankMall {
  id: string;
  agare_org_id: string;
  created_by: string;
  titel: string;
  beskrivning: string;
  year_level: string;
  course_code: string;
  kind: AssignmentKind;
  payload: BankPayload;
  regel_refs: string[];
  version: number;
  status: UppdragsbankStatus;
  granskad_av: string | null;
  granskad_at: string | null;
  granskningskommentar: string;
  source_mall_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UppdragsbankGranskning {
  id: string;
  mall_id: string;
  granskare: string;
  godkand: boolean;
  kommentar: string;
  created_at: string;
}

export const BANK_STATUS_LABEL: Record<UppdragsbankStatus, string> = {
  utkast: "Utkast",
  granskning: "Granskas",
  godkand: "Godkänd",
  avslagen: "Avslagen",
};

export const BANK_STATUS_TONE: Record<
  UppdragsbankStatus,
  "muted" | "success" | "warning" | "danger" | "accent"
> = {
  utkast: "muted",
  granskning: "warning",
  godkand: "success",
  avslagen: "danger",
};

/** Alla mallar som RLS ger mig tillgång till: godkända + min egen skolas. */
export async function listaMallar(): Promise<UppdragsbankMall[]> {
  const { data, error } = await supabase
    .from("uppdragsbank_mallar")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as UppdragsbankMall[];
}

export async function hamtaMall(id: string): Promise<UppdragsbankMall | null> {
  const { data, error } = await supabase
    .from("uppdragsbank_mallar")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as UppdragsbankMall | null) ?? null;
}

/** Frys ett av mina uppdrag till en bankmall. Går till granskning direkt. */
export async function skapaMallFranUppdrag(
  assignmentId: string,
  opts?: { titel?: string; beskrivning?: string; regelRefs?: string[] },
): Promise<string> {
  const { data, error } = await supabase.rpc("skapa_uppdragsbank_mall", {
    p_assignment_id: assignmentId,
    p_titel: opts?.titel ?? null,
    p_beskrivning: opts?.beskrivning ?? null,
    p_regel_refs: opts?.regelRefs ?? null,
  });
  if (error) throw error;
  return data as string;
}

/** Djup kopia av en godkänd (eller egen skolas) mall till min org. */
export async function taUtMall(mallId: string): Promise<string> {
  const { data, error } = await supabase.rpc("ta_ut_uppdragsbank_mall", {
    p_mall_id: mallId,
  });
  if (error) throw error;
  return data as string;
}

export async function granskaMall(
  mallId: string,
  godkann: boolean,
  kommentar = "",
): Promise<UppdragsbankStatus> {
  const { data, error } = await supabase.rpc("granska_uppdragsbank_mall", {
    p_mall_id: mallId,
    p_godkann: godkann,
    p_kommentar: kommentar,
  });
  if (error) throw error;
  return data as UppdragsbankStatus;
}

export async function ateroppnaMall(mallId: string): Promise<void> {
  const { error } = await supabase.rpc("ateroppna_uppdragsbank_mall", {
    p_mall_id: mallId,
  });
  if (error) throw error;
}

export async function listaGranskningar(mallId: string): Promise<UppdragsbankGranskning[]> {
  const { data, error } = await supabase
    .from("uppdragsbank_granskningar")
    .select("*")
    .eq("mall_id", mallId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as UppdragsbankGranskning[];
}

/** Radera en mall man äger (eller som admin i samma org). */
export async function raderaMall(mallId: string): Promise<void> {
  const { error } = await supabase.from("uppdragsbank_mallar").delete().eq("id", mallId);
  if (error) throw error;
}

/** Uppskattning som används i listan – antal rader i snabböversikten. */
export function sammanfatta(mall: UppdragsbankMall): string {
  const delar: string[] = [];
  if (mall.year_level) delar.push(mall.year_level);
  if (mall.course_code) delar.push(mall.course_code);
  if (mall.kind === "quiz") delar.push("quiz");
  if (mall.payload?.material_requirements?.length) {
    delar.push(`${mall.payload.material_requirements.length} materialrader`);
  }
  if (mall.payload?.quiz_questions?.length) {
    delar.push(`${mall.payload.quiz_questions.length} frågor`);
  }
  if (mall.regel_refs?.length) delar.push(`${mall.regel_refs.length} Säkervatten-regler`);
  return delar.join(" · ");
}

/** JSON-typen från Supabase är bred; den här hjälper TypeScript i UI:t. */
export function somPayload(v: Json): BankPayload {
  return v as unknown as BankPayload;
}
