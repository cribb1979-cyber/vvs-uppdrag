import { Stack } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function KlasserLayout() {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }}>
      <Stack.Screen name="index" options={{ title: "Klasser" }} />
      <Stack.Screen name="[id]" options={{ title: "Klass" }} />
      <Stack.Screen name="[id]/skriv-ut" options={{ title: "Elevkort", presentation: "modal" }} />
    </Stack>
  );
}
