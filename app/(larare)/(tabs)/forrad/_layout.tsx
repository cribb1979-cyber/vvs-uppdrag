import { Stack } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function ForradLayout() {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }}>
      <Stack.Screen name="index" options={{ title: "Förråd" }} />
      <Stack.Screen name="artikel/[id]" options={{ title: "Artikel" }} />
      <Stack.Screen name="import" options={{ title: "Importera lista", presentation: "modal" }} />
      <Stack.Screen name="skriv-ut" options={{ title: "Etiketter", presentation: "modal" }} />
    </Stack>
  );
}
