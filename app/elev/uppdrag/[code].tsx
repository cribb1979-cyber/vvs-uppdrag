import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { quizImageUrl } from "@/lib/quizImages";
import { supabase } from "@/lib/supabase";
import { TeacherSignedInError, useStudentSession } from "@/lib/useStudentSession";

function timeLeftLabel(expiresAt: string | null) {
  if (!expiresAt) return "Ingen tidsgräns";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Avslutat";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return `${Math.floor(hours / 24)} dagar kvar`;
  if (hours >= 1) return `${hours} tim ${minutes} min kvar`;
  return `${minutes} min kvar`;
}

export default function ElevUppdrag() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { data, error, loading, refresh } = useStudentSession(code);

  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [selfCheck, setSelfCheck] = useState<Record<string, boolean>>({});
  const [savingSelf, setSavingSelf] = useState(false);
  const [reflection, setReflection] = useState<Record<string, string>>({});
  const [savingRefl, setSavingRefl] = useState(false);

  const loadName = useCallback(async () => {
    if (!data?.participant_id) return;
    const { data: row } = await supabase
      .from("assignment_participants")
      .select("display_name")
      .eq("id", data.participant_id)
      .single();
    setSavedName(row?.display_name ?? null);
    setName(row?.display_name ?? "");
  }, [data?.participant_id]);

  useEffect(() => {
    loadName();
  }, [loadName]);

  // Fyll egenkontrollen + reflektionen från det som redan sparats.
  useEffect(() => {
    if (data) {
      setSelfCheck(data.self_check ?? {});
      setReflection(data.reflection ?? {});
    }
  }, [data]);

  async function saveReflection() {
    if (!data?.participant_id) return;
    setSavingRefl(true);
    const { error: saveError } = await supabase.rpc("submit_reflection", {
      p_participant_id: data.participant_id,
      p_answers: reflection,
    });
    setSavingRefl(false);
    if (saveError) {
      Alert.alert("Kunde inte spara", getErrorMessage(saveError));
      return;
    }
    await refresh();
    Alert.alert("Tack!", "Reflektionen är sparad.");
  }

  async function saveSelfCheck() {
    if (!data?.participant_id) return;
    setSavingSelf(true);
    const { error: saveError } = await supabase.rpc("submit_self_check", {
      p_participant_id: data.participant_id,
      p_answers: selfCheck,
    });
    setSavingSelf(false);
    if (saveError) {
      Alert.alert("Kunde inte spara", getErrorMessage(saveError));
      return;
    }
    await refresh();
    Alert.alert("Tack!", "Din egen kontroll är sparad.");
  }

  async function saveName() {
    if (!data?.participant_id || !name.trim()) return;
    setSavingName(true);
    const { error: saveError } = await supabase.rpc("set_participant_display_name", {
      p_participant_id: data.participant_id,
      p_name: name.trim(),
    });
    setSavingName(false);
    if (saveError) {
      Alert.alert("Kunde inte spara namnet", getErrorMessage(saveError));
      return;
    }
    setSavedName(name.trim());
  }

  // Kontrollera utgång live medan eleven tittar på skärmen -- inte bara
  // vid navigering. Går sessionen ut medan skärmen är öppen ska den bli
  // ogiltig automatiskt, inte först nästa gång appen öppnas.
  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error) {
    const isTeacherConflict = error.includes("inloggad som lärare");
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.emoji}>{isTeacherConflict ? "👩‍🏫" : "⏱️"}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{isTeacherConflict ? "Inloggad som lärare" : "Uppdraget har avslutats"}</Text>
        <Text style={[styles.body, { color: theme.muted }]}>{error}</Text>
        <View style={{ height: 20 }} />
        {isTeacherConflict ? (
          <Button title="Logga ut" variant="secondary" onPress={() => supabase.auth.signOut().then(refresh)} />
        ) : (
          <Button title="Skanna en ny kod" variant="secondary" onPress={() => router.replace("/elev/scan")} />
        )}
      </View>
    );
  }

  if (!data) return null;

  const selfItems = data.assignment.self_check_items ?? [];
  const reflItems = data.assignment.reflection_questions ?? [];

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.eyebrow, { color: theme.accent }]}>Du är ansluten till</Text>
      <Text style={[styles.title, { color: theme.text }]}>{data.assignment.title}</Text>
      {!!data.assignment.description && <Text style={[styles.body, { color: theme.muted }]}>{data.assignment.description}</Text>}

      {!!data.assignment.goal && (
        <Card style={{ marginTop: 14, borderColor: theme.accent, borderWidth: 1 }}>
          <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>🎯 DAGENS MÅL</Text>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", marginTop: 4 }}>{data.assignment.goal}</Text>
        </Card>
      )}

      <Card style={{ marginTop: 20 }}>
        <Text style={{ color: theme.muted, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>DITT NAMN (VISAS FÖR LÄRAREN)</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={[styles.nameInput, { flex: 1, color: theme.text, borderColor: theme.border }]}
            placeholder="T.ex. Förnamn Efternamn"
            placeholderTextColor={theme.muted}
            value={name}
            onChangeText={setName}
          />
          <Button title={savedName ? "Spara" : "Spara namn"} onPress={saveName} loading={savingName} disabled={!name.trim() || name.trim() === savedName} />
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={{ color: theme.text, fontWeight: "700" }}>⏳ {timeLeftLabel(data.session_expires_at)}</Text>
        {!!data.session_expires_at && (
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
            Uppdraget stängs {new Date(data.session_expires_at).toLocaleString("sv-SE")}
          </Text>
        )}
      </Card>

      {data.assignment.kind === "uppdrag" && data.assignment.ai_mode === "off" && (
        <Card style={{ marginTop: 12 }}>
          <Text style={{ color: theme.muted, fontSize: 13 }}>
            🔒 Provläge: facit, referensbild och AI-hjälp är avstängda under detta uppdrag.
          </Text>
        </Card>
      )}

      {data.assignment.kind === "uppdrag" && !!data.assignment.reference_image_path && (
        <>
          <Text style={{ color: theme.muted, fontSize: 13, fontWeight: "700", marginTop: 16, marginBottom: 8 }}>REFERENSBILD</Text>
          <Image source={{ uri: quizImageUrl(data.assignment.reference_image_path) }} style={styles.referenceImage} />
        </>
      )}

      <View style={{ height: 28 }} />
      {data.assignment.kind === "quiz" ? (
        <Button title="Starta quiz" onPress={() => router.push(`/elev/uppdrag/quiz/${encodeURIComponent(code!)}`)} />
      ) : (
        <>
          <Button
            title={data.plan_locked ? "Se min materialplan" : "Skapa din materialplan"}
            onPress={() => router.push(`/elev/materialplan/${encodeURIComponent(code!)}`)}
          />
          {data.plan_submitted_at && (
            <Text style={{ color: theme.success, textAlign: "center", marginTop: 12, fontWeight: "600" }}>
              ✓ Inskickad {new Date(data.plan_submitted_at).toLocaleString("sv-SE")}
            </Text>
          )}
          <View style={{ height: 12 }} />
          <Button
            title="⏱ Tidrapport"
            variant="secondary"
            onPress={() => router.push(`/elev/tidrapport/${encodeURIComponent(code!)}`)}
          />

          {selfItems.length > 0 && (
            <Card style={{ marginTop: 20 }}>
              <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>✅ Egen kontroll</Text>
              <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4, marginBottom: 10 }}>
                Bocka av det du gjort och är nöjd med, innan du lämnar uppdraget.
              </Text>
              {selfItems.map((it, i) => {
                const av = !!selfCheck[String(i)];
                return (
                  <Pressable
                    key={i}
                    onPress={() => setSelfCheck((prev) => ({ ...prev, [String(i)]: !prev[String(i)] }))}
                    style={styles.selfRow}
                  >
                    <View style={[styles.selfBox, { borderColor: av ? theme.success : theme.border, backgroundColor: av ? theme.success : "transparent" }]}>
                      {av && <Text style={styles.selfTick}>✓</Text>}
                    </View>
                    <Text style={{ color: av ? theme.muted : theme.text, flex: 1, fontSize: 15, textDecorationLine: av ? "line-through" : "none" }}>
                      {it}
                    </Text>
                  </Pressable>
                );
              })}
              <View style={{ height: 12 }} />
              <Button title="Spara egen kontroll" onPress={saveSelfCheck} loading={savingSelf} />
              {!!data.self_check_submitted_at && (
                <Text style={{ color: theme.success, textAlign: "center", marginTop: 10, fontWeight: "600" }}>
                  ✓ Sparad {new Date(data.self_check_submitted_at).toLocaleString("sv-SE")}
                </Text>
              )}
            </Card>
          )}

          {reflItems.length > 0 && (
            <Card style={{ marginTop: 14 }}>
              <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>💬 Reflektion i grupp</Text>
              <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4, marginBottom: 10 }}>
                Prata igenom frågorna i gruppen och skriv era svar.
              </Text>
              {reflItems.map((q, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: theme.text, fontWeight: "600", marginBottom: 6 }}>{q}</Text>
                  <TextInput
                    multiline
                    numberOfLines={3}
                    placeholder="Skriv här…"
                    placeholderTextColor={theme.muted}
                    style={[styles.reflInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                    value={reflection[String(i)] ?? ""}
                    onChangeText={(t) => setReflection((prev) => ({ ...prev, [String(i)]: t }))}
                  />
                </View>
              ))}
              <Button title="Spara reflektionen" onPress={saveReflection} loading={savingRefl} />
              {!!data.reflection_submitted_at && (
                <Text style={{ color: theme.success, textAlign: "center", marginTop: 10, fontWeight: "600" }}>
                  ✓ Sparad {new Date(data.reflection_submitted_at).toLocaleString("sv-SE")}
                </Text>
              )}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 40, marginBottom: 12 },
  eyebrow: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  body: { fontSize: 15, lineHeight: 21, textAlign: "center" },
  referenceImage: { width: "100%", height: 200, borderRadius: 12, backgroundColor: "#eee" },
  nameInput: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15 },
  selfRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  selfBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  selfTick: { color: "#fff", fontWeight: "900", fontSize: 15, lineHeight: 18 },
  reflInput: { minHeight: 72, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, textAlignVertical: "top" },
});
