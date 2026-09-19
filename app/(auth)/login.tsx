import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(err.message === "Invalid login credentials" ? "Fel e-post eller lösenord." : err.message);
      return;
    }
    await refresh();
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field label="E-post" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Field label="Lösenord" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
        <Button title="Logga in" onPress={handleLogin} loading={loading} disabled={!email || !password} />
        <Link href="/(auth)/signup" style={[styles.link, { color: theme.tint }]}>
          Ny lärare? Skapa konto
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40 },
  error: { marginBottom: 16 },
  link: { marginTop: 24, textAlign: "center", fontSize: 15, fontWeight: "600" },
});
