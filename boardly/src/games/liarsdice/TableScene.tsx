// The table, while the calls go round: everyone on the stage under their
// lamps (StageLineup), a leather dice cup turned down at each player's
// feet — their dice hidden under it — and the call on the table chalked
// big on the slate hanging over them. Whoever the table waits on stands
// in full light, the one who made the call wears a seal on their plate,
// and a player knocked out stands in the dark with no cup.

import { Canvas, Group, Image as SkImage } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Easing, useDerivedValue, useSharedValue, withSequence, withTiming, type SharedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { AppText, useBox } from "@/components/ui";
import { StageLineup, type Light, type Plate, type Standing } from "@/features/game/stage/StageLineup";
import { fontFamily } from "@/theme";
import { cupArt } from "./art";
import { Call, Slate } from "./pieces";
import type { Bid } from "./logic";

/** Where StageLineup stands each player on a stage w × h (the same sums
 *  as its own: one row up to five, two staggered rows past that), so a
 *  cup can be set at their feet. */
export function standingPlaces(n: number, w: number, h: number) {
  const two = n > 5;
  const first = two ? Math.ceil(n / 2) : n;
  const across = w * 0.92;
  return Array.from({ length: n }, (_, k) => {
    const r = two && k >= first ? 1 : 0;
    const len = two ? (r === 0 ? first : n - first) : n;
    const i = r === 0 ? k : k - first;
    const back = two && r === 0;
    const size = back ? Math.min(54, across / (len + 1.2)) : Math.min(84, across / (len + 0.4));
    const y = back ? h - 158 : h - 60;
    const x = w * 0.04 + (back ? ((i + 1) * across) / (len + 1) : ((i + 0.5) * across) / len);
    return { x, y, size };
  });
}

/** A cup shaken on its own: a little rattle when the round is new. */
function Cup({ x, y, w, shake, i }: { x: number; y: number; w: number; shake: SharedValue<number>; i: number }) {
  const h = w * 1.15;
  const image = bakedSvg("ld-cup", w, h, () => cupArt(w));
  const transform = useDerivedValue(() => {
    const k = shake.value;
    const a = Math.sin(k * Math.PI * 8 + i) * 0.18 * (1 - k);
    return [{ translateX: x }, { translateY: y + h }, { rotate: a }, { translateX: -w / 2 }, { translateY: -h }];
  });
  return image ? (
    <Group transform={transform}>
      <SkImage image={image} x={0} y={0} width={w} height={h} />
    </Group>
  ) : null;
}

export function TableScene({
  people,
  lights,
  bid,
  heading,
  out,
  round,
  hold,
  aim = null,
  paused,
}: {
  people: Standing[];
  lights: Record<number, Light>;
  /** The call on the table. */
  bid: Bid | null;
  /** The slate's first line (who called, or who opens). */
  heading: string;
  /** Seats knocked out (no cup). */
  out: number[];
  /** The round: cups rattle as a new one begins. */
  round: number;
  hold?: SharedValue<number>;
  aim?: number | null;
  paused: boolean;
}) {
  const [{ w, h }, onLayout] = useBox();
  const places = w > 0 ? standingPlaces(people.length, w, h) : [];
  const shake = useSharedValue(0);
  useEffect(() => {
    shake.set(0);
    shake.set(withSequence(withTiming(0, { duration: 600 }), withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })));
  }, [round, shake]);
  const plates: Record<number, Plate> = bid ? { [bid.seat]: "voted" } : {};
  const slateW = Math.min(w - 24, 300);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {w > 0 ? (
        <>
          <StageLineup people={people} lights={lights} plates={plates} hold={hold} aim={aim} paused={paused} />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFill}>
              {people.map((p, k) =>
                out.includes(p.seat) ? null : (
                  <Cup
                    key={p.seat}
                    i={k}
                    shake={shake}
                    x={places[k].x + places[k].size * 0.5}
                    y={places[k].y - places[k].size * 0.36 * 1.15 + 2}
                    w={places[k].size * 0.36}
                  />
                ),
              )}
            </Canvas>
          </View>
          <View style={[styles.slate, { top: 46 }]} pointerEvents="none">
            <Slate width={slateW} height={96}>
              <AppText style={styles.heading} numberOfLines={1}>
                {heading}
              </AppText>
              {bid ? <Call quantity={bid.quantity} face={bid.face} zhai={bid.zhai} size={40} /> : null}
            </Slate>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slate: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  heading: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: "#E8D2B4",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
});
