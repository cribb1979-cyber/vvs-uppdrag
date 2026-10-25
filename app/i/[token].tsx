import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { bildUrl } from "@/lib/infobank";
import { supabase } from "@/lib/supabase";

type Svar = {
  status: "ok" | "avstangd" | "saknas" | "planerad" | "utgangen";
  titel?: string;
  plats?: string;
  funktion?: string;
  driftsattning?: string[];
  foto?: string | null;
  schema?: string | null;
  uppdaterad?: string;
  fran?: string;
  till?: string;
};

function svDatum(s?: string): string {
  if (!s) return "";
  const d = new Date(s.length === 10 ? s + "T12:00:00" : s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

export default function InstallationInfo() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const [svar, setSvar] = useState<Svar | null>(null);
  const [fel, setFel] = useState<string | null>(null);

  useEffect(() => {
    let av = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("installation_public", { p_token: String(token ?? "") });
        if (error) throw error;
        if (!av) setSvar(data as unknown as Svar);
      } catch (e) {
        if (!av) setFel("Kunde inte hämta informationen. Kontrollera nätet och försök igen.");
      }
    })();
    return () => { av = true; };
  }, [token]);

  const ram = (barn: ReactNode) => (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {barn}
      <Text style={[styles.fot, { color: theme.muted }]}>VVS Uppdrag</Text>
    </ScrollView>
  );

  if (fel) {
    return ram(<Card><Text style={{ color: theme.text, fontSize: 16 }}>{fel}</Text></Card>);
  }

  if (!svar) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (svar.status === "saknas") {
    return ram(
      <Card>
        <Text style={[styles.rubrik, { color: theme.text }]}>Ingen information här</Text>
        <Text style={{ color: theme.muted, fontSize: 15, lineHeight: 22 }}>
          QR-koden hör inte till någon installation längre. Fråga din lärare om den ska bytas ut.
        </Text>
      </Card>,
    );
  }

  if (svar.status === "avstangd") {
    return ram(
      <Card>
        <Text style={[styles.rubrik, { color: theme.text }]}>Visningen är avstängd</Text>
        <Text style={{ color: theme.muted, fontSize: 15, lineHeight: 22 }}>
          Läraren har stängt av informationen för den här installationen. Den kan slås på igen.
        </Text>
      </Card>,
    );
  }

  if (svar.status === "planerad" || svar.status === "utgangen") {
    const datum = svar.fran || svar.till;
    const text = datum ? svDatum(datum) : "";
    return ram(
      <Card>
        <Text style={[styles.rubrik, { color: theme.text }]}>
          {svar.status === "planerad" ? "Visas senare" : "Visningen har stängt"}
        </Text>
        <Text style={{ color: theme.muted, fontSize: 15, lineHeight: 22 }}>
          {svar.status === "planerad"
            ? `Informationen är öppen från ${text}.`
            : `Informationen visades till ${text}.`}
        </Text>
      </Card>,
    );
  }

  const foto = bildUrl(svar.foto ?? null);
  const schema = bildUrl(svar.schema ?? null);

  return ram(
    <>
      <Text style={[styles.rubrik, { color: theme.text }]}>{svar.titel}</Text>
      {!!svar.plats && <Text style={{ color: theme.muted, fontSize: 15, marginBottom: 14 }}>{svar.plats}</Text>}

      {!!foto && (
        <Image source={{ uri: foto }} style={styles.bild} resizeMode="cover" />
      )}

      {!!svar.funktion && (
        <Card style={{ marginTop: 14 }}>
          <Text style={[styles.avsnitt, { color: theme.muted }]}>FUNKTION</Text>
          <Text style={{ color: theme.text, fontSize: 17, lineHeight: 25 }}>{svar.funktion}</Text>
        </Card>
      )}

      {!!(svar.driftsattning ?? []).length && (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.avsnitt, { color: theme.muted }]}>DRIFTSÄTTNING</Text>
          {(svar.driftsattning ?? []).map((steg, i) => (
            <View key={i} style={styles.steg}>
              <Text style={{ color: theme.accent, fontWeight: "800", width: 24 }}>{i + 1}</Text>
              <Text style={{ color: theme.text, fontSize: 16, lineHeight: 23, flex: 1 }}>{steg}</Text>
            </View>
          ))}
        </Card>
      )}

      {!!schema && (
        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.avsnitt, { color: theme.muted }]}>FLÖDESSCHEMA</Text>
          <Image source={{ uri: schema }} style={[styles.bild, { height: 240 }]} resizeMode="contain" />
        </Card>
      )}

      {!!svar.uppdaterad && (
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 16 }}>
          Uppdaterad {svDatum(svar.uppdaterad)}
        </Text>
      )}
    </>,
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, paddingBottom: 50, maxWidth: 720, width: "100%", alignSelf: "center" },
  rubrik: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  avsnitt: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, marginBottom: 8 },
  bild: { width: "100%", height: 220, borderRadius: 14, backgroundColor: "#eee" },
  steg: { flexDirection: "row", gap: 8, paddingVertical: 6, alignItems: "flex-start" },
  fot: { textAlign: "center", fontSize: 12, marginTop: 26 },
});
