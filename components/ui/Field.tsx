import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  const theme = Colors[useColorScheme() ?? "light"];
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.muted}
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  input: { minHeight: 50, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
});
