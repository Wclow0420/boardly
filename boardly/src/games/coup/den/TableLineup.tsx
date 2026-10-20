// Everyone at the table on the stage (the shared StageLineup), with what
// each has laid at their feet under the name plate: their two cards —
// face down, or turned up once lost — and their cash. The small cards
// are baked images, all drawn on one canvas.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, type SharedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { AppText, useBox } from "@/components/ui";
import { StageLineup, placeAll, type Light, type Plate, type Standing } from "@/features/game/stage/StageLineup";
import { BOX } from "@/features/mascot/rig";
import { fontFamily } from "@/theme";
import { CARD_RATIO, miniKey, miniSvg } from "../cards";
import type { CoupPlayer, Role } from "../logic";

const MINI = 14;
const PAD = 3;

/** A small card at (x, y), its face or its back. */
export function miniImage(role: Role | null, width: number) {
  const s = width / 100;
  return bakedSvg(miniKey(role), (100 + 2 * PAD) * s, (140 + 2 * PAD) * s, () => miniSvg(role));
}

export const TableLineup = memo(function TableLineup({
  people,
  table,
  lights,
  plates,
  crown = null,
  selectable = [],
  onPick,
  hold,
  aim = null,
  struck = null,
  bare = false,
  paused,
}: {
  people: Standing[];
  /** Each seat's cards and cash. */
  table: CoupPlayer[];
  lights: Record<number, Light>;
  plates?: Record<number, Plate>;
  crown?: number | null;
  selectable?: number[];
  onPick?: (seat: number) => void;
  hold?: SharedValue<number>;
  aim?: number | null;
  struck?: number | null;
  /** Just the players, nothing at their feet. */
  bare?: boolean;
  paused: boolean;
}) {
  const [{ w, h }, onLayout] = useBox();
  const cast = people.map((p) => p.seat).join(",");
  const places = useMemo(
    () => (w > 0 ? placeAll(people, w, h) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `cast` stands for `people`
    [cast, w, h],
  );
  const s = MINI / 100;
  const cardH = MINI * CARD_RATIO;
  // what each has laid down: at the feet of the front row, held up over
  // the heads of the back row (whose feet are behind the front row)
  const two = places.length > 5;
  const rowY = (p: (typeof places)[number]) =>
    two && p.order < 10 ? p.y - (p.size * BOX[1]) / BOX[0] - cardH - 16 : p.y + 19;
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <StageLineup
        people={people}
        lights={lights}
        plates={plates}
        crown={crown}
        selectable={selectable}
        onPick={onPick}
        hold={hold}
        aim={aim}
        struck={struck}
        paused={paused}
      />
      {places.length > 0 && !bare ? (
        <Animated.View entering={FadeIn.delay(900 + places.length * 120).duration(400)} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            {places.flatMap((p) => {
              const cards = table[p.seat]?.cards ?? [];
              return cards.map((card, i) => {
                const role = card.revealed ? card.role : null;
                const image = miniImage(role, MINI);
                const x = p.x - 22 + i * (MINI + 2);
                const y = rowY(p);
                return image ? (
                  <SkImage
                    key={`${p.seat}-${i}`}
                    image={image}
                    x={x - PAD * s}
                    y={y - PAD * s}
                    width={(100 + 2 * PAD) * s}
                    height={(140 + 2 * PAD) * s}
                    opacity={card.revealed ? 0.75 : 1}
                  />
                ) : null;
              });
            })}
          </Canvas>
          {places.map((p) => {
            const info = table[p.seat];
            return info?.alive ? (
              <AppText key={p.seat} style={[styles.cash, { left: p.x + 9, top: rowY(p) + cardH / 2 - 8 }]} numberOfLines={1}>
                {`🪙${info.coins}`}
              </AppText>
            ) : null;
          })}
        </Animated.View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  cash: {
    position: "absolute",
    fontFamily: fontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
    color: "#FFE7A8",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
