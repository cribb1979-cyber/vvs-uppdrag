import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { OrgChooser } from "@/components/OrgChooser";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"account" | "org" | "confirm-email">("account");

  async function handleSignup() {
    setError(null);
    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      setStep("org");
    } else {
      setStep("confirm-email");
    }
  }

  if (step === "org") {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.heading, { color: theme.text }]}>Nästan klart</Text>
        <OrgChooser fullName={fullName} />
      </ScrollView>
    );
  }

  if (step === "confirm-email") {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.heading, { color: theme.text }]}>Bekräfta din e-post</Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          Vi har skickat ett bekräftelsemejl till {email}. Klicka på länken där och logga sedan in.
        </Text>
        <Button title="Till inloggning" onPress={() => router.replace("/(auth)/login")} />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field label="Ditt namn" value={fullName} onChangeText={setFullName} />
        <Field label="E-post" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Field label="Lösenord (minst 8 tecken)" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
        <Button title="Fortsätt" onPress={handleSignup} loading={loading} disabled={!fullName || !email || !password} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40, flexGrow: 1 },
  heading: { fontSize: 24, fontWeight: "800", marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 22, marginBottom: 24 },
  error: { marginBottom: 16 },
});
