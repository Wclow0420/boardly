// Engraved trim for the app's own pieces: metal bezels, gold scrolls and
// jewels, drawn as still SVG sized to the piece they dress (see
// engraved/trim.ts for the shapes). Nothing here moves, so it costs
// nothing per frame.

import { memo, useCallback, useEffect, useId, useState } from "react";
import { LinearGradient as Fade } from "expo-linear-gradient";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

import { INKS, JEWELS, MATERIALS, type Jewel } from "@/components/engraved/shapes";
import { bezel, cornerScrolls } from "@/components/engraved/trim";
import { useOnScreen } from "@/hooks/useOnScreen";

export type Metal = "gold" | "silver";

/** The size a view was laid out at, and the handler that keeps it. */
export function useBox() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((b) => (b.w === width && b.h === height ? b : { w: width, h: height }));
  }, []);
  return [box, onLayout] as const;
}

/** An id that's safe in url(#…). */
export function useSvgId() {
  return `t${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

export function Gradient({
  id,
  colors,
  vertical = false,
  radial = false,
}: {
  id: string;
  colors: readonly string[];
  vertical?: boolean;
  radial?: boolean;
}) {
  const stops = colors.map((color, i) => (
    <Stop key={i} offset={i / (colors.length - 1)} stopColor={color} />
  ));
  return radial ? (
    <RadialGradient id={id} cx="0.35" cy="0.3" r="0.8">
      {stops}
    </RadialGradient>
  ) : (
    <LinearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2="1">
      {stops}
    </LinearGradient>
  );
}

/** A metal bezel `t` thick, w × h at x, y with corners `r`: its rim,
 *  the groove along it, one shine and the ink. With `face`, the face
 *  inside is filled too (top to bottom); with `shadow`, it casts one. */
export function Bezel({
  w,
  h,
  r,
  t,
  x = 0,
  y = 0,
  metal = "gold",
  face,
  shadow = 0,
}: {
  w: number;
  h: number;
  r: number;
  t: number;
  x?: number;
  y?: number;
  metal?: Metal;
  face?: readonly string[];
  shadow?: number;
}) {
  const id = useSvgId();
  const b = bezel(w, h, r, t, x, y);
  const { ink, vein } = INKS[metal];
  return (
    <G>
      <Defs>
        <Gradient id={`${id}r`} colors={MATERIALS[metal]} />
        {face ? <Gradient id={`${id}f`} colors={face} vertical /> : null}
      </Defs>
      {shadow ? (
        <Path
          d={b.outer}
          fill="#000000"
          opacity={0.35}
          transform={`translate(0 ${shadow})`}
        />
      ) : null}
      {face ? <Path d={b.face} fill={`url(#${id}f)`} /> : null}
      <Path d={b.rim} fillRule="evenodd" fill={`url(#${id}r)`} />
      <Path d={b.groove} fill="none" stroke={vein} strokeWidth={0.55} strokeOpacity={0.85} />
      <Path
        d={b.shine}
        stroke="#FFFFFF"
        strokeWidth={0.9}
        strokeOpacity={0.9}
        strokeLinecap="round"
      />
      <Path d={b.outer} fill="none" stroke={ink} strokeWidth={1.1} />
      <Path d={b.face} fill="none" stroke={ink} strokeWidth={0.8} />
    </G>
  );
}

/** Engraved pieces (scrolls: an outline and its vein) in a metal. */
export function MetalParts({
  parts,
  metal = "gold",
  ink = 0.9,
}: {
  parts: { outline: string; vein: string }[];
  metal?: Metal;
  ink?: number;
}) {
  const id = useSvgId();
  const { ink: inkColor, vein } = INKS[metal];
  return (
    <G>
      <Defs>
        <Gradient id={id} colors={MATERIALS[metal]} />
      </Defs>
      {parts.map((part, i) => (
        <G key={i}>
          <Path d={part.outline} fill={`url(#${id})`} stroke={inkColor} strokeWidth={ink} />
          <Path d={part.vein} fill="none" stroke={vein} strokeWidth={0.45} />
        </G>
      ))}
    </G>
  );
}

