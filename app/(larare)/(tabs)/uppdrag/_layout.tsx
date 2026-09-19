import { Stack } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function UppdragLayout() {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }}>
      <Stack.Screen name="index" options={{ title: "Uppdrag" }} />
      <Stack.Screen name="new" options={{ title: "Nytt uppdrag", presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ title: "Uppdrag" }} />
    </Stack>
  );
}
