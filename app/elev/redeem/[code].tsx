import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { ensureAnonymousAuth, TeacherSignedInError } from "@/lib/useStudentSession";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

// Löser in en elevs läsårslånga kod (från elevkort/QR) och kopplar den
// till den här enheten -- se redeem_student_code i migrationen. Efter
// det behöver eleven aldrig skanna igen på samma enhet.
export default function Redeem() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isTeacherConflict, setIsTeacherConflict] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    (async () => {
      try {
        await ensureAnonymousAuth();
        const { data, error: err } = await supabase.rpc("redeem_student_code", { p_code: code });
        if (err) throw err;
        const result = data as unknown as { name: string; class_name: string };
        setName(result.name);
        setTimeout(() => router.replace("/elev/mina-uppdrag"), 1200);
      } catch (e) {
        console.error("Kunde inte lösa in koden:", e);
        setIsTeacherConflict(e instanceof TeacherSignedInError);
        setError(getErrorMessage(e, "Kunde inte lösa in koden."));
      }
    })();
  }, [code, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {error ? (
        <>
          <Text style={styles.emoji}>{isTeacherConflict ? "👩‍🏫" : "⚠️"}</Text>
          <Text style={[styles.title, { color: theme.text }]}>Kunde inte logga in</Text>
          <Text style={{ color: theme.muted, textAlign: "center", marginBottom: 20 }}>{error}</Text>
          {isTeacherConflict ? (
            <Button title="Logga ut" variant="secondary" onPress={() => supabase.auth.signOut().then(() => router.replace("/elev/scan"))} />
          ) : (
            <Button title="Tillbaka" variant="secondary" onPress={() => router.replace("/elev/scan")} />
          )}
        </>
      ) : name ? (
        <>
          <Text style={styles.emoji}>✅</Text>
          <Text style={[styles.title, { color: theme.text }]}>Välkommen, {name}!</Text>
          <Text style={{ color: theme.muted }}>Loggar in...</Text>
        </>
      ) : (
        <ActivityIndicator size="large" color={theme.tint} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 8, textAlign: "center" },
});
