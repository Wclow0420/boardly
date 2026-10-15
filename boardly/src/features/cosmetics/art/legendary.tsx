// Legendary art borders: the lion dance, the phoenix, the fire dragon.

import {
  BlurMask,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import {
  Band,
  Flicker,
  Glint,
  Halo,
  Sparks,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

// ── Phoenix: burning wings beat behind, a crested head on top ────────

const FEATHER = (len: number, w: number) =>
  `M0 0C${w} ${-len * 0.25} ${w * 0.8} ${-len * 0.75} 0 ${-len}C${-w * 0.8} ${-len * 0.75} ${-w} ${-len * 0.25} 0 0z`;

function Wing({ t, side }: { t: Clock; side: 1 | -1 }) {
  const feathers = useMemo(
    () =>
      Array.from({ length: 7 }, (_, k) => ({
        // fanned out sideways and up from the shoulder
        rot: side * (0.35 + k * 0.2),
        len: 34 + k * 4 - (k > 4 ? (k - 4) * 8 : 0),
        w: 7,
      })),
    [side],
  );
  const beat = useDerivedValue(() => [
    { translateX: side * 34 },
    { translateY: -14 },
    { rotate: side * Math.sin(t.value * 2.2) * 0.16 },
    { scale: 1.3 },
  ]);
  return (
    <Group transform={beat}>
      {feathers.map((f, k) => (
        <Group key={k} transform={[{ rotate: f.rot }]}>
          <Path path={FEATHER(f.len, f.w)}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, -f.len)}
              colors={["#B3160C", "#FF5A1F", "#FFC93C"]}
            />
          </Path>
          <Path
            path={`M0 0L0 ${-f.len * 0.9}`}
            style="stroke"
            strokeWidth={0.8}
            color="#FFE59A99"
          />
          <Flicker
            t={t}
            x={0}
            y={-f.len + 3}
            size={7}
            phase={k * 1.3 + side}
            color="#FFB347"
          />
        </Group>
      ))}
    </Group>
  );
}

function Tail({ t }: { t: Clock }) {
  const sway = useDerivedValue(() => [
    { translateY: 46 },
    { rotate: Math.sin(t.value * 1.5) * 0.08 },
  ]);
  return (
    <Group transform={sway}>
      {[-0.45, -0.15, 0.15, 0.45].map((r, k) => (
        <Group key={k} transform={[{ rotate: Math.PI + r }]}>
          <Path path={FEATHER(38 - Math.abs(r) * 18, 6)}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, -38)}
              colors={["#B3160C", "#FF7A1F", "#FFE08A"]}
            />
          </Path>
        </Group>
      ))}
    </Group>
  );
}

function PhoenixHead({ t }: { t: Clock }) {
  const bob = useDerivedValue(() => [
    { translateY: -60 + Math.sin(t.value * 2.2) * 1.5 },
  ]);
  const eye = useDerivedValue(() => 0.6 + 0.4 * Math.sin(t.value * 4));
  return (
    <Group transform={bob}>
      {/* crest of three flame feathers */}
      {[-0.4, 0, 0.4].map((r, k) => (
        <Group key={k} transform={[{ translateY: -8 }, { rotate: r }]}>
          <Path path={FEATHER(18 - Math.abs(r) * 8, 4.5)}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, -18)}
              colors={["#FF5A1F", "#FFE08A"]}
            />
          </Path>
        </Group>
      ))}
      <Circle cx={0} cy={0} r={10}>
        <RadialGradient
          c={vec(-3, -3)}
          r={14}
          colors={["#FFD15A", "#FF6A1F", "#B3160C"]}
        />
      </Circle>
      <Path path="M-3 3L0 13L3 3z" color="#F6C64A" />
      <Circle cx={-4} cy={-1.5} r={3} color="#FFEFA8" opacity={eye}>
        <BlurMask blur={2.5} style="normal" />
      </Circle>
      <Circle cx={-4} cy={-1.5} r={1.3} color="#2A0A04" />
      <Circle cx={4} cy={-1.5} r={3} color="#FFEFA8" opacity={eye}>
        <BlurMask blur={2.5} style="normal" />
      </Circle>
      <Circle cx={4} cy={-1.5} r={1.3} color="#2A0A04" />
    </Group>
  );
}

const Phoenix: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={92} color="#FF6A1F" opacity={0.6} />
      <Wing t={t} side={-1} />
      <Wing t={t} side={1} />
      <Tail t={t} />
      <Sparks
        t={t}
        count={10}
        from={-Math.PI}
        to={0}
        r={70}
        rise={26}
        seed={4}
      />
    </Group>
  ),
  front: ({ t }) => (
    <Group>
      <Band
        r={53.5}
        width={6}
        colors={["#FFE08A", "#F2A11F", "#B3460C"]}
        rim="#7A2A0A"
      />
      <PhoenixHead t={t} />
    </Group>
  ),
};

// ── Fire Dragon: coiled round the avatar, eyes burning ───────────────

/** The head sits up and to the right; the body runs on clockwise from
 *  it, round the avatar, to the tail at the top left. */
const HEAD_A = -Math.PI * 0.42;
const TAIL_A = HEAD_A + TAU * 0.95;
const BODY_R = 70;

