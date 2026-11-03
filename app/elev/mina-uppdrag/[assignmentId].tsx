import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { ExamClock, useExamClock } from "@/components/ExamClock";
import { MaintenancePlanCard } from "@/components/MaintenancePlanCard";
import { examInfo } from "@/lib/examMode";
import { quizImageUrl } from "@/lib/quizImages";
import { supabase } from "@/lib/supabase";
import { useAssignmentAsStudent } from "@/lib/useAssignmentAsStudent";

export default function MinaUppdragDetail() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { data, error, loading, refresh } = useAssignmentAsStudent(assignmentId);
  const [teacherComment, setTeacherComment] = useState("");

  const exam = examInfo(data?.assignment.steps);
  const examNyckel = data?.participant_id ? `vvsuppdrag.exam.${data.participant_id}` : null;
  const klocka = useExamClock(examNyckel, exam.minutes, exam.lage === "prov");

  const loadTeacherComment = useCallback(async () => {
    if (!data?.participant_id) return;
    const { data: row } = await supabase
      .from("assignment_participants")
      .select("teacher_comment")
      .eq("id", data.participant_id)
      .single();
    setTeacherComment(row?.teacher_comment ?? "");
  }, [data?.participant_id]);

  useEffect(() => {
    loadTeacherComment();
  }, [loadTeacherComment]);

  // Samma live-uppdatering som QR-engångsflödet (app/elev/uppdrag/[code].tsx):
  // byter läraren mellan Övningsläge/Provläge medan eleven har skärmen öppen
  // ska det synas utan att eleven behöver logga in på nytt.
  useEffect(() => {
    const interval = setInterval(() => {
      refresh({ silent: true });
      loadTeacherComment();
    }, 30_000);
    return () => clearInterval(interval);
  }, [refresh, loadTeacherComment]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: "center" }}>{error ?? "Uppdraget är inte tillgängligt."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{data.assignment.title}</Text>
      {!!data.assignment.description && (
        <Card style={{ marginTop: 12, borderColor: theme.danger }}>
          <Text style={{ color: theme.danger, fontSize: 12, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 }}>
            📌 LÄS INSTRUKTIONEN
          </Text>
          <Text style={{ color: theme.danger, fontSize: 15, fontWeight: "600", lineHeight: 22 }}>
            {data.assignment.description}
          </Text>
        </Card>
      )}

      {!!teacherComment && (
        <Card style={{ marginTop: 14, borderColor: theme.accent }}>
          <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>💬 KOMMENTAR FRÅN LÄRAREN</Text>
          <Text style={{ color: theme.text, fontSize: 15, marginTop: 4 }}>{teacherComment}</Text>
        </Card>
      )}

      {data.assignment.kind === "uppdrag" && data.assignment.ai_mode === "off" && (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: theme.muted, fontSize: 13 }}>
            🔒 Provläge: facit, referensbild och AI-hjälp är avstängda under detta uppdrag.
          </Text>
        </Card>
      )}

      <ExamClock steps={data.assignment.steps} storageKey={examNyckel} />

      {data.assignment.kind === "uppdrag" && !!data.assignment.reference_image_path && (
        <>
          <Text style={{ color: theme.muted, fontSize: 13, fontWeight: "700", marginTop: 16, marginBottom: 8 }}>REFERENSBILD</Text>
          <Image source={{ uri: quizImageUrl(data.assignment.reference_image_path) }} style={styles.referenceImage} />
        </>
      )}

      {data.assignment.kind === "uppdrag" && (
        <MaintenancePlanCard
          participantId={data.participant_id}
          initialText={data.maintenance_plan ?? ""}
          savedAt={data.maintenance_plan_saved_at ?? null}
        />
      )}

      <View style={{ height: 28 }} />
      {data.assignment.kind === "quiz" ? (
        <Button title="Starta quiz" onPress={() => router.push(`/elev/mina-uppdrag/quiz/${assignmentId}`)} disabled={klocka.slut} />
      ) : (
        <>
          <Button
            title={data.plan_locked ? "Se min materialplan" : "Skapa din materialplan"}
            onPress={() => router.push(`/elev/mina-uppdrag/materialplan/${assignmentId}`)}
            disabled={klocka.slut}
          />
          {data.plan_submitted_at && (
            <Text style={{ color: theme.success, textAlign: "center", marginTop: 12, fontWeight: "600" }}>
              ✓ Inskickad {new Date(data.plan_submitted_at).toLocaleString("sv-SE")}
            </Text>
          )}
          <View style={{ height: 12 }} />
          <Button
            title="🎓 Se mitt omdöme"
            variant="secondary"
            onPress={() => router.push(`/elev/mina-uppdrag/bedomning/${assignmentId}`)}
          />
          <View style={{ height: 12 }} />
          <Button
            title="⏱ Tidrapport"
            variant="secondary"
            onPress={() => router.push(`/elev/mina-uppdrag/tidrapport/${assignmentId}`)}
            disabled={klocka.slut}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  body: { fontSize: 15, lineHeight: 21, textAlign: "center" },
  referenceImage: { width: "100%", height: 200, borderRadius: 12, backgroundColor: "#eee" },
});
