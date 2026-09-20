import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];

// new Date().toISOString() ger UTC-datum, inte enhetens lokala datum -- en
// elev som loggar tid efter midnatt UTC (dvs efter ca kl 01-02 svensk tid)
// skulle annars få gårdagens datum förifyllt. Bygg strängen av lokala
// datumdelar istället.
function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

// Fristående från materialplanen (aldrig låst av plan_locked) -- det
// praktiska verkstadsarbetet, och därmed tidsloggningen, fortsätter
// normalt även efter att materialplanen skickats in.
export function TimeLog({ participantId, onBack }: { participantId: string; onBack: () => void }) {
  const theme = Colors[useColorScheme() ?? "light"];

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayIso());
  const [minutes, setMinutes] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("time_entries")
      .select("*")
      .eq("participant_id", participantId)
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  }, [participantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addEntry() {
    const match = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      Alert.alert("Ogiltigt datum", "Ange datum som ÅÅÅÅ-MM-DD.");
      return;
    }
    const parsedMinutes = Number.parseInt(minutes, 10);
    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      Alert.alert("Ange antal minuter", "Skriv hur många minuter du jobbade, t.ex. 45.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("time_entries").insert({
      participant_id: participantId,
      work_date: date.trim(),
      minutes: parsedMinutes,
      comment: comment.trim(),
    });
    setSaving(false);
    if (error) {
      Alert.alert("Kunde inte spara", getErrorMessage(error));
      return;
    }
    setMinutes("");
    setComment("");
    load();
  }

  function removeEntry(id: string) {
    Alert.alert("Ta bort raden?", undefined, [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort",
        style: "destructive",
        onPress: async () => {
          await supabase.from("time_entries").delete().eq("id", id);
          load();
        },
      },
    ]);
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  const total = entries.reduce((sum, e) => sum + e.minutes, 0);

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Tidrapport</Text>
      <Text style={{ color: theme.muted, marginBottom: 16 }}>Totalt: {formatMinutes(total)}</Text>

      <Card>
        <Text style={{ color: theme.muted, fontSize: 13, fontWeight: "700", marginBottom: 10 }}>NYTT ARBETSPASS</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
          placeholder="Datum (ÅÅÅÅ-MM-DD)"
          placeholderTextColor={theme.muted}
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
          placeholder="Minuter, t.ex. 45"
          placeholderTextColor={theme.muted}
          keyboardType="number-pad"
          value={minutes}
          onChangeText={setMinutes}
        />
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, marginBottom: 12 }]}
          placeholder="Vad gjorde du? (valfritt)"
          placeholderTextColor={theme.muted}
          value={comment}
          onChangeText={setComment}
        />
        <Button title="+ Lägg till" onPress={addEntry} loading={saving} disabled={!minutes.trim()} />
      </Card>

      <View style={{ height: 20 }} />
      {entries.length === 0 && <Text style={{ color: theme.muted }}>Inga arbetspass loggade ännu.</Text>}
      {entries.map((e) => (
        <Card key={e.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {e.work_date} · {formatMinutes(e.minutes)}
            </Text>
            {!!e.comment && <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>{e.comment}</Text>}
          </View>
          <TouchableOpacity onPress={() => removeEntry(e.id)}>
            <Text style={{ color: theme.danger }}>Ta bort</Text>
          </TouchableOpacity>
        </Card>
      ))}

      <View style={{ height: 20 }} />
      <Button title="Tillbaka" variant="secondary" onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: "800" },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 12 },
});
