// Crown borders: a crown resting on top of the picture (covering its top
// a little, as a crown would), a jewelled ring round it, a sweep of
// light across the metal and the gems glinting.

import {
  Circle,
  FillType,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import {
  Glint,
  Halo,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

/** A band of light crossing `d` every few seconds. */
export function Sweep({
  t,
  d,
  every = 3.6,
  phase = 0,
  evenOdd = false,
}: {
  t: Clock;
  d: string;
  every?: number;
  phase?: number;
  /** `d` cuts holes (a ring drawn as two circles): keep the light out of
   *  them. */
  evenOdd?: boolean;
}) {
  const clip = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(d);
    if (path && evenOdd) path.setFillType(FillType.EvenOdd);
    return path;
  }, [d, evenOdd]);
  const transform = useDerivedValue(() => {
    const p = ((t.value + phase) % every) / 1.1;
    // from well clear of one side to well clear of the other
    const x = p < 1 ? -110 + p * 220 : 260;
    return [{ translateX: x }, { rotate: 0.45 }];
  });
  if (!clip) return null;
  return (
    <Group clip={clip}>
      <Group transform={transform}>
        {/* tall enough to cross the tallest frame, corner to corner */}
        <Rect x={-12} y={-160} width={24} height={320}>
          <LinearGradient
            start={vec(-12, 0)}
            end={vec(12, 0)}
            colors={["#FFFFFF00", "#FFFFFFCC", "#FFFFFF00"]}
          />
        </Rect>
      </Group>
    </Group>
  );
}

/** A faceted gem: body, a darker lower half, a highlight. */
export function Gem({
  x,
  y,
  w,
  h,
  colors,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  colors: [string, string, string];
}) {
  return (
    <Group>
      <Oval
        x={x - w / 2 - 1}
        y={y - h / 2 - 1}
        width={w + 2}
        height={h + 2}
        color="#5A3A08"
      />
      <Oval x={x - w / 2} y={y - h / 2} width={w} height={h}>
        <RadialGradient
          c={vec(x - w * 0.2, y - h * 0.25)}
          r={Math.max(w, h)}
          colors={colors}
        />
      </Oval>
      <Oval
        x={x - w * 0.28}
        y={y - h * 0.32}
        width={w * 0.3}
        height={h * 0.22}
        color="#FFFFFFCC"
      />
    </Group>
  );
}

function Pearl({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <Circle cx={x} cy={y} r={r}>
      <RadialGradient
        c={vec(x - r * 0.35, y - r * 0.4)}
        r={r * 1.5}
        colors={["#FFFFFF", "#F1E9F4", "#B8AEC6"]}
      />
    </Circle>
  );
}

// ── King's Crown: heavy gold, rubies and sapphires, ermine and velvet ─

const KING_BODY =
  "M-44 -44L-50 -76L-36 -60L-26 -84L-13 -62L0 -90L13 -62L26 -84L36 -60L50 -76L44 -44Q0 -54 -44 -44z";
const KING_BAND = "M-46 -48Q0 -58 46 -48L46 -36Q0 -46 -46 -36z";
const KING_VELVET = "M-42 -46Q-40 -88 0 -88Q40 -88 42 -46z";
const KING_TIPS: [number, number][] = [
  [-50, -78],
  [-26, -86],
  [0, -92],
  [26, -86],
  [50, -78],
];
const GOLD = ["#FFF3B0", "#F6C64A", "#C88A16", "#8E5A0C"];

function KingBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.45 + 0.12 * Math.sin(t.value * 1.5));
  return (
    <Group>
      <Halo r={90} color="#FFC94A" opacity={glow} />
    </Group>
  );
}

