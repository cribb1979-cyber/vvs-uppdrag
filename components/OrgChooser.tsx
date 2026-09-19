import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// Visas efter att en lärare har en giltig Supabase-session men saknar
// profil ännu: antingen precis registrerad, eller inloggad efter att ha
// hoppat över det steget (t.ex. via e-postbekräftelse). Skapar org+admin
// eller ansluter till en befintlig org som pending-lärare.
export function OrgChooser({ fullName }: { fullName: string }) {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [orgName, setOrgName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === "create") {
        if (!orgName.trim()) throw new Error("Ange skolans namn.");
        const { error: err } = await supabase.rpc("create_org_and_admin", {
          org_name: orgName.trim(),
          teacher_name: fullName,
        });
        if (err) throw err;
      } else {
        if (!joinCode.trim()) throw new Error("Ange skolans kod.");
        const { error: err } = await supabase.rpc("join_org", {
          code: joinCode.trim(),
          teacher_name: fullName,
        });
        if (err) throw err;
      }
      await refresh();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <View style={styles.tabs}>
        <View style={{ flex: 1 }}>
          <Button title="Ny skola" variant={mode === "create" ? "primary" : "secondary"} onPress={() => setMode("create")} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Button title="Gå med i skola" variant={mode === "join" ? "primary" : "secondary"} onPress={() => setMode("join")} />
        </View>
      </View>

      {mode === "create" ? (
        <Field label="Skolans namn" placeholder="t.ex. Praktiska Gymnasiet Uppsala" value={orgName} onChangeText={setOrgName} />
      ) : (
        <Field
          label="Skolans kod (från en kollega)"
          placeholder="t.ex. A1B2C3"
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={setJoinCode}
        />
      )}

      {mode === "join" && (
        <Text style={[styles.hint, { color: theme.muted }]}>
          Ditt konto blir väntande tills en admin på skolan godkänner dig.
        </Text>
      )}

      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

      <Button title={mode === "create" ? "Skapa skola" : "Skicka ansökan"} onPress={submit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", marginBottom: 20 },
  hint: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  error: { marginBottom: 16 },
});
