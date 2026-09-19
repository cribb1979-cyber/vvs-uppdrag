import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const theme = Colors[useColorScheme() ?? "light"];

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </SafeAreaView>
    );
  }

  if (session && !session.user.is_anonymous) {
    if (profile?.status === "approved") return <Redirect href="/(larare)" />;
    if (profile?.status === "pending") return <Redirect href="/(auth)/pending" />;
    return <Redirect href="/(auth)/complete-profile" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.text }]}>VVS Uppdrag</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Praktiska uppdrag, materialplanering och förråd för VVS-utbildning.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title="Jag är elev — skanna QR-kod" onPress={() => router.push("/elev/scan")} />
        <View style={{ height: 12 }} />
        <Button title="Jag är lärare" variant="secondary" onPress={() => router.push("/(auth)/login")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: 24, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { flex: 1, justifyContent: "center" },
  title: { fontSize: 34, fontWeight: "800", marginBottom: 12 },
  subtitle: { fontSize: 17, lineHeight: 24 },
  actions: { width: "100%" },
});
