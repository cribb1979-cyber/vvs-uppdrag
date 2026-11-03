import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import {
  BANK_STATUS_LABEL,
  BANK_STATUS_TONE,
  listaMallar,
  sammanfatta,
  taUtMall,
  type UppdragsbankMall,
} from "@/lib/uppdragsbank";

type Filter = "alla" | "godkand" | "granskning" | "mina";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "alla", label: "Alla" },
  { key: "godkand", label: "Godkända" },
  { key: "granskning", label: "Granskas" },
  { key: "mina", label: "Mina" },
];

export default function Uppdragsbank() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org, profile } = useAuth();
  const [mallar, setMallar] = useState<UppdragsbankMall[]>([]);
  const [filter, setFilter] = useState<Filter>("alla");
  const [sok, setSok] = useState("");
  const [laddar, setLaddar] = useState(true);
  const [drar, setDrar] = useState(false);
  const [tarUt, setTarUt] = useState<string | null>(null);

  const ladda = useCallback(async () => {
    try {
      setMallar(await listaMallar());
    } catch (e) {
      Alert.alert("Kunde inte hämta banken", getErrorMessage(e));
    } finally {
      setLaddar(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      ladda();
    }, [ladda]),
  );

  const filtrerade = useMemo(() => {
    const q = sok.trim().toLowerCase();
    return mallar.filter((m) => {
      if (filter === "godkand" && m.status !== "godkand") return false;
      if (filter === "granskning" && m.status !== "granskning") return false;
      if (filter === "mina" && m.created_by !== profile?.id) return false;
      if (!q) return true;
      return (
        m.titel.toLowerCase().includes(q) ||
        m.beskrivning.toLowerCase().includes(q) ||
        m.year_level.toLowerCase().includes(q) ||
        m.course_code.toLowerCase().includes(q)
      );
    });
  }, [mallar, filter, sok, profile?.id]);

  async function taUt(m: UppdragsbankMall) {
    setTarUt(m.id);
    try {
      const nyttId = await taUtMall(m.id);
      await ladda();
      router.push({ pathname: "/(larare)/(tabs)/uppdrag/[id]", params: { id: nyttId } });
    } catch (e) {
      Alert.alert("Kunde inte ta ut mallen", getErrorMessage(e));
    } finally {
      setTarUt(null);
    }
  }

  const kanTaUt = (m: UppdragsbankMall) => m.status === "godkand" || m.agare_org_id === org?.id;

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      data={filtrerade}
      keyExtractor={(m) => m.id}
      refreshControl={
        <RefreshControl
          refreshing={drar}
          onRefresh={async () => {
            setDrar(true);
            await ladda();
            setDrar(false);
          }}
          tintColor={theme.tint}
        />
      }
      ListHeaderComponent={
        <View>
          <Text style={[styles.title, { color: theme.text }]}>🏦 Uppdragsbank</Text>
          <Text style={[styles.intro, { color: theme.muted }]}>
            Färdiga uppdrag från andra lärare. Ta ut en mall – då skapas en egen kopia i din skola som du kan
            ändra utan att påverka banken.
          </Text>

          <TextInput
            style={[styles.sok, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="Sök titel, kurs eller årskurs"
            placeholderTextColor={theme.muted}
            value={sok}
            onChangeText={setSok}
          />

          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterChip,
                  {
                    borderColor: filter === f.key ? theme.accent : theme.border,
                    backgroundColor: theme.card,
                  },
                ]}
              >
                <Text style={{ color: filter === f.key ? theme.accent : theme.text, fontWeight: "700", fontSize: 13 }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.tip, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/(larare)/(tabs)/uppdrag")}
          >
            <Text style={{ color: theme.text, fontWeight: "700" }}>Vill du bidra?</Text>
            <Text style={{ color: theme.muted, fontSize: 13, marginTop: 3 }}>
              Öppna ett av dina uppdrag → “Sätt in i uppdragsbanken”. Det går till granskning och blir synligt
              för alla först när en kollega har godkänt det.
            </Text>
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        !laddar ? (
          <Text style={{ color: theme.muted, textAlign: "center", marginTop: 32 }}>
            Inga mallar matchar filtret ännu.
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
              {item.titel}
            </Text>
            <Badge label={BANK_STATUS_LABEL[item.status]} tone={BANK_STATUS_TONE[item.status]} />
          </View>
          {!!item.beskrivning && (
            <Text style={{ color: theme.muted, marginTop: 4 }} numberOfLines={2}>
              {item.beskrivning}
            </Text>
          )}
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 8 }}>{sammanfatta(item)}</Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
            {item.agare_org_id === org?.id ? "Din skola" : "Delad av en annan skola"} · version {item.version}
          </Text>

          {kanTaUt(item) ? (
            <View style={{ marginTop: 12 }}>
              <Button
                title={item.status === "godkand" ? "Ta ut till min skola" : "Ta ut (egen skola)"}
                onPress={() => taUt(item)}
                loading={tarUt === item.id}
              />
            </View>
          ) : (
            <Text style={{ color: theme.warning, fontSize: 12, marginTop: 10 }}>
              Granskas – går att ta ut när den är godkänd.
            </Text>
          )}

          <TouchableOpacity
            style={{ marginTop: 10, alignSelf: "flex-start" }}
            onPress={() => router.push({ pathname: "/(larare)/(tabs)/bank/[id]", params: { id: item.id } })}
          >
            <Text style={{ color: theme.tint, fontWeight: "700" }}>Öppna mallen →</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  sok: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 14, flexWrap: "wrap" },
  filterChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  tip: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 18 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: "800" },
});
