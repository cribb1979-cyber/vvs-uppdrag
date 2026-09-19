import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { quizImageUrl } from "@/lib/quizImages";
import { supabase } from "@/lib/supabase";

interface QuizQuestionView {
  id: string;
  image_path: string;
  prompt: string;
  options: string[];
  answered_correct: boolean | null;
}

interface QuizViewData {
  assignment_title: string;
  questions: QuizQuestionView[];
}

export function QuizPlayer({ participantId, onBack }: { participantId: string; onBack: () => void }) {
  const theme = Colors[useColorScheme() ?? "light"];

  const [data, setData] = useState<QuizViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  // question_id -> rätt/fel. Källan till sanning för poängen -- byggs upp
  // både från tidigare besvarade frågor (vid återbesök) och nya svar i den
  // här sessionen, så en elev som stänger appen mitt i återupptar exakt
  // där de var, och poängen räknas rätt oavsett.
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Ren state räcker inte för att stoppa dubbeltryck -- setSubmitting(true)
  // committar inte förrän nästa render, så två snabba tryck (barn trycker
  // otåligt) hinner båda läsa submitting=false och skicka in varsitt svar.
  // Servern stoppar det andra försöket (redan besvarad), men klienten
  // skulle då visa ett fullskärmsfel istället för att bara ignorera
  // dubbeltrycket -- en synkron ref stänger det hålet direkt.
  const submittingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase.rpc("get_quiz_view", { p_participant_id: participantId });
      if (err) throw err;
      const view = result as unknown as QuizViewData;
      setData(view);

      const initialAnswered: Record<string, boolean> = {};
      view.questions.forEach((q) => {
        if (q.answered_correct !== null) initialAnswered[q.id] = q.answered_correct;
      });
      setAnswered(initialAnswered);

      const firstUnanswered = view.questions.findIndex((q) => q.answered_correct === null);
      setIndex(firstUnanswered === -1 ? view.questions.length : firstUnanswered);
    } catch (e) {
      setError(getErrorMessage(e, "Kunde inte hämta quizet."));
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function selectOption(question: QuizQuestionView, option: string) {
    if (submittingRef.current || feedback) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const { data: result, error: err } = await supabase.rpc("submit_quiz_answer", {
        p_participant_id: participantId,
        p_question_id: question.id,
        p_selected_answer: option,
      });
      if (err) throw err;
      const res = result as unknown as { correct: boolean; correct_answer: string };
      setFeedback({ correct: res.correct, correctAnswer: res.correct_answer });
      setAnswered((a) => ({ ...a, [question.id]: res.correct }));
    } catch (e) {
      setError(getErrorMessage(e, "Kunde inte skicka svaret."));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function next() {
    setFeedback(null);
    setIndex((i) => i + 1);
  }

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
        <Text style={{ color: theme.text, textAlign: "center", marginBottom: 20 }}>{error ?? "Quizet är inte tillgängligt."}</Text>
        <Button title="Tillbaka" variant="secondary" onPress={onBack} />
      </View>
    );
  }

  const total = data.questions.length;
  const correctCount = Object.values(answered).filter(Boolean).length;
  const answeredCount = Object.keys(answered).length;

  if (total === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: "center" }}>Det här quizet har inga frågor ännu.</Text>
        <View style={{ height: 16 }} />
        <Button title="Tillbaka" variant="secondary" onPress={onBack} />
      </View>
    );
  }

  if (index >= total) {
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={[styles.title, { color: theme.text }]}>Klart!</Text>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: "800", textAlign: "center", marginTop: 8 }}>
          {correctCount} av {total} rätt
        </Text>
        <View style={{ height: 24 }} />
        <Button title="Tillbaka" onPress={onBack} />
      </ScrollView>
    );
  }

  const question = data.questions[index];

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={{ color: theme.muted, textAlign: "center", marginBottom: 12 }}>
        Fråga {index + 1} av {total} · {answeredCount} besvarade
      </Text>

      <Image source={{ uri: quizImageUrl(question.image_path) }} style={styles.image} />
      <Text style={[styles.prompt, { color: theme.text }]}>{question.prompt}</Text>

      {feedback ? (
        <Card style={{ alignItems: "center", marginTop: 16 }}>
          <Text style={styles.emoji}>{feedback.correct ? "✅" : "❌"}</Text>
          <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, marginTop: 4 }}>
            {feedback.correct ? "Rätt!" : "Fel svar"}
          </Text>
          {!feedback.correct && <Text style={{ color: theme.muted, marginTop: 4 }}>Rätt svar: {feedback.correctAnswer}</Text>}
          <View style={{ height: 16 }} />
          <Button title={index + 1 >= total ? "Se resultat" : "Nästa fråga"} onPress={next} />
        </Card>
      ) : (
        <View style={{ marginTop: 16 }}>
          {question.options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
              onPress={() => selectOption(question, opt)}
              disabled={submitting}
            >
              <Text style={{ color: theme.text, fontWeight: "600", fontSize: 16 }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60, alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  image: { width: "100%", height: 220, borderRadius: 16, backgroundColor: "#eee" },
  prompt: { fontSize: 18, fontWeight: "700", textAlign: "center", marginTop: 16, marginBottom: 4 },
  optionBtn: { width: "100%", borderWidth: 1.5, borderRadius: 12, padding: 16, marginBottom: 10, alignItems: "center" },
});
