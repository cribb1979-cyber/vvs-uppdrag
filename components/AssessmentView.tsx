import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { AssessmentStatus } from "@/lib/database.types";

interface AssessmentResultView {
  criteria_label: string;
  status: AssessmentStatus;
  comment: string;
}

function statusColor(status: AssessmentStatus, theme: (typeof Colors)["light"]) {
  if (status === "uppfyller") return theme.success;
  if (status === "behover_kompletteras") return theme.warning;
  return theme.muted;
}

function statusIcon(status: AssessmentStatus) {
  if (status === "uppfyller") return "✓";
  if (status === "behover_kompletteras") return "△";
  return "–";
}

function statusLabel(status: AssessmentStatus) {
  if (status === "uppfyller") return "Uppfyller";
  if (status === "behover_kompletteras") return "Behöver kompletteras";
  return "Ej bedömd ännu";
}

// Elevens motsvarighet till lärarens betygsgrid (bedomning/[id].tsx) --
// men read-only och styrd av assignments.assessment_visible: RPC:en
// get_my_assessment_view returnerar visible:false om läraren inte aktivt
// publicerat bedömningen än, oavsett vad som redan är ifyllt bakom kulisserna.
export function AssessmentView({ participantId, onBack }: { participantId: string; onBack: () => void }) {
  const theme = Colors[useColorScheme() ?? "light"];

  const [visible, setVisible] = useState(false);
  const [results, setResults] = useState<AssessmentResultView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.rpc("get_my_assessment_view", { p_participant_id: participantId });
      if (err) throw err;
      const view = data as unknown as { visible: boolean; results: AssessmentResultView[] };
      setVisible(view.visible);
      setResults(view.results);
    } catch (e) {
      setError(getErrorMessage(e, "Kunde inte hämta bedömningen."));
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, textAlign: "center", marginBottom: 20 }}>{error}</Text>
        <Button title="Tillbaka" variant="secondary" onPress={onBack} />
      </View>
    );
  }

  if (!visible) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={{ color: theme.text, textAlign: "center", marginTop: 8 }}>
          Läraren har inte publicerat bedömningen än.
        </Text>
        <View style={{ height: 16 }} />
        <Button title="Tillbaka" variant="secondary" onPress={onBack} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Din bedömning</Text>

      {results.length === 0 && <Text style={{ color: theme.muted, textAlign: "center" }}>Inga kriterier ännu.</Text>}

      {results.map((r, i) => {
        const color = statusColor(r.status, theme);
        return (
          <Card key={i} style={{ marginBottom: 10 }}>
            <View style={styles.row}>
              <Text style={[styles.badge, { color, borderColor: color }]}>{statusIcon(r.status)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "700" }}>{r.criteria_label}</Text>
                <Text style={{ color, fontSize: 13, fontWeight: "600", marginTop: 2 }}>{statusLabel(r.status)}</Text>
                {!!r.comment && <Text style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>{r.comment}</Text>}
              </View>
            </View>
          </Card>
        );
      })}

      <View style={{ height: 20 }} />
      <Button title="Tillbaka" variant="secondary" onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  badge: { fontSize: 20, fontWeight: "800", width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, textAlign: "center", lineHeight: 30 },
});
