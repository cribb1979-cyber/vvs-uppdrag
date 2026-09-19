import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { parseDelimitedText } from "@/lib/csv";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MaterialInsert = Database["public"]["Tables"]["material_catalog"]["Insert"];
type TargetField = "name" | "article_number" | "rsk_number" | "dimension" | "category" | "supplier" | "shelf_location" | "stock_quantity" | "note";

const TARGET_FIELDS: { key: TargetField; label: string; required?: boolean }[] = [
  { key: "name", label: "Namn", required: true },
  { key: "article_number", label: "Artikelnummer" },
  { key: "rsk_number", label: "RSK-nummer" },
  { key: "dimension", label: "Dimension" },
  { key: "category", label: "Kategori" },
  { key: "supplier", label: "Leverantör" },
  { key: "shelf_location", label: "Hyllplats" },
  { key: "stock_quantity", label: "Antal i lager" },
  { key: "note", label: "Anteckning" },
];

export default function ImportForrad() {
  const theme = Colors[useColorScheme() ?? "light"];
  const router = useRouter();
  const { org } = useAuth();

  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<TargetField, number>>>({});
  const [importing, setImporting] = useState(false);

  const header = rows?.[0] ?? [];
  const dataRows = useMemo(() => rows?.slice(1) ?? [], [rows]);

  function parse() {
    const parsed = parseDelimitedText(rawText);
    if (parsed.length < 2) {
      Alert.alert("Kunde inte tolka listan", "Klistra in minst en rubrikrad och en datarad.");
      return;
    }
    setRows(parsed);
    // Gissa rimliga standardkopplingar utifrån rubriktexten.
    const guess: Partial<Record<TargetField, number>> = {};
    parsed[0].forEach((h, idx) => {
      const key = h.toLowerCase();
      if (!guess.name && /namn|benämning|artikel(?!nr|nummer)|produkt/.test(key)) guess.name = idx;
      if (!guess.article_number && /art(ikel)?\.?\s*nr|artikelnummer/.test(key)) guess.article_number = idx;
      if (!guess.rsk_number && /rsk/.test(key)) guess.rsk_number = idx;
      if (!guess.dimension && /dim|mått|storlek/.test(key)) guess.dimension = idx;
      if (!guess.category && /kategori|grupp/.test(key)) guess.category = idx;
      if (!guess.supplier && /leverant/.test(key)) guess.supplier = idx;
      if (!guess.shelf_location && /hylla|plats|lager(plats)?/.test(key)) guess.shelf_location = idx;
      if (!guess.stock_quantity && /antal|saldo|lagersaldo|qty|quantity/.test(key)) guess.stock_quantity = idx;
    });
    setMapping(guess);
  }

  function setMap(field: TargetField, colIdx: number | null) {
    setMapping((m) => {
      const next = { ...m };
      if (colIdx === null) delete next[field];
      else next[field] = colIdx;
      return next;
    });
  }

  function reset() {
    setRows(null);
    setMapping({});
  }

  async function doImport() {
    if (!org || !rows || mapping.name === undefined) return;
    const toInsert: MaterialInsert[] = dataRows
      .map((row) => {
        const get = (field: TargetField) => (mapping[field] != null ? (row[mapping[field]!]?.trim() ?? "") : "");
        return { name: get("name"), get };
      })
      .filter((r) => r.name)
      .map(({ name, get }) => {
        const qtyRaw = get("stock_quantity");
        return {
          org_id: org.id,
          name,
          article_number: get("article_number"),
          rsk_number: get("rsk_number"),
          dimension: get("dimension"),
          category: get("category"),
          supplier: get("supplier"),
          shelf_location: get("shelf_location"),
          stock_quantity: qtyRaw ? Math.max(0, Number.parseInt(qtyRaw, 10) || 0) : 0,
          note: get("note"),
        };
      });

    if (toInsert.length === 0) {
      Alert.alert("Inget att importera", "Ingen rad hade ett namn i den kopplade kolumnen.");
      return;
    }

    setImporting(true);
    const { error } = await supabase.from("material_catalog").insert(toInsert);
    setImporting(false);
    if (error) {
      Alert.alert("Importen misslyckades", getErrorMessage(error));
      return;
    }
    Alert.alert("Klart!", `${toInsert.length} artiklar importerade.`, [{ text: "OK", onPress: () => router.back() }]);
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Card style={{ marginBottom: 20, opacity: 0.7 }}>
        <Text style={{ color: theme.text, fontWeight: "700", marginBottom: 4 }}>🚧 AI-fotoimport av katalogsida</Text>
        <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 19 }}>
          Kommer senare -- att tolka ett foto av en grossistkatalog automatiskt kräver AI-bildtolkning som inte är
          aktiverad i den här installationen ännu. Använd listimporten nedan tills vidare.
        </Text>
      </Card>

      {!rows ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Klistra in listan</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 12 }}>
            Öppna grossistens Excel/CSV-fil, markera allt (inklusive rubrikraden) och klistra in här. Kommatecken,
            semikolon och tabb fungerar alla.
          </Text>
          <TextInput
            style={[styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder={"Namn;RSK-nummer;Dimension;Antal\nKopparrör;123456;15 mm;20"}
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={10}
            value={rawText}
            onChangeText={setRawText}
          />
          <View style={{ height: 16 }} />
          <Button title="Tolka listan" onPress={parse} disabled={!rawText.trim()} />
        </>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Koppla kolumner</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 12 }}>
            {dataRows.length} rader hittade. Ange vilken kolumn som motsvarar vilket fält (Namn krävs).
          </Text>
          {TARGET_FIELDS.map((f) => (
            <View key={f.key} style={{ marginBottom: 14 }}>
              <Text style={{ color: theme.text, fontWeight: "600", marginBottom: 6 }}>
                {f.label}
                {f.required ? " *" : ""}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      { borderColor: theme.border, backgroundColor: mapping[f.key] === undefined ? theme.tint + "22" : "transparent" },
                    ]}
                    onPress={() => setMap(f.key, null)}
                  >
                    <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "600" }}>Ingen</Text>
                  </TouchableOpacity>
                  {header.map((h, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.chip,
                        { borderColor: mapping[f.key] === idx ? theme.accent : theme.border, backgroundColor: mapping[f.key] === idx ? theme.accent + "22" : "transparent" },
                      ]}
                      onPress={() => setMap(f.key, idx)}
                    >
                      <Text style={{ color: mapping[f.key] === idx ? theme.accent : theme.text, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                        {h || `Kolumn ${idx + 1}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Förhandsgranskning</Text>
          <Card style={{ marginBottom: 20 }}>
            {dataRows.slice(0, 5).map((r, i) => (
              <Text key={i} style={{ color: theme.text, fontSize: 13, marginBottom: 6 }}>
                {i + 1}. {mapping.name != null ? r[mapping.name] || "(tomt namn)" : "—"}
                {mapping.rsk_number != null && r[mapping.rsk_number] ? ` · RSK ${r[mapping.rsk_number]}` : ""}
                {mapping.dimension != null && r[mapping.dimension] ? ` · ${r[mapping.dimension]}` : ""}
                {mapping.stock_quantity != null && r[mapping.stock_quantity] ? ` · ${r[mapping.stock_quantity]} st` : ""}
              </Text>
            ))}
            {dataRows.length > 5 && <Text style={{ color: theme.muted, fontSize: 12 }}>...och {dataRows.length - 5} rader till</Text>}
          </Card>

          <Button title={`Importera ${dataRows.length} rader`} onPress={doImport} loading={importing} disabled={mapping.name === undefined} />
          <View style={{ height: 10 }} />
          <Button title="Börja om" variant="ghost" onPress={reset} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
  textarea: { minHeight: 160, borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 6 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, maxWidth: 160 },
});
