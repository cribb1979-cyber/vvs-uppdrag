import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { timmar } from "@/lib/examVvs";
import type { AssignmentStep } from "@/lib/database.types";
import { examInfo } from "@/lib/examMode";

/** Klockan startar första gången eleven öppnar uppdraget och ligger kvar
    på enheten, så att en omladdning inte ger ny tid. */
export function useExamClock(storageKey: string | null, minutes: number | null, running: boolean) {
  const [start, setStart] = useState<number | null>(null);
  const [nu, setNu] = useState(() => Date.now());

  useEffect(() => {
    if (!storageKey || !minutes || !running) return;
    let av = false;
    (async () => {
      try {
        const sparat = await AsyncStorage.getItem(storageKey);
        const tal = sparat ? Number.parseInt(sparat, 10) : Number.NaN;
        if (Number.isFinite(tal)) {
          if (!av) setStart(tal);
          return;
        }
        const nu2 = Date.now();
        await AsyncStorage.setItem(storageKey, String(nu2));
        if (!av) setStart(nu2);
      } catch {
        if (!av) setStart(Date.now());
      }
    })();
    return () => {
      av = true;
    };
  }, [storageKey, minutes, running]);

  useEffect(() => {
    if (!start || !minutes || !running) return;
    const t = setInterval(() => setNu(Date.now()), 1000);
    return () => clearInterval(t);
  }, [start, minutes, running]);

  if (!minutes || !running || !start) return { kvarMs: null as number | null, slut: false };
  const kvarMs = Math.max(0, minutes * 60_000 - (nu - start));
  return { kvarMs, slut: kvarMs === 0 };
}

function klocka(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const t = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const två = (n: number) => String(n).padStart(2, "0");
  return t > 0 ? `${t}:${två(m)}:${två(s)}` : `${m}:${två(s)}`;
}

export function ExamClock({
  steps,
  storageKey,
}: {
  steps: AssignmentStep[] | null | undefined;
  storageKey: string | null;
}) {
  const theme = Colors[useColorScheme() ?? "light"];
  const { minutes, lage } = examInfo(steps);
  const skarpt = lage === "prov";
  const { kvarMs, slut } = useExamClock(storageKey, minutes, skarpt);

  if (!minutes) return null;

  if (!skarpt) {
    return (
      <Card style={{ marginTop: 12 }}>
        <Text style={{ color: theme.text, fontWeight: "700" }}>🎓 Övningsläge</Text>
        <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
          Uppskattad tid: {timmar(minutes)}. Ingen klocka och inget lås – du får titta, fråga och göra om.
        </Text>
      </Card>
    );
  }

  if (slut) {
    return (
      <Card style={{ marginTop: 12, borderColor: theme.danger, borderWidth: 2 }}>
        <Text style={{ color: theme.danger, fontWeight: "800", fontSize: 16 }}>⏱ Tiden är slut</Text>
        <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
          Delprovet skulle ha slutförts utan avbrott. Lämna in det du gjort och prata med läraren innan du fortsätter.
        </Text>
      </Card>
    );
  }

  const snart = kvarMs !== null && kvarMs < 10 * 60_000;
  return (
    <Card style={{ marginTop: 12, borderColor: snart ? theme.danger : theme.border }}>
      <Text style={{ color: snart ? theme.danger : theme.text, fontWeight: "800", fontSize: 16 }}>
        🔒 Skarpt läge · {kvarMs === null ? timmar(minutes) : klocka(kvarMs)} kvar
      </Text>
      <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
        Provet ska slutföras utan avbrott. Facit, referensbild och AI-hjälp är avstängda.
      </Text>
    </Card>
  );
}
