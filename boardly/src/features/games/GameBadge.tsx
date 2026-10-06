import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { getGame } from "@/games/registry";

export interface GameBadgeProps {
  /** Registry key of the game. */
  gameKey: string;
  /** Fallbacks for games without their own logo. */
  emoji?: string | null;
  tileColor?: string | null;
  size?: number;
  radius?: number;
}

/** A game's square badge: its logo on its own dark colour when the game
 *  has one, otherwise the emoji on a pastel tile. */
export function GameBadge({
  gameKey,
  emoji,
  tileColor,
  size = 52,
  radius = 14,
}: GameBadgeProps) {
  const skin = getGame(gameKey)?.skin;

  if (skin?.logo) {
    return (
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: skin.colors.background ?? "#0B1114",
          },
        ]}
      >
        {skin.backdropImage ? (
          <Image
            source={skin.backdropImage}
            style={[StyleSheet.absoluteFill, styles.dim]}
            contentFit="cover"
          />
        ) : null}
        <Image
          source={skin.logo}
          style={{ width: size * 0.92, height: size * 0.92 }}
          contentFit="contain"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: tileColor ?? "#FFF2D6",
        },
      ]}
    >
      <AppText style={{ fontSize: size * 0.44, lineHeight: size * 0.56 }}>
        {emoji ?? "🎲"}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  dim: { opacity: 0.35 },
});
