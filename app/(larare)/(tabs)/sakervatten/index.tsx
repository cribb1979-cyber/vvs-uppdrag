import { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import {
  REGLER,
  SAKERVATTEN_GILTIG_FRAN,
  SAKERVATTEN_URL,
  SAKERVATTEN_VERSION,
  reglerPerOmrade,
  type SakervattenRegel,
} from "@/lib/sakervatten";

function normalisera(text: string): string {
  return text.toLowerCase().replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o");
}

function matchar(regel: SakervattenRegel, q: string): boolean {
  if (!q) return true;
  const text = [regel.rubrik, regel.sammanfattning, regel.omrade, regel.kod, ...regel.kontrollpunkter].join(" ");
  return normalisera(text).includes(q);
}

export default function SakervattenScreen() {
  const theme = Colors[useColorScheme() ?? "light"];
  const [query, setQuery] = useState("");
  const [oppna, setOppna] = useState<Record<string, boolean>>({});

  const q = normalisera(query.trim());
  const grupper = useMemo(
    () =>
      reglerPerOmrade()
        .map((grupp) => ({ ...grupp, regler: grupp.regler.filter((regel) => matchar(regel, q)) }))
        .filter((grupp) => grupp.regler.length > 0),
    [q],
  );
  const antal = grupper.reduce((sum, grupp) => sum + grupp.regler.length, 0);

  function vaxla(kod: string) {
    setOppna((prev) => ({ ...prev, [kod]: !prev[kod] }));
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.text }]}>Säkervatten {SAKERVATTEN_VERSION}</Text>
      <Text style={[styles.ingress, { color: theme.muted }]}>
        {REGLER.length} regler i {reglerPerOmrade().length} områden. Giltig från {SAKERVATTEN_GILTIG_FRAN}.
      </Text>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.text, fontWeight: "800", marginBottom: 6 }}>Appens egna sammanfattningar</Text>
        <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19 }}>
          Det här är inte den officiella regeltexten. Sammanfattningarna är skrivna för appen och varje regel
          utgår från Branschregler {SAKERVATTEN_VERSION}. Full text finns i boken och på sakervatten.se.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(SAKERVATTEN_URL)} style={{ marginTop: 10 }}>
          <Text style={{ color: theme.tint, fontWeight: "700" }}>
            Öppna Branschregler {SAKERVATTEN_VERSION} på sakervatten.se →
          </Text>
        </TouchableOpacity>
      </Card>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Sök regel, område eller kontrollpunkt"
        placeholderTextColor={theme.muted}
        style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
      {q.length > 0 && (
        <Text style={[styles.resultat, { color: theme.muted }]}>
          Visar {antal} av {REGLER.length} regler
        </Text>
      )}

      {grupper.length === 0 && (
        <Card>
          <Text style={{ color: theme.muted }}>Ingen regel matchar ”{query.trim()}”.</Text>
        </Card>
      )}

      {grupper.map((grupp) => (
        <View key={grupp.omrade} style={{ marginBottom: 8 }}>
          <View style={styles.omradeRad}>
            <Text style={[styles.omrade, { color: theme.text }]}>
              {grupp.emoji} {grupp.omrade}
            </Text>
            <Badge label={`${grupp.regler.length}`} tone="muted" />
          </View>
          {grupp.regler.map((regel) => {
            const expanderad = Boolean(oppna[regel.kod]);
            return (
              <Card key={regel.kod} style={styles.regelKort}>
                <Text style={[styles.regelRubrik, { color: theme.text }]}>{regel.rubrik}</Text>
                <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
                  {regel.sammanfattning}
                </Text>
                <TouchableOpacity onPress={() => vaxla(regel.kod)} style={styles.kontrollKnapp} accessibilityRole="button">
                  <Text style={{ color: theme.tint, fontWeight: "700" }}>
                    {expanderad ? "Dölj kontrollpunkter" : `Visa kontrollpunkter (${regel.kontrollpunkter.length})`}
                  </Text>
                </TouchableOpacity>
                {expanderad && (
                  <View style={{ marginTop: 6 }}>
                    {regel.kontrollpunkter.map((punkt) => (
                      <Text key={punkt} style={{ color: theme.text, fontSize: 13, marginTop: 4 }}>
                        ☐  {punkt}
                      </Text>
                    ))}
                    <Text style={{ color: theme.muted, fontSize: 11, marginTop: 10 }}>Regelkod: {regel.kod}</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "800" },
  ingress: { fontSize: 15, lineHeight: 21, marginTop: 4, marginBottom: 16 },
  search: { minHeight: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, marginBottom: 8 },
  resultat: { fontSize: 13, marginBottom: 8 },
  omradeRad: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 8 },
  omrade: { fontSize: 17, fontWeight: "800" },
  regelKort: { marginBottom: 8 },
  regelRubrik: { fontSize: 15, fontWeight: "800" },
  kontrollKnapp: { marginTop: 10, alignSelf: "flex-start" },
});
