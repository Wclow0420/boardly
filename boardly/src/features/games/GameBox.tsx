// A game's box, as it sits on the shelf or the table: a lid with the
// game's picture and name, and the box's side showing below and to the
// right for depth. The picture is the game's own box art (boxArt), else
// its logo on its backdrop, else its emoji on its colour.

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { getGame } from "@/games/registry";
import { fontFamily } from "@/theme";

export interface GameBoxProps {
  gameKey: string;
  /** The game's name, printed on the lid (omit for a plain lid). */
  name?: string;
  emoji?: string | null;
  tileColor?: string | null;
  width: number;
  /** Lid height ÷ width (1 = square). */
  aspect?: number;
}

/** How far the box's side shows. */
export const BOX_DEPTH = 7;
const DEPTH = BOX_DEPTH;

/** The lid's two colours: the game's backdrop, darkened towards the foot. */
export function lidColors(
  gameKey: string,
  tileColor?: string | null,
): [string, string] {
  const skin = getGame(gameKey)?.skin;
  if (skin) return [skin.backdrop[0], skin.colors.background ?? "#0B1114"];
  return [tileColor ?? "#FFF2D6", shade(tileColor ?? "#FFF2D6")];
}

/** A hex colour a third darker (or lighter, for a dark one: the box's
 *  side must show against the wood either way). */
function shade(hex: string): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const light = ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255) > 240;
  const part = (shift: number) => {
    const c = (n >> shift) & 255;
    return Math.round(light ? c * 0.66 : c + (255 - c) * 0.16);
  };
  return `rgb(${part(16)},${part(8)},${part(0)})`;
}

export function GameBox({
  gameKey,
  name,
  emoji,
  tileColor,
  width,
  aspect = 1,
}: GameBoxProps) {
  const game = getGame(gameKey);
  const Art = game?.boxArt;
  const skin = game?.skin;
  const height = width * aspect;
  const [top, foot] = lidColors(gameKey, tileColor);
  const radius = Math.max(6, width * 0.07);

  return (
    <View style={{ width: width + DEPTH, height: height + DEPTH }}>
      {/* the box's side, peeking out under the lid */}
      <View
        style={[
          styles.side,
          {
            left: DEPTH,
            top: DEPTH,
            width,
            height,
            borderRadius: radius,
            backgroundColor: shade(top),
          },
        ]}
      />
      <LinearGradient
        colors={[top, foot]}
        style={[styles.lid, { width, height, borderRadius: radius }]}
      >
        {Art ? (
          <View style={styles.art}>
            {/* as wide as fits the lid both ways */}
            <Art width={Math.min(width * 0.96, height * 0.92)} />
          </View>
        ) : skin?.logo ? (
          <>
            {skin.backdropImage ? (
              <Image
                source={skin.backdropImage}
                style={[StyleSheet.absoluteFill, styles.backdrop]}
                contentFit="cover"
              />
            ) : null}
            <Image
              source={skin.logo}
              style={{ width: width * 0.84, height: height * 0.62 }}
              contentFit="contain"
            />
          </>
        ) : (
          <AppText
            style={{
              fontSize: Math.min(width * 0.36, height * 0.42),
              lineHeight: Math.min(width * 0.46, height * 0.54),
              marginBottom: name ? height * 0.12 : 0,
            }}
          >
            {emoji ?? "🎲"}
          </AppText>
        )}
        {/* a sheen across the lid's card */}
        <LinearGradient
          colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.6 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {name ? (
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.78)"]}
            style={[
              styles.band,
              { paddingHorizontal: width * 0.06, paddingBottom: width * 0.05 },
            ]}
          >
            <AppText
              numberOfLines={2}
              style={[
                styles.name,
                {
                  fontSize: Math.max(11, width * 0.085),
                  lineHeight: Math.max(14, width * 0.105),
                },
              ]}
            >
              {name}
            </AppText>
          </LinearGradient>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  lid: {
    position: "absolute",
    left: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  art: { alignItems: "center", justifyContent: "center", marginTop: -8 },
  backdrop: { opacity: 0.45 },
  band: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 18 },
  name: { fontFamily: fontFamily.bold, color: "#FFF6E6" },
});
