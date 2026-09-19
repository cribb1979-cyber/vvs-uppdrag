import { Stack } from "expo-router";

// Auth-vakten sitter i root-layouten (app/_layout.tsx) via Stack.Protected --
// den här gruppen monteras överhuvudtaget inte förrän auktoriserad, så ingen
// egen loading/redirect-logik behövs här.
export default function LarareLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="installningar" options={{ title: "Inställningar" }} />
    </Stack>
  );
}
