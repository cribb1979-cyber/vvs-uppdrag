import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
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

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.eyebrow, { color: theme.accent }]}>Du är ansluten till</Text>
      <Text style={[styles.title, { color: theme.text }]}>{data.assignment.title}</Text>
      {!!data.assignment.description && <Text style={[styles.body, { color: theme.muted }]}>{data.assignment.description}</Text>}

      <Card style={{ marginTop: 20 }}>
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
});
