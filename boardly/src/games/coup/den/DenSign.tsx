// Hustle's header, drawn like a border (art in denArt.ts, baked once):
// the den's eave with its signboard (whose turn it is, and how the night
// stands), red lanterns swaying at the ends and breathing light, and the
// rack of mahjong tiles, one per player — a crimson pip per hidden card,
// the cash under them, turned to the jade back once they're out — the
// tile of whoever's turn it is raised in a pulse of gold. One canvas, one
// clock: the still parts are images, the lanterns and the glow move.

import { Canvas, Circle, Group, Image as SkImage, RadialGradient, vec } from "@shopify/react-native-skia";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import { PlayerName } from "@/features/game/stage/PlayerName";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { LANTERN_H, LANTERN_W, TILE_H, TILE_W, denArt, denLayout, lanternArt, tileArt, type TileKind } from "./denArt";

export interface DenTile {
  seat: number;
  name: string;
  /** Cards still face down (0: out). */
  hidden: number;
  coins: number;
}

export function denHeight(width: number, top: number, n: number) {
  return denLayout(width, top, n).h;
}

export const DenSign = memo(function DenSign({
  width,
  top,
  title,
  subtitle,
  tiles,
  turn,
  paused = false,
}: {
  width: number;
  top: number;
  title: string;
  subtitle?: string;
  tiles: DenTile[];
  /** Whose tile is raised and lit; null for none. */
  turn: number | null;
  paused?: boolean;
}) {
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const L = denLayout(width, top, tiles.length);
  const den = bakedSvg(`hustle-den|${tiles.length}|${top}`, width, L.h, () => denArt(L));
  const lantern = bakedSvg("hustle-lantern", LANTERN_W, LANTERN_H, lanternArt);
  const kinds: Record<TileKind, ReturnType<typeof bakedSvg>> = {
    two: bakedSvg("hustle-tile|two", TILE_W, TILE_H, () => tileArt("two")),
    one: bakedSvg("hustle-tile|one", TILE_W, TILE_H, () => tileArt("one")),
    out: bakedSvg("hustle-tile|out", TILE_W, TILE_H, () => tileArt("out")),
  };
  const kindOf = (tile: DenTile): TileKind => (tile.hidden >= 2 ? "two" : tile.hidden === 1 ? "one" : "out");
  const at = tiles.findIndex((tile) => tile.seat === turn);
  const lit = at >= 0 ? L.tiles[at] : null;

  // the lanterns sway on their cords, out of step; their light breathes
  const sways = useDerivedValue(() =>
    L.lanterns.map((l, i) => [
      { translateX: l.x },
      { translateY: l.y },
      { rotate: 0.05 * Math.sin(clock.value * 0.9 + i * 2.1) + 0.02 * Math.sin(clock.value * 2.3 + i) },
      { translateX: -LANTERN_W / 2 },
    ]),
  );
  const left = useDerivedValue(() => sways.value[0]);
  const right = useDerivedValue(() => sways.value[1]);
  const glow = useDerivedValue(() => 0.5 + 0.16 * Math.sin(clock.value * 1.6) + 0.06 * Math.sin(clock.value * 6.1));
  const pulse = useDerivedValue(() => 0.55 + 0.3 * Math.sin(clock.value * 2.4));

  return (
    <View style={{ width, height: L.h }} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {den ? <SkImage image={den} x={0} y={0} width={width} height={L.h} /> : null}
        {L.lanterns.map((l, i) => (
          <Circle key={i} cx={l.x} cy={l.y + 34} r={34} opacity={glow} blendMode="screen">
            <RadialGradient c={vec(l.x, l.y + 34)} r={34} colors={["#FF8A4Acc", "#FF5A2A00"]} />
          </Circle>
        ))}
        {lantern ? (
          <>
            <Group transform={left}>
              <SkImage image={lantern} x={0} y={0} width={LANTERN_W} height={LANTERN_H} />
            </Group>
            <Group transform={right}>
              <SkImage image={lantern} x={0} y={0} width={LANTERN_W} height={LANTERN_H} />
            </Group>
          </>
        ) : null}
        {lit ? (
          <Circle cx={lit.x + TILE_W / 2} cy={lit.y + TILE_H / 2 - 3} r={30} opacity={pulse} blendMode="screen">
            <RadialGradient c={vec(lit.x + TILE_W / 2, lit.y + TILE_H / 2 - 3)} r={30} colors={["#FFD27Aee", "#FFB23A00"]} />
          </Circle>
        ) : null}
        {tiles.map((tile, i) => {
          const image = kinds[kindOf(tile)];
          const p = L.tiles[i];
          return image ? <SkImage key={tile.seat} image={image} x={p.x} y={p.y - (i === at ? 4 : 0)} width={TILE_W} height={TILE_H} /> : null;
        })}
      </Canvas>
      <View style={[styles.sign, { left: L.sign.x + 10, top: L.sign.y + 6, width: L.sign.w - 20, height: L.sign.h - 12 }]}>
        <AppText style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {tiles.map((tile, i) => {
        const p = L.tiles[i];
        const up = i === at ? 4 : 0;
        return (
          <View key={tile.seat}>
            {tile.hidden > 0 ? (
              <AppText style={[styles.cash, { left: p.x, top: p.y + 18 - up, width: TILE_W }]} numberOfLines={1}>
                {`$${tile.coins}`}
              </AppText>
            ) : null}
            <PlayerName
              name={tile.name}
              style={[
                styles.name,
                { left: p.x + TILE_W / 2 - p.slot / 2, top: p.y + TILE_H + 3, width: p.slot },
                i === at && styles.nameLit,
                tile.hidden === 0 && styles.nameOut,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
});

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  sign: { position: "absolute", alignItems: "center", justifyContent: "center" },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 1.6,
    color: "#FFE7A8",
    textTransform: "uppercase",
    ...shadow,
  },
  subtitle: { fontFamily: fontFamily.semiBold, fontSize: 10.5, lineHeight: 13, color: "#FFD0C0", ...shadow },
  cash: {
    position: "absolute",
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    color: "#3A2408",
  },
  name: {
    position: "absolute",
    textAlign: "center",
    fontFamily: fontFamily.semiBold,
    fontSize: 9.5,
    lineHeight: 12,
    color: "#E8D8C0",
    ...shadow,
  },
  nameLit: { color: "#FFD27A", fontFamily: fontFamily.bold },
  nameOut: { color: "#8A8070", textDecorationLine: "line-through" },
});
