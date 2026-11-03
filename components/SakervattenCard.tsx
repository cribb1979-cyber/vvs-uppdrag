import { Linking, Text, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { reglerFor, SAKERVATTEN_URL, SAKERVATTEN_VERSION } from "@/lib/sakervatten";

/** Visar uppdragets valda Säkervatten-regler för eleven. */
export function SakervattenCard({ ruleRefs }: { ruleRefs: string[] | null | undefined }) {
  const theme = Colors[useColorScheme() ?? "light"];
  const regler = reglerFor(ruleRefs);
  if (regler.length === 0) return null;

  return (
    <Card style={{ marginTop: 14 }}>
      <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>🛡️ Säkervatten {SAKERVATTEN_VERSION}</Text>
      <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4, marginBottom: 8 }}>
        Det här är reglerna som uppdraget tränar. Följ dem och bocka av i egenkontrollen.
      </Text>
      {regler.map((regel) => (
        <View key={regel.kod} style={{ marginTop: 10 }}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>{regel.rubrik}</Text>
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>{regel.sammanfattning}</Text>
          {regel.kontrollpunkter.map((punkt) => (
            <Text key={punkt} style={{ color: theme.text, fontSize: 13, marginTop: 3 }}>
              ☐  {punkt}
            </Text>
          ))}
        </View>
      ))}
      <TouchableOpacity onPress={() => Linking.openURL(SAKERVATTEN_URL)} style={{ marginTop: 10 }}>
        <Text style={{ color: theme.tint, fontWeight: "700" }}>
          Öppna Branschregler {SAKERVATTEN_VERSION} på sakervatten.se →
        </Text>
      </TouchableOpacity>
    </Card>
  );
}
