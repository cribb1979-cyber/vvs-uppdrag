import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Requirement = Database["public"]["Tables"]["material_requirements"]["Row"];
type PlanItem = Database["public"]["Tables"]["material_plan_items"]["Row"];
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
type Participant = Database["public"]["Tables"]["assignment_participants"]["Row"] & {
  students: { name: string } | null;
};

function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

type MatchStatus = "match" | "review" | "missing";

function norm(s: string) {
  return s.trim().toLowerCase();
}

interface ComparisonRow {
  req: Requirement;
  status: MatchStatus;
  found: PlanItem | null;
}

// Varje elev-rad får bara "användas" som bevis för EN kravrad -- annars kan
// samma angivna komponent räknas som matchning för flera krav samtidigt
// (t.ex. två kravrader "Rörklämma" i olika dimensioner som båda pekar på
// elevens enda "Rörklämma"-rad). Två pass: exakt matchning (komponent +
// dimension + tillräckligt antal) före löst matchning (bara komponent),
// så att en exakt träff aldrig blockeras av att en annan kravrad redan
// tagit samma elev-rad i det lösa passet.
function compare(requirements: Requirement[], items: PlanItem[]): { rows: ComparisonRow[]; usedItemIds: Set<string> } {
  const usedItemIds = new Set<string>();
  const rows = new Map<string, ComparisonRow>();

  for (const req of requirements) {
    const exact = items.find(
      (it) => !usedItemIds.has(it.id) && norm(it.component) === norm(req.component) && norm(it.dimension) === norm(req.dimension) && it.quantity >= req.quantity,
    );
    if (exact) {
      usedItemIds.add(exact.id);
      rows.set(req.id, { req, status: "match", found: exact });
    }
  }

  for (const req of requirements) {
    if (rows.has(req.id)) continue;
    const loose = items.find((it) => !usedItemIds.has(it.id) && norm(it.component) === norm(req.component));
    if (loose) {
      usedItemIds.add(loose.id);
      rows.set(req.id, { req, status: "review", found: loose });
    } else {
      rows.set(req.id, { req, status: "missing", found: null });
    }
  }

  return { rows: requirements.map((req) => rows.get(req.id)!), usedItemIds };
}

const STATUS_META: Record<MatchStatus, { emoji: string; label: string; tone: "success" | "warning" | "danger" }> = {
  match: { emoji: "🟢", label: "Matchar", tone: "success" },
  review: { emoji: "🟡", label: "Behöver granskas", tone: "warning" },
  missing: { emoji: "🔴", label: "Saknas", tone: "danger" },
};

export default function PlanReview() {
  const { participantId } = useLocalSearchParams<{ participantId: string }>();
  const theme = Colors[useColorScheme() ?? "light"];

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!participantId) return;
    const { data: part } = await supabase
      .from("assignment_participants")
      .select("*, students(name)")
      .eq("id", participantId)
      .single();
    if (!part) return;
    setParticipant(part);

    const { data: reqs } = await supabase
      .from("material_requirements")
      .select("*")
      .eq("assignment_id", part.assignment_id)
      .order("sort_order");
    const { data: planItems } = await supabase.from("material_plan_items").select("*").eq("participant_id", participantId);
    const { data: entries } = await supabase
      .from("time_entries")
      .select("*")
      .eq("participant_id", participantId)
      .order("work_date", { ascending: false });
    setRequirements(reqs ?? []);
    setItems(planItems ?? []);
    setTimeEntries(entries ?? []);
  }, [participantId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function reopen() {
    if (!participant) return;
    setBusy(true);
    const { error } = await supabase.rpc("reopen_material_plan", { p_participant_id: participant.id });
    setBusy(false);
    if (!error) load();
  }

  if (!participant) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  const { rows: results, usedItemIds } = compare(requirements, items);
  const extras = items.filter((it) => !usedItemIds.has(it.id));
  const counts = results.reduce(
    (acc, r) => ({ ...acc, [r.status]: acc[r.status] + 1 }),
    { match: 0, review: 0, missing: 0 } as Record<MatchStatus, number>,
  );

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{participant.students?.name ? `Materialplan — ${participant.students.name}` : "Materialplan"}</Text>
      <Text style={{ color: theme.muted, marginBottom: 4 }}>
        {participant.plan_submitted_at
          ? `Inskickad ${new Date(participant.plan_submitted_at).toLocaleString("sv-SE")}`
          : "Ej inskickad ännu — eleven arbetar fortfarande"}
      </Text>

      <View style={styles.summaryRow}>
        <Text style={{ color: theme.success, fontWeight: "700" }}>🟢 {counts.match}</Text>
        <Text style={{ color: theme.warning, fontWeight: "700" }}>🟡 {counts.review}</Text>
        <Text style={{ color: theme.danger, fontWeight: "700" }}>🔴 {counts.missing}</Text>
      </View>

      {results.map(({ req, status, found }) => {
        const meta = STATUS_META[status];
        return (
          <Card key={req.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: "700" }}>
                {meta.emoji} {req.component} {req.dimension ? `· ${req.dimension}` : ""}
              </Text>
              <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>Krav: {req.quantity} st</Text>
              {found && (
                <Text style={{ color: theme.muted, fontSize: 13 }}>
                  Elev angav: {found.component} {found.dimension ? `· ${found.dimension}` : ""} — {found.quantity} st
                </Text>
              )}
            </View>
            <Badge label={meta.label} tone={meta.tone} />
          </Card>
        );
      })}

      {extras.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Övrigt eleven angett</Text>
          {extras.map((it) => (
            <Card key={it.id} style={styles.row}>
              <Text style={{ color: theme.text }}>
                {it.component} {it.dimension ? `· ${it.dimension}` : ""} — {it.quantity} st
              </Text>
            </Card>
          ))}
        </>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Tidrapport ({formatMinutes(timeEntries.reduce((sum, e) => sum + e.minutes, 0))})
      </Text>
      {timeEntries.length === 0 && <Text style={{ color: theme.muted }}>Inga arbetspass loggade ännu.</Text>}
      {timeEntries.map((e) => (
        <Card key={e.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {e.work_date} · {formatMinutes(e.minutes)}
            </Text>
            {!!e.comment && <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>{e.comment}</Text>}
          </View>
        </Card>
      ))}

      {participant.plan_locked && (
        <>
          <View style={{ height: 20 }} />
          <Button title="Öppna för komplettering" variant="secondary" onPress={reopen} loading={busy} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  summaryRow: { flexDirection: "row", gap: 16, marginVertical: 16 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 20, marginBottom: 10 },
});
