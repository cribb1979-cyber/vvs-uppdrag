import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import type * as ImagePicker from "expo-image-picker";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { pickQuizImage } from "@/lib/quizImages";
import { bildUrl, datumOk, laddaUppBild, nyToken, publikUrl, type Installation } from "@/lib/infobank";
import { supabase } from "@/lib/supabase";

type Utkast = {
  id?: string;
  token?: string;
  titel: string;
  plats: string;
  funktion: string;
  driftsattning: string;
  foto_path: string | null;
  schema_path: string | null;
  publicerad: boolean;
  visas_fran: string;
  visas_till: string;
};

function tomtUtkast(): Utkast {
  return {
    titel: "", plats: "", funktion: "", driftsattning: "",
    foto_path: null, schema_path: null, publicerad: false, visas_fran: "", visas_till: "",
  };
}

function utkastFran(i: Installation): Utkast {
  return {
    id: i.id, token: i.token, titel: i.titel, plats: i.plats, funktion: i.funktion,
    driftsattning: (i.driftsattning ?? []).join("\n"), foto_path: i.foto_path,
    schema_path: i.schema_path, publicerad: i.publicerad,
    visas_fran: i.visas_fran ?? "", visas_till: i.visas_till ?? "",
  };
}

function status(i: Installation): { text: string; ton: "muted" | "success" | "warning" | "danger" } {
  if (!i.publicerad) return { text: "avstängd", ton: "muted" };
  const idag = new Date().toISOString().slice(0, 10);
  if (i.visas_fran && idag < i.visas_fran) return { text: "visas från " + i.visas_fran, ton: "warning" };
  if (i.visas_till && idag > i.visas_till) return { text: "utgången " + i.visas_till, ton: "danger" };
  return { text: "visas nu", ton: "success" };
}

