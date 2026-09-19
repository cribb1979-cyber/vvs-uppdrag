import { StyleSheet, Text, View, type ViewProps } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export function Card({ style, ...props }: ViewProps) {
  const theme = Colors[useColorScheme() ?? "light"];
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]} {...props} />;
}

export function Badge({ label, tone = "muted" }: { label: string; tone?: "muted" | "success" | "warning" | "danger" | "accent" }) {
  const theme = Colors[useColorScheme() ?? "light"];
  const color = tone === "muted" ? theme.muted : theme[tone];
  return (
    <View style={[styles.badge, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, fontWeight: "700" },
});
