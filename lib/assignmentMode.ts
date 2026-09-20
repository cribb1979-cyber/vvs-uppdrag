import type { AiMode, RevealMode } from "./database.types";

// Övningsläge/Provläge är EN användarvänlig växel ovanpå två fält som redan
// fanns (reveal_mode, ai_mode) -- se 0004_ovning_provlage.sql. "count"
// (reveal_mode) förekommer inte här -- det är kvar i databasen för
// bakåtkompatibilitet men erbjuds inte längre i UI:t.
export type AssignmentMode = "ovning" | "prov";

export const MODE_OPTIONS: { value: AssignmentMode; label: string; hint: string }[] = [
  { value: "ovning", label: "🎓 Övningsläge", hint: "Eleven ser facit och referensbild" },
  { value: "prov", label: "🔒 Provläge", hint: "Facit, referensbild och AI-hjälp avstängt" },
];

export function modeToFields(mode: AssignmentMode): { reveal_mode: RevealMode; ai_mode: AiMode } {
  return mode === "ovning" ? { reveal_mode: "full", ai_mode: "app_help_only" } : { reveal_mode: "hidden", ai_mode: "off" };
}

export function modeFromFields(reveal_mode: RevealMode): AssignmentMode {
  return reveal_mode === "full" ? "ovning" : "prov";
}
