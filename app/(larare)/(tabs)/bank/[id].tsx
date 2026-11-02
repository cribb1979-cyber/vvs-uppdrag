import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import {
  BANK_STATUS_LABEL,
  BANK_STATUS_TONE,
  ateroppnaMall,
  granskaMall,
  hamtaMall,
  listaGranskningar,
  raderaMall,
  taUtMall,
  type UppdragsbankGranskning,
  type UppdragsbankMall,
} from "@/lib/uppdragsbank";
import {
  SAKERVATTEN_GILTIG_FRAN,
  SAKERVATTEN_URL,
  SAKERVATTEN_VERSION,
  reglerFor,
} from "@/lib/sakervatten";

function SectionTitle({ text }: { text: string }) {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <Text style={[styles.section, { color: theme.muted }]}>{text}</Text>
  );
}

export default function BankMall() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org, profile } = useAuth();
  const [mall, setMall] = useState<UppdragsbankMall | null>(null);
  const [granskningar, setGranskningar] = useState<UppdragsbankGranskning[]>([]);
  const [kommentar, setKommentar] = useState("");
  const [jobb, setJobb] = useState<string | null>(null);

  const ladda = useCallback(async () => {
    if (!id) return;
    try {
      const m = await hamtaMall(id);
      setMall(m);
      if (m) setGranskningar(await listaGranskningar(m.id));
    } catch (e) {
      Alert.alert("Kunde inte hämta mallen", getErrorMessage(e));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      ladda();
    }, [ladda]),
  );

  async function taUt() {
    if (!mall) return;
    setJobb("taUt");
    try {
      const nyttId = await taUtMall(mall.id);
      Alert.alert("Uppdraget ligger nu hos dig", "Det skapades som ett utkast i din skola.", [
        { text: "Öppna uppdraget", onPress: () => router.push({ pathname: "/(larare)/(tabs)/uppdrag/[id]", params: { id: nyttId } }) },
        { text: "Stanna kvar" },
      ]);
    } catch (e) {
      Alert.alert("Kunde inte ta ut mallen", getErrorMessage(e));
    } finally {
      setJobb(null);
    }
  }

  async function granska(godkann: boolean) {
    if (!mall) return;
    setJobb(godkann ? "godkann" : "avsla");
    try {
      await granskaMall(mall.id, godkann, kommentar.trim());
      setKommentar("");
      await ladda();
      Alert.alert(godkann ? "Mallen är godkänd" : "Mallen är avslagen", godkann ? "Nu kan alla lärare ta ut den." : "Ägaren kan rätta och skicka in den igen.");
    } catch (e) {
      Alert.alert("Kunde inte spara granskningen", getErrorMessage(e));
    } finally {
      setJobb(null);
    }
  }

  async function skickaInIgen() {
    if (!mall) return;
    setJobb("ateroppna");
    try {
      await ateroppnaMall(mall.id);
      await ladda();
    } catch (e) {
      Alert.alert("Kunde inte öppna mallen igen", getErrorMessage(e));
    } finally {
      setJobb(null);
    }
  }

  function radera() {
    if (!mall) return;
    Alert.alert("Ta bort mallen?", "Uppdrag som redan tagits ut påverkas inte.", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort",
        style: "destructive",
        onPress: async () => {
          try {
            await raderaMall(mall.id);
            router.back();
          } catch (e) {
            Alert.alert("Kunde inte ta bort", getErrorMessage(e));
          }
        },
      },
    ]);
  }

  if (!mall) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  const arMin = mall.created_by === profile?.id;
  const kanTaUt = mall.status === "godkand" || mall.agare_org_id === org?.id;
  const regler = reglerFor(mall.regel_refs);
  const a = mall.payload?.assignment;
  const material = mall.payload?.material_requirements ?? [];
  const fragor = mall.payload?.quiz_questions ?? [];
  const kriterier = mall.payload?.assessment_criteria ?? [];

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.text }]}>{mall.titel}</Text>
        <Badge label={BANK_STATUS_LABEL[mall.status]} tone={BANK_STATUS_TONE[mall.status]} />
      </View>
      {!!mall.beskrivning && <Text style={[styles.desc, { color: theme.muted }]}>{mall.beskrivning}</Text>}

      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 8 }}>
        {mall.agare_org_id === org?.id ? "Din skola" : "Delad av en annan skola"} · version {mall.version} ·
        skapad {new Date(mall.created_at).toLocaleDateString("sv-SE")}
      </Text>

      {kanTaUt && (
        <View style={{ marginTop: 16 }}>
          <Button
            title={mall.status === "godkand" ? "Ta ut till min skola" : "Ta ut (egen skola)"}
            onPress={taUt}
            loading={jobb === "taUt"}
          />
        </View>
      )}

      {mall.status === "granskning" && arMin && (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: theme.warning, fontWeight: "800" }}>Granskas av en kollega</Text>
          <Text style={{ color: theme.muted, marginTop: 4 }}>
            Du kan inte godkänna din egen mall. När en annan lärare har granskat den blir den synlig i banken.
          </Text>
        </Card>
      )}

      {mall.status === "granskning" && !arMin && (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: theme.text, fontWeight: "800", marginBottom: 6 }}>Granska mallen</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 10 }}>
            Läs igenom innehållet och bedöm om det är redo att delas. Din granskning sparas med namn och tid.
          </Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder="Kommentar (frivillig)"
            placeholderTextColor={theme.muted}
            value={kommentar}
            onChangeText={setKommentar}
            multiline
          />
          <View style={{ gap: 8 }}>
            <Button title="Godkänn mallen" onPress={() => granska(true)} loading={jobb === "godkann"} />
            <Button title="Avslå med kommentar" variant="danger" onPress={() => granska(false)} loading={jobb === "avsla"} />
          </View>
        </Card>
      )}

      {mall.status === "avslagen" && (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: theme.danger, fontWeight: "800" }}>Avslagen</Text>
          {!!mall.granskningskommentar && (
            <Text style={{ color: theme.text, marginTop: 6 }}>“{mall.granskningskommentar}”</Text>
          )}
          {arMin && (
            <View style={{ marginTop: 12 }}>
              <Button title="Rätta och skicka in igen" variant="secondary" onPress={skickaInIgen} loading={jobb === "ateroppna"} />
            </View>
          )}
        </Card>
      )}

      <SectionTitle text="INNEHÅLL" />
      <Card>
        <Text style={{ color: theme.text, fontWeight: "800", marginBottom: 6 }}>{a?.title || mall.titel}</Text>
        {!!a?.description && <Text style={{ color: theme.muted, marginBottom: 8 }}>{a.description}</Text>}
        {!!a?.goal && (
          <>
            <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "800", marginTop: 6 }}>MÅL</Text>
            <Text style={{ color: theme.text, marginBottom: 6 }}>{a.goal}</Text>
          </>
        )}
        {!!a?.self_check_items?.length && (
          <>
            <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "800", marginTop: 6 }}>EGEN KONTROLL</Text>
            {a.self_check_items.map((it) => (
              <Text key={it} style={{ color: theme.text }}>☐  {it}</Text>
            ))}
          </>
        )}
        {material.length > 0 && (
          <>
            <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "800", marginTop: 10 }}>MATERIAL</Text>
            {material.map((r, i) => (
              <Text key={i} style={{ color: theme.text }}>
                •  {r.component} {r.dimension ? `(${r.dimension})` : ""} × {r.quantity}
              </Text>
            ))}
          </>
        )}
        {fragor.length > 0 && (
          <>
            <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "800", marginTop: 10 }}>QUIZFRÅGOR</Text>
            <Text style={{ color: theme.text }}>{fragor.length} bildfrågor följer med i uttaget.</Text>
          </>
        )}
        {kriterier.length > 0 && (
          <>
            <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "800", marginTop: 10 }}>BEDÖMNINGSKRITERIER</Text>
            {kriterier.map((k, i) => (
              <Text key={i} style={{ color: theme.text }}>•  {k.label}</Text>
            ))}
          </>
        )}
        {a?.kind === "quiz" && (
          <Text style={{ color: theme.muted, marginTop: 8 }}>Typ: materialquiz</Text>
        )}
      </Card>

      <SectionTitle text={`SÄKERVATTEN ${SAKERVATTEN_VERSION}`} />
      <Card>
        <Text style={{ color: theme.muted, fontSize: 12, marginBottom: 8 }}>
          Giltig från {SAKERVATTEN_GILTIG_FRAN}. Sammanfattningarna är appens egna – öppna alltid originalet för full text.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(SAKERVATTEN_URL)}>
          <Text style={{ color: theme.tint, fontWeight: "700" }}>Öppna Branschregler 2026:1 på sakervatten.se →</Text>
        </TouchableOpacity>
        {regler.length === 0 ? (
          <Text style={{ color: theme.muted, marginTop: 10 }}>Inga Säkervatten-regler är kopplade till mallen.</Text>
        ) : (
          regler.map((r) => (
            <View key={r.kod} style={{ marginTop: 12 }}>
              <Text style={{ color: theme.text, fontWeight: "700" }}>{r.rubrik}</Text>
              <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>{r.sammanfattning}</Text>
              {r.kontrollpunkter.slice(0, 2).map((p) => (
                <Text key={p} style={{ color: theme.text, fontSize: 13 }}>☐  {p}</Text>
              ))}
            </View>
          ))
        )}
      </Card>

      <SectionTitle text="GRANSKNINGSHISTORIK" />
      {granskningar.length === 0 ? (
        <Text style={{ color: theme.muted }}>Ingen granskning ännu.</Text>
      ) : (
        granskningar.map((g) => (
          <Card key={g.id} style={{ marginBottom: 10 }}>
            <Text style={{ color: g.godkand ? theme.success : theme.danger, fontWeight: "800" }}>
              {g.godkand ? "Godkänd" : "Avslagen"} · {new Date(g.created_at).toLocaleString("sv-SE")}
            </Text>
            {!!g.kommentar && <Text style={{ color: theme.text, marginTop: 4 }}>“{g.kommentar}”</Text>}
          </Card>
        ))
      )}

      {(arMin || profile?.role === "admin") && (
        <View style={{ marginTop: 22 }}>
          <Button title="Ta bort mallen" variant="danger" onPress={radera} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { flex: 1, fontSize: 24, fontWeight: "800" },
  desc: { fontSize: 15, lineHeight: 21, marginTop: 6 },
  section: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, marginTop: 24, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 70, textAlignVertical: "top", marginBottom: 10 },
});
