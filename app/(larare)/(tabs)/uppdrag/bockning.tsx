import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { BOCKNINGAR, type BockNiva, type BockOvning } from "@/lib/bockVvs";

const NIVÅER: Array<"Alla" | BockNiva> = ["Alla", "Grund", "Fördjupning", "Mästare"];

function normalisera(text: string): string {
  return text.toLowerCase().replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o");
}

function matchar(o: BockOvning, q: string): boolean {
  if (!q) return true;
  const text = [o.titel, o.sammanfattning, o.niva, o.kalla ?? "", ...o.yrkestermer, ...o.moment, ...o.kontroll].join(" ");
  return normalisera(text).includes(q);
}

function nivaTone(niva: BockNiva): "success" | "warning" | "danger" {
  return niva === "Grund" ? "success" : niva === "Fördjupning" ? "warning" : "danger";
}

export default function Bockningar() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [niva, setNiva] = useState<"Alla" | BockNiva>("Alla");
  const [oppna, setOppna] = useState<Record<string, boolean>>({});

  const q = normalisera(query.trim());
  const lista = useMemo(
    () => BOCKNINGAR.filter((o) => (niva === "Alla" || o.niva === niva) && matchar(o, q)),
    [niva, q],
  );

  function vaxla(id: string) {
    setOppna((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function skapa(o: BockOvning) {
    router.push({
      pathname: "/(larare)/(tabs)/uppdrag/new",
      params: { bockning: o.id },
    } as any);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.text }]}>Bockövningar</Text>
      <Text style={[styles.ingress, { color: theme.muted }]}>
        Åtta praktiska bockövningar i koppar och PEX. Skapa ett uppdrag med moment, kontrollpunkter, yrkesspråk och
        materialrader – ändra allt innan du sparar.
      </Text>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.text, fontWeight: "800", marginBottom: 6 }}>Yrkesspråk i verkstaden</Text>
        <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19 }}>
          Bockmått, bockradie, bockvinkel, ovalitet, veckbildning, sträckning och skäva. Varje övning tränar både
          handlaget och språket – eleven ska kunna säga vad som är fel och varför.
        </Text>
      </Card>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Sök övning, verktyg eller yrkestermer"
        placeholderTextColor={theme.muted}
        style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />

      <View style={styles.chips}>
        {NIVÅER.map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setNiva(n)}
            style={[
              styles.chip,
              {
                borderColor: niva === n ? theme.accent : theme.border,
                backgroundColor: niva === n ? theme.accent + "22" : theme.card,
              },
            ]}
          >
            <Text style={{ color: theme.text, fontWeight: "700", fontSize: 13 }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.resultat, { color: theme.muted }]}>
        Visar {lista.length} av {BOCKNINGAR.length} övningar
      </Text>

      {lista.length === 0 && (
        <Card>
          <Text style={{ color: theme.muted }}>Ingen övning matchar ”{query.trim()}”.</Text>
        </Card>
      )}

      {lista.map((o) => {
        const expanderad = Boolean(oppna[o.id]);
        return (
          <Card key={o.id} style={styles.kort}>
            <Text style={[styles.rubrik, { color: theme.text }]}>{o.titel}</Text>
            <View style={styles.badgeRad}>
              <Badge label={o.niva} tone={nivaTone(o.niva)} />
              <Badge label={`${o.tidMin} min`} tone="muted" />
            </View>
            <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }}>{o.sammanfattning}</Text>

            <View style={styles.atgarder}>
              <TouchableOpacity onPress={() => vaxla(o.id)} accessibilityRole="button">
                <Text style={{ color: theme.tint, fontWeight: "700" }}>
                  {expanderad ? "Dölj moment" : `Visa moment (${o.moment.length})`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => skapa(o)} accessibilityRole="button">
                <Text style={{ color: theme.accent, fontWeight: "700" }}>+ Skapa övning</Text>
              </TouchableOpacity>
            </View>

            {expanderad && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.delRubrik, { color: theme.text }]}>Moment</Text>
                {o.moment.map((m, i) => (
                  <Text key={m} style={{ color: theme.text, fontSize: 13, marginTop: 4 }}>
                    {i + 1}. {m}
                  </Text>
                ))}

                <Text style={[styles.delRubrik, { color: theme.text, marginTop: 12 }]}>Kontrollpunkter</Text>
                {o.kontroll.map((k) => (
                  <Text key={k} style={{ color: theme.text, fontSize: 13, marginTop: 4 }}>
                    ☐  {k}
                  </Text>
                ))}

                <Text style={[styles.delRubrik, { color: theme.text, marginTop: 12 }]}>Yrkesspråk</Text>
                <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19 }}>{o.yrkestermer.join(" · ")}</Text>

                <Text style={[styles.delRubrik, { color: theme.text, marginTop: 12 }]}>Vanliga fel</Text>
                {o.vanligaFel.map((f) => (
                  <Text key={f} style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
                    • {f}
                  </Text>
                ))}

                {!!o.kalla && (
                  <>
                    <Text style={[styles.delRubrik, { color: theme.text, marginTop: 12 }]}>Källa</Text>
                    <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 18 }}>{o.kalla}</Text>
                  </>
                )}

                <Text style={[styles.delRubrik, { color: theme.text, marginTop: 12 }]}>Säkerhet</Text>
                {o.sakerhet.map((s) => (
                  <Text key={s} style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
                    • {s}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "800" },
  ingress: { fontSize: 15, lineHeight: 21, marginTop: 4, marginBottom: 16 },
  search: { minHeight: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  resultat: { fontSize: 13, marginBottom: 8 },
  kort: { marginBottom: 10 },
  rubrik: { fontSize: 15, fontWeight: "800" },
  badgeRad: { flexDirection: "row", gap: 6, marginTop: 6 },
  atgarder: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 12 },
  delRubrik: { fontSize: 13, fontWeight: "800" },
});
