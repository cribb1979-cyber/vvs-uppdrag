import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { QuizPlayer } from "@/components/QuizPlayer";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useStudentSession } from "@/lib/useStudentSession";

export default function SessionQuiz() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { data, error, loading } = useStudentSession(code);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, textAlign: "center" }}>{error ?? "Uppdraget är inte tillgängligt."}</Text>
      </View>
    );
  }

  return <QuizPlayer participantId={data.participant_id} onBack={() => router.back()} />;
}
