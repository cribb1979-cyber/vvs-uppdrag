import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { Database, MaterialOrderStatus } from "@/lib/database.types";

type MaterialRow = Database["public"]["Tables"]["material_catalog"]["Row"];
type OrderRow = Database["public"]["Tables"]["material_orders"]["Row"];

const STATUS_META: Record<MaterialOrderStatus, { label: string; tone: "warning" | "muted" | "success"; next: MaterialOrderStatus }> = {
  att_bestalla: { label: "Att beställa", tone: "warning", next: "bestalld" },
  bestalld: { label: "Beställd", tone: "muted", next: "mottagen" },
  mottagen: { label: "Mottagen", tone: "success", next: "att_bestalla" },
};

export default function Bestallningar() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { org } = useAuth();

  const [catalog, setCatalog] = useState<MaterialRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newNote, setNewNote] = useState("");

  const load = useCallback(async () => {
    if (!org) return;
    const [{ data: items }, { data: ord }] = await Promise.all([
      supabase.from("material_catalog").select("*").eq("org_id", org.id).order("name"),
      supabase.from("material_orders").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    ]);
    setCatalog(items ?? []);
    setOrders(ord ?? []);
  }, [org]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openMaterialIds = new Set(orders.filter((o) => o.status !== "mottagen" && o.material_id).map((o) => o.material_id));
  const suggestions = catalog.filter(
    (item) => item.min_quantity != null && item.stock_quantity <= item.min_quantity && !openMaterialIds.has(item.id),
  );

  async function addSuggestion(item: MaterialRow) {
    if (!org) return;
    const quantity = Math.max(1, item.reorder_quantity ?? ((item.min_quantity ?? 0) - item.stock_quantity || 1));
    const { error } = await supabase.from("material_orders").insert({
      org_id: org.id,
      material_id: item.id,
      material_name: item.name,
      quantity,
    });
    if (error) {
      Alert.alert("Kunde inte lägga till", getErrorMessage(error));
      return;
    }
    load();
  }

  async function addManual() {
    if (!org || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("material_orders").insert({
      org_id: org.id,
      material_name: newName.trim(),
      quantity: Math.max(1, Number.parseInt(newQuantity, 10) || 1),
      note: newNote.trim(),
    });
    setSaving(false);
    if (error) {
      Alert.alert("Kunde inte lägga till", getErrorMessage(error));
      return;
    }
    setNewName("");
    setNewQuantity("1");
    setNewNote("");
    setAdding(false);
    load();
  }

  async function cycleStatus(order: OrderRow) {
    const next = STATUS_META[order.status].next;
    await supabase.from("material_orders").update({ status: next }).eq("id", order.id);
    load();
  }

  function removeOrder(order: OrderRow) {
    Alert.alert("Ta bort beställningen?", order.material_name, [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort",
        style: "destructive",
        onPress: async () => {
          await supabase.from("material_orders").delete().eq("id", order.id);
          load();
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Beställningar</Text>
      <Text style={{ color: theme.muted, marginBottom: 16 }}>{orders.filter((o) => o.status !== "mottagen").length} öppna beställningar</Text>

      {suggestions.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Förslag (lågt lagersaldo)</Text>
          {suggestions.map((item) => (
            <Card key={item.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "700" }}>{item.name}</Text>
                <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>
                  {item.stock_quantity} st i lager · min {item.min_quantity} st
                </Text>
              </View>
              <Button title="+ Lägg till" variant="secondary" onPress={() => addSuggestion(item)} />
            </Card>
          ))}
        </>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Beställningar</Text>
      {orders.length === 0 && <Text style={{ color: theme.muted }}>Inga beställningar ännu.</Text>}
      {orders.map((order) => (
        <Card key={order.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {order.material_name} · {order.quantity} st
            </Text>
            {!!order.note && <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>{order.note}</Text>}
          </View>
          <TouchableOpacity onPress={() => cycleStatus(order)}>
            <Badge label={STATUS_META[order.status].label} tone={STATUS_META[order.status].tone} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeOrder(order)} style={{ marginLeft: 10 }}>
            <Text style={{ color: theme.danger }}>Ta bort</Text>
          </TouchableOpacity>
        </Card>
      ))}

      {adding ? (
        <Card style={{ marginTop: 16 }}>
          <Field label="Vad ska beställas" placeholder="T.ex. Kopparrör 15mm" value={newName} onChangeText={setNewName} />
          <Field label="Antal" value={newQuantity} onChangeText={setNewQuantity} keyboardType="number-pad" />
          <Field label="Anteckning" placeholder="Valfritt" value={newNote} onChangeText={setNewNote} />
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button title="Spara" onPress={addManual} loading={saving} disabled={!newName.trim()} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Avbryt" variant="ghost" onPress={() => setAdding(false)} />
            </View>
          </View>
        </Card>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Button title="+ Ny beställning" variant="ghost" onPress={() => setAdding(true)} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 20, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
});
