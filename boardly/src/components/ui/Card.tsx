import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "@/theme";

import { Texture } from "./Texture";
import { BezelOverlay } from "./Trim";
import { tapHaptic } from "@/utils/haptics";

/** The gold moulding round a card. */
const CARD_RIM = 3;

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Raised panel — the standard container for a block of content. */
export function Card({ children, onPress, padding, radius, style }: CardProps) {
  const theme = useTheme();

  // A tray on the table in a thin engraved gold moulding; the fill is
  // the theme's, so a game's skin keeps its own colour inside the rim
  const r = radius ?? theme.radius.lg;
  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: r,
    padding: (padding ?? theme.spacing.md) + CARD_RIM - 1,
    ...theme.shadows.card,
  };

  const texture = <Texture radius={r} />;
  // over the content, so a picture running to the edge sits in the frame
  const rim = <BezelOverlay r={r} t={CARD_RIM} />;

  if (!onPress) {
    return (
      <View style={[cardStyle, style]}>
        {texture}
        {children}
        {rim}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }, style]}
    >
      {texture}
      {children}
      {rim}
    </Pressable>
  );
}
