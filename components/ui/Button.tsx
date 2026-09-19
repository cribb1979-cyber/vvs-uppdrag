import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const theme = Colors[useColorScheme() ?? "light"];
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary" ? theme.accent : variant === "danger" ? theme.danger : variant === "ghost" ? "transparent" : theme.card;
  const textColor = variant === "ghost" ? theme.tint : variant === "secondary" ? theme.text : "#fff";
  const borderColor = variant === "secondary" || variant === "ghost" ? theme.border : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 17,
    fontWeight: "600",
  },
});
