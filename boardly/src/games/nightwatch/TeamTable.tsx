// Choosing a team, on the stage: everyone stands round the manor's round
// table as their own mascot, three candles burning in its middle. The
// leader taps the ones to send: each is handed a lantern, which floats
// glowing over their head, and a ring of gold lights under their feet.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { useBox } from "@/components/ui";
import { MascotFigure } from "@/features/mascot/MascotStage";
import type { Look } from "@/features/mascot/dress";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { GameText as AppText } from "./GameText";
import { Candle } from "./lantern/Lantern";

export interface Seated {
  seat: number;
  name: string;
  look: Look;
}

/** The round table seen from a little above, w × h: a wooden top in a
 *  gilt rim, its edge below, and a gold candelabrum's foot in the middle. */
function tableArt(w: number, h: number) {
  const cx = w / 2;
  const ry = h * 0.36;
  const rx = w / 2 - 4;
  const cy = ry + 4;
  const edge = h * 0.16;
  const grain = Array.from({ length: 7 }, (_, i) => {
    const k = (i + 1) / 8;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${(rx * k).toFixed(1)}" ry="${(ry * k).toFixed(1)}" fill="none" stroke="#4A2C12" stroke-opacity="0.35" stroke-width="0.9"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="te" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3A2010"/><stop offset="0.4" stop-color="#6A4020"/><stop offset="1" stop-color="#2A1608"/></linearGradient>
<linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF2B8"/><stop offset="0.35" stop-color="#E2B04A"/><stop offset="0.7" stop-color="#9A6B1E"/><stop offset="1" stop-color="#F0CC72"/></linearGradient>
<linearGradient id="woodtop" x1="0.1" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#C89258"/><stop offset="0.5" stop-color="#94623A"/><stop offset="1" stop-color="#5A3618"/></linearGradient>
<radialGradient id="tl" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFC870" stop-opacity="0.45"/><stop offset="1" stop-color="#FFC870" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="${cx}" cy="${cy + edge + 6}" rx="${rx}" ry="${ry}" fill="#000" fill-opacity="0.45"/>
<path d="M${cx - rx} ${cy}V${cy + edge}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + edge}V${cy}Z" fill="url(#te)" stroke="#1E1006" stroke-width="1.2"/>
<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z" fill="url(#woodtop)"/>
${grain}
<path d="M${cx - rx * 0.6} ${cy}A${rx * 0.6} ${ry * 0.6} 0 1 0 ${cx + rx * 0.6} ${cy}A${rx * 0.6} ${ry * 0.6} 0 1 0 ${cx - rx * 0.6} ${cy}Z" fill="url(#tl)"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#tg)" stroke-width="4"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#3A2408" stroke-width="1"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx - 4}" ry="${ry - 4}" fill="none" stroke="#3A2408" stroke-opacity="0.6" stroke-width="0.8"/>
<path d="M${cx - rx * 0.7} ${cy - ry * 0.55}Q${cx - rx * 0.3} ${cy - ry * 0.95} ${cx + rx * 0.1} ${cy - ry * 0.98}" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>`;
}

export function TeamTable({
  people,
  team,
  size,
  busy,
  onToggle,
  paused,
}: {
  people: Seated[];
  team: number[];
  size: number;
  busy: boolean;
  onToggle: (seat: number) => void;
  paused: boolean;
}) {
  const [{ w, h }, onLayout] = useBox();
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  const full = team.length >= size;

  const tw = Math.min(w * 0.7, 300);
  const th = tw * 0.62;
  const cx = w / 2;
  const cy = h * 0.5;
  const table = w > 0 ? bakedSvg("manor-round-table-4", tw, th, () => tableArt(tw, th)) : null;
  // round the table: an ellipse a little wider than it
  const rx = Math.min(w * 0.37, tw * 0.6);
  const ry = th * 0.62;
  const seats = people.map((person, i) => {
    const a = Math.PI / 2 + (i / people.length) * Math.PI * 2;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry + 10;
    const depth = (Math.sin(a) + 1) / 2; // 0 at the back, 1 at the front
    return { ...person, x, y, depth, fig: 52 + depth * 22 };
  });
  const back = seats.filter((s) => s.depth < 0.5);
  const front = seats.filter((s) => s.depth >= 0.5);
  const candleY = cy - th * 0.5 + th * 0.36 + 4;

  const figure = (s: (typeof seats)[number]) => (
    <Guest
      key={s.seat}
      seat={s}
      chosen={team.includes(s.seat)}
      disabled={busy || (full && !team.includes(s.seat))}
      paused={paused}
      onPress={() => onToggle(s.seat)}
    />
  );

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {back.map(figure)}
      {w > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            {table ? <SkImage image={table} x={cx - tw / 2} y={cy - th * 0.5} width={tw} height={th} /> : null}
            {[-18, 0, 18].map((dx, i) => (
              <Candle key={i} x={cx + dx} y={candleY - (i === 1 ? 6 : 0)} clock={clock} done tint={0} seed={i + 4} />
            ))}
          </Canvas>
        </View>
      ) : null}
      {front.map(figure)}
    </View>
  );
}

/** One player at the table; chosen, they hold a lantern up. */
function Guest({
  seat,
  chosen,
  disabled,
  paused,
  onPress,
}: {
  seat: Seated & { x: number; y: number; fig: number };
  chosen: boolean;
  disabled: boolean;
  paused: boolean;
  onPress: () => void;
}) {
  const height = seat.fig * 1.3;
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.set(withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1));
  }, [bob]);
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 4 }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={seat.name}
      accessibilityState={{ selected: chosen, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.guest, { left: seat.x - seat.fig / 2, top: seat.y - height, width: seat.fig, height: height + 18 }]}
    >
      {chosen ? <View style={[styles.ring, { width: seat.fig * 1.1, left: -seat.fig * 0.05, top: height - 9 }]} /> : null}
      <View style={[styles.body, chosen && styles.stepUp]}>
        <MascotFigure look={seat.look} width={seat.fig} seed={String(seat.seat)} paused={paused} />
      </View>
      {chosen ? (
        <Animated.View entering={ZoomIn.duration(260)} style={[styles.lantern, { left: seat.fig / 2 - 15 }]}>
          <Animated.View style={lift}>
            <View style={styles.lanternGlow} />
            <Emblem emoji="🏮" size={30} />
          </Animated.View>
        </Animated.View>
      ) : null}
      <AppText numberOfLines={1} style={[styles.name, { width: seat.fig + 24, left: -12, top: height + 1 }, chosen && styles.nameOn]}>
        {seat.name}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  guest: { position: "absolute" },
  body: {},
  stepUp: { transform: [{ translateY: -4 }] },
  ring: {
    position: "absolute",
    height: 16,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: "#F0CC72",
    backgroundColor: "rgba(255,200,112,0.25)",
  },
  lantern: { position: "absolute", top: -34 },
  lanternGlow: {
    position: "absolute",
    left: -10,
    top: -8,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,180,90,0.35)",
    shadowColor: "#FFB45E",
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  name: {
    position: "absolute",
    textAlign: "center",
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: "#F1E6D2",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  nameOn: { color: "#FFD58A", fontFamily: fontFamily.bold },
});
