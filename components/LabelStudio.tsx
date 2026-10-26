// Etikettstudio: skriv ut etiketter direkt från appen till en Phomemo D35
// över Web Bluetooth. Tre källor: förrådets artiklar, examensprovets
// stationer och helt fri text. Stilen gäller alla etiketter i kön.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Image, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/database.types";
import { getErrorMessage } from "@/lib/errors";
import { EXAM_TASKS, timmar } from "@/lib/examVvs";
import {
  DEFAULT_STYLE,
  bluetoothSupported,
  connectPrinter,
  printLabels,
  renderPreview,
  type LabelSpec,
  type LabelStyle,
  type Printer,
} from "@/lib/labelPrinter";
import { examTaskUrl, materialArticleUrl } from "@/lib/links";
import { supabase } from "@/lib/supabase";

type MaterialRow = Database["public"]["Tables"]["material_catalog"]["Row"];
type Kalla = "forrad" | "examensprov" | "fritext";

interface QueueItem {
  key: string;
  text: string;
  qr?: string;
}

let nyckelRaknare = 0;
const nyNyckel = () => `etikett-${++nyckelRaknare}`;

const LANGDER = [
  { label: "Auto", value: 0 },
  { label: "30 mm", value: 30 },
  { label: "40 mm", value: 40 },
  { label: "50 mm", value: 50 },
];

const STORLEKAR = ["S", "M", "L", "XL"];

