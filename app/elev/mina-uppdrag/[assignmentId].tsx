import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAssignmentAsStudent } from "@/lib/useAssignmentAsStudent";

export default function MinaUppdragDetail() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { data, error, loading } = useAssignmentAsStudent(assignmentId);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: "center" }}>{error ?? "Uppdraget är inte tillgängligt."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{data.assignment.title}</Text>
      {!!data.assignment.description && <Text style={[styles.body, { color: theme.muted }]}>{data.assignment.description}</Text>}

      {data.assignment.ai_mode === "off" && (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: theme.muted, fontSize: 13 }}>🔒 Provläge: AI-hjälp för uppgiften är avstängd under detta uppdrag.</Text>
        </Card>
      )}

      <View style={{ height: 28 }} />
      <Button
        title={data.plan_locked ? "Se min materialplan" : "Skapa din materialplan"}
        onPress={() => router.push(`/elev/mina-uppdrag/materialplan/${assignmentId}`)}
      />
      {data.plan_submitted_at && (
        <Text style={{ color: theme.success, textAlign: "center", marginTop: 12, fontWeight: "600" }}>
          ✓ Inskickad {new Date(data.plan_submitted_at).toLocaleString("sv-SE")}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  body: { fontSize: 15, lineHeight: 21, textAlign: "center" },
});
