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
      <Stack.Screen name="redeem/[code]" options={{ title: "Loggar in", headerBackVisible: false }} />
      <Stack.Screen name="mina-uppdrag/index" options={{ title: "Mina uppdrag" }} />
      <Stack.Screen name="mina-uppdrag/[assignmentId]" options={{ title: "Uppdrag" }} />
      <Stack.Screen name="mina-uppdrag/materialplan/[assignmentId]" options={{ title: "Min materialplan" }} />
    </Stack>
  );
}
