import { Stack } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function ElevLayout() {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }}>
      <Stack.Screen name="scan" options={{ title: "Skanna QR-kod" }} />
      <Stack.Screen name="uppdrag/[code]" options={{ title: "Uppdrag" }} />
      <Stack.Screen name="materialplan/[code]" options={{ title: "Min materialplan" }} />
    </Stack>
  );
}
