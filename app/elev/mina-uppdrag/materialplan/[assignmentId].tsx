import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { MaterialPlanEditor } from "@/components/MaterialPlanEditor";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAssignmentAsStudent } from "@/lib/useAssignmentAsStudent";

export default function MinaUppdragMaterialplan() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { data, error, loading, refresh } = useAssignmentAsStudent(assignmentId);

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

  return (
    <MaterialPlanEditor
      participantId={data.participant_id}
      planLocked={data.plan_locked}
      planSubmittedAt={data.plan_submitted_at}
      onSubmitted={refresh}
      onBack={() => router.back()}
    />
  );
}
