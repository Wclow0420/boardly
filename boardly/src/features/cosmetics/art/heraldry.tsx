// The heraldic frames, engraved like the rest of the house: Steel Plate
// (a riveted octagon of brushed silver), Guardian (a quartered shield
// behind the picture, laurel at its point), and Royal Crown (a pearled
// gold ring under a jewelled crown, acanthus curling to a ruby below).
// They replace the flat cut-out shapes of the same names.

import {
  Circle,
  FillType,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { LEAF, acanthus } from "@/components/engraved/shapes";
import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const NIGHT = ["#6A8AC8", "#2A4A8A", "#14244A"];
const INK_GOLD = "#3A2408";
const INK_STEEL = "#1E242C";

/** An engraved piece: filled with its metal, its veins and shine cut in,
 *  inked round. */
function Metal({
  d,
  colors,
  ink,
  vein,
  veinColor,
  shine,
  evenOdd,
  width = 1.4,
  from = vec(-60, -70),
  to = vec(60, 70),
}: {
  d: string;
  colors: string[];
  ink: string;
  vein?: string;
  veinColor?: string;
  shine?: string;
  evenOdd?: boolean;
  width?: number;
  from?: ReturnType<typeof vec>;
  to?: ReturnType<typeof vec>;
}) {
  const fill = evenOdd ? "evenOdd" : "winding";
  // the engraving stays inside the piece
  const clip = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(d);
    if (path && evenOdd) path.setFillType(FillType.EvenOdd);
    return path;
  }, [d, evenOdd]);
  return (
    <Group>
      <Path path={d} fillType={fill}>
        <LinearGradient start={from} end={to} colors={colors} />
      </Path>
      {clip ? (
        <Group clip={clip}>
          {vein ? (
            <Path
              path={vein}
              style="stroke"
              strokeWidth={0.8}
              strokeCap="round"
              color={veinColor ?? ink}
              opacity={0.75}
            />
          ) : null}
          {shine ? (
            <Path
              path={shine}
              style="stroke"
              strokeWidth={1.2}
              strokeCap="round"
              color="#FFFFFF"
              opacity={0.85}
            />
          ) : null}
        </Group>
      ) : null}
      <Path
        path={d}
        fillType={fill}
        style="stroke"
        strokeWidth={width}
        strokeJoin="round"
        color={ink}
      />
    </Group>
  );
}

