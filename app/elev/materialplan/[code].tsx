import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useStudentSession } from "@/lib/useStudentSession";
import type { Database } from "@/lib/database.types";

type PlanItem = Database["public"]["Tables"]["material_plan_items"]["Row"];
type RequirementsView =
  | { hidden: true; count: number | null }
  | Array<{ component: string; dimension: string; quantity: number; note: string }>;

export default function MaterialPlan() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { data: session, error: sessionError, loading: sessionLoading, refresh: refreshSession } = useStudentSession(code);

  const [items, setItems] = useState<PlanItem[]>([]);
  const [requirementsView, setRequirementsView] = useState<RequirementsView | null>(null);
  const [component, setComponent] = useState("");
  const [dimension, setDimension] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  const loadItems = useCallback(async () => {
    if (!session) return;
    setLoadingItems(true);
    const [{ data: planItems }, { data: view }] = await Promise.all([
      supabase.from("material_plan_items").select("*").eq("participant_id", session.participant_id).order("created_at"),
      supabase.rpc("get_requirements_view", { p_participant_id: session.participant_id }),
    ]);
    setItems(planItems ?? []);
    setRequirementsView((view as RequirementsView) ?? null);
    setLoadingItems(false);
  }, [session]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function addItem() {
    if (!session || !component.trim()) return;
    const { error } = await supabase.from("material_plan_items").insert({
      participant_id: session.participant_id,
      component: component.trim(),
      dimension: dimension.trim(),
      quantity: Math.max(1, Number.parseInt(quantity, 10) || 1),
      comment: comment.trim(),
    });
    if (error) {
      Alert.alert("Kunde inte lägga till", error.message);
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
    if (!session) return;
    if (items.length === 0) {
      Alert.alert("Tom materialplan", "Lägg till minst en rad innan du skickar in.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_material_plan", { p_participant_id: session.participant_id });
    setSubmitting(false);
    if (error) {
      Alert.alert("Kunde inte skicka in", error.message);
      return;
    }
    await refreshSession();
  }

  if (sessionLoading || (session && loadingItems)) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (sessionError || !session) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: "center" }}>{sessionError ?? "Uppdraget är inte tillgängligt."}</Text>
      </View>
    );
  }

  const locked = session.plan_locked;

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

      {locked ? (
        <Card style={{ marginBottom: 16, borderColor: theme.success }}>
          <Text style={{ color: theme.success, fontWeight: "700" }}>✓ Inskickad — låst för redigering</Text>
        </Card>
      ) : null}

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
          {!locked && (
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Text style={{ color: theme.danger }}>Ta bort</Text>
            </TouchableOpacity>
          )}
        </Card>
      ))}

      {!locked && (
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
      {locked ? (
        <Button title="Tillbaka till uppdraget" variant="secondary" onPress={() => router.back()} />
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
