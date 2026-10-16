// A lantern alive on the canvas (inside a parent <Canvas>), and the
// light that flows into it. Its art is baked once (art.ts); each frame
// moves it (a slow swing on its chain), and
// draws its light over and under the art: the aura round it, a halo,
// the glow behind the glass, the flame on its candle.

import {
  Circle,
  Group,
  Image as SkImage,
  Oval,
  Picture,
  RadialGradient,
  Rect,
  Shader,
  Skia,
  vec,
  BlendMode,
  type SkPaint,
} from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import {
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import {
  GLASS,
  LANTERN_H,
  LANTERN_W,
  LINK,
  WICK,
  chainStrip,
  lanternBack,
  lanternFront,
  type LanternKind,
} from "./art";
import { AURA, FLAME, LIGHT, rgb } from "./fx";

type SV = SharedValue<number>;

const clamp01 = (v: number) => {
  "worklet";
  return Math.max(0, Math.min(1, v));
};

/** The same pseudo-random number for the same seed, 0..1. */
const rnd = (i: number) => {
  "worklet";
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function Lantern({
  kind,
  x,
  y,
  scale,
  clock,
  lit,
  power,
  shown,
  shift,
  drop = 0,
  seed = 0,
}: {
  kind: LanternKind;
  /** Where its chain hangs from, and how big it is (1 = 120 × 210). */
  x: number;
  y: number;
  scale: number;
  clock: SV;
  /** Its candle: 0 out, 1 burning bright. */
  lit: SV;
  /** What has been poured into it, 0..1: the aura grows with it. */
  power: SV;
  /** 1 as it is; lower dims it (the one not chosen). */
  shown: SV;
  /** Moved aside, in points (coming and going). */
  shift?: SV;
  /** Extra chain above it, in points: it hangs this much lower. */
  drop?: number;
  seed?: number;
}) {
  const light = LIGHT[kind];
  const w = LANTERN_W * scale;
  const h = LANTERN_H * scale;
  const back = bakedSvg(`lantern-back|${kind}`, w, h, () => lanternBack(kind));
  const front = bakedSvg(`lantern-front|${kind}`, w, h, () =>
    lanternFront(kind),
  );
  const links = Math.ceil(drop / scale / LINK) + 1;
  const chain =
    drop > 0 ? bakedSvg(`lantern-chain|${kind}|${links}`, 8 * scale, (links * LINK + 2) * scale, () => chainStrip(kind, links)) : null;
  const sink = drop / scale;
  const aura = useMemo(() => Skia.RuntimeEffect.Make(AURA), []);
  const flame = useMemo(() => Skia.RuntimeEffect.Make(FLAME), []);
  const colors = useMemo(
    () => ({
      flame: light.flame.map(rgb),
      aura: light.aura.map(rgb),
    }),
    [light],
  );

  const transform = useDerivedValue(() => {
    const t = clock.value + seed * 3.1;
    const swing = Math.sin(t * 0.85) * 0.035 + Math.sin(t * 2.3) * 0.008;
    return [
      { translateX: x + (shift ? shift.value : 0) },
      { translateY: y },
      { rotate: swing },
      { scale },
      { translateX: -LANTERN_W / 2 },
      { translateY: sink },
    ];
  });
  const auraUniforms = useDerivedValue(() => ({
    t: clock.value + seed * 5.3,
    c: [GLASS.cx, GLASS.cy - 4],
    R: [GLASS.rx + 16, GLASS.ry + 48],
    power: power.value * shown.value,
    mode: light.mode,
    c0: colors.aura[0],
    c1: colors.aura[1],
    c2: colors.aura[2],
  }));
  const heat = useDerivedValue(() =>
    clamp01(lit.value * 0.85 + power.value * 0.5),
  );
  const flameUniforms = useDerivedValue(() => {
    const k = heat.value;
    return {
      t: clock.value + seed * 2.7,
      foot: [WICK.x, WICK.y],
      size: [10 + 14 * k, 16 + 30 * k],
      c0: colors.flame[0],
      c1: colors.flame[1],
      c2: colors.flame[2],
    };
  });
  const flicker = useDerivedValue(
    () =>
      0.85 +
      0.1 * Math.sin(clock.value * 9.1 + seed) +
      0.05 * Math.sin(clock.value * 23 + seed),
  );
  const haloOpacity = useDerivedValue(
    () =>
      (0.1 + 0.25 * lit.value + 0.55 * power.value) *
      shown.value *
      flicker.value,
  );
  const glowOpacity = useDerivedValue(
    () => clamp01(0.3 + heat.value * 1.2) * shown.value * flicker.value,
  );
  const flameOpacity = useDerivedValue(
    () => clamp01(lit.value * 3) * (0.4 + 0.6 * shown.value),
  );
  const artOpacity = useDerivedValue(() => 0.45 + 0.55 * shown.value);

  return (
    <Group transform={transform}>
      {chain ? (
        <SkImage
          image={chain}
          x={LANTERN_W / 2 - 4}
          y={-sink - 1}
          width={8}
          height={links * LINK + 2}
          opacity={artOpacity}
        />
      ) : null}
      {aura ? (
        <Rect x={-60} y={-10} width={240} height={260} blendMode="screen">
          <Shader source={aura} uniforms={auraUniforms} />
        </Rect>
      ) : null}
      <Circle
        cx={GLASS.cx}
        cy={GLASS.cy}
        r={100}
        opacity={haloOpacity}
        blendMode="screen"
      >
        <RadialGradient
          c={vec(GLASS.cx, GLASS.cy)}
          r={100}
          colors={[`${light.glow}AA`, `${light.glow}00`]}
        />
      </Circle>
      {back ? (
        <SkImage
          image={back}
          x={0}
          y={0}
          width={LANTERN_W}
          height={LANTERN_H}
          opacity={artOpacity}
        />
      ) : null}
      <Oval
        x={GLASS.cx - 30}
        y={GLASS.cy - 36}
        width={60}
        height={80}
        opacity={glowOpacity}
        blendMode="screen"
      >
        <RadialGradient
          c={vec(GLASS.cx, WICK.y - 10)}
          r={46}
          colors={[light.glow, `${light.glow}00`]}
        />
      </Oval>
      {flame ? (
        <Rect
          x={WICK.x - 14}
          y={WICK.y - 50}
          width={28}
          height={50}
          opacity={flameOpacity}
          blendMode="screen"
        >
          <Shader source={flame} uniforms={flameUniforms} />
        </Rect>
      ) : null}
      {front ? (
        <SkImage
          image={front}
          x={0}
          y={0}
          width={LANTERN_W}
          height={LANTERN_H}
          opacity={artOpacity}
        />
      ) : null}
    </Group>
  );
}

/** Motes of light streaming from a band along the bottom (`from`) up into
 *  a point (`to`), more of them the more `flow` there is: the power
 *  being poured into a lantern. One picture a frame. */
export function Motes({
  clock,
  flow,
  from,
  to,
  color,
  count = 36,
}: {
  clock: SV;
  flow: SV;
  from: { x0: number; x1: number; y: number };
  to: { x: number; y: number };
  color: string;
  count?: number;
}) {
  const paint = useMemo<SkPaint>(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(color));
    p.setBlendMode(BlendMode.Plus);
    p.setAntiAlias(true);
    return p;
  }, [color]);
  const core = useMemo<SkPaint>(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color("#FFFFFF"));
    p.setAntiAlias(true);
    return p;
  }, []);
  const picture = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(-2000, -2000, 4000, 4000));
    const f = flow.value;
    if (f > 0.01) {
      const t = clock.value;
      for (let i = 0; i < count; i++) {
        // the first ones always flow; more join as the power rises
        if (rnd(i + 7) > f * 1.15) continue;
        const life = 0.9 + rnd(i) * 0.7;
        const p = (((t / life + rnd(i + 3)) % 1) + 1) % 1;
        const e = p * p;
        const sx = from.x0 + (from.x1 - from.x0) * rnd(i + 11);
        const bend = (rnd(i + 5) - 0.5) * 160;
        const mx = (sx + to.x) / 2 + bend;
        const my = (from.y + to.y) / 2;
        const u = 1 - e;
        const px = u * u * sx + 2 * u * e * mx + e * e * to.x;
        const py = u * u * from.y + 2 * u * e * my + e * e * to.y;
        const a = Math.sin(Math.PI * p) * (0.5 + 0.5 * f);
        const r = (1.4 + rnd(i + 9) * 2.2) * (1 - 0.5 * e);
        paint.setAlphaf(a * 0.55);
        c.drawCircle(px, py, r * 2.6, paint);
        core.setAlphaf(a);
        c.drawCircle(px, py, r * 0.8, core);
      }
    }
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

