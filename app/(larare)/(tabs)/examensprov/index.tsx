import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { EXAM_TASKS, timmar, type ExamTask } from "@/lib/examVvs";
import { examWeekUrl, RITVERKSTAD_URL } from "@/lib/links";
import { examMeta } from "@/lib/examMode";
import { modeToFields, type AssignmentMode } from "@/lib/assignmentMode";
import { supabase } from "@/lib/supabase";

const KATEGORI_TON = {
  Dokumentation: "accent",
  Kontroll: "warning",
  Beräkning: "success",
  Installation: "danger",
} as const;

export default function Examensprov() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org, profile } = useAuth();
  const [arbetar, setArbetar] = useState<string | null>(null);

  async function skapa(task: ExamTask, lage: AssignmentMode) {
    if (!org || !profile) return;
    const nyckel = `${task.id}:${lage}`;
    setArbetar(nyckel);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          org_id: org.id,
          created_by: profile.id,
          title: task.titel,
          description: `${task.beskrivning}\n\nUppskattad tid: ${timmar(task.minut)}.`,
          kind: "uppdrag",
          ...modeToFields(lage),
          goal:
            lage === "prov"
              ? `Klara uppgiften på ${timmar(task.minut)} utan avbrott – då är du redo för examensprovet.`
              : `Träna på ${task.titel.toLowerCase()} i lugn och ro.`,
          self_check_items: task.checklista,
          reflection_questions: task.fragor,
          steps: [examMeta(task.id, task.minut, lage)],
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      router.push(`/(larare)/(tabs)/uppdrag/${data.id}`);
    } catch (e) {
      Alert.alert("Kunde inte skapa uppdraget", getErrorMessage(e));
    } finally {
      setArbetar(null);
    }
  }

  async function skapaHelaVeckan() {
    if (!org || !profile) return;
    setArbetar("hela-veckan");
    try {
      const momentText = EXAM_TASKS.map(
        (t, i) => `${i + 1}. ${t.titel} (${timmar(t.minut)})\n${t.beskrivning}`,
      ).join("\n\n");
      const beskrivning =
        "Genomför alla moment i examensprovet under veckan. Tiderna är uppskattade.\n\n" +
        `${momentText}\n\n` +
        `Ritverkstad: ${RITVERKSTAD_URL}\n` +
        `Alla moment finns också på ${examWeekUrl()}`;
      const selfCheck = EXAM_TASKS.flatMap((t) =>
        t.checklista.map((punkt) => `${t.titel}: ${punkt}`),
      );
      const regler = Array.from(new Set(EXAM_TASKS.flatMap((t) => t.regelRefs ?? [])));

      const { data, error } = await supabase
        .from("assignments")
        .insert({
          org_id: org.id,
          created_by: profile.id,
          title: "Examensvecka VVS-montör",
          description: beskrivning,
          kind: "uppdrag",
          ...modeToFields("prov"),
          goal: "Genomföra alla moment i examensprovet VVS-montör.",
          self_check_items: selfCheck,
          reflection_questions: [
            "Vilka moment gick bra?",
            "Vilka moment behöver du komplettera?",
            "Vad lärde du dig under veckan?",
            "Vad skulle du göra annorlunda nästa gång?",
          ],
          steps: [examMeta("examensvecka", 4 * 24 * 60, "prov")],
          rule_refs: regler,
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      router.push(`/(larare)/(tabs)/uppdrag/${data.id}`);
    } catch (e) {
      Alert.alert("Kunde inte skapa examensveckan", getErrorMessage(e));
    } finally {
      setArbetar(null);
    }
  }

  async function kopieraVeckolank() {
    const url = examWeekUrl();
    const clipboard = typeof navigator !== "undefined" ? (navigator as any).clipboard : null;
    if (Platform.OS === "web" && clipboard?.writeText) {
      try {
        await clipboard.writeText(url);
        Alert.alert("Examenslänk kopierad", url);
        return;
      } catch {
        // fall tillbaka till dela-dialogen
      }
    }
    await Share.share({ message: `Examensprov VVS-montör: ${url}` });
  }

  const totalt = EXAM_TASKS.reduce((s, t) => s + t.minut, 0);

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Examensprov VVS-montör</Text>
      <Text style={[styles.ingress, { color: theme.muted }]}>
        Byggt på VVS-Branschens Yrkesnämnds gymnasiearbete. {EXAM_TASKS.length} delmoment, cirka {timmar(totalt)} totalt.
      </Text>

      <Button
        title="🎓 Skapa hela examensveckan"
        onPress={skapaHelaVeckan}
        loading={arbetar === "hela-veckan"}
        disabled={arbetar !== null}
      />
      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6, marginBottom: 16 }}>
        Ett uppdrag med alla moment och en gemensam session för hela veckan. De enskilda momenten finns kvar nedan.
      </Text>

      <View style={{ marginBottom: 16 }}>
        <Button
          title="🏷 Skriv ut stationsetiketter"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/(larare)/(tabs)/forrad/skriv-ut",
              params: { kalla: "examensprov" },
            })
          }
        />
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6 }}>
          QR-kod på varje station som öppnar momentet – skrivs direkt på etikettskrivaren.
        </Text>
        <View style={{ height: 10 }} />
        <Button
          title="🏷 Skriv ut examensveckans QR"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/(larare)/(tabs)/forrad/skriv-ut",
              params: { kalla: "examensvecka" },
            })
          }
        />
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6 }}>
          En QR för hela examensveckan – öppnar översikten med alla moment.
        </Text>
        <Text selectable style={{ color: theme.tint, fontSize: 12, marginTop: 6 }}>
          {examWeekUrl()}
        </Text>
      </View>

      <Card style={{ alignItems: "center", marginBottom: 16 }}>
        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>QR för examensveckan</Text>
        <Text style={{ color: theme.muted, fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 10 }}>
          Visa på projektorn, skriv ut på A4 eller skriv ut etiketten. QR:en öppnar alla moment.
        </Text>
        <View style={{ backgroundColor: "#fff", padding: 14, borderRadius: 14 }}>
          <QRCode value={examWeekUrl()} size={230} color="#0F1B24" backgroundColor="#ffffff" />
        </View>
        <Text selectable style={{ color: theme.tint, fontSize: 12, marginTop: 10 }}>
          {examWeekUrl()}
        </Text>
        <View style={{ height: 10 }} />
        <Button title="📋 Kopiera examenslänk" variant="secondary" onPress={kopieraVeckolank} />
      </Card>

      <View style={styles.modes}>
        <Card style={{ flex: 1, borderColor: theme.accent }}>
          <Text style={{ color: theme.accent, fontWeight: "800" }}>🎓 Övning</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
            Facit, ledtrådar och AI-hjälp på. Ingen klocka. Gör om hur många gånger du vill.
          </Text>
        </Card>
        <Card style={{ flex: 1, borderColor: theme.danger }}>
          <Text style={{ color: theme.danger, fontWeight: "800" }}>🔒 Skarpt läge</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
            Klocka på uppskattad tid, facit och AI av. Ska slutföras utan avbrott.
          </Text>
        </Card>
      </View>

      {EXAM_TASKS.map((t) => {
        const nyckel = `${t.id}:prov`;
        return (
          <Card key={t.id} style={{ marginTop: 12 }}>
            <View style={styles.rad}>
              <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16, flex: 1 }}>{t.titel}</Text>
              <Badge label={t.kategori} tone={KATEGORI_TON[t.kategori]} />
            </View>
            <Text style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>{timmar(t.minut)}</Text>
            <Text style={{ color: theme.text, fontSize: 14, marginTop: 8 }} numberOfLines={4}>
              {t.beskrivning}
            </Text>
            <View style={{ height: 12 }} />
            <View style={styles.knappar}>
              <View style={{ flex: 1 }}>
                <Button
                  title="🎓 Öva"
                  variant="secondary"
                  onPress={() => skapa(t, "ovning")}
                  loading={arbetar === `${t.id}:ovning`}
                  disabled={arbetar !== null}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="🔒 Skarpt läge"
                  onPress={() => skapa(t, "prov")}
                  loading={arbetar === nyckel}
                  disabled={arbetar !== null}
                />
              </View>
            </View>
          </Card>
        );
      })}

      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 20, textAlign: "center" }}>
        Uppdragen skapas som utkast. Dela dem sedan som vanligt med klass eller QR-kod.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  ingress: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  modes: { flexDirection: "row", gap: 10 },
  rad: { flexDirection: "row", alignItems: "center", gap: 8 },
  knappar: { flexDirection: "row", gap: 10 },
});
