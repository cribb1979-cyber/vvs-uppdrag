import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
type Requirement = Database["public"]["Tables"]["material_requirements"]["Row"];
type StudentSession = Database["public"]["Tables"]["student_sessions"]["Row"];
type Participant = Database["public"]["Tables"]["session_participants"]["Row"];

const DURATIONS = [
  { label: "1 dag", days: 1 },
  { label: "3 dagar", days: 3 },
  { label: "7 dagar", days: 7 },
  { label: "14 dagar", days: 14 },
];

function generateCode(title: string) {
  const slug = title
    .toUpperCase()
    .replace(/[ÅÄ]/g, "A")
    .replace(/Ö/g, "O")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  // 6 hex-tecken (24 bitar) ger ~16 miljoner kombinationer per titel-slug --
  // krocksannolikheten är i praktiken försumbar, men insert-anropet nedan
  // försöker ändå igen vid en krock istället för att bara ge upp.
  const suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `VVS-${slug || "UPPDRAG"}-${suffix}`;
}

const UNIQUE_VIOLATION = "23505";

function timeLeftLabel(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Utgången";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours} h kvar`;
  return `${Math.floor(hours / 24)} dagar kvar`;
}

export default function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [creatingSession, setCreatingSession] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [newComponent, setNewComponent] = useState("");
  const [newDimension, setNewDimension] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");

  const load = useCallback(async () => {
    if (!id) return;
    const { data: a } = await supabase.from("assignments").select("*").eq("id", id).single();
    const { data: reqs } = await supabase.from("material_requirements").select("*").eq("assignment_id", id).order("sort_order");
    const { data: sess } = await supabase
      .from("student_sessions")
      .select("*")
      .eq("assignment_id", id)
      .order("created_at", { ascending: false });
    setAssignment(a ?? null);
    setRequirements(reqs ?? []);
    setSessions(sess ?? []);

    if (sess && sess.length > 0) {
      const { data: parts } = await supabase
        .from("session_participants")
        .select("*")
        .in(
          "session_id",
          sess.map((s) => s.id),
        );
      const grouped: Record<string, Participant[]> = {};
      for (const p of parts ?? []) {
        grouped[p.session_id] = [...(grouped[p.session_id] ?? []), p];
      }
      setParticipants(grouped);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function setStatus(status: Assignment["status"]) {
    if (!assignment) return;
    const { error } = await supabase.from("assignments").update({ status }).eq("id", assignment.id);
    if (!error) load();
  }

  async function addRequirement() {
    if (!assignment || !newComponent.trim()) return;
    const nextSortOrder = requirements.reduce((max, r) => Math.max(max, r.sort_order), -1) + 1;
    const { error } = await supabase.from("material_requirements").insert({
      assignment_id: assignment.id,
      component: newComponent.trim(),
      dimension: newDimension.trim(),
      quantity: Math.max(1, Number.parseInt(newQuantity, 10) || 1),
      sort_order: nextSortOrder,
    });
    if (error) {
      Alert.alert("Kunde inte lägga till raden", error.message);
      return;
    }
    setNewComponent("");
    setNewDimension("");
    setNewQuantity("1");
    load();
  }

  async function removeRequirement(reqId: string) {
    await supabase.from("material_requirements").delete().eq("id", reqId);
    load();
  }

  async function createSession(expiresAt: string) {
    if (!assignment) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Försök några gånger vid en (extremt osannolik) kod-krock istället för
    // att bara tyst misslyckas.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode(assignment.title);
      const { error } = await supabase.from("student_sessions").insert({
        assignment_id: assignment.id,
        code,
        created_by: user.id,
        expires_at: expiresAt,
      });
      if (!error) {
        setCreatingSession(false);
        setCustomDate("");
        load();
        return;
      }
      if (error.code !== UNIQUE_VIOLATION) {
        Alert.alert("Kunde inte skapa elevsession", error.message);
        return;
      }
    }
    Alert.alert("Kunde inte skapa elevsession", "Försök igen.");
  }

  function createSessionWithDays(days: number) {
    createSession(new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString());
  }

  function createSessionWithCustomDate() {
    // Tolka ÅÅÅÅ-MM-DD som slutet av den dagen i lärarens LOKALA tidszon --
    // new Date("2026-10-01") tolkas annars som UTC-midnatt, vilket gör att
    // sessionen går ut flera timmar för tidigt lokalt (se join_session-flödet).
    const match = customDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      Alert.alert("Ogiltigt datum", "Ange datum som ÅÅÅÅ-MM-DD.");
      return;
    }
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      Alert.alert("Ogiltigt datum", "Datumet måste vara i framtiden.");
      return;
    }
    createSession(parsed.toISOString());
  }

  async function revokeSession(sessionId: string) {
    await supabase.from("student_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", sessionId);
    load();
  }

  if (!assignment) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  const activeSessions = sessions.filter((s) => !s.revoked_at && new Date(s.expires_at).getTime() > Date.now());

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{assignment.title}</Text>
      {!!assignment.description && <Text style={[styles.desc, { color: theme.muted }]}>{assignment.description}</Text>}

      <View style={styles.statusRow}>
        {(["draft", "active", "archived"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            style={[
              styles.statusChip,
              { borderColor: assignment.status === s ? theme.accent : theme.border, backgroundColor: theme.card },
            ]}
          >
            <Text style={{ color: assignment.status === s ? theme.accent : theme.text, fontWeight: "700", fontSize: 13 }}>
              {s === "draft" ? "Utkast" : s === "active" ? "Aktivt" : "Arkiverat"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle text="Elevsessioner (QR)" theme={theme} />
      {activeSessions.map((s) => (
        <Card key={s.id} style={styles.sessionCard}>
          <View style={styles.qrWrap}>
            <QRCode value={s.code} size={140} />
          </View>
          <Text style={[styles.code, { color: theme.text }]}>{s.code}</Text>
          <Text style={{ color: theme.muted, marginBottom: 8 }}>{timeLeftLabel(s.expires_at)}</Text>
          <Text style={{ color: theme.muted, marginBottom: 12 }}>
            {(participants[s.id] ?? []).length} elev(er) anslutna ·{" "}
            {(participants[s.id] ?? []).filter((p) => p.plan_submitted_at).length} har skickat in
          </Text>
          <Button title="Stäng session" variant="danger" onPress={() => revokeSession(s.id)} />
        </Card>
      ))}

      {creatingSession ? (
        <Card>
          <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 12 }}>Hur länge ska QR-koden gälla?</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d.days}
                style={[styles.durationChip, { borderColor: theme.border, backgroundColor: theme.background }]}
                onPress={() => createSessionWithDays(d.days)}
              >
                <Text style={{ color: theme.text, fontWeight: "600" }}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 8 }}>Eget slutdatum (ÅÅÅÅ-MM-DD):</Text>
          <View style={styles.durationRow}>
            <TextInput
              style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]}
              placeholder="2026-10-01"
              placeholderTextColor={theme.muted}
              value={customDate}
              onChangeText={setCustomDate}
            />
            <TouchableOpacity
              style={[styles.durationChip, { borderColor: theme.border, backgroundColor: theme.background }]}
              onPress={createSessionWithCustomDate}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>Använd datum</Text>
            </TouchableOpacity>
          </View>
          <Button title="Avbryt" variant="ghost" onPress={() => setCreatingSession(false)} />
        </Card>
      ) : (
        <Button title="+ Skapa elevsession" variant="secondary" onPress={() => setCreatingSession(true)} />
      )}

      <SectionTitle text={`Facit (${requirements.length} rader, elever ser: ${revealLabel(assignment.reveal_mode)})`} theme={theme} />
      {requirements.map((r) => (
        <View key={r.id} style={[styles.reqRow, { borderColor: theme.border }]}>
          <Text style={{ color: theme.text, flex: 1 }}>
            {r.component} {r.dimension ? `· ${r.dimension}` : ""}
          </Text>
          <Text style={{ color: theme.muted, marginRight: 12 }}>{r.quantity} st</Text>
          <TouchableOpacity onPress={() => removeRequirement(r.id)}>
            <Text style={{ color: theme.danger }}>Ta bort</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Card style={{ marginTop: 8 }}>
        <View style={styles.addReqRow}>
          <TextInput
            style={[styles.input, { flex: 2, color: theme.text, borderColor: theme.border }]}
            placeholder="Komponent"
            placeholderTextColor={theme.muted}
            value={newComponent}
            onChangeText={setNewComponent}
          />
          <TextInput
            style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]}
            placeholder="Dim"
            placeholderTextColor={theme.muted}
            value={newDimension}
            onChangeText={setNewDimension}
          />
          <TextInput
            style={[styles.input, { width: 50, textAlign: "center", color: theme.text, borderColor: theme.border }]}
            keyboardType="number-pad"
            value={newQuantity}
            onChangeText={setNewQuantity}
          />
        </View>
        <Button title="Lägg till rad" variant="ghost" onPress={addRequirement} />
      </Card>

      <SectionTitle text="Materialplaner från elever" theme={theme} />
      {activeSessions.flatMap((s) => participants[s.id] ?? []).length === 0 && (
        <Text style={{ color: theme.muted }}>Inga elever har anslutit ännu.</Text>
      )}
      {activeSessions
        .flatMap((s) => participants[s.id] ?? [])
        .map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.reqRow, { borderColor: theme.border }]}
            onPress={() => router.push(`/(larare)/(tabs)/uppdrag/plan/${p.id}`)}
          >
            <Text style={{ color: theme.text, flex: 1 }}>Elev {p.id.slice(0, 8)}</Text>
            <Badge
              label={p.plan_submitted_at ? "Inskickad" : "Pågår"}
              tone={p.plan_submitted_at ? "success" : "warning"}
            />
          </TouchableOpacity>
        ))}
    </ScrollView>
  );
}

function revealLabel(mode: Assignment["reveal_mode"]) {
  return mode === "hidden" ? "inget facit" : mode === "count" ? "antal saknade" : "allt facit";
}

function SectionTitle({ text, theme }: { text: string; theme: (typeof Colors)["light"] }) {
  return <Text style={[styles.sectionTitle, { color: theme.text }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800" },
  desc: { fontSize: 15, marginTop: 6, lineHeight: 21 },
  statusRow: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 8 },
  statusChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  sessionCard: { alignItems: "center", marginBottom: 14 },
  qrWrap: { padding: 12, backgroundColor: "#fff", borderRadius: 12, marginBottom: 12 },
  code: { fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  durationChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  reqRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  addReqRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
});