/** A burst of light at a point: a ring flying out and fading, as `go`
 *  runs 0..1. */
export function Burst({
  x,
  y,
  go,
  color,
  size = 160,
}: {
  x: number;
  y: number;
  go: SV;
  color: string;
  size?: number;
}) {
  const r = useDerivedValue(() => 10 + size * go.value);
  const opacity = useDerivedValue(() =>
    go.value > 0 && go.value < 1 ? Math.pow(1 - go.value, 1.5) : 0,
  );
  return (
    <Circle cx={x} cy={y} r={r} opacity={opacity} blendMode="screen">
      <RadialGradient
        c={vec(x, y)}
        r={r}
        colors={[`${color}00`, `${color}00`, `${color}EE`, `${color}00`]}
        positions={[0, 0.55, 0.85, 1]}
      />
    </Circle>
  );
}

const CANDLE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="40" viewBox="0 0 24 40">
<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF2B8"/><stop offset="0.35" stop-color="#E2B04A"/><stop offset="0.7" stop-color="#9A6B1E"/><stop offset="1" stop-color="#F0CC72"/></linearGradient>
<linearGradient id="ci" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#F4EEDF"/><stop offset="1" stop-color="#D8CCB0"/></linearGradient></defs>
<path d="M8 10Q8 7.5 10 8.2Q11 12 12 8.2H16V31H8Z" fill="url(#ci)" stroke="#3A2408" stroke-width="0.9"/>
<path d="M11.5 8.6H12.5V5.6H11.5Z" fill="#2A1A0A"/>
<path d="M3 31H21L19 35H5Z" fill="url(#cg)" stroke="#3A2408" stroke-width="1"/>
<path d="M7 35H17V38H7Z" fill="url(#cg)" stroke="#3A2408" stroke-width="0.9"/>
<path d="M5 32.5H15" stroke="#fff" stroke-opacity="0.8" stroke-width="0.8" stroke-linecap="round"/>
</svg>`;

/** A candle in its gold cup, one per player round the lantern: it
 *  lights (after `delay` ms) once that player is `done`, and its flame
 *  turns green or red (`tint` 1 or -1) when their vote is shown. */
export function Candle({
  x,
  y,
  clock,
  done,
  tint: tintTo,
  delay = 0,
  seed,
}: {
  x: number;
  y: number;
  clock: SV;
  done: boolean;
  tint: number;
  delay?: number;
  seed: number;
}) {
  const lit = useSharedValue(done ? 1 : 0);
  const tint = useSharedValue(tintTo);
  useEffect(() => {
    lit.set(withDelay(delay, withTiming(done ? 1 : 0, { duration: 500 })));
  }, [done, delay, lit]);
  useEffect(() => {
    tint.set(withDelay(delay, withTiming(tintTo, { duration: 600 })));
  }, [tintTo, delay, tint]);
  const image = bakedSvg("manor-candle", 24, 40, () => CANDLE);
  const flame = useMemo(() => Skia.RuntimeEffect.Make(FLAME), []);
  // gold, and what it turns to as the vote shows: green or red
  const tones = useMemo(
    () => ({
      gold: ["#A8481A", "#FFB23A", "#FFF6D8"].map(rgb),
      green: ["#0E6A2A", "#42E070", "#F0FFE0"].map(rgb),
      red: ["#2A0006", "#E0203A", "#FFC8C0"].map(rgb),
    }),
    [],
  );
  const uniforms = useDerivedValue(() => {
    const k = tint.value;
    const to = k >= 0 ? tones.green : tones.red;
    const s = Math.abs(k);
    const mix = (i: number) =>
      tones.gold[i].map((v, j) => v + (to[i][j] - v) * s);
    return {
      t: clock.value + seed * 1.9,
      foot: [x, y - 32.5],
      size: [7 + 2 * s, 13 + 5 * s],
      c0: mix(0),
      c1: mix(1),
      c2: mix(2),
    };
  });
  const breath = useDerivedValue(
    () => lit.value * (0.5 + 0.12 * Math.sin(clock.value * 7 + seed)),
  );
  const gold = useDerivedValue(() => breath.value * (1 - Math.abs(tint.value)));
  const green = useDerivedValue(() => breath.value * Math.max(0, tint.value));
  const red = useDerivedValue(() => breath.value * Math.max(0, -tint.value));
  const c = vec(x, y - 36);
  return (
    <Group>
      <Circle cx={x} cy={y - 36} r={22} opacity={gold} blendMode="screen">
        <RadialGradient c={c} r={22} colors={["#FFC870", "#FFC87000"]} />
      </Circle>
      <Circle cx={x} cy={y - 36} r={24} opacity={green} blendMode="screen">
        <RadialGradient c={c} r={24} colors={["#6CFF8E", "#6CFF8E00"]} />
      </Circle>
      <Circle cx={x} cy={y - 36} r={24} opacity={red} blendMode="screen">
        <RadialGradient c={c} r={24} colors={["#FF2E44", "#FF2E4400"]} />
      </Circle>
      {image ? (
        <SkImage image={image} x={x - 12} y={y - 40} width={24} height={40} />
      ) : null}
      {flame ? (
        <Rect
          x={x - 8}
          y={y - 54}
          width={16}
          height={22}
          opacity={lit}
          blendMode="screen"
        >
          <Shader source={flame} uniforms={uniforms} />
        </Rect>
      ) : null}
    </Group>
  );
}
