import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { studentRedeemUrl } from "@/lib/links";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type StudentRow = Database["public"]["Tables"]["students"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];

export default function PrintCards() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from("classes").select("*").eq("id", id).single(),
        supabase.from("students").select("*").eq("class_id", id).is("revoked_at", null).order("name"),
      ]);
      setCls(c ?? null);
      setStudents(s ?? []);
    })();
  }, [id]);

  function print() {
    if (Platform.OS === "web" && typeof window !== "undefined") window.print();
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.noPrint}>
          <Text style={{ color: theme.muted, marginBottom: 12 }}>
            {students.length} elevkort redo. Klicka skriv ut och välj etikettpapper eller vanligt papper att klippa ut.
          </Text>
          <Button title="🖨 Skriv ut" onPress={print} />
        </View>
      ) : (
        <Text style={{ color: theme.muted, marginBottom: 12 }}>
          Utskrift stöds just nu bäst från webbversionen på en dator. Öppna appen i webbläsaren för att skriva ut elevkort.
        </Text>
      )}

      <View style={styles.grid}>
        {students.map((s) => (
          <View key={s.id} style={[styles.cardItem, { borderColor: theme.border }]}>
            <Text style={styles.className}>{cls?.name}</Text>
            <QRCode value={studentRedeemUrl(s.code)} size={120} />
            <Text style={styles.studentName}>{s.name}</Text>
            <Text style={styles.studentCode}>{s.code}</Text>
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
    width: 180,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  className: { fontSize: 11, color: "#8A97A0", marginBottom: 6, textTransform: "uppercase", fontWeight: "700" },
  studentName: { fontSize: 15, fontWeight: "800", color: "#0F1B24", marginTop: 8, textAlign: "center" },
  studentCode: { fontSize: 11, color: "#8A97A0", marginTop: 2 },
});
