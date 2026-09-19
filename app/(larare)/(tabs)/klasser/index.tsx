import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];

export default function KlasserList() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org, profile } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!org) return;
    const { data } = await supabase.from("classes").select("*").eq("org_id", org.id).order("created_at", { ascending: false });
    setClasses(data ?? []);
    if (data && data.length > 0) {
      const { data: students } = await supabase
        .from("students")
        .select("class_id")
        .in(
          "class_id",
          data.map((c) => c.id),
        )
        .is("revoked_at", null);
      const counts: Record<string, number> = {};
      for (const s of students ?? []) counts[s.class_id] = (counts[s.class_id] ?? 0) + 1;
      setStudentCounts(counts);
    }
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

  async function createClass() {
    if (!org || !profile || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("classes").insert({
      org_id: org.id,
      name: name.trim(),
      year_level: yearLevel.trim(),
      school_year: schoolYear.trim(),
      created_by: profile.id,
    });
    setSaving(false);
    if (error) {
      Alert.alert("Kunde inte skapa klassen", getErrorMessage(error));
      return;
    }
    setName("");
    setYearLevel("");
    setSchoolYear("");
    setCreating(false);
    load();
  }

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      data={classes}
      keyExtractor={(c) => c.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          {creating ? (
            <Card>
              <Field label="Klassnamn" placeholder="t.ex. VVS åk 1" value={name} onChangeText={setName} />
              <Field label="Årskurs (valfritt)" placeholder="t.ex. åk1" value={yearLevel} onChangeText={setYearLevel} />
              <Field label="Läsår (valfritt)" placeholder="t.ex. HT26" value={schoolYear} onChangeText={setSchoolYear} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Avbryt" variant="ghost" onPress={() => setCreating(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Skapa" onPress={createClass} loading={saving} disabled={!name.trim()} />
                </View>
              </View>
            </Card>
          ) : (
            <Button title="+ Ny klass" onPress={() => setCreating(true)} />
          )}
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <Text style={{ color: theme.muted, textAlign: "center", marginTop: 20 }}>Inga klasser ännu.</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push(`/(larare)/(tabs)/klasser/${item.id}`)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>{item.name}</Text>
            <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>
              {[item.year_level, item.school_year].filter(Boolean).join(" · ") || "—"}
            </Text>
          </View>
          <Text style={{ color: theme.muted }}>{studentCounts[item.id] ?? 0} elever</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 60 },
  row: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12, gap: 12 },
  rowTitle: { fontSize: 16, fontWeight: "700" },
});
