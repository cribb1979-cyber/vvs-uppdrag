import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { studentRedeemUrl } from "@/lib/links";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];

export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCodeFor, setShowCodeFor] = useState<StudentRow | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { data: c } = await supabase.from("classes").select("*").eq("id", id).single();
    const { data: s } = await supabase.from("students").select("*").eq("class_id", id).order("name");
    setCls(c ?? null);
    setStudents(s ?? []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function addStudent() {
    if (!id || !newName.trim()) return;
    setAdding(true);
    const { data, error } = await supabase.rpc("add_student", { p_class_id: id, p_name: newName.trim() });
    setAdding(false);
    if (error) {
      Alert.alert("Kunde inte lägga till eleven", getErrorMessage(error));
      return;
    }
    setNewName("");
    await load();
    if (data) setShowCodeFor(data);
  }

  async function regenerate(studentId: string) {
    setBusyId(studentId);
    const { data, error } = await supabase.rpc("regenerate_student_code", { p_student_id: studentId });
    setBusyId(null);
    if (error) {
      Alert.alert("Kunde inte skapa ny kod", getErrorMessage(error));
      return;
    }
    await load();
    if (data) setShowCodeFor(data);
  }

  async function remove(studentId: string, name: string) {
    Alert.alert("Ta bort elev?", `${name} kan inte längre logga in. Historik och bedömning behålls.`, [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort",
        style: "destructive",
        onPress: async () => {
          setBusyId(studentId);
          const { error } = await supabase.rpc("remove_student", { p_student_id: studentId });
          setBusyId(null);
          if (error) {
            Alert.alert("Kunde inte ta bort eleven", getErrorMessage(error));
            return;
          }
          load();
        },
      },
    ]);
  }

  if (!cls) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  const active = students.filter((s) => !s.revoked_at);

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{cls.name}</Text>
      <Text style={{ color: theme.muted, marginBottom: 20 }}>
        {[cls.year_level, cls.school_year].filter(Boolean).join(" · ") || "—"}
      </Text>

      {active.length > 0 && (
        <Button
          title="🖨 Skriv ut elevkort"
          variant="secondary"
          onPress={() => router.push(`/(larare)/(tabs)/klasser/${id}/skriv-ut`)}
        />
      )}
      <View style={{ height: 16 }} />

      {showCodeFor && (
        <Card style={styles.codeCard}>
          <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 4 }}>{showCodeFor.name}s kod</Text>
          <Text style={{ color: theme.muted, marginBottom: 12, fontSize: 13, textAlign: "center" }}>
            Eleven skannar denna EN gång — gäller sedan hela läsåret på den enheten.
          </Text>
          <View style={styles.qrWrap}>
            <QRCode value={studentRedeemUrl(showCodeFor.code)} size={140} />
          </View>
          <Text style={[styles.code, { color: theme.text }]}>{showCodeFor.code}</Text>
          <View style={{ height: 12 }} />
          <Button title="Stäng" variant="ghost" onPress={() => setShowCodeFor(null)} />
        </Card>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Elever ({active.length})</Text>
      {active.map((s) => (
        <Card key={s.id} style={styles.studentRow}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCodeFor(s)}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>{s.name}</Text>
            <Text style={{ color: theme.muted, fontSize: 13 }}>{s.code}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => regenerate(s.id)} disabled={busyId === s.id} style={styles.iconBtn}>
            <Text style={{ color: theme.tint, fontSize: 13 }}>Ny kod</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => remove(s.id, s.name)} disabled={busyId === s.id} style={styles.iconBtn}>
            <Text style={{ color: theme.danger, fontSize: 13 }}>Ta bort</Text>
          </TouchableOpacity>
        </Card>
      ))}

      <Card style={{ marginTop: 8 }}>
        <Field label="Elevens namn" placeholder="Förnamn Efternamn" value={newName} onChangeText={setNewName} />
        <Button title="+ Lägg till elev" onPress={addStudent} loading={adding} disabled={!newName.trim()} />
      </Card>

      {students.some((s) => s.revoked_at) && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Borttagna</Text>
          {students
            .filter((s) => s.revoked_at)
            .map((s) => (
              <Card key={s.id} style={styles.studentRow}>
                <Text style={{ color: theme.muted, flex: 1 }}>{s.name}</Text>
                <Badge label="Borttagen" tone="muted" />
              </Card>
            ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 24, marginBottom: 12 },
  studentRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 12 },
  iconBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  codeCard: { alignItems: "center", marginBottom: 8 },
  qrWrap: { padding: 12, backgroundColor: "#fff", borderRadius: 12, marginVertical: 8 },
  code: { fontSize: 16, fontWeight: "800", letterSpacing: 1 },
});
