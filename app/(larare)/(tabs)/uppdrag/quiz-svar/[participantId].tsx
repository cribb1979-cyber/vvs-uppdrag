import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { quizImageUrl } from "@/lib/quizImages";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Participant = Database["public"]["Tables"]["assignment_participants"]["Row"] & {
  students: { name: string } | null;
};
type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
type QuizAnswer = Database["public"]["Tables"]["quiz_answers"]["Row"];

interface Row {
  question: QuizQuestion;
  answer: QuizAnswer | null;
}

function AnswerRow({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const theme = Colors[useColorScheme() ?? "light"];
  const { question, answer } = row;
  const [comment, setComment] = useState(answer?.teacher_comment ?? "");
  const [saving, setSaving] = useState(false);

  async function saveFeedback(override: boolean | null) {
    if (!answer) return;
    setSaving(true);
    await supabase.rpc("set_quiz_answer_feedback", { p_answer_id: answer.id, p_comment: comment.trim(), p_override: override });
    setSaving(false);
    onSaved();
  }

  const effectiveCorrect = answer ? (answer.teacher_override ?? answer.is_correct) : null;

  return (
    <Card style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Image source={{ uri: quizImageUrl(question.image_path) }} style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>{question.prompt}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>Rätt svar: {question.correct_answer}</Text>
        </View>
      </View>

      <View style={{ height: 10 }} />
      {answer ? (
        <>
          <Text style={{ color: theme.text }}>
            Elevens svar: <Text style={{ fontWeight: "700" }}>{answer.selected_answer}</Text>
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
            <Badge label={effectiveCorrect ? "Rätt" : "Fel"} tone={effectiveCorrect ? "success" : "danger"} />
            {answer.teacher_override !== null && <Text style={{ color: theme.muted, fontSize: 12 }}>manuellt rättad</Text>}
          </View>

          <View style={{ height: 10 }} />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, minHeight: 50, textAlignVertical: "top" }]}
            placeholder="Kommentar till eleven (valfritt)"
            placeholderTextColor={theme.muted}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <View style={{ height: 8 }} />
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button title="Markera rätt" variant="secondary" onPress={() => saveFeedback(true)} loading={saving} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Markera fel" variant="secondary" onPress={() => saveFeedback(false)} loading={saving} />
            </View>
          </View>
          <View style={{ height: 8 }} />
          <Button
            title={answer.teacher_override !== null ? "Spara kommentar + återställ till auto-rättning" : "Spara kommentar"}
            variant="ghost"
            onPress={() => saveFeedback(null)}
            loading={saving}
          />
        </>
      ) : (
        <Text style={{ color: theme.muted }}>Eleven har inte svarat på den här frågan ännu.</Text>
      )}
    </Card>
  );
}

export default function QuizSvar() {
  const { participantId } = useLocalSearchParams<{ participantId: string }>();
  const theme = Colors[useColorScheme() ?? "light"];

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    if (!participantId) return;
    const { data: part } = await supabase
      .from("assignment_participants")
      .select("*, students(name)")
      .eq("id", participantId)
      .single();
    if (!part) return;
    setParticipant(part);

    const [{ data: questions }, { data: answers }] = await Promise.all([
      supabase.from("quiz_questions").select("*").eq("assignment_id", part.assignment_id).order("sort_order"),
      supabase.from("quiz_answers").select("*").eq("participant_id", participantId),
    ]);
    const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a]));
    setRows((questions ?? []).map((question) => ({ question, answer: answerByQuestion.get(question.id) ?? null })));
  }, [participantId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!participant) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  const name = participant.students?.name ?? participant.display_name ?? `Elev ${participant.id.slice(0, 8)} (QR)`;
  const answeredCount = rows.filter((r) => r.answer).length;
  const correctCount = rows.filter((r) => r.answer && (r.answer.teacher_override ?? r.answer.is_correct)).length;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Quiz-svar — {name}</Text>
      <Text style={{ color: theme.muted, marginBottom: 16 }}>
        {answeredCount}/{rows.length} besvarade · {correctCount} rätt
      </Text>

      {rows.map((row) => (
        <AnswerRow key={row.question.id} row={row} onSaved={load} />
      ))}
      {rows.length === 0 && <Text style={{ color: theme.muted }}>Inga frågor i det här quizet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#eee" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  actionRow: { flexDirection: "row", gap: 8 },
});
