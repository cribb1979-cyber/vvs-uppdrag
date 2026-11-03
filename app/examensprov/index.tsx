// Publik översikt för examensveckan. En enda QR kan peka hit, och eleven
// väljer moment utan inloggning. Inga elevsvar visas här.
import { Link } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { EXAM_TASKS, timmar } from "@/lib/examVvs";
import { RITVERKSTAD_URL } from "@/lib/links";

const TON = {
  Dokumentation: "accent",
  Kontroll: "warning",
  Beräkning: "success",
  Installation: "danger",
} as const;

export default function Examensvecka() {
  const theme = Colors[useColorScheme() ?? "light"];

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.eyebrow, { color: theme.muted }]}>EXAMENSPROV VVS-MONTÖR</Text>
      <Text style={[styles.title, { color: theme.text }]}>Examensveckan</Text>
      <Text style={[styles.ingress, { color: theme.text }]}>
        Alla moment under examensveckan. Välj ett moment för att se uppgiften. Sidan är publik och visar inga elevsvar.
      </Text>

      <Card style={{ marginTop: 12, borderColor: theme.accent }}>
        <Text style={{ color: theme.text, fontWeight: "700" }}>
          Det här är en översikt – ingen inloggning eller session.
        </Text>
        <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4, lineHeight: 19 }}>
          Sidan är alltid öppen. Själva inlämningen sker via länken/QR-koden som läraren delar för uppdraget.
        </Text>
      </Card>

      <Card style={{ marginTop: 16, borderColor: theme.tint }}>
        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>🖥 Laneskär Ritverkstad</Text>
        <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
          Ritmomentet görs i Ritverkstaden. Exportera ritningen som SVG/PNG eller .cad och lämna in enligt
          lärarens instruktion.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(RITVERKSTAD_URL)} style={{ marginTop: 10 }}>
          <Text style={{ color: theme.tint, fontWeight: "700" }}>Öppna Ritverkstaden →</Text>
        </TouchableOpacity>
      </Card>

      <Text style={[styles.section, { color: theme.text }]}>Moment</Text>
      {EXAM_TASKS.map((task, index) => (
        <Card key={task.id} style={{ marginBottom: 10 }}>
          <View style={styles.row}>
            <Text style={{ color: theme.muted, fontWeight: "800", width: 28 }}>{index + 1}</Text>
            <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16, flex: 1 }}>{task.titel}</Text>
            <Badge label={task.kategori} tone={TON[task.kategori]} />
          </View>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>ca {timmar(task.minut)}</Text>
          <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20, marginTop: 8 }} numberOfLines={3}>
            {task.beskrivning}
          </Text>
          <Link href={`/examensprov/${task.id}`} style={{ color: theme.tint, fontWeight: "700", marginTop: 10 }}>
            Öppna momentet →
          </Link>
        </Card>
      ))}

      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 20, textAlign: "center" }}>
        Sidan visar bara momentens innehåll – inga elevsvar eller resultat.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, maxWidth: 760, width: "100%", alignSelf: "center" },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 10 },
  ingress: { fontSize: 15, lineHeight: 22 },
  section: { fontSize: 16, fontWeight: "800", marginTop: 22, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
});
