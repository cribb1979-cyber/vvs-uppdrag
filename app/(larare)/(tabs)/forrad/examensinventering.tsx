import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { EXAM_MATERIAL, type ExamMaterialItem } from "@/lib/examMaterial";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MaterialRow = Database["public"]["Tables"]["material_catalog"]["Row"];
type OrderRow = Database["public"]["Tables"]["material_orders"]["Row"];

function norm(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-zåäö0-9]/g, "");
}
function dim(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/\s/g, "");
}

function matchMaterial(item: ExamMaterialItem, catalog: MaterialRow[]) {
  const name = norm(item.component);
  const dimension = dim(item.dimension);
  const exact = catalog.find((c) => norm(c.name) === name && dim(c.dimension) === dimension);
  if (exact) return exact;
  const sameName = catalog.find((c) => norm(c.name) === name);
  if (sameName) return sameName;
  const contains = catalog.find(
    (c) => norm(c.name).includes(name) && (!dimension || dim(c.dimension) === dimension),
  );
  if (contains) return contains;
  const reverse = catalog.find(
    (c) => name.includes(norm(c.name)) && (!dimension || dim(c.dimension) === dimension),
  );
  if (reverse) return reverse;
  return catalog.find((c) => norm(c.name).includes(name) || name.includes(norm(c.name))) ?? null;
}

function statusTone(status: "ok" | "low" | "missing") {
  return status === "ok" ? "success" : status === "low" ? "warning" : "danger";
}
function statusText(status: "ok" | "low" | "missing") {
  return status === "ok" ? "OK" : status === "low" ? "Lågt" : "Saknas";
}

