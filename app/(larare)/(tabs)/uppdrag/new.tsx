import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type * as ImagePicker from "expo-image-picker";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { MODE_OPTIONS, modeToFields, type AssignmentMode } from "@/lib/assignmentMode";
import { pickQuizImage, uploadQuizImage } from "@/lib/quizImages";
import { supabase } from "@/lib/supabase";
import type { AssignmentKind } from "@/lib/database.types";

interface DraftRequirement {
  key: string;
  component: string;
  dimension: string;
  quantity: string;
}

const KIND_OPTIONS: { value: AssignmentKind; label: string; hint: string }[] = [
  { value: "uppdrag", label: "📋 Uppdrag", hint: "Praktiskt uppdrag med materialplan" },
  { value: "quiz", label: "🖼 Materialquiz", hint: "Bildfrågor eleven svarar flerval på" },
];

export default function NewAssignment() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org, profile } = useAuth();

  const [kind, setKind] = useState<AssignmentKind>("uppdrag");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<AssignmentMode>("prov");
  const [referenceAsset, setReferenceAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pickingReference, setPickingReference] = useState<"camera" | "library" | null>(null);
  const [requirements, setRequirements] = useState<DraftRequirement[]>([
    { key: String(Date.now()), component: "", dimension: "", quantity: "1" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickReferenceImage(source: "camera" | "library") {
    setPickingReference(source);
    try {
      const asset = await pickQuizImage(source);
      if (asset) setReferenceAsset(asset);
    } catch (e) {
      Alert.alert("Kunde inte öppna kameran/bilderna", getErrorMessage(e));
    } finally {
      setPickingReference(null);
    }
  }

  function updateRequirement(key: string, field: keyof DraftRequirement, value: string) {
    setRequirements((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function addRequirement() {
    setRequirements((prev) => [...prev, { key: String(Date.now()), component: "", dimension: "", quantity: "1" }]);
  }

  function removeRequirement(key: string) {
    setRequirements((prev) => prev.filter((r) => r.key !== key));
  }

  async function save() {
    if (!org || !profile) return;
    if (!title.trim()) {
      setError("Ge uppdraget en titel.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const referenceImagePath = referenceAsset ? await uploadQuizImage(org.id, referenceAsset) : null;

      const { data: assignment, error: assignErr } = await supabase
        .from("assignments")
        .insert({
          org_id: org.id,
          created_by: profile.id,
          title: title.trim(),
          description: description.trim(),
          kind,
          ...modeToFields(mode),
          reference_image_path: referenceImagePath,
          status: "draft",
        })
        .select()
        .single();
      if (assignErr) throw assignErr;

      if (kind === "uppdrag") {
        const validRequirements = requirements
          .filter((r) => r.component.trim())
          .map((r, i) => ({
            assignment_id: assignment.id,
            component: r.component.trim(),
            dimension: r.dimension.trim(),
            quantity: Math.max(1, Number.parseInt(r.quantity, 10) || 1),
            sort_order: i,
          }));

        if (validRequirements.length > 0) {
          const { error: reqErr } = await supabase.from("material_requirements").insert(validRequirements);
          if (reqErr) throw reqErr;
        }
      }

      // Samma mål oavsett typ -- uppdragets detaljsida. Därifrån når
      // läraren "🖼 Quiz-frågor" för att lägga till bildfrågor, precis som
      // Facit/Bedömning för ett vanligt uppdrag. Går man direkt till
      // frågeredigeraren istället finns ingen väg tillbaka till
      // detaljsidan för att sätta uppdraget aktivt eller tilldela en klass
      // utan att först gå via uppdragslistan.
      router.replace(`/(larare)/(tabs)/uppdrag/${assignment.id}`);
    } catch (e) {
      console.error("Kunde inte spara uppdraget:", e);
      setError(getErrorMessage(e, "Kunde inte spara uppdraget."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: theme.muted }]}>TYP AV UPPDRAG</Text>
        <View style={styles.revealRow}>
          {KIND_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.revealOption, { borderColor: kind === opt.value ? theme.accent : theme.border, backgroundColor: theme.card }]}
              onPress={() => setKind(opt.value)}
            >
              <Text style={{ color: kind === opt.value ? theme.accent : theme.text, fontWeight: "700" }}>{opt.label}</Text>
              <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{opt.hint}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 8 }} />
        <Field label="Titel" placeholder="t.ex. Slutprov – Komplett badrumsinstallation" value={title} onChangeText={setTitle} />
        <Field
          label="Beskrivning"
          placeholder="Vad ska eleven göra?"
          multiline
          numberOfLines={4}
          style={{ minHeight: 90, textAlignVertical: "top" }}
          value={description}
          onChangeText={setDescription}
        />

        {kind === "uppdrag" && (
          <>
            <Text style={[styles.label, { color: theme.muted }]}>LÄGE</Text>
            <View style={styles.revealRow}>
              {MODE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.revealOption,
                    { borderColor: mode === opt.value ? theme.accent : theme.border, backgroundColor: theme.card },
                  ]}
                  onPress={() => setMode(opt.value)}
                >
                  <Text style={{ color: mode === opt.value ? theme.accent : theme.text, fontWeight: "700" }}>{opt.label}</Text>
                  <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{opt.hint}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.hint, { color: theme.muted }]}>
              Du kan växla läge senare från uppdragets detaljsida -- eleven ser ändringen direkt, ingen ny QR-kod behövs.
            </Text>

            <Text style={[styles.label, { color: theme.muted, marginTop: 8 }]}>REFERENSBILD (VALFRI, VISAS BARA I ÖVNINGSLÄGE)</Text>
            {referenceAsset ? (
              <Image source={{ uri: referenceAsset.uri }} style={styles.referencePreview} />
            ) : (
              <View style={[styles.referencePreview, styles.referencePlaceholder, { borderColor: theme.border }]}>
                <Text style={{ color: theme.muted }}>Ingen bild vald</Text>
              </View>
            )}
            <View style={styles.imageBtnRow}>
              <View style={{ flex: 1 }}>
                <Button
                  title="📷 Ta foto"
                  variant="secondary"
                  onPress={() => pickReferenceImage("camera")}
                  loading={pickingReference === "camera"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="🖼 Välj bild"
                  variant="secondary"
                  onPress={() => pickReferenceImage("library")}
                  loading={pickingReference === "library"}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.muted, marginTop: 20 }]}>MATERIALKRAV (DITT DOLDA FACIT)</Text>
            <Text style={[styles.hint, { color: theme.muted }]}>
              Eleven ser aldrig denna lista direkt — bara det du valt ovan. Den används för att jämföra mot elevens egen materialplan.
            </Text>

            {requirements.map((r) => (
              <Card key={r.key} style={styles.reqCard}>
                <View style={styles.reqRow}>
                  <TextInput
                    style={[styles.reqInput, { flex: 2, color: theme.text, borderColor: theme.border }]}
                    placeholder="Komponent, t.ex. Kulventil"
                    placeholderTextColor={theme.muted}
                    value={r.component}
                    onChangeText={(v) => updateRequirement(r.key, "component", v)}
                  />
                  <TextInput
                    style={[styles.reqInput, { flex: 1, color: theme.text, borderColor: theme.border }]}
                    placeholder="Dim, t.ex. 22 mm"
                    placeholderTextColor={theme.muted}
                    value={r.dimension}
                    onChangeText={(v) => updateRequirement(r.key, "dimension", v)}
                  />
                  <TextInput
                    style={[styles.reqInput, { width: 56, textAlign: "center", color: theme.text, borderColor: theme.border }]}
                    placeholder="Antal"
                    placeholderTextColor={theme.muted}
                    keyboardType="number-pad"
                    value={r.quantity}
                    onChangeText={(v) => updateRequirement(r.key, "quantity", v)}
                  />
                </View>
                {requirements.length > 1 && (
                  <TouchableOpacity onPress={() => removeRequirement(r.key)}>
                    <Text style={{ color: theme.danger, marginTop: 10, fontSize: 13 }}>Ta bort rad</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))}

            <TouchableOpacity onPress={addRequirement} style={styles.addRow}>
              <Text style={{ color: theme.tint, fontWeight: "700" }}>+ Lägg till materialrad</Text>
            </TouchableOpacity>
          </>
        )}

        {kind === "quiz" && (
          <Text style={[styles.hint, { color: theme.muted, marginTop: 20 }]}>
            Du lägger till bildfrågorna i nästa steg, efter att uppdraget skapats.
          </Text>
        )}

        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

        <View style={{ height: 12 }} />
        <Button title="Skapa uppdrag" onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8, letterSpacing: 0.3 },
  hint: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  revealRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  revealOption: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  reqCard: { marginBottom: 10 },
  reqRow: { flexDirection: "row", gap: 8 },
  reqInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  addRow: { paddingVertical: 12, marginBottom: 10 },
  error: { marginTop: 8, marginBottom: 4 },
  referencePreview: { width: "100%", height: 160, borderRadius: 12, marginBottom: 10, backgroundColor: "#eee" },
  referencePlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed" },
  imageBtnRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
});
