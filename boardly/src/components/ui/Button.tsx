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
import { BezelOverlay } from "./Trim";

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

  // Each variant is an enamel face in an engraved metal bezel: gold for
  // the buttons that matter, silver for the second choice. The enamel
  // derives from the theme, so a game's own skin recolours its buttons.
  const look: Record<
    Exclude<ButtonVariant, "tertiary">,
    { fill: [string, string, string]; metal: "gold" | "silver"; label: string }
  > = {
    primary: {
      fill: [shade(colors.primary, 0.3), colors.primary, colors.primaryPressed],
      metal: "gold",
      label: colors.primaryContrast,
    },
    secondary: {
      fill: [shade(colors.card, 0.18), colors.card, shade(colors.card, -0.15)],
      metal: "silver",
      label: colors.text,
    },
    danger: {
      fill: [shade(colors.danger, 0.3), colors.danger, shade(colors.danger, -0.25)],
      metal: "gold",
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
        {
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
          // pressed, the piece sinks into the table
          transform: [{ translateY: pressed && variant !== "tertiary" ? 1.5 : 0 }],
        },
        variant === "tertiary" ? [styles.base, shape, face] : null,
        outer,
      ]}
    >
      {variant === "tertiary" ? (
        content
      ) : (
        <LinearGradient
          colors={look[variant].fill}
          style={[styles.base, styles.raised, shape, face]}
        >
          <Texture
            radius={
              (face.borderRadius as number | undefined) ?? shape.borderRadius
            }
          />
          <BezelOverlay
            r={(face.borderRadius as number | undefined) ?? shape.borderRadius}
            t={size === "sm" ? 2.8 : 3.5}
            metal={look[variant].metal}
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
  // A raised piece casts a shadow on the table
  raised: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