export default function Examensinventering() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org } = useAuth();

  const [catalog, setCatalog] = useState<MaterialRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [antalElever, setAntalElever] = useState("16");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [baraSaknade, setBaraSaknade] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const load = useCallback(async () => {
    if (!org) return;
    const [{ data: items }, { data: ord }] = await Promise.all([
      supabase.from("material_catalog").select("*").eq("org_id", org.id).order("name"),
      supabase.from("material_orders").select("*").eq("org_id", org.id).neq("status", "mottagen"),
    ]);
    const rows = items ?? [];
    setCatalog(rows);
    setOrders(ord ?? []);
    setCounts(Object.fromEntries(rows.map((r) => [r.id, String(r.stock_quantity)])));
  }, [org]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const elever = Math.max(1, Number.parseInt(antalElever, 10) || 1);
  const openMaterialIds = useMemo(
    () => new Set(orders.map((o) => o.material_id).filter(Boolean) as string[]),
    [orders],
  );

  const groups = useMemo(
    () =>
      EXAM_MATERIAL.map((group) => ({
        ...group,
        rows: group.items.map((item) => {
          const hit = matchMaterial(item, catalog);
          const behov = item.quantity * elever;
          const stock = hit?.stock_quantity ?? 0;
          const diff = stock - behov;
          const status: "ok" | "low" | "missing" = !hit || stock <= 0 ? "missing" : diff < 0 ? "low" : "ok";
          return { groupId: group.id, groupTitel: group.titel, item, hit, behov, stock, diff, status };
        }),
      })),
    [catalog, elever],
  );

  const allRows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);
  const summary = useMemo(
    () => ({
      ok: allRows.filter((r) => r.status === "ok").length,
      low: allRows.filter((r) => r.status === "low").length,
      missing: allRows.filter((r) => r.status === "missing").length,
    }),
    [allRows],
  );

  // Slå ihop samma artikel från flera moment så beställningen inte dubbleras.
  const uniqueNeeds = useMemo(() => {
    const map = new Map<string, { hit: MaterialRow; behov: number; grupper: string[] }>();
    for (const row of allRows) {
      if (!row.hit) continue;
      const prev = map.get(row.hit.id);
      if (prev) {
        prev.behov += row.behov;
        if (!prev.grupper.includes(row.groupTitel)) prev.grupper.push(row.groupTitel);
      } else {
        map.set(row.hit.id, { hit: row.hit, behov: row.behov, grupper: [row.groupTitel] });
      }
    }
    return [...map.values()];
  }, [allRows]);

  const toOrder = useMemo(
    () =>
      uniqueNeeds.filter(
        (x) =>
          x.hit.stock_quantity < x.behov ||
          (x.hit.min_quantity != null && x.hit.stock_quantity <= x.hit.min_quantity),
      ),
    [uniqueNeeds],
  );

  const bySupplier = useMemo(() => {
    const map = new Map<string, typeof toOrder>();
    for (const row of toOrder) {
      const supplier = (row.hit.supplier || "Okänd leverantör").trim() || "Okänd leverantör";
      if (!map.has(supplier)) map.set(supplier, []);
      map.get(supplier)!.push(row);
    }
    return [...map.entries()];
  }, [toOrder]);

  async function saveCounts() {
    const changed = catalog.filter((c) => {
      const raw = counts[c.id];
      if (raw == null || raw.trim() === "") return false;
      return Math.max(0, Number.parseInt(raw, 10) || 0) !== c.stock_quantity;
    });
    if (changed.length === 0) {
      Alert.alert("Inget att spara", "Ändra något räknat antal först.");
      return;
    }
    setSaving(true);
    const results = await Promise.all(
      changed.map((c) =>
        supabase
          .from("material_catalog")
          .update({ stock_quantity: Math.max(0, Number.parseInt(counts[c.id], 10) || 0) })
          .eq("id", c.id),
      ),
    );
    setSaving(false);
    const error = results.find((r) => r.error)?.error;
    if (error) {
      Alert.alert("Kunde inte spara", getErrorMessage(error));
      return;
    }
    Alert.alert("Sparat", `${changed.length} artiklar uppdaterade i Förrådet.`);
    load();
  }

  async function createOrders() {
    if (!org) return;
    const rows = toOrder
      .filter((x) => !openMaterialIds.has(x.hit.id))
      .map((x) => ({
        org_id: org.id,
        material_id: x.hit.id,
        material_name: x.hit.name,
        quantity: Math.max(1, x.behov - x.hit.stock_quantity, x.hit.reorder_quantity ?? 0),
        note: `Examensinventering · ${x.grupper.join(", ")}${x.hit.supplier ? ` · ${x.hit.supplier}` : ""}`,
      }));
    if (rows.length === 0) {
      Alert.alert("Inget att beställa", "Allt ligger redan i beställning eller finns hemma.");
      return;
    }
    setOrdering(true);
    const { error } = await supabase.from("material_orders").insert(rows);
    setOrdering(false);
    if (error) {
      Alert.alert("Kunde inte skapa beställning", getErrorMessage(error));
      return;
    }
    Alert.alert("Beställning skapad", `${rows.length} rader ligger nu under Beställningar.`);
    load();
  }

  async function addToCatalog(item: ExamMaterialItem) {
    if (!org) return;
    const { error } = await supabase.from("material_catalog").insert({
      org_id: org.id,
      name: item.component,
      dimension: item.dimension ?? "",
      category: item.category ?? "Examensmaterial",
      stock_quantity: 0,
      min_quantity: item.quantity,
      note: item.note ?? "",
    });
    if (error) {
      Alert.alert("Kunde inte lägga till", getErrorMessage(error));
      return;
    }
    Alert.alert("Tillagd i Förrådet", `${item.component} ${item.dimension ?? ""} ligger nu med saldo 0.`);
    load();
  }

  function printList() {
    const date = new Date().toLocaleDateString("sv-SE");
    const rowsHtml = groups
      .map((group) => {
        const rows = baraSaknade ? group.rows.filter((r) => r.status !== "ok") : group.rows;
        if (rows.length === 0) return "";
        const body = rows
          .map(
            (r) => `<tr>
              <td>${r.item.component}${r.item.dimension ? ` ${r.item.dimension}` : ""}</td>
              <td class="num">${r.item.quantity}</td>
              <td class="num">${r.behov}</td>
              <td class="num">${r.stock}</td>
              <td class="num ${r.diff < 0 ? "bad" : ""}">${r.diff}</td>
              <td>${r.hit?.shelf_location || "—"}</td>
              <td>${r.hit?.supplier || "—"}</td>
              <td class="${r.status === "ok" ? "ok" : r.status === "low" ? "warn" : "bad"}">${statusText(r.status)}</td>
            </tr>`,
          )
          .join("");
        return `<h2>${group.titel}</h2>
          <table><thead><tr><th>Artikel</th><th>Per elev</th><th>Behov</th><th>Saldo</th><th>Diff</th><th>Hylla</th><th>Leverantör</th><th>Status</th></tr></thead><tbody>${body}</tbody></table>`;
      })
      .join("");
    const orderHtml = bySupplier
      .map(
        ([supplier, rows]) => `<h3>${supplier}</h3><ul>${rows
          .map(
            (r) =>
              `<li>${r.hit.name} ${r.hit.dimension} — beställ <b>${Math.max(
                1,
                r.behov - r.hit.stock_quantity,
                r.hit.reorder_quantity ?? 0,
              )}</b> st (behov ${r.behov}, saldo ${r.hit.stock_quantity})</li>`,
          )
          .join("")}</ul>`,
      )
      .join("");

    const html = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>Examensinventering</title>
      <style>
        @page { size: A4; margin: 14mm; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #111; }
        h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 16px 0 4px; border-bottom: 1px solid #999; }
        h3 { font-size: 11px; margin: 12px 0 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th, td { border-bottom: 1px solid #ccc; padding: 3px 4px; text-align: left; }
        th { background: #eee; } .num { text-align: right; } .ok { color: #167c3a; font-weight: bold; }
        .warn { color: #9a6700; font-weight: bold; } .bad { color: #b42318; font-weight: bold; }
        .meta { color: #555; margin-bottom: 10px; }
      </style></head><body>
      <h1>Examensinventering – VVS-montör</h1>
      <div class="meta">Datum: ${date} · Antal elever: ${elever} · Behov = per elev × antal elever</div>
      ${rowsHtml}
      <h2>Beställningslista per leverantör</h2>
      ${orderHtml || "<p>Inget behöver beställas just nu.</p>"}
      <p class="meta">Kontrollera att artiklarna är likvärdiga innan du byter leverantör. Samla gärna större köp för lägre styckpris.</p>
      </body></html>`;

    if (Platform.OS === "web") {
      const w = (globalThis as any).window?.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
        return;
      }
    }
    const text = groups
      .flatMap((g) => [
        g.titel,
        ...g.rows.map(
          (r) =>
            `- ${r.item.component} ${r.item.dimension ?? ""}: behov ${r.behov}, saldo ${r.stock}, ${statusText(
              r.status,
            )}`,
        ),
      ])
      .join("\n");
    Share.share({ message: text });
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Examensinventering</Text>
      <Text style={[styles.intro, { color: theme.muted }]}>
        Räkna behovet per elev × antal elever. Jämför med Förrådet. Beställ det som saknas – gärna samlat per
        leverantör.
      </Text>

      <Card style={{ marginBottom: 12 }}>
        <Field
          label="Antal elever"
          value={antalElever}
          onChangeText={setAntalElever}
          keyboardType="number-pad"
        />
        <View style={styles.summaryRow}>
          <Badge label={`${summary.ok} OK`} tone="success" />
          <Badge label={`${summary.low} lågt`} tone="warning" />
          <Badge label={`${summary.missing} saknas`} tone="danger" />
        </View>
        <View style={{ gap: 8 }}>
          <Button title="💾 Spara räknade antal" onPress={saveCounts} loading={saving} />
          <Button
            title="🛒 Lägg saknade i beställning"
            variant="secondary"
            onPress={createOrders}
            loading={ordering}
            disabled={toOrder.length === 0}
          />
          <Button title="🖨 Skriv ut lista" variant="ghost" onPress={printList} />
        </View>
        <TouchableOpacity style={styles.toggle} onPress={() => setBaraSaknade((v) => !v)}>
          <View
            style={[
              styles.check,
              { borderColor: theme.border, backgroundColor: baraSaknade ? theme.accent : "transparent" },
            ]}
          >
            {baraSaknade && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={{ color: theme.text }}>Visa bara sådant som saknas</Text>
        </TouchableOpacity>
      </Card>

      {groups.map((group) => {
        const rows = baraSaknade ? group.rows.filter((r) => r.status !== "ok") : group.rows;
        if (rows.length === 0) return null;
        return (
          <Card key={group.id} style={{ marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{group.titel}</Text>
            {rows.map((r, idx) => (
              <View
                key={`${group.id}-${r.item.component}-${r.item.dimension ?? ""}-${idx}`}
                style={[styles.row, { borderTopColor: theme.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "700" }}>
                    {r.item.component}
                    {r.item.dimension ? ` ${r.item.dimension}` : ""}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                    {r.hit
                      ? [r.hit.name, r.hit.shelf_location, r.hit.supplier].filter(Boolean).join(" · ")
                      : "Saknas i Förrådet"}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                    Per elev: {r.item.quantity} · Behov: {r.behov} · Saldo: {r.stock} · Diff: {r.diff}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Badge label={statusText(r.status)} tone={statusTone(r.status)} />
                  {r.hit ? (
                    <TextInput
                      value={counts[r.hit.id] ?? String(r.hit.stock_quantity)}
                      onChangeText={(v) => setCounts((c) => ({ ...c, [r.hit!.id]: v }))}
                      keyboardType="number-pad"
                      style={[
                        styles.countInput,
                        { color: theme.text, borderColor: theme.border, backgroundColor: theme.card },
                      ]}
                    />
                  ) : (
                    <Button title="+ Förråd" variant="ghost" onPress={() => addToCatalog(r.item)} />
                  )}
                </View>
              </View>
            ))}
          </Card>
        );
      })}

      <Card style={{ marginBottom: 12 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Beställningslista per leverantör</Text>
        {bySupplier.length === 0 ? (
          <Text style={{ color: theme.muted }}>Inget behöver beställas just nu.</Text>
        ) : (
          bySupplier.map(([supplier, rows]) => (
            <View key={supplier} style={{ marginBottom: 10 }}>
              <Text style={{ color: theme.text, fontWeight: "800", marginBottom: 4 }}>{supplier}</Text>
              {rows.map((r) => (
                <Text key={r.hit.id} style={[styles.orderLine, { color: theme.muted }]}>
                  • {r.hit.name} {r.hit.dimension} — beställ{" "}
                  <Text style={{ color: theme.text, fontWeight: "700" }}>
                    {Math.max(1, r.behov - r.hit.stock_quantity, r.hit.reorder_quantity ?? 0)} st
                  </Text>{" "}
                  (behov {r.behov}, saldo {r.hit.stock_quantity})
                </Text>
              ))}
            </View>
          ))
        )}
        <Text style={{ color: theme.muted, fontSize: 12, marginTop: 8 }}>
          Tips: samla raderna per leverantör och gör ett större köp – ofta blir styckpriset lägre. Kontrollera att
          artiklarna är likvärdiga innan du byter leverantör.
        </Text>
      </Card>

      <Button
        title="📦 Tillbaka till Förrådet"
        variant="ghost"
        onPress={() => router.push("/(larare)/(tabs)/forrad")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800" },
  intro: { fontSize: 14, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  summaryRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 6 },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  countInput: {
    width: 76,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    textAlign: "right",
  },
  toggle: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  check: { width: 22, height: 22, borderRadius: 5, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  checkMark: { color: "#fff", fontSize: 14, fontWeight: "800" },
  orderLine: { fontSize: 13, marginTop: 3, lineHeight: 18 },
});
