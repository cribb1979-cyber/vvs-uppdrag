import { useRouter } from "expo-router";
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BOCK_TEORI, type TeoriBlock } from "@/lib/bockTeori";
import { bockImagePath } from "@/lib/bockVvs";
import { quizImageUrl } from "@/lib/quizImages";

export default function BockTeori() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();

  function block(b: TeoriBlock, i: number) {
    if (b.type === "p") {
      return <Text key={i} style={[styles.p, { color: theme.text }]}>{b.text}</Text>;
    }
    if (b.type === "bullets") {
      return (
        <View key={i} style={{ marginBottom: 6 }}>
          {b.items.map((item) => (
            <Text key={item} style={[styles.bullet, { color: theme.text }]}>•  {item}</Text>
          ))}
        </View>
      );
    }
    if (b.type === "note") {
      return (
        <View key={i} style={[styles.note, { backgroundColor: theme.accent + "18", borderLeftColor: theme.accent }]}>
          <Text style={{ color: theme.text, fontSize: 13, lineHeight: 19 }}>{b.text}</Text>
        </View>
      );
    }
    if (b.type === "example") {
      return (
        <View key={i} style={[styles.note, { backgroundColor: theme.success + "18", borderLeftColor: theme.success }]}>
          <Text style={{ color: theme.text, fontSize: 13, lineHeight: 19 }}><Text style={{ fontWeight: "800" }}>Räkneexempel: </Text>{b.text}</Text>
        </View>
      );
    }
    if (b.type === "formula") {
      return (
        <View key={i} style={[styles.table, { borderColor: theme.border }]}>
          <View style={[styles.tr, { backgroundColor: theme.card }]}>
            <Text style={[styles.th, { color: theme.text }]}>Vinkel</Text>
            <Text style={[styles.th, { color: theme.text }]}>Faktor</Text>
            <Text style={[styles.th, { color: theme.text, flex: 2 }]}>Används till</Text>
          </View>
          {b.rows.map((r) => (
            <View key={r.vinkel} style={[styles.tr, { borderTopColor: theme.border }]}>
              <Text style={[styles.td, { color: theme.text }]}>{r.vinkel}</Text>
              <Text style={[styles.td, { color: theme.accent, fontWeight: "800" }]}>{r.faktor}</Text>
              <Text style={[styles.td, { color: theme.muted, flex: 2 }]}>{r.anvandning}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (b.type === "image") {
      return (
        <TouchableOpacity
          key={i}
          onPress={() => Linking.openURL(quizImageUrl(bockImagePath(b.exerciseId)))}
          accessibilityRole="imagebutton"
          style={{ marginTop: 8 }}
        >
          <Image
            source={{ uri: quizImageUrl(bockImagePath(b.exerciseId)) }}
            style={{ width: "100%", height: 190, resizeMode: "contain", backgroundColor: theme.card }}
          />
          {!!b.caption && <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{b.caption}</Text>}
        </TouchableOpacity>
      );
    }
    return null;
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Bockning – teori och formler</Text>
      <Text style={[styles.ingress, { color: theme.muted }]}>
        Varför böjer röret sig? Vad är cc-mått? Hur räknar man en offset eller S-bock? Här är grunderna – med
        formler, exempel och vanliga fel.
      </Text>

      {BOCK_TEORI.map((section) => (
        <Card key={section.id} style={{ marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.titel}</Text>
          {!!section.ingress && (
            <Text style={{ color: theme.tint, fontSize: 13, marginTop: 2, marginBottom: 8 }}>{section.ingress}</Text>
          )}
          {section.block.map(block)}
        </Card>
      ))}

      <TouchableOpacity
        onPress={() => router.push("/(larare)/(tabs)/uppdrag/bockning" as any)}
        style={{ paddingVertical: 14 }}
      >
        <Text style={{ color: theme.accent, fontWeight: "800", textAlign: "center" }}>← Tillbaka till bockövningarna</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 50 },
  title: { fontSize: 26, fontWeight: "800" },
  ingress: { fontSize: 15, lineHeight: 21, marginTop: 4, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  p: { fontSize: 13.5, lineHeight: 20, marginBottom: 8 },
  bullet: { fontSize: 13.5, lineHeight: 20, marginBottom: 2 },
  note: { borderLeftWidth: 4, borderRadius: 6, padding: 10, marginVertical: 6 },
  table: { borderWidth: 1, borderRadius: 8, overflow: "hidden", marginVertical: 6 },
  tr: { flexDirection: "row", alignItems: "center" },
  th: { flex: 1, fontWeight: "800", fontSize: 12, padding: 8 },
  td: { flex: 1, fontSize: 12.5, padding: 8 },
});