const circle = (r: number) =>
  `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
/** A regular octagon, flat at the top. */
const octagon = (r: number) =>
  `M${Array.from({ length: 8 }, (_, k) => {
    const p = polar(((k * 45 + 22.5) * Math.PI) / 180, r);
    return `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join("L")}Z`;

/** A riveted bolt: a domed silver head. */
function Rivet({ x, y, r = 2.8 }: { x: number; y: number; r?: number }) {
  return (
    <Group>
      <Circle cx={x} cy={y} r={r}>
        <RadialGradient
          c={vec(x - r * 0.4, y - r * 0.4)}
          r={r * 1.6}
          colors={["#FFFFFF", "#9AA4B4", "#3A424E"]}
        />
      </Circle>
      <Circle
        cx={x}
        cy={y}
        r={r}
        style="stroke"
        strokeWidth={0.9}
        color={INK_STEEL}
      />
    </Group>
  );
}

// ── Steel Plate ───────────────────────────────────────────────────────

const PLATE = octagon(66) + circle(49.5);

function SteelBack() {
  // the plate's thickness, a shade under it
  return (
    <Group transform={[{ translateX: 1.8 }, { translateY: 2.6 }]}>
      <Path path={octagon(66)} color="#1A1E26" />
    </Group>
  );
}

function SteelFront({ t }: { t: Clock }) {
  const corners = Array.from({ length: 8 }, (_, k) =>
    polar(((k * 45 + 22.5) * Math.PI) / 180, 59.6),
  );
  return (
    <Group>
      <Metal
        d={PLATE}
        evenOdd
        colors={SILVER}
        ink={INK_STEEL}
        // a groove round the plate, a lip round the picture, and the
        // brushing of the metal
        vein={`${octagon(61.4)}${circle(53.4)}M-44 -46L-30 -58M44 46L30 58M-46 44L-58 30M46 -44L58 -30`}
        veinColor="#4A5462"
        shine="M-56 -24L-62 -12M-25 -59L-12 -62"
      />
      {corners.map((p, k) => (
        <Rivet key={k} x={p.x} y={p.y} />
      ))}
      <Sweep t={t} d={PLATE} evenOdd every={4.4} />
      <Glint t={t} x={corners[5].x} y={corners[5].y} size={5} phase={0.6} />
      <Glint t={t} x={corners[1].x} y={corners[1].y} size={4} phase={2.4} />
    </Group>
  );
}

// ── Guardian ─────────────────────────────────────────────────────────

const SHIELD =
  "M-64 -66Q0 -58 64 -66L64 4C64 42 34 70 0 88C-34 70 -64 42 -64 4Z";
const FIELD =
  "M-56 -58Q0 -51 56 -58L56 4C56 37 30 61 0 77C-30 61 -56 37 -56 4Z";
/** The field's quarters: top-right and bottom-left are silver. */
const QUARTERS = "M0 -54.6Q28 -54.6 56 -58L56 8H0ZM0 8H-56C-55 36 -30 60 0 77Z";
/** Heraldic azure: fine level lines engraved across the blue. */
const AZURE = Array.from({ length: 13 }, (_, k) => {
  const y = -50 + k * 10;
  return `M-55 ${y}H55`;
}).join("");

function GuardianBack({ t }: { t: Clock }) {
  return (
    <Group>
      <Group transform={[{ translateX: 1.8 }, { translateY: 2.6 }]}>
        <Path path={SHIELD} color="#1A140A" />
      </Group>
      <Metal
        d={SHIELD}
        colors={GOLD}
        ink={INK_GOLD}
        shine="M-60 -60Q-30 -58 -6 -59M-60 -50V-6"
      />
      <Metal
        d={FIELD}
        colors={NIGHT}
        ink={INK_GOLD}
        width={1.1}
        vein={AZURE}
        veinColor="#14244A"
      />
      <Metal
        d={QUARTERS}
        colors={SILVER}
        ink={INK_STEEL}
        width={1}
        from={vec(0, -60)}
        to={vec(56, 60)}
      />
      <Sweep t={t} d={SHIELD} every={5} />
    </Group>
  );
}

/** Laurel along the shield's point, from the tip up each side. */
const LAUREL = [
  { x: 6, y: 74, a: 28 },
  { x: 16, y: 66, a: 40 },
  { x: 26, y: 57, a: 52 },
  { x: 35, y: 47, a: 64 },
];

function GuardianFront({ t }: { t: Clock }) {
  const sprig = (
    <Group>
      {LAUREL.map((l, k) => (
        <Group
          key={k}
          transform={[
            { translateX: l.x },
            { translateY: l.y },
            { rotate: (l.a * Math.PI) / 180 },
          ]}
        >
          <Metal
            d={LEAF(11, 3.4)}
            colors={["#D8F0A0", "#6AAA3A", "#2E6A1E"]}
            ink="#14300A"
            width={1}
            vein="M0 -1L0 -9"
            veinColor="#2E5A16"
          />
        </Group>
      ))}
    </Group>
  );
  return (
    <Group>
      {/* a gold ring round the picture */}
      <Metal
        d={circle(55) + circle(49.5)}
        evenOdd
        colors={GOLD}
        ink={INK_GOLD}
        width={1.2}
      />
      {sprig}
      <Group transform={[{ scaleX: -1 }]}>{sprig}</Group>
      {/* the boss on top */}
      <Circle cx={0} cy={-60} r={7.4}>
        <RadialGradient c={vec(-2, -62)} r={10} colors={GOLD} />
      </Circle>
      <Circle
        cx={0}
        cy={-60}
        r={7.4}
        style="stroke"
        strokeWidth={1.2}
        color={INK_GOLD}
      />
      <Gem
        x={0}
        y={-60}
        w={8}
        h={8}
        colors={["#D8EEFF", "#2E7AE0", "#0A2A6A"]}
      />
      <Glint t={t} x={0} y={-60} size={6} phase={0.3} />
    </Group>
  );
}

// ── Royal Crown ──────────────────────────────────────────────────────

const RING = circle(63) + circle(50.5);
/** The crown: a band over the ring's top, five points rising from it. */
const CROWN_POINTS =
  "M-31 -66L-30 -86L-21 -75L-14 -90L-7 -77L0 -93L7 -77L14 -90L21 -75L30 -86L31 -66Z";
const CROWN_BAND = "M-31 -70H31L29 -60H-29Z";
const VELVET = "M-28 -66C-28 -84 28 -84 28 -66Z";
const TIPS: [number, number][] = [
  [-30, -87],
  [-14, -91],
  [0, -94],
  [14, -91],
  [30, -87],
];

/** Acanthus under the ring, curling out from the ruby; the right half. */
const SCROLLS = acanthus(10, 60, 0.18, 62, -5.4, 11, true);

function RoyalBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.32 + 0.1 * Math.sin(t.value * 1.3));
  const scrolls = (
    <Group>
      {SCROLLS.map((s, k) => (
        <Metal
          key={k}
          d={s.outline}
          colors={GOLD}
          ink={INK_GOLD}
          width={1.1}
          vein={s.vein}
          veinColor="#7A5212"
        />
      ))}
    </Group>
  );
  return (
    <Group>
      <Halo r={90} color="#FFE6A0" opacity={glow} />
      {scrolls}
      <Group transform={[{ scaleX: -1 }]}>{scrolls}</Group>
    </Group>
  );
}

function RoyalFront({ t }: { t: Clock }) {
  const pearls = Array.from({ length: 28 }, (_, k) =>
    polar((k / 28) * TAU, 56.8),
  );
  return (
    <Group>
      {/* the pearled ring */}
      <Metal d={RING} evenOdd colors={GOLD} ink={INK_GOLD} />
      <Circle
        cx={0}
        cy={0}
        r={56.8}
        style="stroke"
        strokeWidth={5}
        color="#5A0A1A"
      />
      {pearls.map((p, k) => (
        <Circle key={k} cx={p.x} cy={p.y} r={1.7}>
          <RadialGradient
            c={vec(p.x - 0.6, p.y - 0.6)}
            r={2.4}
            colors={["#FFFFFF", "#F2E6D8", "#B8A890"]}
          />
        </Circle>
      ))}
      <Sweep t={t} d={RING} evenOdd every={4.6} />
      {/* the crown over it */}
      <Path path={VELVET}>
        <LinearGradient
          start={vec(0, -80)}
          end={vec(0, -64)}
          colors={["#E05A6A", "#8A0A1E"]}
        />
      </Path>
      <Metal
        d={CROWN_POINTS}
        colors={GOLD}
        ink={INK_GOLD}
        vein="M-21 -75V-68M-7 -77V-68M7 -77V-68M21 -75V-68"
        veinColor="#7A5212"
        shine="M-31 -66L-33 -80"
      />
      <Metal
        d={CROWN_BAND}
        colors={GOLD}
        ink={INK_GOLD}
        width={1.2}
        shine="M-27 -68H-8"
      />
      {TIPS.map(([x, y], k) => (
        <Circle key={k} cx={x} cy={y} r={2.6}>
          <RadialGradient
            c={vec(x - 0.8, y - 0.8)}
            r={3.4}
            colors={["#FFFFFF", "#F2E6D8", "#B8A890"]}
          />
        </Circle>
      ))}
      <Gem
        x={0}
        y={-65}
        w={7}
        h={6}
        colors={["#FF9AA6", "#D0102E", "#5A0410"]}
      />
      <Gem
        x={-17}
        y={-65}
        w={5}
        h={4.6}
        colors={["#D8EEFF", "#2E7AE0", "#0A2A6A"]}
      />
      <Gem
        x={17}
        y={-65}
        w={5}
        h={4.6}
        colors={["#C8FFD8", "#1E9A54", "#06401E"]}
      />
      <Sweep t={t} d={CROWN_POINTS} every={4.6} phase={0.5} />
      {/* the ruby the scrolls curl from */}
      <Gem
        x={0}
        y={64}
        w={9}
        h={10}
        colors={["#FF9AA6", "#D0102E", "#5A0410"]}
      />
      <Glint t={t} x={0} y={-65} size={6} phase={0.4} />
      <Glint t={t} x={0} y={64} size={5} phase={2.1} />
      <Glint t={t} x={-14} y={-91} size={4} phase={3.3} />
    </Group>
  );
}

export const HERALDRY_ART = {
  "steel-plate": {
    back: SteelBack,
    front: SteelFront,
  } satisfies ArtBorderDrawing,
  guardian: {
    back: GuardianBack,
    front: GuardianFront,
  } satisfies ArtBorderDrawing,
  "royal-crown": {
    back: RoyalBack,
    front: RoyalFront,
  } satisfies ArtBorderDrawing,
};
