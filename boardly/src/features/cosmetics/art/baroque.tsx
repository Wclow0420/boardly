// Baroque Silver: an engraved cartouche. Two thick acanthus bands, cut
// with grooves, meet in a bud at the top and in two pointed leaves at
// the foot; great scrolls curl out at the upper corners, and leafy
// fronds fan out at the lower sides, stirring. A sapphire sits in the
// bud and the light runs over the silver.

import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

import {
  LEAF,
  acanthus,
  curl,
  frond,
  ribbon,
  type Pt,
} from "@/components/engraved/shapes";

import { Gem, Sweep } from "./crowns";
import { Glint, Halo, type ArtBorderDrawing, type Clock } from "./kit";

const INK = "#1E242C";
const GROOVE = "#4A5462";
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const DEG = Math.PI / 180;

// The right half; the left is its mirror image.

const BAND = ribbon(
  [
    [2, -56],
    [18, -60],
    [37, -56],
    [51, -42],
    [58, -23],
    [59, 0],
    [55, 19],
    [46, 35],
    [34, 47],
    [19, 56],
    [6, 63],
    [1, 70],
  ],
  [5, 10, 15, 15, 12, 10, 12, 13, 11, 8, 5, 2],
);

const SCROLLS = [
  // the great scroll at the upper corner
  ...acanthus(50, -34, -1.45, 84, 7.4, 16, true),
  // a smaller one curling out below the side
  ...acanthus(58, 22, 0.3, 50, 6.8, 12, true),
];

/** The fronds fanned at the lower side, from out to down. */
const FRONDS = [
  { dir: -10, len: 46, w: 8 },
  { dir: 18, len: 42, w: 7.5 },
  { dir: 46, len: 36, w: 7 },
  { dir: 74, len: 28, w: 6 },
].map((f) => ({ dir: f.dir * DEG, len: f.len, d: frond(f.len, f.w, 5) }));
const FROND_ROOT: Pt = [50, 42];

/** The bud on top: two small curls opening out of the bands. */
const BUD = curl(0, -58, -1.75, 22, 4.4, 6);
/** The pointed leaf at the foot, leaning in to meet its twin. */
const FOOT = frond(26, 6, 4);

const ALL_D = [
  BAND.outline,
  BUD.outline,
  ...SCROLLS.map((s) => s.outline),
].join("");

function Silver({ d, vein }: { d: string; vein?: string }) {
  return (
    <Group>
      <Path path={d}>
        <LinearGradient
          start={vec(-20, -80)}
          end={vec(80, 80)}
          colors={SILVER}
        />
      </Path>
      <Path path={d} style="stroke" strokeWidth={1.2} color={INK} />
      {vein ? (
        <Path path={vein} style="stroke" strokeWidth={0.7} color={GROOVE} />
      ) : null}
    </Group>
  );
}

function BackHalf({ t }: { t: Clock }) {
  // the fronds stir, hinged at their root
  const stir = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 1.3) * 0.04 },
  ]);
  return (
    <Group>
      <Group transform={stir} origin={vec(FROND_ROOT[0], FROND_ROOT[1])}>
        {FRONDS.map((f, k) => (
          <Group
            key={k}
            transform={[
              { translateX: FROND_ROOT[0] },
              { translateY: FROND_ROOT[1] },
              { rotate: f.dir + Math.PI / 2 },
            ]}
          >
            <Silver d={f.d} vein={`M0 -2L0 ${-f.len * 0.85}`} />
          </Group>
        ))}
      </Group>
      {SCROLLS.map((s, i) => (
        <Silver key={i} d={s.outline} vein={s.vein} />
      ))}
    </Group>
  );
}

function FrontHalf() {
  return (
    <Group>
      <Silver d={BAND.outline} />
      <Path
        path={BAND.grooves}
        style="stroke"
        strokeWidth={0.8}
        color={GROOVE}
      />
      <Path
        path={BAND.shine}
        style="stroke"
        strokeWidth={1.2}
        color="#FFFFFF"
        opacity={0.75}
      />
      <Silver d={BUD.outline} vein={BUD.vein} />
      <Group
        transform={[
          { translateX: 5 },
          { translateY: 62 },
          { rotate: Math.PI + 0.2 },
        ]}
      >
        <Silver d={FOOT} vein="M0 -2L0 -22" />
      </Group>
    </Group>
  );
}

const MIRROR = [{ scaleX: -1 }];

function BaroqueBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.32 + 0.1 * Math.sin(t.value * 1.2));
  return (
    <Group>
      <Halo r={92} color="#CFE0FF" opacity={glow} />
      <BackHalf t={t} />
      <Group transform={MIRROR}>
        <BackHalf t={t} />
      </Group>
      <Sweep t={t} d={ALL_D} every={4.5} />
    </Group>
  );
}

function BaroqueFront({ t }: { t: Clock }) {
  const shine = useDerivedValue(() => 0.5 + 0.4 * Math.sin(t.value * 2.2));
  return (
    <Group>
      <FrontHalf />
      <Group transform={MIRROR}>
        <FrontHalf />
      </Group>
      <Sweep t={t} d={BAND.outline} every={4.5} phase={0.3} />
      {/* the bud's centre: a leaf with a sapphire */}
      <Group transform={[{ translateY: -56 }]}>
        <Silver d={LEAF(20, 6)} vein="M0 -2L0 -16" />
      </Group>
      <Circle cx={0} cy={-64} r={7} color="#5AA8FF" opacity={shine}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Gem
        x={0}
        y={-64}
        w={6}
        h={8}
        colors={["#D8EEFF", "#2E7AE0", "#0A2A6A"]}
      />
      <Glint t={t} x={0} y={-64} size={5} phase={0.5} speed={1} />
      <Glint t={t} x={-62} y={-50} size={4} phase={1.9} speed={1.1} />
      <Glint t={t} x={58} y={10} size={4} phase={3.2} speed={0.9} />
    </Group>
  );
}

export const BAROQUE_ART = {
  "baroque-silver": {
    back: BaroqueBack,
    front: BaroqueFront,
  } satisfies ArtBorderDrawing,
};
