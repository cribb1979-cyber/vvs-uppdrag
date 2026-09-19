import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

interface MyAssignment {
  id: string;
  title: string;
  description: string;
  kind: "uppdrag" | "quiz";
}

export default function MinaUppdrag() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const [items, setItems] = useState<MyAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsCode, setNeedsCode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase.rpc("list_my_assignments");
    if (err) {
      if (err.message.includes("Ingen elevkod")) {
        setNeedsCode(true);
      } else {
        setError(getErrorMessage(err, "Kunde inte hämta uppdrag."));
      }
      setItems(null);
      return;
    }
    setNeedsCode(false);
    setItems((data as unknown as MyAssignment[]) ?? []);
  }, []);

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

  if (needsCode) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={[styles.title, { color: theme.text }]}>Ingen kod kopplad</Text>
        <Text style={{ color: theme.muted, textAlign: "center", marginBottom: 20 }}>
          Skanna ditt elevkort eller skriv in din kod för att komma åt dina uppdrag.
        </Text>
        <Button title="Skanna / ange kod" onPress={() => router.replace("/elev/scan")} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (!items) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
    >
      <Text style={[styles.title, { color: theme.text }]}>Mina uppdrag</Text>

      {items.length === 0 && (
        <Text style={{ color: theme.muted, marginTop: 12 }}>Inga uppdrag tilldelade dig just nu.</Text>
      )}

      {items.map((a) => (
        <TouchableOpacity key={a.id} onPress={() => router.push(`/elev/mina-uppdrag/${a.id}`)}>
          <Card style={styles.row}>
            <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16 }}>
              {a.kind === "quiz" ? "🖼 " : ""}
              {a.title}
            </Text>
            {!!a.description && (
              <Text style={{ color: theme.muted, marginTop: 4 }} numberOfLines={2}>
                {a.description}
              </Text>
            )}
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  row: { marginBottom: 12 },
});
