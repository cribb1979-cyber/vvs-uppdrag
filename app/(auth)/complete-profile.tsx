import { ScrollView, StyleSheet, Text } from "react-native";
import { OrgChooser } from "@/components/OrgChooser";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

// Nås om en lärare har en giltig Supabase-session men ännu ingen
// profil-rad -- t.ex. efter e-postbekräftelse i ett separat steg.
export default function CompleteProfile() {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.heading, { color: theme.text }]}>Slutför ditt konto</Text>
      <OrgChooser fullName="" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 40, flexGrow: 1 },
  heading: { fontSize: 24, fontWeight: "800", marginBottom: 20 },
});
