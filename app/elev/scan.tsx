import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";

const LAST_CODE_KEY = "vvs-uppdrag:last-session-code";

interface ParsedCode {
  code: string;
  kind: "session" | "student";
}

// QR-koder kan innehålla antingen ren text (lokal utveckling, ingen
// EXPO_PUBLIC_APP_URL satt) eller en riktig länk dit telefonens vanliga
// kamera kan skickas: https://.../elev/uppdrag/<KOD> eller
// https://.../elev/redeem/<KOD> (se lib/links.ts). Prefixet (VVS-/ELEV-)
// avgör typen när det bara är ren text.
function parseCode(scanned: string): ParsedCode {
  const redeemMatch = scanned.match(/\/elev\/redeem\/([^/?#]+)/i);
  if (redeemMatch) return { code: decodeURIComponent(redeemMatch[1]).trim().toUpperCase(), kind: "student" };

  const sessionMatch = scanned.match(/\/elev\/uppdrag\/([^/?#]+)/i);
  if (sessionMatch) return { code: decodeURIComponent(sessionMatch[1]).trim().toUpperCase(), kind: "session" };

  const queryMatch = scanned.match(/[?&]code=([^&]+)/i);
  const raw = queryMatch ? decodeURIComponent(queryMatch[1]) : scanned;
  const code = raw.trim().toUpperCase();
  return { code, kind: code.startsWith("ELEV-") ? "student" : "session" };
}

export default function Scan() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [alreadyLinked, setAlreadyLinked] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(LAST_CODE_KEY).then(setLastCode);
    // Tyst koll: är den här enheten redan kopplad till en elev sen tidigare?
    // (persisteras via Supabase-sessionen, inte AsyncStorage -- se
    // lib/supabase.ts persistSession).
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const { error } = await supabase.rpc("list_my_assignments");
      if (!error) setAlreadyLinked(true);
    })();
  }, []);

  function goToCode(parsed: ParsedCode) {
    if (handled.current) return;
    handled.current = true;
    if (parsed.kind === "student") {
      router.replace(`/elev/redeem/${encodeURIComponent(parsed.code)}`);
      return;
    }
    AsyncStorage.setItem(LAST_CODE_KEY, parsed.code).finally(() => {
      router.replace(`/elev/uppdrag/${encodeURIComponent(parsed.code)}`);
    });
  }

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <View style={[styles.center, { backgroundColor: theme.background }]}>
          <Text style={[styles.body, { color: theme.text }]}>Appen behöver tillgång till kameran för att skanna QR-koden.</Text>
          <View style={{ height: 16 }} />
          <Button title="Ge kameraåtkomst" onPress={requestPermission} />
          <View style={{ height: 12 }} />
          <Button title="Skriv koden istället" variant="ghost" onPress={() => setShowCamera(false)} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => goToCode(parseCode(data))}
        />
        <View style={styles.overlay}>
          <View style={styles.frame} />
        </View>
        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.card }]} onPress={() => setShowCamera(false)}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>Avbryt</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Gå med i ett uppdrag</Text>
      <Text style={[styles.body, { color: theme.muted }]}>
        Skanna QR-koden din lärare visar (provkod eller ditt personliga elevkort), eller skriv in koden manuellt.
      </Text>

      {alreadyLinked && (
        <>
          <View style={{ height: 20 }} />
          <Button title="→ Mina uppdrag" onPress={() => router.replace("/elev/mina-uppdrag")} />
        </>
      )}

      <View style={{ height: 24 }} />
      <Button title="📷 Skanna QR-kod" variant={alreadyLinked ? "secondary" : "primary"} onPress={() => setShowCamera(true)} />

      <View style={{ height: 24 }} />
      <Text style={[styles.label, { color: theme.muted }]}>ELLER SKRIV KODEN</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="t.ex. VVS-BADRUM-7F82 eller ELEV-A1B2C3D4"
        placeholderTextColor={theme.muted}
        autoCapitalize="characters"
        value={manualCode}
        onChangeText={setManualCode}
      />
      <View style={{ height: 12 }} />
      <Button
        title="Anslut"
        variant="secondary"
        onPress={() => manualCode.trim() && goToCode(parseCode(manualCode))}
        disabled={!manualCode.trim()}
      />

      {lastCode && (
        <>
          <View style={{ height: 24 }} />
          <TouchableOpacity onPress={() => goToCode({ code: lastCode, kind: "session" })}>
            <Text style={{ color: theme.tint, textAlign: "center", fontWeight: "600" }}>Fortsätt senaste provet ({lastCode})</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 21 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4 },
  input: { minHeight: 50, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  frame: { width: 240, height: 240, borderWidth: 3, borderColor: "#E67E22", borderRadius: 16 },
  cancelBtn: { position: "absolute", bottom: 40, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
});
