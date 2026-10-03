import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

export interface ErrorStateProps {
  title: string;
  subtitle?: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Shown when a fetch fails — always offers a retry. */
export function ErrorState({
  title,
  subtitle,
  retryLabel,
  onRetry,
  style,
}: ErrorStateProps) {
  const { spacing } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xxl }, style]}>
      <AppText style={styles.emoji}>😵</AppText>
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
      {retryLabel && onRetry ? (
        <Button
          label={retryLabel}
          style={{ marginTop: spacing.lg }}
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 44, lineHeight: 52 },
});
