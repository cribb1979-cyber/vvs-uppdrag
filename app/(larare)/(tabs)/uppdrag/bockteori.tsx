import { useRouter } from "expo-router";
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
            style={{ width: "100%", height: 260, resizeMode: "contain", backgroundColor: theme.card }}
          />
          {!!b.caption && <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{b.caption}</Text>}
        </TouchableOpacity>
      );
    }
    return null;
  }

  function skrivUtBilder() {
    const bilder: Array<[string, string]> = [
      ["Offset – 45°", bockImagePath("teori-offset-matt")],
      ["S-bock – 30°", bockImagePath("teori-s-bock-matt")],
      ["Z-bock – 90°", bockImagePath("teori-z-bock-matt")],
      ["90° och 45°", bockImagePath("teori-90-45-matt")],
      ["Mäta från insida", bockImagePath("teori-insida-matt")],
    ];
    if (Platform.OS !== "web") {
      Alert.alert("Skriv ut", "Öppna webbversionen (vvs-uppdrag.vercel.app) och tryck på Skriv ut där.");
      return;
    }
    const w = (globalThis as any).window?.open("", "_blank");
    if (!w) {
      Alert.alert("Popup blockerad", "Tillåt popup-fönster för att skriva ut bilderna.");
      return;
    }
    const html = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>Bockning – bilder</title><style>
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0f2a44; margin: 0; }
      section { page-break-after: always; break-after: page; }
      section:last-child { page-break-after: auto; break-after: auto; }
      h1 { font-size: 24pt; margin: 0 0 2mm; }
      img { width: 100%; height: 155mm; object-fit: contain; display: block; border: 1px solid #d6dee2; }
      p { font-size: 10pt; color: #6b7280; }
    </style></head><body>
    ${bilder.map(([t, p]) => `<section><h1>${t}</h1><img src="${quizImageUrl(p)}"><p>Principskiss – kontrollera mot din bocknyckel.</p></section>`).join("")}
    </body></html>`;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 1200);
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Bockning – teori och formler</Text>
      <Text style={[styles.ingress, { color: theme.muted }]}>
        Varför böjer röret sig? Vad är cc-mått? Hur räknar man en offset eller S-bock? Här är grunderna – med
        formler, exempel och vanliga fel.
      </Text>

      <TouchableOpacity
        onPress={skrivUtBilder}
        style={[styles.printBtn, { backgroundColor: theme.accent }]}
        accessibilityRole="button"
      >
        <Text style={styles.printBtnText}>🖨 Skriv ut bilderna (A4 liggande)</Text>
      </TouchableOpacity>
      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4, marginBottom: 12 }}>
        En bild per sida – samma mått som i appen. Tryck på en bild för att öppna den i full storlek.
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
  printBtn: { minHeight: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  printBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  p: { fontSize: 13.5, lineHeight: 20, marginBottom: 8 },
  bullet: { fontSize: 13.5, lineHeight: 20, marginBottom: 2 },
  note: { borderLeftWidth: 4, borderRadius: 6, padding: 10, marginVertical: 6 },
  table: { borderWidth: 1, borderRadius: 8, overflow: "hidden", marginVertical: 6 },
  tr: { flexDirection: "row", alignItems: "center" },
  th: { flex: 1, fontWeight: "800", fontSize: 12, padding: 8 },
  td: { flex: 1, fontSize: 12.5, padding: 8 },
});
