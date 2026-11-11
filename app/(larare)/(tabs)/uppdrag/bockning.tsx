import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { modeToFields } from "@/lib/assignmentMode";
import { skapaMallFranUppdrag } from "@/lib/uppdragsbank";
import { supabase } from "@/lib/supabase";
import { BOCKNINGAR, type BockNiva, type BockOvning } from "@/lib/bockVvs";
import { OffsetDiagram } from "@/components/OffsetDiagram";

const NIVÅER: Array<"Alla" | BockNiva> = ["Alla", "Grund", "Fördjupning", "Mästare"];

function normalisera(text: string): string {
  return text.toLowerCase().replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o");
}

function matchar(o: BockOvning, q: string): boolean {
  if (!q) return true;
  const text = [o.titel, o.sammanfattning, o.forklaring ?? "", o.niva, o.kalla ?? "", ...o.yrkestermer, ...o.moment, ...o.kontroll].join(" ");
  return normalisera(text).includes(q);
}

function nivaTone(niva: BockNiva): "success" | "warning" | "danger" {
  return niva === "Grund" ? "success" : niva === "Fördjupning" ? "warning" : "danger";
}

export default function Bockningar() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org, profile } = useAuth();
  const [skickar, setSkickar] = useState<string | null>(null);
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

  async function laggIBank(o: BockOvning) {
    if (!org || !profile) {
      Alert.alert("Inte inloggad", "Logga in som lärare först.");
      return;
    }
    if (skickar) return;
    setSkickar(o.id);
    try {
      const beskrivning = [
        o.sammanfattning,
        "",
        "Moment:",
        ...o.moment.map((m, i) => `${i + 1}. ${m}`),
        "",
        "Yrkesspråk: " + o.yrkestermer.join(", "),
        "",
        "Säkerhet:",
        ...o.sakerhet.map((s) => `- ${s}`),
        "",
        "Vanliga fel:",
        ...o.vanligaFel.map((f) => `- ${f}`),
        ...(o.kalla ? ["", "Källa: " + o.kalla] : []),
      ].join("\n");

      const { data: assignment, error } = await supabase
        .from("assignments")
        .insert({
          org_id: org.id,
          created_by: profile.id,
          title: `Bockövning – ${o.titel}`,
          description: beskrivning,
          kind: "uppdrag",
          ...modeToFields("prov"),
          goal: o.mal.join(" "),
          self_check_items: o.kontroll,
          reflection_questions: o.reflektion,
          rule_refs: [],
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;

      const rader = o.material
        .filter((m) => m.component.trim())
        .map((m, i) => ({
          assignment_id: assignment.id,
          component: m.component.trim(),
          dimension: (m.dimension ?? "").trim(),
          quantity: Math.max(1, m.quantity ?? 1),
          sort_order: i,
        }));
      if (rader.length > 0) {
        const { error: reqErr } = await supabase.from("material_requirements").insert(rader);
        if (reqErr) throw reqErr;
      }

      const mallId = await skapaMallFranUppdrag(assignment.id, {
        titel: `Bockövning – ${o.titel}`,
        beskrivning: o.sammanfattning,
      });

      // Uppdraget är nu fryst i banken – arkivera det så uppdragslistan hålls ren.
      await supabase.from("assignments").update({ status: "archived" }).eq("id", assignment.id);

      Alert.alert("Inlagd i uppdragsbanken", "Mallen ligger nu under Granskningsstatus i banken.", [
        { text: "OK" },
        {
          text: "Öppna",
          onPress: () =>
            router.push({
              pathname: "/(larare)/(tabs)/bank/[id]",
              params: { id: mallId },
            } as any),
        },
      ]);
    } catch (e) {
      Alert.alert("Kunde inte lägga i banken", getErrorMessage(e));
    } finally {
      setSkickar(null);
    }
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
            <TouchableOpacity
              onPress={() => laggIBank(o)}
              disabled={skickar !== null}
              accessibilityRole="button"
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: theme.tint, fontWeight: "700" }}>
                {skickar === o.id ? "Lägger i banken…" : "🏦 Lägg i uppdragsbanken"}
              </Text>
            </TouchableOpacity>

            {expanderad && (
              <View style={{ marginTop: 10 }}>
                {o.diagram === "offset" && (
                  <View style={{ marginTop: 8, marginBottom: 6 }}>
                    <OffsetDiagram />
                    <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                      Två motriktade 45°-bockar. Röret fortsätter rakt men på en ny nivå.
                    </Text>
                  </View>
                )}

                {!!o.forklaring && (
                  <>
                    <Text style={[styles.delRubrik, { color: theme.text }]}>Förklaring</Text>
                    <Text style={{ color: theme.text, fontSize: 13, lineHeight: 19, marginTop: 4 }}>{o.forklaring}</Text>
                  </>
                )}

                <Text style={[styles.delRubrik, { color: theme.text, marginTop: 12 }]}>Moment</Text>
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
