import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type * as ImagePicker from "expo-image-picker";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { pickQuizImage, quizImageUrl, suggestMaterialName, uploadQuizImage } from "@/lib/quizImages";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];

export default function QuizFragor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const { org } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const [pickedAsset, setPickedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [prompt, setPrompt] = useState("Vad heter den här rördelen?");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [wrongAnswers, setWrongAnswers] = useState<string[]>([""]);
  const [picking, setPicking] = useState<"camera" | "library" | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: a }, { data: qs }] = await Promise.all([
      supabase.from("assignments").select("*").eq("id", id).single(),
      supabase.from("quiz_questions").select("*").eq("assignment_id", id).order("sort_order"),
    ]);
    setAssignment(a ?? null);
    setQuestions(qs ?? []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function resetForm() {
    setEditingId(null);
    setExistingImagePath(null);
    setPickedAsset(null);
    setPrompt("Vad heter den här rördelen?");
    setCorrectAnswer("");
    setWrongAnswers([""]);
  }

  function startEdit(q: QuizQuestion) {
    setEditingId(q.id);
    setExistingImagePath(q.image_path);
    setPickedAsset(null);
    setPrompt(q.prompt);
    setCorrectAnswer(q.correct_answer);
    setWrongAnswers(q.wrong_answers.length > 0 ? q.wrong_answers : [""]);
  }

  async function pickImage(source: "camera" | "library") {
    setPicking(source);
    try {
      const asset = await pickQuizImage(source);
      if (asset) setPickedAsset(asset);
    } catch (e) {
      Alert.alert("Kunde inte öppna kameran/bilderna", getErrorMessage(e));
    } finally {
      setPicking(null);
    }
  }

  async function suggestFromImage() {
    if (!pickedAsset) return;
    setSuggesting(true);
    try {
      const suggestion = await suggestMaterialName(pickedAsset);
      setCorrectAnswer(suggestion.name);
      if (suggestion.wrongAnswers.length > 0) setWrongAnswers(suggestion.wrongAnswers);
    } catch (e) {
      Alert.alert("Kunde inte föreslå svar", getErrorMessage(e));
    } finally {
      setSuggesting(false);
    }
  }

  function updateWrongAnswer(idx: number, value: string) {
    setWrongAnswers((prev) => prev.map((w, i) => (i === idx ? value : w)));
  }

  function addWrongAnswerRow() {
    setWrongAnswers((prev) => [...prev, ""]);
  }

  function removeWrongAnswerRow(idx: number) {
    setWrongAnswers((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!org || !id) return;
    const cleanWrong = wrongAnswers.map((w) => w.trim()).filter(Boolean);
    if (!correctAnswer.trim()) {
      Alert.alert("Rätt svar saknas", "Skriv vad rördelen heter.");
      return;
    }
    if (cleanWrong.length === 0) {
      Alert.alert("Felaktiga alternativ saknas", "Lägg till minst ett felaktigt svarsalternativ.");
      return;
    }
    if (!pickedAsset && !existingImagePath) {
      Alert.alert("Bild saknas", "Ta eller välj en bild av rördelen.");
      return;
    }

    setSaving(true);
    try {
      const imagePath = pickedAsset ? await uploadQuizImage(org.id, pickedAsset) : existingImagePath!;

      if (editingId) {
        const { error } = await supabase
          .from("quiz_questions")
          .update({ image_path: imagePath, prompt: prompt.trim(), correct_answer: correctAnswer.trim(), wrong_answers: cleanWrong })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const nextSortOrder = questions.reduce((max, q) => Math.max(max, q.sort_order), -1) + 1;
        const { error } = await supabase.from("quiz_questions").insert({
          assignment_id: id,
          image_path: imagePath,
          prompt: prompt.trim(),
          correct_answer: correctAnswer.trim(),
          wrong_answers: cleanWrong,
          sort_order: nextSortOrder,
        });
        if (error) throw error;
      }

      resetForm();
      load();
    } catch (e) {
      Alert.alert("Kunde inte spara frågan", getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function removeQuestion(q: QuizQuestion) {
    Alert.alert("Ta bort frågan?", `"${q.correct_answer}" tas bort ur quizet.`, [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort",
        style: "destructive",
        onPress: async () => {
          await supabase.from("quiz_questions").delete().eq("id", q.id);
          if (editingId === q.id) resetForm();
          load();
        },
      },
    ]);
  }

  if (!assignment) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  const previewUri = pickedAsset?.uri ?? (existingImagePath ? quizImageUrl(existingImagePath) : null);

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{assignment.title}</Text>
      <Text style={{ color: theme.muted, marginBottom: 4 }}>{questions.length} frågor</Text>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Frågor</Text>
      {questions.length === 0 && <Text style={{ color: theme.muted }}>Inga frågor ännu -- lägg till den första nedan.</Text>}
      {questions.map((q) => (
        <Card key={q.id} style={styles.questionRow}>
          <TouchableOpacity style={styles.questionMain} onPress={() => startEdit(q)}>
            <Image source={{ uri: quizImageUrl(q.image_path) }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: "700" }}>{q.correct_answer}</Text>
              <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                {q.wrong_answers.length} felaktiga alternativ
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeQuestion(q)}>
            <Text style={{ color: theme.danger }}>Ta bort</Text>
          </TouchableOpacity>
        </Card>
      ))}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>{editingId ? "Redigera fråga" : "Ny fråga"}</Text>
      <Card>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.previewPlaceholder, { borderColor: theme.border }]}>
            <Text style={{ color: theme.muted }}>Ingen bild vald</Text>
          </View>
        )}
        <View style={styles.imageBtnRow}>
          <View style={{ flex: 1 }}>
            <Button title="📷 Ta foto" variant="secondary" onPress={() => pickImage("camera")} loading={picking === "camera"} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="🖼 Välj bild" variant="secondary" onPress={() => pickImage("library")} loading={picking === "library"} />
          </View>
        </View>

        {pickedAsset && (
          <>
            <View style={{ height: 8 }} />
            <Button
              title="🤖 Föreslå svar med AI"
              variant="secondary"
              onPress={suggestFromImage}
              loading={suggesting}
            />
          </>
        )}

        <View style={{ height: 8 }} />
        <Field label="Fråga" value={prompt} onChangeText={setPrompt} />
        <Field label="Rätt svar" placeholder="T.ex. Vinkelkoppling 90°" value={correctAnswer} onChangeText={setCorrectAnswer} />

        <Text style={[styles.label, { color: theme.muted }]}>FELAKTIGA ALTERNATIV</Text>
        {wrongAnswers.map((w, idx) => (
          <View key={idx} style={styles.wrongRow}>
            <TextInput
              style={[styles.wrongInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
              placeholder={`Fel alternativ ${idx + 1}`}
              placeholderTextColor={theme.muted}
              value={w}
              onChangeText={(v) => updateWrongAnswer(idx, v)}
            />
            {wrongAnswers.length > 1 && (
              <TouchableOpacity onPress={() => removeWrongAnswerRow(idx)} style={styles.removeWrongBtn}>
                <Text style={{ color: theme.danger }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addWrongAnswerRow} style={{ marginBottom: 12 }}>
          <Text style={{ color: theme.tint, fontWeight: "700" }}>+ Lägg till felaktigt alternativ</Text>
        </TouchableOpacity>

        <Button title={editingId ? "Spara ändringar" : "Lägg till fråga"} onPress={save} loading={saving} />
        {editingId && (
          <>
            <View style={{ height: 8 }} />
            <Button title="Avbryt redigering" variant="ghost" onPress={resetForm} />
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 24, marginBottom: 12 },
  questionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  questionMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#eee" },
  preview: { width: "100%", height: 180, borderRadius: 12, marginBottom: 12 },
  previewPlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed" },
  imageBtnRow: { flexDirection: "row", gap: 8 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  wrongRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  wrongInput: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 15 },
  removeWrongBtn: { paddingHorizontal: 4 },
});
