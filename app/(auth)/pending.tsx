import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";

export default function Pending() {
  const theme = Colors[useColorScheme() ?? "light"];
  const { org, signOut } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.emoji}>⏳</Text>
      <Text style={[styles.heading, { color: theme.text }]}>Väntar på godkännande</Text>
      <Text style={[styles.body, { color: theme.muted }]}>
        Din ansökan att gå med i {org?.name ?? "skolan"} har skickats. En admin-lärare där behöver godkänna dig innan du kommer
        vidare.
      </Text>
      <View style={{ height: 24 }} />
      <Button title="Logga ut" variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  body: { fontSize: 16, lineHeight: 22, textAlign: "center" },
});