function KingFront({ t }: { t: Clock }) {
  const ringGems = useMemo(
    () =>
      Array.from({ length: 10 }, (_, k) => ({
        ...polar((k / 10) * TAU + Math.PI / 10, 54),
        red: k % 2 === 0,
      })),
    [],
  );
  return (
    <Group>
      {/* the ring round the picture, studded with gems */}
      <Circle cx={0} cy={0} r={54} style="stroke" strokeWidth={8}>
        <LinearGradient start={vec(0, -58)} end={vec(0, 58)} colors={GOLD} />
      </Circle>
      <Circle
        cx={0}
        cy={0}
        r={58}
        style="stroke"
        strokeWidth={1.4}
        color="#6E4A0E"
      />
      <Circle
        cx={0}
        cy={0}
        r={50}
        style="stroke"
        strokeWidth={1.4}
        color="#6E4A0E"
      />
      {ringGems.map((g, k) => (
        <Circle
          key={k}
          cx={g.x}
          cy={g.y}
          r={2.6}
          color={g.red ? "#D0242A" : "#2E6BD9"}
        />
      ))}

      {/* velvet cap showing between the crown's points */}
      <Path path={KING_VELVET}>
        <LinearGradient
          start={vec(0, -88)}
          end={vec(0, -46)}
          colors={["#C2263A", "#7A0E1E"]}
        />
      </Path>
      {/* the crown */}
      <Path path={KING_BODY}>
        <LinearGradient start={vec(0, -92)} end={vec(0, -44)} colors={GOLD} />
      </Path>
      <Path
        path={KING_BODY}
        style="stroke"
        strokeWidth={1.6}
        strokeJoin="round"
        color="#6E4A0E"
      />
      <Sweep t={t} d={KING_BODY} />
      {/* a small diamond under each point */}
      {KING_TIPS.map(([x, y], k) => (
        <Path
          key={`d${k}`}
          path={`M${x} ${y + 10}l3.2 4.4l-3.2 4.4l-3.2-4.4z`}
          color="#E8F4FF"
        />
      ))}
      {KING_TIPS.map(([x, y], k) => (
        <Pearl key={`p${k}`} x={x} y={y} r={k === 2 ? 4.6 : 3.8} />
      ))}
      {/* the band, with its jewels */}
      <Path path={KING_BAND}>
        <LinearGradient
          start={vec(0, -58)}
          end={vec(0, -36)}
          colors={["#FFE48A", "#D99A1E", "#9E6A10"]}
        />
      </Path>
      <Path path={KING_BAND} style="stroke" strokeWidth={1.6} color="#6E4A0E" />
      <Sweep t={t} d={KING_BAND} phase={0.15} />
      <Gem
        x={0}
        y={-47}
        w={12}
        h={9}
        colors={["#FF8A8A", "#D0242A", "#6E0A10"]}
      />
      <Gem
        x={-24}
        y={-45}
        w={8}
        h={7}
        colors={["#8AB8FF", "#2E6BD9", "#122C6E"]}
      />
      <Gem
        x={24}
        y={-45}
        w={8}
        h={7}
        colors={["#8AB8FF", "#2E6BD9", "#122C6E"]}
      />
      <Gem
        x={-39}
        y={-42}
        w={6}
        h={5.5}
        colors={["#9AF0B0", "#1F9E4A", "#0A4A22"]}
      />
      <Gem
        x={39}
        y={-42}
        w={6}
        h={5.5}
        colors={["#9AF0B0", "#1F9E4A", "#0A4A22"]}
      />
      {/* ermine trim along the foot, over the picture's top */}
      <Path
        path="M-46 -36Q0 -46 46 -36L45 -29Q0 -39 -45 -29z"
        color="#FFFDF6"
      />
      <Path
        path="M-46 -36Q0 -46 46 -36L45 -29Q0 -39 -45 -29z"
        style="stroke"
        strokeWidth={1}
        color="#9A8E78"
      />
      {[-34, -17, 0, 17, 34].map((x) => (
        <Path
          key={x}
          path={`M${x} ${-36 - (1 - (x / 46) ** 2) * 6}l1.6 4l-1.6 2l-1.6-2z`}
          color="#1A1410"
        />
      ))}
      {/* glints off the gems and points */}
      <Glint t={t} x={0} y={-47} size={6} phase={0} speed={1.1} />
      <Glint t={t} x={-26} y={-86} size={4.5} phase={1.8} speed={1.3} />
      <Glint t={t} x={50} y={-78} size={4} phase={3.4} speed={1.2} />
      <Glint t={t} x={-40} y={30} size={3.5} phase={2.6} speed={0.9} />
    </Group>
  );
}

const KingCrown: ArtBorderDrawing = { back: KingBack, front: KingFront };

// ── Queen's Tiara: silver lace, pearls and pink diamonds ─────────────

const TIARA =
  "M-44 -40Q0 -50 44 -40L46 -52Q40 -66 31 -60Q26 -78 15 -72Q8 -90 0 -90Q-8 -90 -15 -72Q-26 -78 -31 -60Q-40 -66 -46 -52z";
const TIARA_BAND = "M-46 -44Q0 -54 46 -44L45 -36Q0 -46 -45 -36z";
const TIARA_PEARLS: [number, number, number][] = [
  [0, -92, 4.2],
  [-15, -74, 3.4],
  [15, -74, 3.4],
  [-31, -62, 3],
  [31, -62, 3],
  [-46, -53, 2.6],
  [46, -53, 2.6],
];
const SILVER = ["#FFFFFF", "#E4E8F4", "#B4BCD4", "#7C84A0"];
const PINK: [string, string, string] = ["#FFC6E2", "#F0559E", "#8A1650"];

