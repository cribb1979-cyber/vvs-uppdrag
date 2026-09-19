import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";

export default function LarareLayout() {
  const { loading, session, profile } = useAuth();
  const theme = Colors[useColorScheme() ?? "light"];

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (!session || session.user.is_anonymous || profile?.status !== "approved") {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="installningar" options={{ title: "Inställningar" }} />
    </Stack>
  );
}
