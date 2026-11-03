import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Text } from "react-native";
import { MaterialPlanEditor } from "@/components/MaterialPlanEditor";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useStudentSession } from "@/lib/useStudentSession";

export default function MaterialPlan() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { data: session, error: sessionError, loading: sessionLoading, refresh: refreshSession } = useStudentSession(code);

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

  return (
    <MaterialPlanEditor
      participantId={session.participant_id}
      planLocked={session.plan_locked}
      planSubmittedAt={session.plan_submitted_at}
      onSubmitted={refreshSession}
      onBack={() => router.back()}
      checklist={{
        selfCheckRequired: (session.assignment.self_check_items?.length ?? 0) > 0,
        selfCheckDone: !!session.self_check_submitted_at,
        reflectionRequired: (session.assignment.reflection_questions?.length ?? 0) > 0,
        reflectionDone: !!session.reflection_submitted_at,
        maintenanceRequired: session.assignment.kind === "uppdrag",
        maintenanceDone: !!session.maintenance_plan_saved_at,
      }}
    />
  );
}
