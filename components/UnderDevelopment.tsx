import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

// Används för funktioner som INTE är kopplade till riktig data/backend
// ännu -- vi simulerar aldrig ett lyckat resultat genom att visa påhittad
// data istället.
export function UnderDevelopment({ title, note }: { title: string; note?: string }) {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.muted }]}>{note ?? "Den här funktionen är under utveckling och inte kopplad till riktig data ännu."}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  body: { fontSize: 15, textAlign: "center", lineHeight: 21 },
});
