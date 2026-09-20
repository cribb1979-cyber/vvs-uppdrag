import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { AssessmentStatus, Database } from "@/lib/database.types";

type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
type Criteria = Database["public"]["Tables"]["assessment_criteria"]["Row"];
type Result = Database["public"]["Tables"]["assessment_results"]["Row"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];

interface StudentWithClass extends StudentRow {
  classes: { name: string } | null;
}

const STATUS_ORDER: AssessmentStatus[] = ["ej_bedomd", "uppfyller", "behover_kompletteras"];

function statusColor(status: AssessmentStatus, theme: (typeof Colors)["light"]) {
  if (status === "uppfyller") return theme.success;
  if (status === "behover_kompletteras") return theme.warning;
  return theme.muted;
}

function statusIcon(status: AssessmentStatus) {
  if (status === "uppfyller") return "✓";
  if (status === "behover_kompletteras") return "△";
  return "–";
}

function statusLabel(status: AssessmentStatus) {
  if (status === "uppfyller") return "Uppfyller";
  if (status === "behover_kompletteras") return "Komplettera";
  return "Ej bedömd";
}

export default function Bedomning() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const { profile } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [selected, setSelected] = useState<{ studentId: string; criteriaId: string } | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: a }, { data: crit }, { data: aa }] = await Promise.all([
      supabase.from("assignments").select("*").eq("id", id).single(),
      supabase.from("assessment_criteria").select("*").eq("assignment_id", id).order("sort_order"),
      supabase.from("assignment_assignments").select("*").eq("assignment_id", id),
    ]);
    setAssignment(a ?? null);
    setCriteria(crit ?? []);

    // Eleverna som ska bedömas är de som fått uppdraget via klass ELLER
    // direkt enskild tilldelning (assignment_assignments) -- inte via
    // anonyma QR-sessioner, som saknar en stabil elevidentitet över tid.
    const classIds = (aa ?? []).map((r) => r.class_id).filter((v): v is string => !!v);
    const directIds = (aa ?? []).map((r) => r.student_id).filter((v): v is string => !!v);
    const criteriaIds = (crit ?? []).map((c) => c.id);

    const [{ data: viaClass }, { data: viaDirect }, { data: res }] = await Promise.all([
      supabase.from("students").select("*, classes(name)").in("class_id", classIds).is("revoked_at", null),
      supabase.from("students").select("*, classes(name)").in("id", directIds).is("revoked_at", null),
      supabase.from("assessment_results").select("*").in("criteria_id", criteriaIds),
    ]);

    const merged = new Map<string, StudentWithClass>();
    for (const s of [...((viaClass as StudentWithClass[]) ?? []), ...((viaDirect as StudentWithClass[]) ?? [])]) merged.set(s.id, s);
    setStudents([...merged.values()].sort((a, b) => a.name.localeCompare(b.name, "sv")));
    setResults(res ?? []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function resultFor(studentId: string, criteriaId: string) {
    return results.find((r) => r.student_id === studentId && r.criteria_id === criteriaId) ?? null;
  }

  async function saveResult(studentId: string, criteriaId: string, patch: { status?: AssessmentStatus; comment?: string }) {
    const current = resultFor(studentId, criteriaId);
    const { error } = await supabase.from("assessment_results").upsert(
      {
        criteria_id: criteriaId,
        student_id: studentId,
        status: patch.status ?? current?.status ?? "ej_bedomd",
        comment: patch.comment ?? current?.comment ?? "",
        assessed_by: profile?.id,
        assessed_at: new Date().toISOString(),
      },
      { onConflict: "criteria_id,student_id" },
    );
    if (error) {
      Alert.alert("Kunde inte spara bedömningen", getErrorMessage(error));
      return;
    }
    load();
  }

  async function cycleStatus(studentId: string, criteriaId: string) {
    const current = resultFor(studentId, criteriaId)?.status ?? "ej_bedomd";
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
    await saveResult(studentId, criteriaId, { status: next });
  }

  function openComment(studentId: string, criteriaId: string) {
    setSelected({ studentId, criteriaId });
    setCommentDraft(resultFor(studentId, criteriaId)?.comment ?? "");
  }

  async function addCriteria() {
    if (!id || !newLabel.trim()) return;
    const nextSortOrder = criteria.reduce((max, c) => Math.max(max, c.sort_order), -1) + 1;
    const { error } = await supabase.from("assessment_criteria").insert({ assignment_id: id, label: newLabel.trim(), sort_order: nextSortOrder });
    if (error) {
      Alert.alert("Kunde inte lägga till kriteriet", getErrorMessage(error));
      return;
    }
    setNewLabel("");
    load();
  }

  async function removeCriteria(criteriaId: string) {
    await supabase.from("assessment_criteria").delete().eq("id", criteriaId);
    if (selected?.criteriaId === criteriaId) setSelected(null);
    load();
  }

  async function toggleVisible() {
    if (!id || !assignment) return;
    const { error } = await supabase.from("assignments").update({ assessment_visible: !assignment.assessment_visible }).eq("id", id);
    if (error) {
      Alert.alert("Kunde inte ändra synlighet", getErrorMessage(error));
      return;
    }
    load();
  }

  if (!assignment) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  const selectedStudent = selected ? students.find((s) => s.id === selected.studentId) : null;
  const selectedCriteria = selected ? criteria.find((c) => c.id === selected.criteriaId) : null;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{assignment.title}</Text>
      <Text style={{ color: theme.muted, marginBottom: 4 }}>Bedömning</Text>

      <Card style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>
            {assignment.assessment_visible ? "🔓 Synlig för eleverna" : "🔒 Dold för eleverna"}
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
            {assignment.assessment_visible
              ? "Eleverna ser sin bedömning under \"Mina uppdrag\"."
              : "Fyll i kriterierna klart innan du publicerar."}
          </Text>
        </View>
        <Button title={assignment.assessment_visible ? "Dölj" : "Publicera"} variant="secondary" onPress={toggleVisible} />
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Kriterier</Text>
      {criteria.map((c) => (
        <View key={c.id} style={[styles.reqRow, { borderColor: theme.border }]}>
          <Text style={{ color: theme.text, flex: 1 }}>{c.label}</Text>
          <TouchableOpacity onPress={() => removeCriteria(c.id)}>
            <Text style={{ color: theme.danger }}>Ta bort</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Card style={{ marginTop: 8 }}>
        <View style={styles.addReqRow}>
          <TextInput
            style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]}
            placeholder="T.ex. Lödfog tät och jämn"
            placeholderTextColor={theme.muted}
            value={newLabel}
            onChangeText={setNewLabel}
          />
        </View>
        <Button title="Lägg till kriterium" variant="ghost" onPress={addCriteria} />
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Betygsgrid</Text>
      {criteria.length === 0 || students.length === 0 ? (
        <Text style={{ color: theme.muted }}>
          {criteria.length === 0
            ? "Lägg till minst ett kriterium för att börja bedöma."
            : "Inga elever tilldelade (endast klasser/enskilda elever, inte QR-sessioner, kan bedömas)."}
        </Text>
      ) : (
        <>
          <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 10 }}>
            Tryck för att växla status. Håll intryckt för att skriva en kommentar.
          </Text>
          <View style={styles.gridWrap}>
            <View>
              <View style={styles.cornerCell} />
              {students.map((s) => (
                <View key={s.id} style={[styles.nameCell, { borderColor: theme.border }]}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 13 }} numberOfLines={2}>
                    {s.name}
                  </Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={{ flexDirection: "row" }}>
                  {criteria.map((c) => (
                    <View key={c.id} style={[styles.critHeaderCell, { borderColor: theme.border }]}>
                      <Text style={{ color: theme.text, fontWeight: "700", fontSize: 12 }} numberOfLines={3}>
                        {c.label}
                      </Text>
                    </View>
                  ))}
                </View>
                {students.map((s) => (
                  <View key={s.id} style={{ flexDirection: "row" }}>
                    {criteria.map((c) => {
                      const status = resultFor(s.id, c.id)?.status ?? "ej_bedomd";
                      const color = statusColor(status, theme);
                      const isSelected = selected?.studentId === s.id && selected?.criteriaId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.cell,
                            { backgroundColor: color + "22", borderColor: isSelected ? theme.accent : theme.border },
                          ]}
                          onPress={() => cycleStatus(s.id, c.id)}
                          onLongPress={() => openComment(s.id, c.id)}
                        >
                          <Text style={{ color, fontWeight: "800", fontSize: 18 }}>{statusIcon(status)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.legendRow}>
            {STATUS_ORDER.map((st) => (
              <View key={st} style={styles.legendItem}>
                <Text style={{ color: statusColor(st, theme), fontWeight: "800" }}>{statusIcon(st)}</Text>
                <Text style={{ color: theme.muted, fontSize: 12 }}>{statusLabel(st)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {selected && selectedStudent && selectedCriteria && (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 12 }}>
            {selectedStudent.name} · {selectedCriteria.label}
          </Text>
          <View style={styles.statusChipRow}>
            {STATUS_ORDER.map((st) => {
              const active = (resultFor(selected.studentId, selected.criteriaId)?.status ?? "ej_bedomd") === st;
              const color = statusColor(st, theme);
              return (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChip,
                    { borderColor: color, backgroundColor: active ? color + "22" : "transparent" },
                  ]}
                  onPress={() => saveResult(selected.studentId, selected.criteriaId, { status: st })}
                >
                  <Text style={{ color, fontWeight: "700", fontSize: 13 }}>{statusLabel(st)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Field
            label="Kommentar"
            placeholder="Valfri kommentar till eleven eller för egen del"
            multiline
            numberOfLines={3}
            value={commentDraft}
            onChangeText={setCommentDraft}
          />
          <View style={styles.durationRow}>
            <View style={{ flex: 1 }}>
              <Button
                title="Spara kommentar"
                variant="secondary"
                onPress={() => saveResult(selected.studentId, selected.criteriaId, { comment: commentDraft })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Stäng" variant="ghost" onPress={() => setSelected(null)} />
            </View>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  reqRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  addReqRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  gridWrap: { flexDirection: "row" },
  cornerCell: { width: 110, height: 62 },
  nameCell: { width: 110, height: 56, justifyContent: "center", paddingRight: 8, borderTopWidth: 1 },
  critHeaderCell: { width: 92, height: 62, justifyContent: "center", alignItems: "center", padding: 4, borderTopWidth: 1, borderLeftWidth: 1 },
  cell: { width: 92, height: 56, justifyContent: "center", alignItems: "center", borderTopWidth: 1, borderLeftWidth: 1.5 },
  legendRow: { flexDirection: "row", gap: 16, marginTop: 14, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusChipRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  statusChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  durationRow: { flexDirection: "row", gap: 8, marginTop: 8 },
});
