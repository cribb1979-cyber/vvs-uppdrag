import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { TimeLog } from "@/components/TimeLog";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useStudentSession } from "@/lib/useStudentSession";

export default function Tidrapport() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { data: session, error: sessionError, loading: sessionLoading } = useStudentSession(code);

  if (sessionLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (sessionError || !session) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, textAlign: "center" }}>{sessionError ?? "Uppdraget är inte tillgängligt."}</Text>
      </View>
    );
  }

  return <TimeLog participantId={session.participant_id} onBack={() => router.back()} />;
}