/** A cabochon in a gold collet. */
export function SetJewel({
  x,
  y,
  r,
  jewel = "sapphire",
}: {
  x: number;
  y: number;
  r: number;
  jewel?: Jewel;
}) {
  const id = useSvgId();
  const ink = INKS.gold.ink;
  return (
    <G>
      <Defs>
        <Gradient id={`${id}g`} colors={MATERIALS.gold} />
        <Gradient id={`${id}j`} colors={JEWELS[jewel]} radial />
      </Defs>
      <Circle cx={x} cy={y} r={r + 1.5} fill={`url(#${id}g)`} stroke={ink} strokeWidth={0.8} />
      <Circle cx={x} cy={y} r={r} fill={`url(#${id}j)`} stroke={ink} strokeWidth={0.6} />
      <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#FFFFFF" opacity={0.9} />
    </G>
  );
}

/** A bezel laid over a whole piece (a button, a pill, a card), sized to
 *  it: put it after the piece's fill and before its content. */
export const BezelOverlay = memo(function BezelOverlay({
  r,
  t = 3.5,
  metal = "gold",
  ornate = false,
}: {
  r: number;
  t?: number;
  metal?: Metal;
  /** Gold scrolls in the corners. */
  ornate?: boolean;
}) {
  const [{ w, h }, onLayout] = useBox();
  const corner = ornate ? cornerScrolls(15) : null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Bezel w={w} h={h} r={r} t={t} metal={metal} />
          {corner ? (
            <>
              <MetalParts parts={corner} metal={metal} />
              <G transform={`translate(${w} 0) scale(-1 1)`}>
                <MetalParts parts={corner} metal={metal} />
              </G>
              <G transform={`translate(0 ${h}) scale(1 -1)`}>
                <MetalParts parts={corner} metal={metal} />
              </G>
              <G transform={`translate(${w} ${h}) scale(-1 -1)`}>
                <MetalParts parts={corner} metal={metal} />
              </G>
            </>
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
});

/** How long one sweep takes to cross, of each cycle. */
const CROSS = 0.22;

/** A band of light that crosses a piece every `every` seconds, like the
 *  sweep across a border's metal. On the native thread (a transform, no
 *  drawing), only while its screen is showing and motion is allowed.
 *  Put it over the piece, clipped to its corners `r`. */
export function LightSweep({
  r,
  every = 4.5,
  phase,
}: {
  r: number;
  every?: number;
  /** Where in the cycle it starts (0..1), so neighbours don't flash at
   *  once. */
  phase?: number;
}) {
  const [{ w, h }, onLayout] = useBox();
  const still = useReducedMotion();
  const onScreen = useOnScreen();
  const [start] = useState(() => phase ?? Math.random());
  const cycle = useSharedValue(start);
  const moving = !still && onScreen && w > 0;
  useEffect(() => {
    if (!moving) return;
    cycle.value = start;
    cycle.value = withRepeat(
      withTiming(start + 1, { duration: every * 1000, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(cycle);
  }, [moving, every, start, cycle]);
  const band = Math.max(18, h * 0.7);
  const style = useAnimatedStyle(() => {
    const p = (cycle.value % 1) / CROSS;
    const x = p < 1 ? -band * 2 + p * (w + band * 3) : w + band * 2;
    return { transform: [{ translateX: x }, { rotate: "22deg" }] };
  });
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: r, overflow: "hidden" }]}
      onLayout={onLayout}
    >
      {moving ? (
        <Animated.View
          style={[{ position: "absolute", top: -h, width: band, height: h * 3 }, style]}
        >
          <Fade
            colors={["#FFFFFF00", "#FFFFFF70", "#FFFFFF00"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
