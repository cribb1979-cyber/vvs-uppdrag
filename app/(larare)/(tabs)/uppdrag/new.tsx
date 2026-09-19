import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { RevealMode } from "@/lib/database.types";

interface DraftRequirement {
  key: string;
  component: string;
  dimension: string;
  quantity: string;
}

const REVEAL_OPTIONS: { value: RevealMode; label: string; hint: string }[] = [
  { value: "hidden", label: "Dolt", hint: "Eleven ser inget av facit" },
  { value: "count", label: "Antal", hint: "Eleven ser bara hur många rader som saknas" },
  { value: "full", label: "Allt", hint: "Eleven ser hela facit" },
];

export default function NewAssignment() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org, profile } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [revealMode, setRevealMode] = useState<RevealMode>("hidden");
  const [requirements, setRequirements] = useState<DraftRequirement[]>([
    { key: String(Date.now()), component: "", dimension: "", quantity: "1" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { data: assignment, error: assignErr } = await supabase
        .from("assignments")
        .insert({
          org_id: org.id,
          created_by: profile.id,
          title: title.trim(),
          description: description.trim(),
          reveal_mode: revealMode,
          status: "draft",
        })
        .select()
        .single();
      if (assignErr) throw assignErr;

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

      router.replace(`/(larare)/(tabs)/uppdrag/${assignment.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte spara uppdraget.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

        <Text style={[styles.label, { color: theme.muted }]}>FACIT-SYNLIGHET FÖR ELEVEN</Text>
        <View style={styles.revealRow}>
          {REVEAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.revealOption,
                { borderColor: revealMode === opt.value ? theme.accent : theme.border, backgroundColor: theme.card },
              ]}
              onPress={() => setRevealMode(opt.value)}
            >
              <Text style={{ color: revealMode === opt.value ? theme.accent : theme.text, fontWeight: "700" }}>{opt.label}</Text>
              <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{opt.hint}</Text>
            </TouchableOpacity>
          ))}
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
});
