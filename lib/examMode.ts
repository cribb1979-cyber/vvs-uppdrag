import type { AssignmentStep } from "./database.types";

// Tidsgränsen för "skarpt läge" sparas som ett steg i uppdragets `steps`
// (JSONB). Det kräver ingen databasmigrering och äldre uppdrag påverkas inte.
export interface ExamStep extends AssignmentStep {
  exam?: boolean;
  minutes?: number;
  /** "prov" = skarpt läge (tid och lås), "ovning" = övning utan klocka. */
  lage?: "ovning" | "prov";
}

export function examMeta(taskId: string, minutes: number, lage: "ovning" | "prov"): ExamStep {
  return {
    key: "exam",
    label: `Examensprov · ${lage === "prov" ? "skarpt läge" : "övning"}`,
    open: false,
    exam: true,
    minutes,
    lage,
  };
}

export function examInfo(steps: AssignmentStep[] | null | undefined): { minutes: number | null; lage: "ovning" | "prov" | null } {
  const s = (steps ?? []).find((x) => x && (x as ExamStep).exam) as ExamStep | undefined;
  const minutes = s && typeof s.minutes === "number" && s.minutes > 0 ? s.minutes : null;
  return { minutes, lage: s?.lage ?? (minutes ? "prov" : null) };
}
