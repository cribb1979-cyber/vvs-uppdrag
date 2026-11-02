import { Stack } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function BankLayout() {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }}>
      <Stack.Screen name="index" options={{ title: "Uppdragsbank" }} />
      <Stack.Screen name="[id]" options={{ title: "Mall" }} />
    </Stack>
  );
}