/** A teardrop gem, point up. */
const drop = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y - h / 2}C${x + w / 2} ${y - h * 0.1} ${x + w / 2} ${y + h / 2} ${x} ${y + h / 2}C${x - w / 2} ${y + h / 2} ${x - w / 2} ${y - h * 0.1} ${x} ${y - h / 2}z`;

/** The tiara's foot (0, -40) moved onto the picture's top right, tilted
 *  and made smaller: a side tiara sitting on the head. */
const TIARA_PLACE = [
  { translateX: 24 },
  { translateY: -33 },
  { rotate: 0.62 },
  { scale: 0.66 },
  { translateY: 40 },
];

function QueenBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.42 + 0.12 * Math.sin(t.value * 1.4));
  return <Halo r={90} color="#FFB3DA" opacity={glow} />;
}

function QueenFront({ t }: { t: Clock }) {
  const strand = useMemo(
    () => Array.from({ length: 34 }, (_, k) => polar((k / 34) * TAU, 55)),
    [],
  );
  return (
    <Group>
      {/* a strand of pearls round the picture */}
      <Circle
        cx={0}
        cy={0}
        r={55}
        style="stroke"
        strokeWidth={1.2}
        color="#B4BCD4"
      />
      {strand.map((p, k) => (
        <Pearl key={k} x={p.x} y={p.y} r={k % 2 ? 3.3 : 3.8} />
      ))}

      {/* worn to the side: smaller, tilted, resting on the top right */}
      <Group transform={TIARA_PLACE}>
        {/* the tiara: silver lace */}
        <Path path={TIARA}>
          <LinearGradient
            start={vec(0, -92)}
            end={vec(0, -40)}
            colors={SILVER}
          />
        </Path>
        <Path
          path={TIARA}
          style="stroke"
          strokeWidth={1.5}
          strokeJoin="round"
          color="#5A6078"
        />
        {/* filigree curls inside the arches */}
        <Path
          path="M-8 -60C-14 -66 -10 -76 0 -78C10 -76 14 -66 8 -60M-36 -48C-36 -56 -28 -58 -24 -52M36 -48C36 -56 28 -58 24 -52M-20 -50C-22 -60 -14 -64 -9 -58M20 -50C22 -60 14 -64 9 -58"
          style="stroke"
          strokeWidth={1.4}
          strokeCap="round"
          color="#7C84A0"
        />
        <Sweep t={t} d={TIARA} every={4} />
        {/* the gems: a great pink diamond and its sisters */}
        <Path path={drop(0, -64, 12, 18)} color="#5A2040" />
        <Path path={drop(0, -64, 10.5, 16.5)}>
          <RadialGradient c={vec(-2, -69)} r={14} colors={PINK} />
        </Path>
        <Oval x={-3.4} y={-69} width={3.6} height={5} color="#FFFFFFCC" />
        {[-20, 20].map((x) => (
          <Group key={x}>
            <Path path={drop(x, -55, 7.5, 11)}>
              <RadialGradient c={vec(x - 1.5, -58)} r={9} colors={PINK} />
            </Path>
            <Oval
              x={x - 2.2}
              y={-58.5}
              width={2.4}
              height={3.2}
              color="#FFFFFFCC"
            />
          </Group>
        ))}
        {[-34, 34].map((x) => (
          <Path
            key={x}
            path={`M${x} -54l2.6 3.4l-2.6 3.4l-2.6-3.4z`}
            color="#E8F4FF"
          />
        ))}
        {TIARA_PEARLS.map(([x, y, r], k) => (
          <Pearl key={`tp${k}`} x={x} y={y} r={r} />
        ))}
        {/* the band along its foot, set with small diamonds */}
        <Path path={TIARA_BAND}>
          <LinearGradient
            start={vec(0, -54)}
            end={vec(0, -36)}
            colors={["#FFFFFF", "#C9CFE2", "#8A93AE"]}
          />
        </Path>
        <Path
          path={TIARA_BAND}
          style="stroke"
          strokeWidth={1.2}
          color="#5A6078"
        />
        {[-36, -27, -18, -9, 0, 9, 18, 27, 36].map((x) => (
          <Circle
            key={x}
            cx={x}
            cy={-41 - (1 - (x / 46) ** 2) * 5}
            r={1.8}
            color={x === 0 ? "#F0559E" : "#F2F8FF"}
          />
        ))}
        <Sweep t={t} d={TIARA_BAND} every={4} phase={0.15} />
        {/* sparkles */}
        <Glint t={t} x={0} y={-64} size={7} phase={0.5} speed={1} />
        <Glint t={t} x={-31} y={-62} size={4} phase={2} speed={1.3} />
        <Glint t={t} x={46} y={-53} size={3.5} phase={3.3} speed={1.2} />
      </Group>
      <Glint t={t} x={38} y={38} size={4} phase={1.2} speed={0.9} />
      <Glint t={t} x={-44} y={30} size={3} phase={4} speed={1.1} />
    </Group>
  );
}

const QueenTiara: ArtBorderDrawing = { back: QueenBack, front: QueenFront };

export const CROWN_ART = {
  "king-crown": KingCrown,
  "queen-crown": QueenTiara,
};
