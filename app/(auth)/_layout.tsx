import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Logga in" }} />
      <Stack.Screen name="signup" options={{ title: "Skapa lärarkonto" }} />
      <Stack.Screen name="complete-profile" options={{ title: "Slutför konto", headerBackVisible: false }} />
      <Stack.Screen name="pending" options={{ title: "Väntar på godkännande", headerBackVisible: false }} />
    </Stack>
  );
}
