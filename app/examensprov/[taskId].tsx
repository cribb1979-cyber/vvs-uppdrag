// Publik stationssida för examensprovet. QR-etiketterna som skrivs ut från
// Etikettstudion pekar hit, så att en telefonkamera kan öppna momentet utan
// inloggning – samma princip som /i/[token] för verkstadens installationer.
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { EXAM_TASKS, timmar } from "@/lib/examVvs";

const TON = {
  Dokumentation: "accent",
  Kontroll: "warning",
  Beräkning: "success",
  Installation: "danger",
} as const;

export default function ExamStation() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const task = EXAM_TASKS.find((t) => t.id === taskId);
  const nummer = task ? EXAM_TASKS.findIndex((t) => t.id === task.id) + 1 : 0;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {!task ? (
        <Card>
          <Text style={{ color: theme.text, fontWeight: "800", fontSize: 18 }}>Momentet finns inte</Text>
          <Text style={{ color: theme.muted, marginTop: 8 }}>
            QR-koden kan höra till ett moment som tagits bort. Be din lärare om en ny etikett.
          </Text>
        </Card>
      ) : (
        <>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            EXAMENSPROV VVS-MONTÖR · STATION {nummer}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>{task.titel}</Text>
          <View style={styles.badges}>
            <Badge label={task.kategori} tone={TON[task.kategori]} />
            <Badge label={`ca ${timmar(task.minut)}`} tone="muted" />
          </View>

          <Card style={{ marginTop: 16 }}>
            <Text style={[styles.body, { color: theme.text }]}>{task.beskrivning}</Text>
          </Card>

          {task.checklista.length > 0 && (
            <Card style={{ marginTop: 12 }}>
              <Text style={[styles.section, { color: theme.text }]}>Det här ska vara med</Text>
              {task.checklista.map((punkt) => (
                <Text key={punkt} style={[styles.listItem, { color: theme.text }]}>
                  ☐  {punkt}
                </Text>
              ))}
            </Card>
          )}

          {task.fragor.length > 0 && (
            <Card style={{ marginTop: 12 }}>
              <Text style={[styles.section, { color: theme.text }]}>Frågor att besvara</Text>
              {task.fragor.map((fraga) => (
                <Text key={fraga} style={[styles.listItem, { color: theme.text }]}>
                  •  {fraga}
                </Text>
              ))}
            </Card>
          )}

          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 20, textAlign: "center" }}>
            Sidan är publik och visar bara momentets innehåll – inga elevsvar.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, maxWidth: 720, width: "100%", alignSelf: "center" },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  badges: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  body: { fontSize: 15, lineHeight: 22 },
  section: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 },
  listItem: { fontSize: 15, lineHeight: 24 },
});
