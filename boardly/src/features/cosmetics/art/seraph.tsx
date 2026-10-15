// Seraph Wings: an ornate gold token ring — a dark channel studded with
// gold, a blue gem in a pointed setting on top, an opal below — held in
// two great silver wings that wrap its sides, rising at the top and
// sweeping down to the foot.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

export const FEATHER = (len: number, w: number) =>
  `M0 0C${w} ${-len * 0.2} ${w * 0.95} ${-len * 0.78} 0 ${-len}C${-w * 0.95} ${-len * 0.78} ${-w} ${-len * 0.2} 0 0z`;

/** Rows along each side of the ring, outermost (longest) first. For
 *  each feather: where it grows (an angle on the right side, top to
 *  foot) and how it points (outward and up at the top, down below). */
const ROWS = [
  {
    count: 13,
    base: 62,
    len: (f: number) => 38 - f * 18,
    w: 7,
    colors: ["#5E6678", "#B9C1D2", "#F4F6FA"],
  },
  {
    count: 11,
    base: 60,
    len: (f: number) => 26 - f * 10,
    w: 6.5,
    colors: ["#737B8E", "#CBD2E0", "#FFFFFF"],
  },
  {
    count: 9,
    base: 58,
    len: (f: number) => 15 - f * 4,
    w: 6,
    colors: ["#8C94A6", "#DCE1EC", "#FFFFFF"],
  },
];
/** Only along the sides: the top and the foot stay clear for the gems. */
const FROM = (-62 * Math.PI) / 180;
const TO = (62 * Math.PI) / 180;

function Wing({ t, side }: { t: Clock; side: 1 | -1 }) {
  // the wing breathes, hinged at the ring's side
  const breathe = useDerivedValue(() => [
    { rotate: side * Math.sin(t.value * 1.4) * 0.025 },
  ]);
  return (
    <Group transform={breathe}>
      {ROWS.map((row, r) =>
        Array.from({ length: row.count }, (_, k) => {
          const f = k / (row.count - 1);
          const theta = FROM + (TO - FROM) * f;
          // mirror the right side's angles for the left wing
          const at = side === 1 ? theta : Math.PI - theta;
          const base = polar(at, row.base);
          // every feather sweeps down; the top ones rise out first
          const point = theta + 0.45 + f * 0.35;
          const dir = side === 1 ? point : Math.PI - point;
          const len = row.len(f);
          return (
            <Group
              key={`${r}-${k}`}
              transform={[
                { translateX: base.x },
                { translateY: base.y },
                { rotate: dir + Math.PI / 2 },
              ]}
            >
              <Path path={FEATHER(len, row.w)}>
                <LinearGradient
                  start={vec(0, -len)}
                  end={vec(0, 0)}
                  colors={row.colors}
                />
              </Path>
              <Path
                path={FEATHER(len, row.w)}
                style="stroke"
                strokeWidth={0.9}
                color="#3E4556"
                opacity={0.8}
              />
              <Path
                path={`M0 0L0 ${-len * 0.82}`}
                style="stroke"
                strokeWidth={0.7}
                color="#6E7688"
              />
            </Group>
          );
        }),
      )}
    </Group>
  );
}

export const RING =
  "M0 -63A63 63 0 1 0 0 63A63 63 0 1 0 0 -63zM0 -51A51 51 0 1 1 0 51A51 51 0 1 1 0 -51z";
const GOLD = ["#FFF0B0", "#E2B04A", "#9A6B1E", "#E8C26A"];

function SeraphBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.4 + 0.12 * Math.sin(t.value * 1.3));
  return (
    <Group>
      <Halo r={94} color="#CFE0FF" opacity={glow} />
      <Wing t={t} side={-1} />
      <Wing t={t} side={1} />
    </Group>
  );
}

function SeraphFront({ t }: { t: Clock }) {
  const shine = useDerivedValue(() => 0.65 + 0.35 * Math.sin(t.value * 2.2));
  const studs = Array.from({ length: 36 }, (_, k) =>
    polar((k / 36) * TAU, 57.5),
  );
  return (
    <Group>
      {/* the gold ring: outer rim, a dark channel studded with gold, inner lip */}
      <Path path={RING} fillType="evenOdd">
        <LinearGradient start={vec(-50, -63)} end={vec(50, 63)} colors={GOLD} />
      </Path>
      <Circle
        cx={0}
        cy={0}
        r={63}
        style="stroke"
        strokeWidth={1.4}
        color="#5A3A08"
      />
      <Circle
        cx={0}
        cy={0}
        r={51}
        style="stroke"
        strokeWidth={1.4}
        color="#5A3A08"
      />
      <Circle
        cx={0}
        cy={0}
        r={57.5}
        style="stroke"
        strokeWidth={5}
        color="#1A1E2E"
      />
      {studs.map((p, k) => (
        <Circle key={k} cx={p.x} cy={p.y} r={1.3} color="#F6D27A" />
      ))}
      <Circle
        cx={0}
        cy={0}
        r={60.5}
        style="stroke"
        strokeWidth={0.8}
        color="#FFF6D0"
        opacity={0.6}
      />
      <Sweep t={t} d={RING} every={4.2} />

      {/* the top gem in its pointed setting */}
      <Path path="M0 -86L13 -66L0 -50L-13 -66z">
        <LinearGradient
          start={vec(0, -86)}
          end={vec(0, -50)}
          colors={["#FFF0B0", "#D99A2E", "#8E5A12"]}
        />
      </Path>
      <Path
        path="M0 -86L13 -66L0 -50L-13 -66z"
        style="stroke"
        strokeWidth={1.2}
        color="#5A3A08"
      />
      <Circle cx={0} cy={-67} r={11} color="#6FD8FF" opacity={shine}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Gem
        x={0}
        y={-67}
        w={11}
        h={15}
        colors={["#D8F6FF", "#3FB0E8", "#0E4A7A"]}
      />
      {/* the opal at the foot */}
      <Path path="M0 72L8 61L0 52L-8 61z">
        <LinearGradient
          start={vec(0, 52)}
          end={vec(0, 72)}
          colors={["#FFF0B0", "#C88A22"]}
        />
      </Path>
      <Circle cx={0} cy={61} r={4.6}>
        <RadialGradient
          c={vec(-1.5, 59.5)}
          r={6}
          colors={["#FFFFFF", "#FFC2DC", "#9A6AC8"]}
        />
      </Circle>
      <Glint t={t} x={0} y={-67} size={7} phase={0.4} speed={1} />
      <Glint t={t} x={0} y={61} size={4} phase={2.6} speed={1.1} />
      <Glint t={t} x={-44} y={-44} size={4} phase={1.5} speed={1.2} />
    </Group>
  );
}

export const SERAPH_ART = {
  "seraph-wings": {
    back: SeraphBack,
    front: SeraphFront,
  } satisfies ArtBorderDrawing,
};
