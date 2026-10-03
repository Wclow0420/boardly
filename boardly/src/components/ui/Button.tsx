import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { AppText } from "./AppText";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "lg" | "md" | "sm";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const SIZE_STYLES: Record<ButtonSize, { paddingVertical: number; fontSize: number }> = {
  lg: { paddingVertical: 17, fontSize: 19 },
  md: { paddingVertical: 13, fontSize: 14 },
  sm: { paddingVertical: 9, fontSize: 12 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  leftIcon,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const { colors, radius, shadows, typography } = theme;
  const sizeStyle = SIZE_STYLES[size];

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          ...(!disabled ? shadows.primaryButton : {}),
        };
      case "secondary":
        return {
          backgroundColor: pressed ? colors.chip : colors.primarySoft,
          borderWidth: 1.5,
          borderColor: colors.primarySoftBorder,
        };
      case "tertiary":
        return { backgroundColor: "transparent" };
      case "danger":
        return {
          backgroundColor: colors.danger,
          opacity: pressed ? 0.85 : 1,
        };
    }
  };

  const labelColor =
    variant === "primary" || variant === "danger"
      ? colors.primaryContrast
      : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={
        onPress
          ? () => {
              tapHaptic();
              onPress();
            }
          : undefined
      }
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: size === "lg" ? radius.pill : radius.md,
          paddingVertical: sizeStyle.paddingVertical,
          opacity: disabled ? 0.5 : 1,
        },
        getContainerStyle(pressed),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <AppText
            style={{
              fontFamily:
                size === "lg"
                  ? typography.h2.fontFamily // bold for the big CTA
                  : typography.label.fontFamily,
              fontSize: sizeStyle.fontSize,
              color: labelColor,
            }}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
