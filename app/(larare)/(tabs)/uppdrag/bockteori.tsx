import { useRouter } from "expo-router";
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BOCK_TEORI, type TeoriBlock } from "@/lib/bockTeori";
import { bockImagePath } from "@/lib/bockVvs";
import { quizImageUrl } from "@/lib/quizImages";

function skrivUt(titel: string, css: string, body: string) {
  if (Platform.OS !== "web") {
    Alert.alert("Skriv ut", "Öppna webbversionen (vvs-uppdrag.vercel.app) och tryck på Skriv ut där.");
    return;
  }
  const w = (globalThis as any).window?.open("", "_blank");
  if (!w) {
    Alert.alert("Popup blockerad", "Tillåt popup-fönster för att skriva ut.");
    return;
  }
  w.document.write(`<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>${titel}</title><style>${css}</style></head><body>${body}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 1200);
}

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
    const css = `
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0f2a44; margin: 0; }
      section { page-break-after: always; break-after: page; }
      section:last-child { page-break-after: auto; break-after: auto; }
      h1 { font-size: 24pt; margin: 0 0 2mm; }
      img { width: 100%; height: 155mm; object-fit: contain; display: block; border: 1px solid #d6dee2; }
      p { font-size: 10pt; color: #6b7280; }
      table { width: 100%; border-collapse: collapse; margin: 2mm 0 3mm; font-size: 10pt; }
      th { background: #0f2a44; color: #fff; text-align: left; padding: 1.5mm 2mm; }
      td { border-bottom: 1px solid #d6dee2; padding: 1.2mm 2mm; }
      ul { margin: 0 0 2mm 5mm; padding: 0; }
      li { margin: 0.8mm 0; font-size: 10.5pt; }
    `;
    const html = `
    ${bilder.map(([t, p]) => `<section><h1>${t}</h1><img src="${quizImageUrl(p)}"><p>Principskiss – kontrollera mot din bocknyckel.</p></section>`).join("")}
    <section>
      <h1>Räkneexempel</h1>
      <p>Så räknar du ut avståndet innan du bockar.</p>
      <table><tr><th>Vinkel</th><th>Faktor</th><th>Exempel</th></tr>
        <tr><td>15°</td><td>3,7</td><td>60 mm S → 60 × 3,7 = 222 mm</td></tr>
        <tr><td>30°</td><td>2,0</td><td>60 mm S → 60 × 2,0 = 120 mm</td></tr>
        <tr><td>45°</td><td>1,41</td><td>60 mm S → 60 × 1,41 = 84,6 mm</td></tr>
        <tr><td>90°</td><td>1,0</td><td>Z-bock – offset = cc-mått</td></tr>
      </table>
      <p><b>Offset och S-bock:</b></p>
      <ul>
        <li>Offset 50 mm, 45°: 50 × 1,41 = <b>70,5 mm</b>.</li>
        <li>Offset 100 mm, 30°: 100 × 2,0 = <b>200 mm</b>.</li>
        <li>S-bock 60 mm, 45°: 60 × 1,41 = <b>84,6 mm</b>.</li>
      </ul>
      <p><b>Större S-bock – videons formler:</b></p>
      <ul>
        <li>12 rör: 90 + X. S = 90 mm → 90 + 90 = <b>180 mm</b>.</li>
        <li>15 rör: 110 + X. S = 80 mm → 110 + 80 = <b>190 mm</b>.</li>
        <li>Tight S-bock 45°: 15 mm ≈ <b>60 mm cc</b>, 12 mm ≈ <b>50 mm cc</b>.</li>
        <li>Första/andra strecket: 15 mm ≈ 15/35 mm S. 12 mm ≈ 10/30 mm S.</li>
      </ul>
      <p><b>Öva själv:</b></p>
      <ul>
        <li>Offset 70 mm, 45° → 70 × 1,41 = <b>98,7 mm</b>.</li>
        <li>S-bock 50 mm, 30° → 50 × 2,0 = <b>100 mm</b>.</li>
        <li>15 rör, S = 100 mm → 110 + 100 = <b>210 mm</b>.</li>
        <li>12 rör, S = 60 mm → 90 + 60 = <b>150 mm</b>.</li>
      </ul>
      <p>110 + X och 90 + X är praktiska formler för den bocknyckel Anders använder. Alla bocknycklar slår olika – kontrollera din egen.</p>
    </section>
    `;
    skrivUt("Bockning – bilder", css, html);
  }

  function skrivUtFuskblad() {
    const css = `
      @page { size: A4 portrait; margin: 10mm; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0f2a44; margin: 0; }
      h1 { font-size: 17pt; margin: 0 0 1mm; }
      .sub { font-size: 9pt; color: #6b7280; margin: 0 0 3mm; }
      table { width: 100%; border-collapse: collapse; margin: 0 0 3mm; font-size: 9.5pt; }
      th { background: #0f2a44; color: #fff; text-align: left; padding: 1.2mm 2mm; }
      td { border-bottom: 1px solid #d6dee2; padding: 1mm 2mm; }
      .bilder { display: flex; gap: 4mm; margin: 0 0 3mm; }
      .bilder figure { flex: 1; margin: 0; }
      .bilder img { width: 100%; height: 48mm; object-fit: contain; border: 1px solid #d6dee2; display: block; }
      figcaption { font-size: 8pt; color: #6b7280; margin-top: 0.5mm; }
      h2 { font-size: 11pt; margin: 0 0 1.5mm; }
      ul { margin: 0; padding: 0; list-style: none; column-count: 2; column-gap: 6mm; }
      li { font-size: 9.5pt; margin: 0 0 1.2mm; break-inside: avoid; }
      .fot { font-size: 8pt; color: #6b7280; margin-top: 3mm; border-top: 1px solid #d6dee2; padding-top: 1.5mm; }
    `;
    const html = `
      <h1>Bockning – fuskblad</h1>
      <p class="sub">Formler, två vanliga bockar och de mått du använder oftast.</p>
      <table>
        <tr><th>Vinkel</th><th>Faktor</th><th>Används till</th><th>Exempel: S eller offset 60 mm</th></tr>
        <tr><td>15°</td><td>3,7</td><td>stor offset/S</td><td>60 × 3,7 = 222 mm</td></tr>
        <tr><td>30°</td><td>2,0</td><td>vanlig S</td><td>60 × 2,0 = 120 mm</td></tr>
        <tr><td>45°</td><td>1,41</td><td>vanligast</td><td>60 × 1,41 = 84,6 mm</td></tr>
        <tr><td>60°</td><td>1,15</td><td>kort offset</td><td>60 × 1,15 = 69 mm</td></tr>
        <tr><td>90°</td><td>1,0</td><td>Z-bock</td><td>offset = cc-mått</td></tr>
      </table>
      <div class="bilder">
        <figure><img src="${quizImageUrl(bockImagePath("teori-offset-matt"))}"><figcaption>Offset – två lika bockar åt motsatt håll.</figcaption></figure>
        <figure><img src="${quizImageUrl(bockImagePath("teori-s-bock-matt"))}"><figcaption>S-bock – S-måttet är förskjutningen.</figcaption></figure>
      </div>
      <h2>Vanligaste måtten</h2>
      <ul>
        <li>Offset 50 mm, 45° → 50 × 1,41 = <b>70,5 mm</b></li>
        <li>Offset 100 mm, 30° → 100 × 2,0 = <b>200 mm</b></li>
        <li>S-bock 60 mm, 45° → <b>84,6 mm</b></li>
        <li>S-bock 60 mm, 30° → <b>120 mm</b></li>
        <li>15 mm rör: <b>110 + X</b>. S 80 → <b>190 mm</b></li>
        <li>12 mm rör: <b>90 + X</b>. S 90 → <b>180 mm</b></li>
        <li>Tight S 45°: 15 mm ≈ <b>60 mm cc</b></li>
        <li>Tight S 45°: 12 mm ≈ <b>50 mm cc</b></li>
        <li>Märken 15 mm: <b>15 / 35 mm S</b></li>
        <li>Märken 12 mm: <b>10 / 30 mm S</b></li>
      </ul>
      <p class="fot">Alla bocknycklar slår olika – kontrollera din egen. Mät alltid från samma referens (centrum eller insida).</p>
    `;
    skrivUt("Bockning – fuskblad", css, html);
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Bockning – teori och formler</Text>
      <Text style={[styles.ingress, { color: theme.muted }]}>
        Varför böjer röret sig? Vad är cc-mått? Hur räknar man en offset eller S-bock? Här är grunderna – med
        formler, exempel och vanliga fel.
      </Text>

      <TouchableOpacity
        onPress={skrivUtFuskblad}
        style={[styles.printBtn, { backgroundColor: theme.success }]}
        accessibilityRole="button"
      >
        <Text style={styles.printBtnText}>🖨 Fuskblad – allt på en A4-sida</Text>
      </TouchableOpacity>
      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4, marginBottom: 12 }}>
        Formlerna, offset och S-bock samt de vanligaste måtten. En sida att sätta i pärmen.
      </Text>

      <TouchableOpacity
        onPress={skrivUtBilder}
        style={[styles.printBtn, { backgroundColor: theme.accent }]}
        accessibilityRole="button"
      >
        <Text style={styles.printBtnText}>🖨 Skriv ut bilder + räkneexempel (A4 liggande)</Text>
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
