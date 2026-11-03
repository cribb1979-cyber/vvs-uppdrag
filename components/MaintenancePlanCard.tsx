import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

/** Elevens skriftliga drift- och underhållsplan för ett uppdrag. */
export function MaintenancePlanCard({
  participantId,
  initialText,
  savedAt,
}: {
  participantId: string;
  initialText: string;
  savedAt: string | null;
}) {
  const theme = Colors[useColorScheme() ?? "light"];
  const [text, setText] = useState(initialText ?? "");
  const [sparad, setSparad] = useState<string | null>(savedAt);
  const [sparar, setSparar] = useState(false);

  // Fyll bara från servern när deltagaren byts ut. En tyst bakgrunds-
  // uppdatering får inte skriva över det eleven håller på att skriva.
  useEffect(() => {
    setText(initialText ?? "");
    setSparad(savedAt);
  }, [participantId]);

  async function spara() {
    setSparar(true);
    const { error } = await supabase.rpc("save_maintenance_plan", {
      p_participant_id: participantId,
      p_text: text,
    });
    setSparar(false);
    if (error) {
      Alert.alert("Kunde inte spara planen", getErrorMessage(error));
      return;
    }
    setSparad(new Date().toISOString());
  }

  return (
    <Card style={{ marginTop: 16 }}>
      <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>🛠 Drift- och underhållsplan</Text>
      <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4, marginBottom: 10, lineHeight: 18 }}>
        Skriv hur installationen ska drivas, kontrolleras och underhållas. Ta med kontrollintervall,
        reservdelar och vad som ska göras vid driftstörning. Spara när du är klar.
      </Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
        placeholder="Skriv din drift- och underhållsplan här..."
        placeholderTextColor={theme.muted}
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />
      <View style={{ marginTop: 10 }}>
        <Button title="Spara plan" onPress={spara} loading={sparar} disabled={sparar} />
      </View>
      {!!sparad && (
        <Text style={{ color: theme.success, fontSize: 12, marginTop: 8 }}>
          ✓ Sparad {new Date(sparad).toLocaleString("sv-SE")}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 150, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
});