export default function LabelStudio({
  initialKalla = "forrad",
  initialArtikelId,
}: {
  initialKalla?: Kalla;
  initialArtikelId?: string;
}) {
  const theme = Colors[useColorScheme() ?? "light"];
  const { org } = useAuth();

  const [kalla, setKalla] = useState<Kalla>(initialKalla);
  const [artiklar, setArtiklar] = useState<MaterialRow[]>([]);
  const [sok, setSok] = useState("");
  const [valdaArtiklar, setValdaArtiklar] = useState<string[]>([]);
  const [valdaProv, setValdaProv] = useState<string[]>([]);
  const [fritext, setFritext] = useState("");
  const [fritextQr, setFritextQr] = useState("");

  const [stil, setStil] = useState<LabelStyle>(DEFAULT_STYLE);
  const [langdMm, setLangdMm] = useState(0);

  const [ko, setKo] = useState<QueueItem[]>([]);
  const [skrivare, setSkrivare] = useState<Printer | null>(null);
  const [busy, setBusy] = useState(false);
  const [forvaldTillagd, setForvaldTillagd] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const arWebb = Platform.OS === "web";
  const stods = arWebb && bluetoothSupported();
  const arFirefox =
    arWebb && typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent ?? "");

  useEffect(() => {
    if (!org) return;
    supabase
      .from("material_catalog")
      .select("*")
      .eq("org_id", org.id)
      .order("name")
      .then(({ data }) => setArtiklar(data ?? []));
  }, [org]);

  const filtrerade = useMemo(() => {
    const q = sok.trim().toLowerCase();
    if (!q) return artiklar.slice(0, 60);
    return artiklar
      .filter((a) =>
        [a.name, a.rsk_number, a.article_number, a.dimension, a.shelf_location]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 60);
  }, [artiklar, sok]);

  // Artikel framklickad från artikelsidan: lägg den i kön automatiskt.
  useEffect(() => {
    if (forvaldTillagd || !initialArtikelId) return;
    const artikel = artiklar.find((a) => a.id === initialArtikelId);
    if (!artikel) return;
    setForvaldTillagd(true);
    setKo((tidigare) => [
      ...tidigare,
      {
        key: nyNyckel(),
        text: [artikel.name, artikel.dimension].filter(Boolean).join("\n"),
        qr: materialArticleUrl(artikel.id),
      },
    ]);
    setStatus("Artikeln ligger i kön – anslut skrivaren och skriv ut.");
  }, [artiklar, initialArtikelId, forvaldTillagd]);

  function laggTill(poster: { text: string; qr?: string }[]) {
    setKo((tidigare) => [...tidigare, ...poster.map((p) => ({ key: nyNyckel(), ...p }))]);
  }

  function laggTillArtiklar(alla = false) {
    const urval = alla ? filtrerade : artiklar.filter((a) => valdaArtiklar.includes(a.id));
    if (!urval.length) {
      setStatus("Markera minst en artikel först.");
      return;
    }
    laggTill(
      urval.map((a) => ({
        text: [a.name, a.dimension].filter(Boolean).join("\n"),
        qr: materialArticleUrl(a.id),
      })),
    );
    setValdaArtiklar([]);
    setStatus(`${urval.length} artikel-etiketter i kön.`);
  }

  function laggTillProv(alla = false) {
    const urval = alla ? EXAM_TASKS : EXAM_TASKS.filter((t) => valdaProv.includes(t.id));
    if (!urval.length) {
      setStatus("Markera minst ett moment först.");
      return;
    }
    laggTill(
      urval.map((t) => ({
        text: `Station ${EXAM_TASKS.findIndex((x) => x.id === t.id) + 1}\n${t.titel}`,
        qr: examTaskUrl(t.id),
      })),
    );
    setValdaProv([]);
    setStatus(`${urval.length} stationsetiketter i kön.`);
  }

  function laggTillFritext() {
    if (!fritext.trim()) {
      setStatus("Skriv något i textfältet först.");
      return;
    }
    laggTill([{ text: fritext.trim(), qr: fritextQr.trim() || undefined }]);
    setFritext("");
    setFritextQr("");
    setStatus("Etikett tillagd i kön.");
  }

  const specs: LabelSpec[] = useMemo(
    () => ko.map((i) => ({ text: i.text, qr: i.qr, style: stil, lengthMm: langdMm })),
    [ko, stil, langdMm],
  );

  const forhandsvisningar = useMemo(() => {
    if (!arWebb) return {} as Record<string, { uri: string; width: number; height: number }>;
    const map: Record<string, { uri: string; width: number; height: number }> = {};
    specs.forEach((spec, i) => {
      const item = ko[i];
      if (!item) return;
      try {
        map[item.key] = renderPreview(spec);
      } catch {
        // canvas kan saknas i vissa webbläsarlägen – strunta i förhandsvisning
      }
    });
    return map;
  }, [arWebb, specs, ko]);

  async function anslut() {
    setBusy(true);
    setStatus("Välj skrivare i listan …");
    try {
      const anslutning = await connectPrinter();
      setSkrivare(anslutning);
      setStatus(`Ansluten till ${anslutning.name}.`);
    } catch (e) {
      setStatus(`Kunde inte ansluta: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function skrivUt(attSkriva: LabelSpec[]) {
    if (!attSkriva.length) {
      setStatus("Kön är tom.");
      return;
    }
    setBusy(true);
    setStatus("Söker skrivare …");
    try {
      const anslutning = skrivare ?? (await connectPrinter());
      setSkrivare(anslutning);
      setStatus(`Ansluten till ${anslutning.name}. Skickar etiketter …`);
      await printLabels(anslutning, attSkriva, (klara, total) => setStatus(`Skickar ${klara} av ${total} …`));
      setStatus(`Klart – ${attSkriva.length} etiketter skickade.`);
    } catch (e) {
      setStatus(`Kunde inte skriva ut: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  function kopplaFran() {
    skrivare?.disconnect();
    setSkrivare(null);
    setStatus("Frånkopplad.");
  }

  /* ------------------------------------------------------------ smådelar */

  function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.chip,
          {
            backgroundColor: active ? theme.accent : theme.card,
            borderColor: active ? theme.accent : theme.border,
          },
        ]}
      >
        <Text style={{ color: active ? "#fff" : theme.text, fontWeight: "700", fontSize: 13 }}>{label}</Text>
      </Pressable>
    );
  }

  function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return <Chip label={`${value ? "☑" : "☐"} ${label}`} active={value} onPress={() => onChange(!value)} />;
  }

  function Rad({ children }: { children: ReactNode }) {
    return <View style={styles.rad}>{children}</View>;
  }

  function ValtChip({ id, valda, setValda, label }: { id: string; valda: string[]; setValda: (n: string[]) => void; label: string }) {
    const active = valda.includes(id);
    return (
      <Pressable
        onPress={() => setValda(active ? valda.filter((x) => x !== id) : [...valda, id])}
        style={[styles.valrad, { borderColor: theme.border, backgroundColor: active ? theme.accent + "18" : theme.card }]}
      >
        <Text style={{ color: active ? theme.accent : theme.muted, fontWeight: "800", width: 22 }}>{active ? "☑" : "☐"}</Text>
        <Text style={{ color: theme.text, flex: 1 }} numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
    );
  }

  if (!arWebb) {
    return (
      <Card>
        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 17 }}>Utskrift kräver webbläsare</Text>
        <Text style={{ color: theme.muted, marginTop: 8, lineHeight: 21 }}>
          Den här skrivaren ansluts via Web Bluetooth, som bara finns i Chrome och Edge på dator (eller Chrome på
          Android). Öppna appens webbadress i Chrome på datorn och öppna Etiketter igen.
        </Text>
      </Card>
    );
  }

  return (
    <View>
      {!stods && (
        <Card style={{ marginBottom: 12, borderColor: theme.danger }}>
          <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>
            Webbläsaren kan inte prata Bluetooth
          </Text>
          <Text style={{ color: theme.muted, marginTop: 6, lineHeight: 20 }}>
            {arFirefox
              ? "Du använder Firefox, som saknar Web Bluetooth. Öppna appen i Chrome eller Edge i stället."
              : "Web Bluetooth saknas i den här webbläsaren. Använd Chrome eller Edge på dator – eller Chrome på Android."}
          </Text>
          <Text style={{ color: theme.muted, marginTop: 6, lineHeight: 20 }}>
            Allt annat i appen fungerar som vanligt; det är bara utskriften som behöver Chrome.
          </Text>
          <Rad>
            <Button
              title="Hämta Chrome"
              variant="secondary"
              onPress={() => void Linking.openURL("https://www.google.com/chrome/")}
            />
          </Rad>
        </Card>
      )}

      {/* Skrivare */}
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.mellanrum}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>Skrivare</Text>
            <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>
              {skrivare ? `Ansluten: ${skrivare.name}` : stods ? "Ingen ansluten ännu" : "Web Bluetooth saknas – använd Chrome eller Edge"}
            </Text>
          </View>
          {skrivare ? <Badge label="ansluten" tone="success" /> : <Badge label="frånkopplad" tone="muted" />}
        </View>
        <Rad>
          <Button
            title={skrivare ? "Byt skrivare" : "🔌 Anslut skrivare"}
            variant="secondary"
            onPress={() => {
              skrivare?.disconnect();
              setSkrivare(null);
              void anslut();
            }}
            disabled={!stods || busy}
          />
          {!!skrivare && <Button title="Koppla från" variant="ghost" onPress={kopplaFran} />}
        </Rad>
        {!!status && (
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 10 }}>{status}</Text>
        )}
      </Card>

      {/* Källa */}
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.rubrik(theme.text)}>Källa</Text>
        <Rad>
          <Chip label="📦 Förråd" active={kalla === "forrad"} onPress={() => setKalla("forrad")} />
          <Chip label="🎓 Examensprov" active={kalla === "examensprov"} onPress={() => setKalla("examensprov")} />
          <Chip label="✏️ Fritext" active={kalla === "fritext"} onPress={() => setKalla("fritext")} />
        </Rad>

        {kalla === "forrad" && (
          <View style={{ marginTop: 12 }}>
            <Field label="Sök artikel" value={sok} onChangeText={setSok} placeholder="namn, RSK, dimension, hylla" />
            <Rad>
              <Button title="Lägg till markerade" onPress={() => laggTillArtiklar()} disabled={!valdaArtiklar.length} />
            </Rad>
            <Rad>
              <Button
                title={`Lägg till alla i sökningen (${filtrerade.length})`}
                variant="ghost"
                onPress={() => laggTillArtiklar(true)}
              />
            </Rad>
            <View style={{ marginTop: 8 }}>
              {filtrerade.map((a) => (
                <ValtChip
                  key={a.id}
                  id={a.id}
                  valda={valdaArtiklar}
                  setValda={setValdaArtiklar}
                  label={[a.name, a.dimension, a.rsk_number ? `RSK ${a.rsk_number}` : ""].filter(Boolean).join(" · ")}
                />
              ))}
              {!filtrerade.length && <Text style={{ color: theme.muted }}>Inga artiklar matchar.</Text>}
            </View>
          </View>
        )}

        {kalla === "examensprov" && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 8 }}>
              QR-koden öppnar momentets publika sida – bra att sätta på stationerna i verkstaden.
            </Text>
            <Rad>
              <Button title="Lägg till markerade" onPress={() => laggTillProv()} disabled={!valdaProv.length} />
            </Rad>
            <Rad>
              <Button title="Alla 12 moment" variant="ghost" onPress={() => laggTillProv(true)} />
            </Rad>
            <View style={{ marginTop: 8 }}>
              {EXAM_TASKS.map((t, i) => (
                <ValtChip
                  key={t.id}
                  id={t.id}
                  valda={valdaProv}
                  setValda={setValdaProv}
                  label={`Station ${i + 1} · ${t.titel} (${timmar(t.minut)})`}
                />
              ))}
            </View>
          </View>
        )}

        {kalla === "fritext" && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 6 }}>
              Skriv text; radbrytning blir ny rad på etiketten.
            </Text>
            <TextInput
              value={fritext}
              onChangeText={setFritext}
              multiline
              placeholder={"t.ex.\nHylla B\nKoppar 15"}
              placeholderTextColor={theme.muted}
              style={[
                styles.textarea,
                { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
              ]}
            />
            <Field
              label="QR-innehåll (valfritt)"
              value={fritextQr}
              onChangeText={setFritextQr}
              placeholder="https://… eller text"
              autoCapitalize="none"
            />
            <Button title="Lägg till etikett" onPress={laggTillFritext} />
          </View>
        )}
      </Card>

      {/* Stil */}
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.rubrik(theme.text)}>Stil (gäller alla i kön)</Text>
        <Text style={styles.delrubrik(theme.muted)}>Storlek</Text>
        <Rad>
          {STORLEKAR.map((s, i) => (
            <Chip key={s} label={s} active={stil.size === i + 1} onPress={() => setStil({ ...stil, size: i + 1 })} />
          ))}
        </Rad>
        <Text style={styles.delrubrik(theme.muted)}>Typsnitt</Text>
        <Rad>
          <Chip label="Sans" active={stil.font === "sans"} onPress={() => setStil({ ...stil, font: "sans" })} />
          <Chip label="Mono" active={stil.font === "mono"} onPress={() => setStil({ ...stil, font: "mono" })} />
          <Chip label="Serif" active={stil.font === "serif"} onPress={() => setStil({ ...stil, font: "serif" })} />
        </Rad>
        <Text style={styles.delrubrik(theme.muted)}>Justering</Text>
        <Rad>
          <Chip label="Vänster" active={stil.align === "left"} onPress={() => setStil({ ...stil, align: "left" })} />
          <Chip label="Center" active={stil.align === "center"} onPress={() => setStil({ ...stil, align: "center" })} />
          <Chip label="Höger" active={stil.align === "right"} onPress={() => setStil({ ...stil, align: "right" })} />
        </Rad>
        <Text style={styles.delrubrik(theme.muted)}>Effekter</Text>
        <Rad>
          <Toggle label="Fet" value={stil.bold} onChange={(v) => setStil({ ...stil, bold: v })} />
          <Toggle label="VERSALER" value={stil.uppercase} onChange={(v) => setStil({ ...stil, uppercase: v })} />
          <Toggle label="Inverterad" value={stil.invert} onChange={(v) => setStil({ ...stil, invert: v })} />
        </Rad>
        <Text style={styles.delrubrik(theme.muted)}>Etikettlängd</Text>
        <Rad>
          {LANGDER.map((l) => (
            <Chip key={l.value} label={l.label} active={langdMm === l.value} onPress={() => setLangdMm(l.value)} />
          ))}
        </Rad>
      </Card>

      {/* Kö */}
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.mellanrum}>
          <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>Kö ({ko.length})</Text>
          {ko.length > 0 && (
            <Pressable onPress={() => setKo([])}>
              <Text style={{ color: theme.danger, fontWeight: "700" }}>Töm kön</Text>
            </Pressable>
          )}
        </View>
        {ko.length === 0 ? (
          <Text style={{ color: theme.muted, marginTop: 8 }}>Inga etiketter ännu. Lägg till från en källa ovan.</Text>
        ) : (
          <View style={{ marginTop: 10 }}>
            {ko.map((item) => {
              const prev = forhandsvisningar[item.key];
              return (
                <View key={item.key} style={[styles.korad, { borderColor: theme.border }]}>
                  {prev ? (
                    <Image
                      source={{ uri: prev.uri }}
                      style={{ width: 44, height: Math.max(24, (prev.height / prev.width) * 44) }}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={{ width: 44 }} />
                  )}
                  <Text style={{ color: theme.text, flex: 1, fontSize: 13 }} numberOfLines={3}>
                    {item.text.replace(/\n/g, " · ")}
                    {item.qr ? "\n🔗 QR" : ""}
                  </Text>
                  <Pressable onPress={() => setKo(ko.filter((x) => x.key !== item.key))}>
                    <Text style={{ color: theme.muted, fontWeight: "800", paddingHorizontal: 6 }}>✕</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        <Rad>
          <Button
            title={busy ? "Skickar …" : `🖨 Skriv ut ${ko.length || ""}`.trim()}
            onPress={() => skrivUt(specs)}
            loading={busy}
            disabled={!ko.length || !stods}
          />
        </Rad>
        <Rad>
          <Button
            title="Testetikett"
            variant="ghost"
            onPress={() => skrivUt([{ text: "Test\nD35", style: stil, lengthMm: langdMm }])}
            disabled={!stods || busy}
          />
        </Rad>
        {busy && <ActivityIndicator style={{ marginTop: 10 }} color={theme.tint} />}
      </Card>
    </View>
  );
}

const styles = {
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  } as const,
  rad: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 } as const,
  mellanrum: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 } as const,
  valrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  } as const,
  korad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 6,
  } as const,
  textarea: {
    minHeight: 90,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 16,
  } as const,
  rubrik: (color: string) => ({ color, fontWeight: "800", fontSize: 16 }) as const,
  delrubrik: (color: string) => ({ color, fontSize: 12, fontWeight: "700", marginTop: 14, textTransform: "uppercase" }) as const,
};
