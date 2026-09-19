import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { materialArticleUrl } from "@/lib/links";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MaterialRow = Database["public"]["Tables"]["material_catalog"]["Row"];

export default function ArtikelDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();

  const [item, setItem] = useState<MaterialRow | null>(null);
  const [form, setForm] = useState<Partial<Record<keyof MaterialRow, string>>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("material_catalog").select("*").eq("id", id).single();
    setItem(data ?? null);
    if (data) {
      setForm({
        name: data.name,
        article_number: data.article_number,
        rsk_number: data.rsk_number,
        dimension: data.dimension,
        category: data.category,
        supplier: data.supplier,
        shelf_location: data.shelf_location,
        stock_quantity: String(data.stock_quantity),
        min_quantity: data.min_quantity != null ? String(data.min_quantity) : "",
        note: data.note,
      });
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function setField(key: keyof MaterialRow, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!id || !form.name?.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("material_catalog")
      .update({
        name: form.name.trim(),
        article_number: form.article_number?.trim() ?? "",
        rsk_number: form.rsk_number?.trim() ?? "",
        dimension: form.dimension?.trim() ?? "",
        category: form.category?.trim() ?? "",
        supplier: form.supplier?.trim() ?? "",
        shelf_location: form.shelf_location?.trim() ?? "",
        stock_quantity: Math.max(0, Number.parseInt(form.stock_quantity ?? "0", 10) || 0),
        min_quantity: form.min_quantity?.trim() ? Math.max(0, Number.parseInt(form.min_quantity, 10) || 0) : null,
        note: form.note?.trim() ?? "",
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      Alert.alert("Kunde inte spara", getErrorMessage(error));
      return;
    }
    load();
  }

  function remove() {
    if (!id || !item) return;
    Alert.alert("Ta bort artikeln?", `${item.name} tas bort ur förrådsregistret.`, [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("material_catalog").delete().eq("id", id);
          if (error) {
            Alert.alert("Kunde inte ta bort", getErrorMessage(error));
            return;
          }
          router.back();
        },
      },
    ]);
  }

  function print() {
    if (Platform.OS === "web" && typeof window !== "undefined") window.print();
  }

  if (!item) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Card style={styles.qrCard}>
        <View style={styles.qrWrap}>
          <QRCode value={materialArticleUrl(item.id)} size={140} />
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        {!!item.rsk_number && <Text style={{ color: theme.muted }}>RSK {item.rsk_number}</Text>}
        <View style={{ height: 12 }} />
        <Button title="🖨 Skriv ut etikett" variant="secondary" onPress={print} />
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Uppgifter</Text>
      <Card>
        <Field label="Namn" value={form.name ?? ""} onChangeText={(v) => setField("name", v)} />
        <Field label="Artikelnummer" value={form.article_number ?? ""} onChangeText={(v) => setField("article_number", v)} />
        <Field label="RSK-nummer" value={form.rsk_number ?? ""} onChangeText={(v) => setField("rsk_number", v)} keyboardType="number-pad" />
        <Field label="Dimension" value={form.dimension ?? ""} onChangeText={(v) => setField("dimension", v)} />
        <Field label="Kategori" value={form.category ?? ""} onChangeText={(v) => setField("category", v)} />
        <Field label="Leverantör" value={form.supplier ?? ""} onChangeText={(v) => setField("supplier", v)} />
        <Field label="Hyllplats" value={form.shelf_location ?? ""} onChangeText={(v) => setField("shelf_location", v)} />
        <Field label="Antal i lager" value={form.stock_quantity ?? ""} onChangeText={(v) => setField("stock_quantity", v)} keyboardType="number-pad" />
        <Field label="Min. antal (varning vid lägre)" value={form.min_quantity ?? ""} onChangeText={(v) => setField("min_quantity", v)} keyboardType="number-pad" />
        <Field label="Anteckning" value={form.note ?? ""} onChangeText={(v) => setField("note", v)} multiline numberOfLines={3} />
        <Button title="Spara" onPress={save} loading={saving} disabled={!form.name?.trim()} />
      </Card>

      <View style={{ height: 20 }} />
      <Button title="Ta bort artikel" variant="danger" onPress={remove} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  qrCard: { alignItems: "center", marginBottom: 8 },
  qrWrap: { padding: 12, backgroundColor: "#fff", borderRadius: 12, marginBottom: 8 },
  name: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 24, marginBottom: 12 },
});
