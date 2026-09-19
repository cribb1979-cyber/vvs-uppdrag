import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Stats {
  activeAssignments: number;
  liveSessions: number;
  expiringSoon: number;
  submittedPlans: number;
  pendingTeachers: number;
}

export default function Hem() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { profile, org } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!org) return;
    // Fyra oberoende queries -- kör parallellt istället för sekventiellt.
    // (En tidigare version av den här koden körde dem en i taget efter att
    // ha stött på en separat TypeScript-bugg i Promise.all-inferensen;
    // grundorsaken satt i lib/database.types.ts, inte här -- se den filens
    // kommentar. Nu när den är fixad är parallellt både snabbare och lika
    // typsäkert.)
    const [{ count: activeAssignments }, sessionsRes, plansRes, teachersRes] = await Promise.all([
      supabase.from("assignments").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("status", "active"),
      supabase
        .from("student_sessions")
        .select("id, expires_at, revoked_at, assignments!inner(org_id)")
        .eq("assignments.org_id", org.id)
        .is("revoked_at", null),
      supabase
        .from("session_participants")
        .select("id, plan_submitted_at, student_sessions!inner(assignment_id, assignments!inner(org_id))")
        .eq("student_sessions.assignments.org_id", org.id)
        .not("plan_submitted_at", "is", null),
      // RLS begränsar denna till org-admins -- en vanlig lärare får alltid
      // 0 rader tillbaka, så vi behöver ingen villkorlig gren här.
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("status", "pending"),
    ]);

    const now = Date.now();
    const sessions = sessionsRes.data ?? [];
    const liveSessions = sessions.filter((s) => new Date(s.expires_at).getTime() > now).length;
    const expiringSoon = sessions.filter((s) => {
      const t = new Date(s.expires_at).getTime();
      return t > now && t - now < 24 * 60 * 60 * 1000;
    }).length;

    setStats({
      activeAssignments: activeAssignments ?? 0,
      liveSessions,
      expiringSoon,
      submittedPlans: plansRes.data?.length ?? 0,
      pendingTeachers: teachersRes.count ?? 0,
    });
  }, [org, profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
    >
      <Text style={[styles.greeting, { color: theme.text }]}>Hej{profile?.full_name ? `, ${profile.full_name}` : ""}</Text>
      <Text style={[styles.org, { color: theme.muted }]}>{org?.name}</Text>

      <View style={{ height: 20 }} />
      <Button title="+ Nytt uppdrag" onPress={() => router.push("/(larare)/(tabs)/uppdrag/new")} />
      <View style={{ height: 20 }} />

      <View style={styles.grid}>
        <StatCard label="Aktiva uppdrag" value={stats?.activeAssignments} />
        <StatCard label="Elever anslutna" value={stats?.liveSessions} />
        <StatCard label="Går ut inom 24h" value={stats?.expiringSoon} tone={stats?.expiringSoon ? "warning" : undefined} />
        <StatCard label="Inskickade planer" value={stats?.submittedPlans} />
      </View>

      {!!stats?.pendingTeachers && (
        <TouchableOpacity onPress={() => router.push("/(larare)/installningar")}>
          <Card style={[styles.alert, { borderColor: theme.warning }]}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {stats.pendingTeachers} lärare väntar på godkännande →
            </Text>
          </Card>
        </TouchableOpacity>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Skolans kod</Text>
      <TouchableOpacity onPress={() => router.push("/(larare)/installningar")}>
        <Card>
          <Text style={{ color: theme.muted, marginBottom: 4 }}>Dela med kollegor för att bjuda in fler lärare:</Text>
          <Text style={[styles.code, { color: theme.tint }]}>{org?.join_code}</Text>
          <Text style={{ color: theme.muted, marginTop: 8, fontSize: 13 }}>Inställningar & väntande lärare →</Text>
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, tone }: { label: string; value?: number; tone?: "warning" }) {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <Card style={[styles.statCard, tone === "warning" && value ? { borderColor: theme.warning } : undefined]}>
      <Text style={[styles.statValue, { color: tone === "warning" && value ? theme.warning : theme.text }]}>{value ?? "–"}</Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  greeting: { fontSize: 26, fontWeight: "800" },
  org: { fontSize: 15, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { width: "47%" },
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 13, marginTop: 4 },
  alert: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 10 },
  code: { fontSize: 24, fontWeight: "800", letterSpacing: 2 },
});
