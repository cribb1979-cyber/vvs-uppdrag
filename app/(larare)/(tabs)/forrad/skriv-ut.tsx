// Etiketter – etikettstudion. Skriver direkt till en Phomemo D35 över
// Web Bluetooth (Chrome/Edge på dator). Tre källor: förråd, examensprov
// och fritext. Nås även från Examensprov med ?kalla=examensprov.
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import LabelStudio from "@/components/LabelStudio";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function SkrivUtEtiketter() {
  const { kalla, artikel } = useLocalSearchParams<{ kalla?: string; artikel?: string }>();
  const theme = Colors[useColorScheme() ?? "light"];

  const start =
    kalla === "examensprov" || kalla === "fritext" || kalla === "forrad" ? kalla : undefined;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <LabelStudio initialKalla={start} initialArtikelId={artikel} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60, maxWidth: 760, width: "100%", alignSelf: "center" },
});
