import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Badge } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Assignment = Database["public"]["Tables"]["assignments"]["Row"];

const STATUS_LABEL: Record<Assignment["status"], string> = {
  draft: "Utkast",
  active: "Aktivt",
  archived: "Arkiverat",
};
const STATUS_TONE: Record<Assignment["status"], "muted" | "success" | "accent"> = {
  draft: "muted",
  active: "success",
  archived: "muted",
};

export default function UppdragList() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!org) return;
    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [org]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!loading && items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Inga uppdrag ännu</Text>
        <Text style={[styles.emptyBody, { color: theme.muted }]}>Skapa ditt första praktiska uppdrag för att komma igång.</Text>
        <TouchableOpacity style={[styles.cta, { backgroundColor: theme.accent }]} onPress={() => router.push("/(larare)/(tabs)/uppdrag/new")}>
          <Text style={styles.ctaText}>+ Nytt uppdrag</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(a) => a.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      ListHeaderComponent={
        <TouchableOpacity style={[styles.cta, { backgroundColor: theme.accent, marginBottom: 16 }]} onPress={() => router.push("/(larare)/(tabs)/uppdrag/new")}>
          <Text style={styles.ctaText}>+ Nytt uppdrag</Text>
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push(`/(larare)/(tabs)/uppdrag/${item.id}`)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>
              {item.kind === "quiz" ? "🖼 " : ""}
              {item.title}
            </Text>
            {!!item.description && (
              <Text style={[styles.rowDesc, { color: theme.muted }]} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 60 },
  row: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12, gap: 12 },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowDesc: { fontSize: 13, marginTop: 3 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  emptyBody: { fontSize: 15, textAlign: "center", marginBottom: 24 },
  cta: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
});
