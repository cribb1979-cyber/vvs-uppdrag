import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type PlanItem = Database["public"]["Tables"]["material_plan_items"]["Row"];
type RequirementsView =
  | { hidden: true; count: number | null }
  | Array<{ component: string; dimension: string; quantity: number; note: string }>;

// Delad materialplan-editor för BÅDA elevflödena (QR-engångssession och
// klassregister) -- själva sessionsupplösningen (join_session vs
// open_assignment_as_student) sker i respektive route, som sedan renderar
// den här komponenten identiskt.
export function MaterialPlanEditor({
  participantId,
  planLocked,
  planSubmittedAt,
  onSubmitted,
  onBack,
}: {
  participantId: string;
  planLocked: boolean;
  planSubmittedAt: string | null;
  onSubmitted: () => void | Promise<void>;
  onBack: () => void;
}) {
  const theme = Colors[useColorScheme() ?? "light"];

  const [items, setItems] = useState<PlanItem[]>([]);
  const [requirementsView, setRequirementsView] = useState<RequirementsView | null>(null);
  const [component, setComponent] = useState("");
  const [dimension, setDimension] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    const [{ data: planItems }, { data: view }] = await Promise.all([
      supabase.from("material_plan_items").select("*").eq("participant_id", participantId).order("created_at"),
      supabase.rpc("get_requirements_view", { p_participant_id: participantId }),
    ]);
    setItems(planItems ?? []);
    setRequirementsView((view as RequirementsView) ?? null);
    setLoadingItems(false);
  }, [participantId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function addItem() {
    if (!component.trim()) return;
    const { error } = await supabase.from("material_plan_items").insert({
      participant_id: participantId,
      component: component.trim(),
      dimension: dimension.trim(),
      quantity: Math.max(1, Number.parseInt(quantity, 10) || 1),
      comment: comment.trim(),
    });
    if (error) {
      Alert.alert("Kunde inte lägga till", getErrorMessage(error));
      return;
    }
    setComponent("");
    setDimension("");
    setQuantity("1");
    setComment("");
    loadItems();
  }

  async function removeItem(id: string) {
    await supabase.from("material_plan_items").delete().eq("id", id);
    loadItems();
  }

  async function submitPlan() {
    if (items.length === 0) {
      Alert.alert("Tom materialplan", "Lägg till minst en rad innan du skickar in.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_material_plan", { p_participant_id: participantId });
    setSubmitting(false);
    if (error) {
      Alert.alert("Kunde inte skicka in", getErrorMessage(error));
      return;
    }
    await onSubmitted();
  }

  if (loadingItems) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Min materialplan</Text>

      {requirementsView && !Array.isArray(requirementsView) && requirementsView.count !== null && (
        <Card style={{ marginBottom: 16, borderColor: theme.warning }}>
          <Text style={{ color: theme.text }}>Läraren har inte visat facit, men du kan se: {requirementsView.count} rader krävs totalt.</Text>
        </Card>
      )}
      {Array.isArray(requirementsView) && requirementsView.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 8 }}>Krav från läraren:</Text>
          {requirementsView.map((r, i) => (
            <Text key={i} style={{ color: theme.muted, marginBottom: 2 }}>
              • {r.component} {r.dimension ? `· ${r.dimension}` : ""} — {r.quantity} st
            </Text>
          ))}
        </Card>
      )}

      {planLocked && (
        <Card style={{ marginBottom: 16, borderColor: theme.success }}>
          <Text style={{ color: theme.success, fontWeight: "700" }}>
            ✓ Inskickad{planSubmittedAt ? ` ${new Date(planSubmittedAt).toLocaleString("sv-SE")}` : ""} — låst för redigering
          </Text>
        </Card>
      )}

      {items.map((item) => (
        <Card key={item.id} style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {item.component} {item.dimension ? `· ${item.dimension}` : ""}
            </Text>
            <Text style={{ color: theme.muted, fontSize: 13 }}>
              {item.quantity} st{item.comment ? ` — ${item.comment}` : ""}
            </Text>
          </View>
          {!planLocked && (
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Text style={{ color: theme.danger }}>Ta bort</Text>
            </TouchableOpacity>
          )}
        </Card>
      ))}

      {!planLocked && (
        <Card style={{ marginTop: 8 }}>
          <Text style={{ color: theme.muted, fontSize: 13, fontWeight: "700", marginBottom: 10 }}>LÄGG TILL KOMPONENT</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
            placeholder="Komponent, t.ex. Kulventil"
            placeholderTextColor={theme.muted}
            value={component}
            onChangeText={setComponent}
          />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.border }]}
              placeholder="Dimension, t.ex. 22 mm"
              placeholderTextColor={theme.muted}
              value={dimension}
              onChangeText={setDimension}
            />
            <TextInput
              style={[styles.input, { width: 60, textAlign: "center", color: theme.text, borderColor: theme.border }]}
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, marginBottom: 12 }]}
            placeholder="Kommentar (valfritt)"
            placeholderTextColor={theme.muted}
            value={comment}
            onChangeText={setComment}
          />
          <Button title="+ Lägg till rad" variant="ghost" onPress={addItem} disabled={!component.trim()} />
        </Card>
      )}

      <View style={{ height: 24 }} />
      {planLocked ? (
        <Button title="Tillbaka till uppdraget" variant="secondary" onPress={onBack} />
      ) : (
        <Button title="Skicka in materialplan" onPress={submitPlan} loading={submitting} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16 },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 12 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15 },
});
