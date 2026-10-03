import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

export interface EmptyStateProps {
  /** Big playful emoji, matching the brand tone. */
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Shown whenever a list/section legitimately has no data. */
export function EmptyState({
  emoji = "🎲",
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xxl }, style]}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText variant="title" align="center" style={{ marginTop: spacing.md }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText
          variant="body"
          color="textSubtle"
          align="center"
          style={{ marginTop: spacing.xs }}
        >
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel ? (
        <Button
          label={actionLabel}
          variant="secondary"
          style={{ marginTop: spacing.lg }}
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 44, lineHeight: 52 },
});