/** The body's line: it winds in and out as it goes round. */
const bodyAt = (a: number) => BODY_R + 6 * Math.sin((a - HEAD_A) * 5);
const STEPS = 64;
const BODY_POINTS = Array.from({ length: STEPS + 1 }, (_, k) => {
  const a = HEAD_A + 0.3 + ((TAIL_A - HEAD_A - 0.3) * k) / STEPS;
  return { a, ...polar(a, bodyAt(a)) };
});
/** Thick at the neck, thinning to the tail. */
const widthAt = (k: number) => 18 * Math.sin((Math.PI * k) / STEPS) ** 0.7 + 3;

/** The body as runs of segments, each run one width, so it tapers. */
const RUNS = Array.from({ length: 8 }, (_, run) => {
  const from = (run * STEPS) / 8;
  const to = ((run + 1) * STEPS) / 8;
  let d = "";
  for (let k = from; k <= to; k++) {
    const p = BODY_POINTS[k];
    d += `${k === from ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return { d, w: widthAt((from + to) / 2) };
});

/** A spine every few steps, standing out from the body's outer side. */
const SPINES = BODY_POINTS.filter((_, k) => k % 4 === 2 && k < STEPS - 3)
  .map(({ a }, n) => {
    const k = n * 4 + 2;
    const w = widthAt(k) / 2;
    const r = bodyAt(a) + w - 1;
    const h = 4 + w * 0.6;
    const p0 = polar(a - 0.045, r);
    const p1 = polar(a + 0.03, r + h);
    const p2 = polar(a + 0.07, r);
    return `M${p0.x} ${p0.y}L${p1.x} ${p1.y}L${p2.x} ${p2.y}z`;
  })
  .join("");

/** Belly: a pale line along the inner side. */
const BELLY = BODY_POINTS.map((p, k) => {
  const q = polar(p.a, bodyAt(p.a) - widthAt(k) * 0.3);
  return `${k ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
}).join("");

const TAIL_END = BODY_POINTS[STEPS];

/** Golden claws gripping the ring. */
const CLAWS = [0.28, 0.62].map((f) => {
  const k = Math.round(f * STEPS);
  const { a } = BODY_POINTS[k];
  const base = polar(a, bodyAt(a) - widthAt(k) * 0.45);
  return { x: base.x, y: base.y, rot: a - Math.PI / 2 };
});

function DragonBody({ t }: { t: Clock }) {
  // a gleam running along the scales, head to tail
  const phase = useDerivedValue(() => -t.value * 26);
  const breathe = useDerivedValue(() => 0.5 + 0.2 * Math.sin(t.value * 1.6));
  return (
    <Group>
      <Halo r={94} color="#FF3B1F" opacity={breathe} />
      <Path path={SPINES} color="#4A0805" />
      {RUNS.map((run, k) => (
        <Path
          key={`s${k}`}
          path={run.d}
          style="stroke"
          strokeWidth={run.w + 2.4}
          strokeCap="round"
          strokeJoin="round"
          color="#3A0503"
        />
      ))}
      {RUNS.map((run, k) => (
        <Path
          key={k}
          path={run.d}
          style="stroke"
          strokeWidth={run.w}
          strokeCap="round"
          strokeJoin="round"
        >
          <SweepGradient
            c={vec(0, 0)}
            colors={["#8E130C", "#D9361E", "#9E180E", "#E8442A", "#8E130C"]}
          />
        </Path>
      ))}
      <Path
        path={BELLY}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
        color="#F5A23A"
        opacity={0.9}
      />
      {/* scales catching a light that runs down the body */}
      {RUNS.map((run, k) => (
        <Path
          key={`g${k}`}
          path={run.d}
          style="stroke"
          strokeWidth={run.w * 0.55}
          color="#FFC07A"
          opacity={0.5}
          blendMode="screen"
        >
          <DashPathEffect intervals={[1.6, 4.4]} phase={phase} />
        </Path>
      ))}
      {/* the tail's spade */}
      <Group
        transform={[
          { translateX: TAIL_END.x },
          { translateY: TAIL_END.y },
          { rotate: TAIL_END.a + Math.PI / 2 },
        ]}
      >
        <Path path="M0 -1.5L10 -9L6.5 0L10 9L0 1.5z" color="#B81F14" />
      </Group>
      {CLAWS.map((c, k) => (
        <Group
          key={k}
          transform={[
            { translateX: c.x },
            { translateY: c.y },
            { rotate: c.rot },
          ]}
        >
          <Path
            path="M-5 0C-5 4 -3 7 -1 8M0 0C0 4 1 7 2 8.5M5 0C5 4 4 7 3 8"
            style="stroke"
            strokeWidth={1.8}
            strokeCap="round"
            color="#F6C64A"
          />
        </Group>
      ))}
    </Group>
  );
}

const FireDragon: ArtBorderDrawing = {
  back: DragonBody,
  front: ({ t }) => (
    <Group>
      <Band r={52.5} width={4} colors={["#F6C64A", "#8E130C"]} rim="#3A0603" />
      <Glint t={t} x={-70} y={-36} size={4} phase={1} />
    </Group>
  ),
};

export const LEGENDARY_ART = {
  phoenix: Phoenix,
  "fire-dragon": FireDragon,
};
