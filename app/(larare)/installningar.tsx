import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Installningar() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { profile, org, signOut } = useAuth();
  const [pending, setPending] = useState<Profile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!org || profile?.role !== "admin") return;
    const { data } = await supabase.from("profiles").select("*").eq("org_id", org.id).eq("status", "pending");
    setPending(data ?? []);
  }, [org, profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function approve(id: string) {
    setBusyId(id);
    await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    setBusyId(null);
    load();
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Skola</Text>
      <Card>
        <Text style={{ color: theme.text, fontWeight: "700" }}>{org?.name}</Text>
        <Text style={{ color: theme.muted, marginTop: 4 }}>Kod för att bjuda in lärare: {org?.join_code}</Text>
      </Card>

      {profile?.role === "admin" && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Väntande lärare</Text>
          {pending.length === 0 && <Text style={{ color: theme.muted }}>Inga väntande ansökningar.</Text>}
          {pending.map((p) => (
            <Card key={p.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "700" }}>{p.full_name || "Namnlös lärare"}</Text>
                <Badge label="Väntar" tone="warning" />
              </View>
              <Button title="Godkänn" onPress={() => approve(p.id)} loading={busyId === p.id} />
            </Card>
          ))}
        </>
      )}

      <View style={{ height: 32 }} />
      <Button title="Logga ut" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 24, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 12 },
});
