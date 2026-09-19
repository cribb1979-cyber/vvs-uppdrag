import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootStack />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootStack() {
  const { loading, session, profile } = useAuth();
  const theme = Colors[useColorScheme() ?? "light"];

  // Väntar in auth-svaret HÄR, en gång för hela appen, innan (larare)-grenen
  // ens övervägs -- annars hinner Stack.Protected nedan fatta ett (felaktigt)
  // guard=false-beslut under laddningen och navigera bort från en direkt
  // djuplänk (t.ex. en bokmärkt /klasser-URL) innan riktiga sessionen hunnit
  // läsas in.
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  // Är eleven inloggad som lärare (inte anonym QR-session) och godkänd?
  // Stack.Protected monterar/avmonterar hela (larare)-grenen utifrån detta --
  // till skillnad från en <Redirect>/useEffect-vakt i en nästlad layout
  // (Stack > Tabs > Stack) undviker detta den oändliga re-render-loop
  // ("Maximum update depth exceeded") som annars uppstår vid en direkt
  // djuplänk in i en skyddad, flera nivåer nästlad rutt utan giltig session.
  const isTeacher = !!session && !session.user.is_anonymous && profile?.status === "approved";

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Protected guard={isTeacher}>
        <Stack.Screen name="(larare)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="elev" options={{ headerShown: false }} />
    </Stack>
  );
}
