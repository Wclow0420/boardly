import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { shade, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { AppText } from "./AppText";
import { Texture } from "./Texture";

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

const SIZE_STYLES: Record<
  ButtonSize,
  { paddingVertical: number; fontSize: number }
> = {
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
  const { colors, radius, typography } = theme;
  const sizeStyle = SIZE_STYLES[size];

  // Each variant is a top-to-bottom gradient with a darker rim, like a
  // raised game piece. Everything derives from the theme, so a game's
  // own skin recolours its buttons too.
  const look: Record<
    Exclude<ButtonVariant, "tertiary">,
    { fill: [string, string]; rim: string; label: string }
  > = {
    primary: {
      fill: [colors.primary, colors.primaryPressed],
      rim: shade(colors.primaryPressed, -0.3),
      label: colors.primaryContrast,
    },
    secondary: {
      fill: [shade(colors.card, 0.12), colors.card],
      rim: colors.border,
      label: colors.text,
    },
    danger: {
      fill: [colors.danger, shade(colors.danger, -0.22)],
      rim: shade(colors.danger, -0.45),
      label: "#FFFFFF",
    },
  };

  // Callers style the button as one box. Padding and corner radius
  // belong to the painted face; everything else (margins, flex, width)
  // positions the pressable around it.
  const {
    padding,
    paddingHorizontal,
    paddingVertical,
    borderRadius,
    ...outer
  } = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const face: ViewStyle = {};
  if (padding !== undefined) face.padding = padding;
  if (paddingHorizontal !== undefined)
    face.paddingHorizontal = paddingHorizontal;
  if (paddingVertical !== undefined) face.paddingVertical = paddingVertical;
  if (borderRadius !== undefined) face.borderRadius = borderRadius;

  const labelColor =
    variant === "tertiary" ? colors.primary : look[variant].label;
  const shape = {
    borderRadius: size === "lg" ? radius.pill : radius.md,
    paddingVertical: sizeStyle.paddingVertical,
  };

  const content = loading ? (
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
  );

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
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === "tertiary" ? [styles.base, shape, face] : null,
        outer,
      ]}
    >
      {variant === "tertiary" ? (
        content
      ) : (
        <LinearGradient
          colors={look[variant].fill}
          style={[
            styles.base,
            styles.raised,
            shape,
            face,
            { borderColor: look[variant].rim },
          ]}
        >
          <Texture
            radius={
              (face.borderRadius as number | undefined) ?? shape.borderRadius
            }
          />
          {content}
        </LinearGradient>
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
  // Thicker bottom edge reads as a pressable, raised piece
  raised: { borderWidth: 2, borderBottomWidth: 4 },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
