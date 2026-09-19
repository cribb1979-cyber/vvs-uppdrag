import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { materialArticleUrl } from "@/lib/links";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MaterialRow = Database["public"]["Tables"]["material_catalog"]["Row"];

export default function SkrivUtEtiketter() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { org } = useAuth();
  const [items, setItems] = useState<MaterialRow[]>([]);

  useEffect(() => {
    if (!org) return;
    supabase
      .from("material_catalog")
      .select("*")
      .eq("org_id", org.id)
      .order("name")
      .then(({ data }) => setItems(data ?? []));
  }, [org]);

  function print() {
    if (Platform.OS === "web" && typeof window !== "undefined") window.print();
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.noPrint}>
          <Text style={{ color: theme.muted, marginBottom: 12 }}>
            {items.length} etiketter redo. Klicka skriv ut och välj etikettpapper eller vanligt papper att klippa ut.
          </Text>
          <Button title="🖨 Skriv ut alla" onPress={print} />
        </View>
      ) : (
        <Text style={{ color: theme.muted, marginBottom: 12 }}>
          Utskrift stöds just nu bäst från webbversionen på en dator. Öppna appen i webbläsaren för att skriva ut etiketter.
        </Text>
      )}

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={[styles.cardItem, { borderColor: theme.border }]}>
            <QRCode value={materialArticleUrl(item.id)} size={110} />
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            {!!item.rsk_number && <Text style={styles.itemMeta}>RSK {item.rsk_number}</Text>}
            {!!item.dimension && <Text style={styles.itemMeta}>{item.dimension}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  noPrint: { marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "flex-start" },
  cardItem: {
    width: 160,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  itemName: { fontSize: 13, fontWeight: "800", color: "#0F1B24", marginTop: 8, textAlign: "center" },
  itemMeta: { fontSize: 11, color: "#8A97A0", marginTop: 2 },
});
