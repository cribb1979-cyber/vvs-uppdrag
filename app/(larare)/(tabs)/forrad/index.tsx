import { useFocusEffect, useRouter } from "expo-router";
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
import type { Database } from "@/lib/database.types";

type MaterialRow = Database["public"]["Tables"]["material_catalog"]["Row"];

export default function Forrad() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org } = useAuth();

  const [items, setItems] = useState<MaterialRow[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRsk, setNewRsk] = useState("");
  const [newDimension, setNewDimension] = useState("");
  const [newQuantity, setNewQuantity] = useState("0");

  const load = useCallback(async () => {
    if (!org) return;
    const { data } = await supabase.from("material_catalog").select("*").eq("org_id", org.id).order("name");
    setItems(data ?? []);
  }, [org]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function addItem() {
    if (!org || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("material_catalog").insert({
      org_id: org.id,
      name: newName.trim(),
      rsk_number: newRsk.trim(),
      dimension: newDimension.trim(),
      stock_quantity: Math.max(0, Number.parseInt(newQuantity, 10) || 0),
    });
    setSaving(false);
    if (error) {
      Alert.alert("Kunde inte lägga till artikeln", getErrorMessage(error));
      return;
    }
    setNewName("");
    setNewRsk("");
    setNewDimension("");
    setNewQuantity("0");
    setAdding(false);
    load();
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((i) =>
        [i.name, i.article_number, i.rsk_number, i.category, i.supplier].some((f) => f.toLowerCase().includes(q)),
      )
    : items;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Förråd</Text>
      <Text style={{ color: theme.muted, marginBottom: 16 }}>{items.length} artiklar registrerade</Text>

      <View style={styles.actionRow}>
        <View style={{ flex: 1 }}>
          <Button title="📥 Importera lista" variant="secondary" onPress={() => router.push("/(larare)/(tabs)/forrad/import")} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="🖨 Etiketter" variant="secondary" onPress={() => router.push("/(larare)/(tabs)/forrad/skriv-ut")} />
        </View>
      </View>
      <View style={{ height: 12 }} />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="Sök namn, RSK-nummer, artikelnummer..."
        placeholderTextColor={theme.muted}
        value={search}
        onChangeText={setSearch}
      />

      <View style={{ height: 16 }} />
      {filtered.map((item) => {
        const lowStock = item.min_quantity != null && item.stock_quantity <= item.min_quantity;
        return (
          <TouchableOpacity key={item.id} onPress={() => router.push(`/(larare)/(tabs)/forrad/artikel/${item.id}`)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "700" }}>{item.name}</Text>
                <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>
                  {[item.dimension, item.rsk_number && `RSK ${item.rsk_number}`, item.shelf_location].filter(Boolean).join(" · ") || "—"}
                </Text>
              </View>
              <Badge label={`${item.stock_quantity} st`} tone={lowStock ? "danger" : "muted"} />
            </Card>
          </TouchableOpacity>
        );
      })}
      {filtered.length === 0 && items.length > 0 && <Text style={{ color: theme.muted }}>Inga träffar på "{search}".</Text>}
      {items.length === 0 && <Text style={{ color: theme.muted }}>Inga artiklar ännu. Lägg till en eller importera en lista.</Text>}

      {adding ? (
        <Card style={{ marginTop: 16 }}>
          <Field label="Namn" placeholder="T.ex. Kopparrör" value={newName} onChangeText={setNewName} />
          <Field label="RSK-nummer" placeholder="Valfritt" value={newRsk} onChangeText={setNewRsk} keyboardType="number-pad" />
          <Field label="Dimension" placeholder="T.ex. 15 mm" value={newDimension} onChangeText={setNewDimension} />
          <Field label="Antal i lager" value={newQuantity} onChangeText={setNewQuantity} keyboardType="number-pad" />
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button title="Spara" onPress={addItem} loading={saving} disabled={!newName.trim()} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Avbryt" variant="ghost" onPress={() => setAdding(false)} />
            </View>
          </View>
        </Card>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Button title="+ Lägg till artikel" variant="ghost" onPress={() => setAdding(true)} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800" },
  actionRow: { flexDirection: "row", gap: 8 },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
});
