import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { Database, MaterialOrderStatus } from "@/lib/database.types";

type MaterialRow = Database["public"]["Tables"]["material_catalog"]["Row"];
type OrderRow = Database["public"]["Tables"]["material_orders"]["Row"];
type PlanItem = Database["public"]["Tables"]["material_plan_items"]["Row"];
type PlanRow = {
  id: string;
  plan_submitted_at: string | null;
  display_name: string | null;
  student_id: string | null;
  students: { name: string } | null;
  assignments: { title: string } | null;
  material_plan_items: PlanItem[];
};

const STATUS_META: Record<MaterialOrderStatus, { label: string; tone: "warning" | "muted" | "success"; next: MaterialOrderStatus }> = {
  att_bestalla: { label: "Att beställa", tone: "warning", next: "bestalld" },
  bestalld: { label: "Beställd", tone: "muted", next: "mottagen" },
  mottagen: { label: "Mottagen", tone: "success", next: "att_bestalla" },
};

export default function Bestallningar() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org } = useAuth();

  const [catalog, setCatalog] = useState<MaterialRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planBusy, setPlanBusy] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newRsk, setNewRsk] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newNote, setNewNote] = useState("");

  const load = useCallback(async () => {
    if (!org) return;
    const [{ data: items }, { data: ord }, { data: planData }] = await Promise.all([
      supabase.from("material_catalog").select("*").eq("org_id", org.id).order("name"),
      supabase.from("material_orders").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
      supabase
        .from("assignment_participants")
        .select(
          "id, plan_submitted_at, display_name, student_id, students(name), assignments(title), material_plan_items(id, component, dimension, quantity, comment, rsk_number, created_at)",
        )
        .not("plan_submitted_at", "is", null)
        .order("plan_submitted_at", { ascending: false }),
    ]);
    setCatalog(items ?? []);
    setOrders(ord ?? []);
    setPlans((planData as unknown as PlanRow[]) ?? []);
  }, [org]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openMaterialIds = new Set(orders.filter((o) => o.status !== "mottagen" && o.material_id).map((o) => o.material_id));
  const suggestions = catalog.filter(
    (item) => item.min_quantity != null && item.stock_quantity <= item.min_quantity && !openMaterialIds.has(item.id),
  );

  async function addSuggestion(item: MaterialRow) {
    if (!org) return;
    const quantity = Math.max(1, item.reorder_quantity ?? ((item.min_quantity ?? 0) - item.stock_quantity || 1));
    const { error } = await supabase.from("material_orders").insert({
      org_id: org.id,
      material_id: item.id,
      material_name: item.name,
      quantity,
    });
    if (error) {
      Alert.alert("Kunde inte lägga till", getErrorMessage(error));
      return;
    }
    load();
  }

  async function addManual() {
    if (!org || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("material_orders").insert({
      org_id: org.id,
      material_name: newName.trim(),
      rsk_number: newRsk.trim(),
      quantity: Math.max(1, Number.parseInt(newQuantity, 10) || 1),
      note: newNote.trim(),
    });
    setSaving(false);
    if (error) {
      Alert.alert("Kunde inte lägga till", getErrorMessage(error));
      return;
    }
    setNewName("");
    setNewRsk("");
    setNewQuantity("1");
    setNewNote("");
    setAdding(false);
    load();
  }

  async function cycleStatus(order: OrderRow) {
    const next = STATUS_META[order.status].next;
    await supabase.from("material_orders").update({ status: next }).eq("id", order.id);
    load();
  }

  function removeOrder(order: OrderRow) {
    Alert.alert("Ta bort beställningen?", order.material_name, [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Ta bort",
        style: "destructive",
        onPress: async () => {
          await supabase.from("material_orders").delete().eq("id", order.id);
          load();
        },
      },
    ]);
  }

  const submittedPlans = plans.filter((plan) => (plan.material_plan_items?.length ?? 0) > 0);

  function planNamn(plan: PlanRow) {
    return plan.students?.name ?? plan.display_name ?? "QR-session";
  }

  function planDatum(iso: string | null) {
    return iso ? new Date(iso).toLocaleString("sv-SE") : "";
  }

  async function skapaBestallning(plan: PlanRow) {
    if (!org) return;
    const items = plan.material_plan_items ?? [];
    if (items.length === 0) return;
    setPlanBusy(plan.id);
    try {
      const itemIds = items.map((item) => item.id);
      const { data: existing } = await supabase
        .from("material_orders")
        .select("source_plan_item_id")
        .in("source_plan_item_id", itemIds);
      const redanBestallda = new Set((existing ?? []).map((o) => o.source_plan_item_id));
      const attLägga = items.filter((item) => !redanBestallda.has(item.id));
      if (attLägga.length === 0) {
        Alert.alert("Redan beställt", "Alla rader i planen finns redan som beställningar.");
        return;
      }
      const titel = plan.assignments?.title ?? "Uppdrag";
      const namn = planNamn(plan);
      const rader = [];
      for (const item of attLägga) {
        let materialId: string | null = null;
        const rsk = item.rsk_number.trim();
        if (rsk) {
          const { data: artikel } = await supabase
            .from("material_catalog")
            .select("id")
            .eq("org_id", org.id)
            .eq("rsk_number", rsk)
            .limit(1)
            .maybeSingle();
          materialId = artikel?.id ?? null;
        }
        rader.push({
          org_id: org.id,
          material_id: materialId,
          material_name: item.component,
          quantity: item.quantity,
          rsk_number: rsk,
          note: `Materialplan: ${titel} – ${namn}${item.comment ? ` · ${item.comment}` : ""}`,
          source_plan_item_id: item.id,
        });
      }
      const { error } = await supabase.from("material_orders").insert(rader);
      if (error) throw error;
      Alert.alert("Beställning skapad", `${rader.length} rader lades till.`);
      load();
    } catch (e) {
      Alert.alert("Kunde inte skapa beställning", getErrorMessage(e));
    } finally {
      setPlanBusy(null);
    }
  }

  async function skapaEtiketter(plan: PlanRow) {
    if (!org) return;
    const medRsk = (plan.material_plan_items ?? []).filter((item) => item.rsk_number.trim());
    if (medRsk.length === 0) {
      Alert.alert("RSK saknas", "Ingen rad i planen har RSK-nummer.");
      return;
    }
    setPlanBusy(plan.id);
    try {
      const artikelIds = new Set<string>();
      const saknade = new Map<string, PlanItem>();
      for (const item of medRsk) {
        const rsk = item.rsk_number.trim();
        const { data: artikel } = await supabase
          .from("material_catalog")
          .select("id")
          .eq("org_id", org.id)
          .eq("rsk_number", rsk)
          .limit(1)
          .maybeSingle();
        if (artikel?.id) {
          artikelIds.add(artikel.id);
        } else if (!saknade.has(rsk)) {
          saknade.set(rsk, item);
        }
      }

      let skapade = 0;
      for (const [rsk, item] of saknade) {
        const { data: ny, error } = await supabase
          .from("material_catalog")
          .insert({
            org_id: org.id,
            name: item.component,
            rsk_number: rsk,
            dimension: item.dimension,
            note: "Skapad från elevens materialplan",
          })
          .select("id")
          .single();
        if (error) throw error;
        if (ny?.id) {
          artikelIds.add(ny.id);
          skapade++;
        }
      }

      const ids = Array.from(artikelIds);
      if (ids.length === 0) {
        Alert.alert("Inga etiketter", "Inga RSK-nummer kunde matchas eller skapas.");
        return;
      }
      if (skapade > 0) {
        Alert.alert("Artiklar skapade", `${skapade} nya artiklar lades i Förrådet.`);
      }
      router.push({
        pathname: "/(larare)/(tabs)/forrad/skriv-ut",
        params: { kalla: "forrad", artikel: ids.join(",") },
      });
    } catch (e) {
      Alert.alert("Kunde inte skapa etiketter", getErrorMessage(e));
    } finally {
      setPlanBusy(null);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Beställningar</Text>
      <Text style={{ color: theme.muted, marginBottom: 16 }}>{orders.filter((o) => o.status !== "mottagen").length} öppna beställningar</Text>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Materialplaner från elever</Text>
      {submittedPlans.length === 0 && (
        <Text style={{ color: theme.muted, marginBottom: 8 }}>Inga inskickade materialplaner ännu.</Text>
      )}
      {submittedPlans.map((plan) => (
        <Card key={plan.id} style={{ marginBottom: 10 }}>
          <Text style={{ color: theme.text, fontWeight: "800" }}>{plan.assignments?.title ?? "Uppdrag"}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>
            {planNamn(plan)} · {planDatum(plan.plan_submitted_at)} · {plan.material_plan_items.length} rader
          </Text>
          {plan.material_plan_items.map((item) => (
            <Text key={item.id} style={{ color: theme.text, fontSize: 13, marginTop: 5 }}>
              • {item.component}
              {item.dimension ? ` · ${item.dimension}` : ""} — {item.quantity} st
              {item.rsk_number ? ` · RSK ${item.rsk_number}` : ""}
            </Text>
          ))}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Skapa beställning"
                variant="secondary"
                onPress={() => skapaBestallning(plan)}
                loading={planBusy === plan.id}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="QR-etiketter"
                variant="ghost"
                onPress={() => skapaEtiketter(plan)}
                loading={planBusy === plan.id}
              />
            </View>
          </View>
          <Text style={{ color: theme.muted, fontSize: 11, marginTop: 8 }}>
            QR-etiketter matchar RSK mot Förrådet. Saknade RSK skapas som artiklar.
          </Text>
        </Card>
      ))}

      {suggestions.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Förslag (lågt lagersaldo)</Text>
          {suggestions.map((item) => (
            <Card key={item.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "700" }}>{item.name}</Text>
                <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>
                  {item.stock_quantity} st i lager · min {item.min_quantity} st
                </Text>
              </View>
              <Button title="+ Lägg till" variant="secondary" onPress={() => addSuggestion(item)} />
            </Card>
          ))}
        </>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Beställningar</Text>
      {orders.length === 0 && <Text style={{ color: theme.muted }}>Inga beställningar ännu.</Text>}
      {orders.map((order) => (
        <Card key={order.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {order.material_name} · {order.quantity} st
              {order.rsk_number ? ` · RSK ${order.rsk_number}` : ""}
            </Text>
            {!!order.note && <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>{order.note}</Text>}
          </View>
          <TouchableOpacity onPress={() => cycleStatus(order)}>
            <Badge label={STATUS_META[order.status].label} tone={STATUS_META[order.status].tone} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeOrder(order)} style={{ marginLeft: 10 }}>
            <Text style={{ color: theme.danger }}>Ta bort</Text>
          </TouchableOpacity>
        </Card>
      ))}

      {adding ? (
        <Card style={{ marginTop: 16 }}>
          <Field label="Vad ska beställas" placeholder="T.ex. Kopparrör 15mm" value={newName} onChangeText={setNewName} />
          <Field label="RSK-nummer" placeholder="Valfritt" value={newRsk} onChangeText={setNewRsk} keyboardType="number-pad" />
          <Field label="Antal" value={newQuantity} onChangeText={setNewQuantity} keyboardType="number-pad" />
          <Field label="Anteckning" placeholder="Valfritt" value={newNote} onChangeText={setNewNote} />
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button title="Spara" onPress={addManual} loading={saving} disabled={!newName.trim()} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Avbryt" variant="ghost" onPress={() => setAdding(false)} />
            </View>
          </View>
        </Card>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Button title="+ Ny beställning" variant="ghost" onPress={() => setAdding(true)} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 20, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
});