export default function Infobank() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { org, profile } = useAuth();
  const [lista, setLista] = useState<Installation[]>([]);
  const [utkast, setUtkast] = useState<Utkast | null>(null);
  const [nyFoto, setNyFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [nySchema, setNySchema] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sparar, setSparar] = useState(false);
  const [qr, setQr] = useState<Installation | null>(null);

  const ladda = useCallback(async () => {
    if (!org) return;
    const { data, error } = await supabase
      .from("installations")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false });
    if (error) { Alert.alert("Kunde inte hämta infobanken", getErrorMessage(error)); return; }
    setLista((data ?? []) as Installation[]);
  }, [org]);

  useFocusEffect(useCallback(() => { ladda(); }, [ladda]));

  function oppna(i?: Installation) {
    setNyFoto(null);
    setNySchema(null);
    setQr(null);
    setUtkast(i ? utkastFran(i) : tomtUtkast());
  }

  async function valjBild(slag: "foto" | "schema", kalla: "camera" | "library") {
    try {
      const asset = await pickQuizImage(kalla);
      if (!asset) return;
      if (slag === "foto") setNyFoto(asset);
      else setNySchema(asset);
    } catch (e) {
      Alert.alert("Kunde inte öppna kameran/bilderna", getErrorMessage(e));
    }
  }

  async function spara() {
    if (!org || !profile || !utkast) return;
    if (!utkast.titel.trim()) { Alert.alert("Ge installationen en titel."); return; }
    for (const f of [utkast.visas_fran, utkast.visas_till]) {
      if (f.trim() && !datumOk(f)) { Alert.alert("Datum ska skrivas ÅÅÅÅ-MM-DD (eller lämnas tomt)."); return; }
    }
    setSparar(true);
    try {
      const foto = nyFoto ? await laddaUppBild(org.id, nyFoto) : utkast.foto_path;
      const schema = nySchema ? await laddaUppBild(org.id, nySchema) : utkast.schema_path;
      const data = {
        titel: utkast.titel.trim(),
        plats: utkast.plats.trim(),
        funktion: utkast.funktion.trim(),
        driftsattning: utkast.driftsattning.split("\n").map((s) => s.trim()).filter(Boolean),
        foto_path: foto,
        schema_path: schema,
        publicerad: utkast.publicerad,
        visas_fran: utkast.visas_fran.trim() || null,
        visas_till: utkast.visas_till.trim() || null,
      };
      if (utkast.id) {
        const { error } = await supabase.from("installations").update(data).eq("id", utkast.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("installations").insert({
          ...data, token: nyToken(), org_id: org.id, created_by: profile.id,
        });
        if (error) throw error;
      }
      setUtkast(null);
      setNyFoto(null);
      setNySchema(null);
      await ladda();
    } catch (e) {
      Alert.alert("Kunde inte spara", getErrorMessage(e));
    } finally {
      setSparar(false);
    }
  }

  async function vaxla(i: Installation) {
    const { error } = await supabase.from("installations")
      .update({ publicerad: !i.publicerad }).eq("id", i.id);
    if (error) { Alert.alert("Kunde inte ändra", getErrorMessage(error)); return; }
    await ladda();
  }

  function taBort(i: Installation) {
    Alert.alert("Ta bort " + i.titel + "?", "QR-koden slutar då fungera. Det går inte att ångra.", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort", style: "destructive", onPress: async () => {
          const { error } = await supabase.from("installations").delete().eq("id", i.id);
          if (error) { Alert.alert("Kunde inte ta bort", getErrorMessage(error)); return; }
          await ladda();
        },
      },
    ]);
  }

  const falt = (
    etikett: string,
    nyckel: keyof Utkast,
    extra: { placeholder?: string; multiline?: boolean; numberOfLines?: number } = {},
  ) => (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>{etikett}</Text>
      <TextInput
        placeholder={extra.placeholder}
        placeholderTextColor={theme.muted}
        multiline={!!extra.multiline}
        numberOfLines={extra.numberOfLines}
        value={String(utkast?.[nyckel] ?? "")}
        onChangeText={(t) => setUtkast((u) => (u ? { ...u, [nyckel]: t } : u))}
        style={[
          styles.falt,
          extra.multiline ? styles.stor : null,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
        ]}
      />
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Infobank</Text>
      <Text style={{ color: theme.muted, marginBottom: 14 }}>
        Koppla en QR-kod till en installation i verkstaden. Den som scannar får funktion, driftsättning och flödesschema – utan inloggning.
      </Text>

      {qr && (
        <Card style={{ marginBottom: 14, alignItems: "center" }}>
          <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16, marginBottom: 10 }}>{qr.titel}</Text>
          <View style={{ backgroundColor: "#fff", padding: 12, borderRadius: 12 }}>
            <QRCode value={publikUrl(qr.token)} size={220} />
          </View>
          <Text selectable style={{ color: theme.muted, fontSize: 12, marginTop: 10, textAlign: "center" }}>{publikUrl(qr.token)}</Text>
          <View style={{ height: 10 }} />
          <Button title="Stäng" variant="secondary" onPress={() => setQr(null)} />
        </Card>
      )}

      {!utkast && (
        <Button title="+ Ny installation" onPress={() => oppna()} />
      )}

      {utkast && (
        <Card style={{ marginTop: 12 }}>
          <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16, marginBottom: 4 }}>
            {utkast.id ? "Redigera" : "Ny installation"}
          </Text>
          {falt("Titel", "titel", { placeholder: "T.ex. Shuntgrupp 2 i verkstad B" })}
          {falt("Plats", "plats", { placeholder: "Verkstad, rum, hylla …" })}
          {falt("Funktion", "funktion", { placeholder: "Vad gör installationen? Kort och konkret.", multiline: true, numberOfLines: 3 })}
          {falt("Driftsättning (en punkt per rad)", "driftsattning", { placeholder: "Öppna ventil V1\nFyll systemet\nLufta …", multiline: true, numberOfLines: 5 })}
          {falt("Visas från (ÅÅÅÅ-MM-DD, frivilligt)", "visas_fran", { placeholder: "2026-11-02" })}
          {falt("Visas till (ÅÅÅÅ-MM-DD, frivilligt)", "visas_till", { placeholder: "2026-12-18" })}

          <View style={styles.bildrad}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>Foto</Text>
              {nyFoto || utkast.foto_path ? (
                <Image source={{ uri: nyFoto?.uri ?? bildUrl(utkast.foto_path)! }} style={styles.bild} />
              ) : <View style={[styles.bild, { backgroundColor: theme.background }]} />}
              <View style={styles.smabilder}>
                <Button title="Kamera" variant="secondary" onPress={() => valjBild("foto", "camera")} />
                <Button title="Välj" variant="secondary" onPress={() => valjBild("foto", "library")} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "700", marginBottom: 4 }}>Flödesschema</Text>
              {nySchema || utkast.schema_path ? (
                <Image source={{ uri: nySchema?.uri ?? bildUrl(utkast.schema_path)! }} style={styles.bild} />
              ) : <View style={[styles.bild, { backgroundColor: theme.background }]} />}
              <View style={styles.smabilder}>
                <Button title="Kamera" variant="secondary" onPress={() => valjBild("schema", "camera")} />
                <Button title="Välj" variant="secondary" onPress={() => valjBild("schema", "library")} />
              </View>
            </View>
          </View>

          <View style={[styles.rad, { marginTop: 14 }]}>
            <Text style={{ color: theme.text, fontWeight: "600", flex: 1 }}>Publicerad (QR-koden visar innehåll)</Text>
            <Switch value={utkast.publicerad} onValueChange={(v) => setUtkast((u) => (u ? { ...u, publicerad: v } : u))} />
          </View>

          <View style={{ height: 12 }} />
          <Button title={sparar ? "Sparar…" : "Spara"} onPress={spara} loading={sparar} />
          <View style={{ height: 8 }} />
          <Button title="Avbryt" variant="secondary" onPress={() => setUtkast(null)} />
        </Card>
      )}

      {lista.map((i) => {
        const s = status(i);
        return (
          <Card key={i.id} style={{ marginTop: 12 }}>
            <View style={styles.rad}>
              <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16, flex: 1 }}>{i.titel}</Text>
              <Badge label={s.text} tone={s.ton} />
            </View>
            {!!i.plats && <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>{i.plats}</Text>}
            {!!i.funktion && <Text style={{ color: theme.text, fontSize: 14, marginTop: 6 }} numberOfLines={3}>{i.funktion}</Text>}
            <View style={{ height: 10 }} />
            <View style={styles.smabilder}>
              <Button title="QR" onPress={() => { setUtkast(null); setQr(i); }} />
              <Button title="Redigera" variant="secondary" onPress={() => oppna(i)} />
              <Button title={i.publicerad ? "Stäng av" : "Slå på"} variant="secondary" onPress={() => vaxla(i)} />
              <Button title="Ta bort" variant="danger" onPress={() => taBort(i)} />
            </View>
          </Card>
        );
      })}

      {!lista.length && !utkast && (
        <Text style={{ color: theme.muted, marginTop: 20, textAlign: "center" }}>
          Inga installationer än. Tryck på ”Ny installation” och ta en bild.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  falt: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  stor: { minHeight: 90, textAlignVertical: "top" },
  rad: { flexDirection: "row", alignItems: "center", gap: 8 },
  bildrad: { flexDirection: "row", gap: 12, marginTop: 14 },
  bild: { width: "100%", height: 100, borderRadius: 8, backgroundColor: "#eee" },
  smabilder: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
});
