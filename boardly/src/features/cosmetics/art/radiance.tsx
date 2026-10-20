// Toxic, Divine Light and Prism, enhanced in the house's engraved style.
// Each keeps the living shader rim it was built on (rimfx.tsx), licking
// over the picture's edge, and gains an engraved ring just outside it.
//   Toxic — the green ooze rim, inside an iron containment ring cut with
//     hazard stripes and studded with rivets. Four round green-glass
//     flasks are set in it, their poison sloshing and bubbling; slime
//     coats the ring's foot and drips from it, stretching and letting go,
//     and bubbles rise round it.
//   Divine Light — the holy rays and molten gold rim, inside a gold ring
//     inlaid with ivory and gold filigree, a diamond at its foot. Small
//     ivory wings spread at its sides, a gold halo floats above, and a
//     soft choir light breathes out from it.
//   Prism — the rainbow rim, inside a silver ring set with cut-glass
//     facets that catch a turning rainbow. A glass prism sits on top,
//     splitting a white beam into a spectrum that wraps round the ring;
//     sparks of refracted light travel round.
// See heraldry.tsx and crest.tsx for the house style.

import {
  BlurMask,
  Circle,
  ClipOp,
  FillType,
  Group,
  LinearGradient,
  PaintStyle,
  Path,
  Picture,
  RadialGradient,
  Rect,
  Skia,
  StrokeCap,
  StrokeJoin,
  SweepGradient,
  TileMode,
  vec,
  type SkCanvas,
  type SkPicture,
  type SkShader,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { FEATHER, curl } from "@/components/engraved/shapes";
import { Gem, Sweep } from "./crowns";
import {
  Glint,
  Halo,
  Sparks,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";
import {
  Fx,
  GOLD_RIM,
  PRISM_GLOW,
  PRISM_RIM,
  RAYS,
  RIM_GLOW,
  rim,
} from "./rimfx";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const SILVER = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const INK_GOLD = "#3A2408";
const VEIN_GOLD = "#7A5212";
const INK_STEEL = "#1E242C";
const DEG = Math.PI / 180;

const f2 = (n: number) => n.toFixed(2);
const pt = (p: { x: number; y: number }) => `${f2(p.x)} ${f2(p.y)}`;
const circle = (r: number) =>
  `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
/** A band from rIn to rOut (fill it even-odd). */
const band = (rOut: number, rIn: number) => circle(rOut) + circle(rIn);
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f2(cx + rx)} ${f2(cy)}A${rx} ${ry} 0 1 1 ${f2(cx - rx)} ${f2(cy)}A${rx} ${ry} 0 1 1 ${f2(cx + rx)} ${f2(cy)}Z`;
/** An arc of radius r from a0 to a1 (degrees), as an open line. */
const arc = (r: number, a0: number, a1: number) => {
  const p = polar(a0 * DEG, r);
  const q = polar(a1 * DEG, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${pt(p)}A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${pt(q)}`;
};
const at = (a: number, r: number) => pt(polar(a * DEG, r));

// ── drawing straight onto a canvas, for the recorded pictures ─────────

const linear = (x0: number, y0: number, x1: number, y1: number, cs: string[]) =>
  Skia.Shader.MakeLinearGradient(
    vec(x0, y0),
    vec(x1, y1),
    cs.map((c) => Skia.Color(c)),
    null,
    TileMode.Clamp,
  );
const radial = (x: number, y: number, r: number, cs: string[]) =>
  Skia.Shader.MakeRadialGradient(
    vec(x, y),
    r,
    cs.map((c) => Skia.Color(c)),
    null,
    TileMode.Clamp,
  );

function pen(width: number, color: string, alpha = 1) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(alpha);
  return paint;
}

function brush(fill: SkShader | string, alpha = 1) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  if (typeof fill === "string") paint.setColor(Skia.Color(fill));
  else paint.setShader(fill);
  paint.setAlphaf(alpha);
  return paint;
}

const toPath = (d: string, evenOdd = false) => {
  const path = Skia.Path.MakeFromSVGString(d);
  if (path && evenOdd) path.setFillType(FillType.EvenOdd);
  return path;
};

interface Piece {
  d: string;
  fill: SkShader | string;
  ink: string;
  width: number;
  alpha?: number;
  evenOdd?: boolean;
  vein?: string;
  veinColor?: string;
  veinWidth?: number;
  shine?: string;
  shineWidth?: number;
}

/** Fills a piece, cuts its veins and shine in, inks it round. */
function engrave(c: SkCanvas, p: Piece) {
  const path = toPath(p.d, p.evenOdd);
  if (!path) return;
  c.drawPath(path, brush(p.fill, p.alpha ?? 1));
  if (p.vein || p.shine) {
    c.save();
    c.clipPath(path, ClipOp.Intersect, true);
    const vein = p.vein ? toPath(p.vein) : null;
    if (vein)
      c.drawPath(vein, pen(p.veinWidth ?? 0.6, p.veinColor ?? p.ink, 0.75));
    const shine = p.shine ? toPath(p.shine) : null;
    if (shine) c.drawPath(shine, pen(p.shineWidth ?? 0.9, "#FFFFFF", 0.8));
    c.restore();
  }
  if (p.width > 0) c.drawPath(path, pen(p.width, p.ink));
}

function record(draw: (c: SkCanvas) => void): SkPicture {
  const recorder = Skia.PictureRecorder();
  const c = recorder.beginRecording(Skia.XYWHRect(-96, -96, 192, 192));
  draw(c);
  return recorder.finishRecordingAsPicture();
}

/** Recorded once, on first use (never at import: Jest has no Skia). */
function lazy(make: () => SkPicture) {
  let pic: SkPicture | null = null;
  return () => (pic ??= make());
}

/** A small domed stud: a rivet, a pearl. */
function stud(
  c: SkCanvas,
  x: number,
  y: number,
  r: number,
  colors: string[],
  ink: string,
  width = 0.45,
) {
  const p = toPath(
    `M${f2(x + r)} ${f2(y)}A${r} ${r} 0 1 1 ${f2(x - r)} ${f2(y)}A${r} ${r} 0 1 1 ${f2(x + r)} ${f2(y)}Z`,
  );
  if (!p) return;
  c.drawPath(p, brush(radial(x - r * 0.35, y - r * 0.4, r * 1.6, colors)));
  c.drawPath(p, pen(width, ink));
}

// ══ Toxic ════════════════════════════════════════════════════════════

const TOXIC_RIM = rim("#0E3A06", "#4FC21A", "#D6FF7A", 0.6, 9, 7);
const IRON = ["#D8DEE6", "#7A808A", "#363A42", "#9AA0AA"];
const INK_IRON = "#0C0E12";
const SLIME = ["#EEFFA8", "#86E832", "#2E8A0A"];
const INK_SLIME = "#0C3205";

const TOX_IN = 59;
const TOX_OUT = 70.5;
const HAZ_IN = 62.3;
const HAZ_OUT = 67.3;
const TOX_RING = band(TOX_OUT, TOX_IN);
/** The flasks sit on the ring's diagonals. */
const FLASK_ANGLES = [-135, -45, 45, 135];
const FLASK_R = (HAZ_IN + HAZ_OUT) / 2;
const FLASK_SCALE = 1.3;

/** Hazard stripes, slanting, cut across the channel. */
const HAZARD = Array.from({ length: 40 }, (_, k) => {
  const a = k * 9;
  return `M${at(a, HAZ_IN - 1)}L${at(a + 4.5, HAZ_IN - 1)}L${at(a + 10, HAZ_OUT + 1)}L${at(a + 5.5, HAZ_OUT + 1)}Z`;
}).join("");

/** The slime coating the ring's foot: a band that swells over the outer
 *  lip and hangs in lobes. */
const GOO_FROM = 56;
const GOO_TO = 124;
const LOBES = [
  { a: 70, h: 3.4, s: 3.6 },
  { a: 86, h: 5, s: 4.2 },
  { a: 100, h: 2.8, s: 3 },
  { a: 111, h: 4.2, s: 3.6 },
];
const gooOut = (a: number) => {
  const e = Math.pow(Math.sin((Math.PI * (a - GOO_FROM)) / (GOO_TO - GOO_FROM)), 0.6);
  const lobes = LOBES.reduce(
    (s, l) => s + l.h * Math.exp(-(((a - l.a) / l.s) ** 2)),
    0,
  );
  return 68.4 + e * 3 + lobes * e;
};
const gooIn = (a: number) => {
  const e = Math.pow(Math.sin((Math.PI * (a - GOO_FROM)) / (GOO_TO - GOO_FROM)), 0.6);
  return 68.4 - e * (3.6 + 0.7 * Math.sin(a * 0.5));
};
const GOO = (() => {
  const N = 60;
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= N; i++) {
    const a = GOO_FROM + ((GOO_TO - GOO_FROM) * i) / N;
    outer.push(at(a, gooOut(a)));
    inner.push(at(a, gooIn(a)));
  }
  return `M${outer.join("L")}L${inner.reverse().join("L")}Z`;
})();
/** Where the drips hang from: the bottom of each lobe. */
const GOO_TIPS = LOBES.map((l) => polar(l.a * DEG, gooOut(l.a) - 1.4));

/** A round-bottomed flask, its ball's centre at (0, 3). */
const FLASK =
  "M2.3 -2.97L2.3 -10L3.3 -10L3.3 -11.7L-3.3 -11.7L-3.3 -10L-2.3 -10L-2.3 -2.97A6.4 6.4 0 1 0 2.3 -2.97Z";
const FLASK_SHINE = "M-4.6 0.6A5.2 5.2 0 0 1 -2.4 -1.8M-1.3 -4L-1.3 -9";
const CORK = "M-2.3 -11.7L-2.1 -14.2Q0 -15 2.1 -14.2L2.3 -11.7Z";
const COLLAR = "M-3.4 -6.6L3.4 -6.6L3.4 -4.2L-3.4 -4.2Z";

const toxicRing = lazy(() =>
  record((c) => {
    engrave(c, {
      d: TOX_RING,
      evenOdd: true,
      fill: linear(-60, -70, 60, 70, IRON),
      ink: INK_IRON,
      width: 1.3,
      shine: arc(69.4, -168, -108) + arc(60.2, -160, -116),
    });
    // the hazard channel: yellow, striped black
    const ch = toPath(band(HAZ_OUT, HAZ_IN), true);
    if (ch) {
      c.drawPath(ch, brush(linear(-50, -60, 50, 60, ["#FFE65A", "#F2B90A", "#C8900A"])));
      c.save();
      c.clipPath(ch, ClipOp.Intersect, true);
      const stripes = toPath(HAZARD);
      if (stripes) c.drawPath(stripes, brush("#16140E"));
      c.restore();
    }
    const edges = toPath(circle(HAZ_OUT) + circle(HAZ_IN));
    if (edges) c.drawPath(edges, pen(0.8, INK_IRON));
    // rivets round both lips, clear of the flasks
    for (let k = 0; k < 36; k++) {
      const a = k * 10 + 5;
      const near = FLASK_ANGLES.some((f) => Math.abs(((a - f + 540) % 360) - 180) < 9);
      if (near) continue;
      for (const r of [60.65, 68.9]) {
        const p = polar(a * DEG, r);
        stud(c, p.x, p.y, 1.05, ["#FFFFFF", "#9AA0AA", "#3A3E46"], INK_IRON, 0.4);
      }
    }
  }),
);

const gooPicture = lazy(() =>
  record((c) => {
    engrave(c, {
      d: GOO,
      fill: linear(0, 60, 0, 80, SLIME),
      ink: INK_SLIME,
      width: 1,
      shine: arc(66.2, 66, 112),
      shineWidth: 1.1,
    });
    // a few bubbles caught in it
    for (const [a, r, s] of [
      [74, 70.4, 1],
      [92, 71.6, 1.3],
      [106, 69.6, 0.8],
      [62, 68.6, 0.7],
    ]) {
      const p = polar(a * DEG, r);
      stud(c, p.x, p.y, s, ["#FFFFFF", "#C8FF7A", "#5AB01A"], INK_SLIME, 0.35);
    }
  }),
);

/** Glass behind the poison: a pale green tint and a dark depth. */
const flaskBack = lazy(() =>
  record((c) => {
    engrave(c, {
      d: FLASK,
      fill: radial(-1.5, 1, 8, ["#E8FFD8", "#7AA87A", "#2A4A2A"]),
      ink: INK_SLIME,
      width: 0,
      alpha: 0.55,
    });
  }),
);
/** Glass in front: the shine, the outline, cork and iron collar. */
const flaskFront = lazy(() =>
  record((c) => {
    const p = toPath(FLASK);
    const s = toPath(FLASK_SHINE);
    if (s) c.drawPath(s, pen(1, "#FFFFFF", 0.85));
    if (p) c.drawPath(p, pen(0.9, INK_SLIME));
    engrave(c, {
      d: CORK,
      fill: linear(-2, -15, 2, -11, ["#D09A5E", "#8A5A2E", "#5A3618"]),
      ink: "#2A1808",
      width: 0.6,
    });
    engrave(c, {
      d: COLLAR,
      fill: linear(-3, -7, 3, -4, IRON),
      ink: INK_IRON,
      width: 0.6,
    });
    stud(c, 0, -5.4, 0.7, ["#FFFFFF", "#9AA0AA", "#3A3E46"], INK_IRON, 0.3);
  }),
);

/** A drop of slime: a thin neck stretching down to a bulb. */
const STRAND =
  "M-2.6 -1C-1.3 3 -1 5 -1.7 7.6A2.3 2.3 0 1 0 1.7 7.6C1 5 1.3 3 2.6 -1Z";
const STRAND_BULB = 9.15;

/** Slime stretching down from (x, y) until a drop lets go and falls. */
function Strand({
  t,
  x,
  y,
  i,
  size,
  fall = 8,
}: {
  t: Clock;
  x: number;
  y: number;
  i: number;
  size: number;
  fall?: number;
}) {
  const every = 2.6 + rnd(i) * 1.6;
  const off = rnd(i + 5) * every;
  const stretch = useDerivedValue(() => {
    const p = ((t.value + off) % every) / every;
    const s =
      p < 0.8
        ? 0.3 + 1.2 * (p / 0.8) ** 1.8
        : 0.3 + 1.2 * Math.max(0, 1 - (p - 0.8) / 0.06);
    return [
      { translateX: x },
      { translateY: y },
      { scale: size },
      { scaleY: s },
    ];
  });
  const drop = useDerivedValue(() => {
    const p = ((t.value + off) % every) / every;
    const q = Math.max(0, (p - 0.8) / 0.2);
    return [
      { translateX: x },
      { translateY: y + size * (STRAND_BULB * 1.5 + q * q * fall) },
      { scale: size },
    ];
  });
  const dropOpacity = useDerivedValue(() => {
    const p = ((t.value + off) % every) / every;
    return p < 0.8 ? 0 : 1 - ((p - 0.8) / 0.2) ** 2;
  });
  return (
    <Group>
      <Group transform={stretch}>
        <Path path={STRAND}>
          <LinearGradient
            start={vec(-3, 0)}
            end={vec(3, 0)}
            colors={["#C8FF6A", "#5AC81A", "#2E8A0A"]}
          />
        </Path>
        <Path
          path="M-1.2 1.5C-0.8 4 -0.7 6 -1 8"
          style="stroke"
          strokeWidth={0.8}
          strokeCap="round"
          color="#F2FFC0"
          opacity={0.8}
        />
        <Path path={STRAND} style="stroke" strokeWidth={0.8} color={INK_SLIME} />
      </Group>
      <Group transform={drop} opacity={dropOpacity}>
        <Circle cx={0} cy={0} r={2.1}>
          <LinearGradient
            start={vec(-2, -2)}
            end={vec(2, 2)}
            colors={["#D6FF7A", "#5AC81A", "#2E8A0A"]}
          />
        </Circle>
        <Circle cx={0} cy={0} r={2.1} style="stroke" strokeWidth={0.7} color={INK_SLIME} />
        <Circle cx={-0.7} cy={-0.7} r={0.6} color="#FFFFFF" />
      </Group>
    </Group>
  );
}

/** A bubble rising inside a flask's poison. */
function FlaskBubble({ t, i }: { t: Clock; i: number }) {
  const life = 1.1 + rnd(i) * 0.8;
  const x0 = (rnd(i + 2) - 0.5) * 5;
  const size = 0.8 + rnd(i + 4) * 0.6;
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 3) * life) % life) / life;
    return [
      { translateX: x0 + Math.sin(p * 7 + i) * 0.6 },
      { translateY: 8 - p * 7.6 },
    ];
  });
  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={size} color="#F4FFD0" opacity={0.85} />
      <Circle cx={0} cy={0} r={size} style="stroke" strokeWidth={0.35} color="#2E6A0A" />
    </Group>
  );
}

/** A green-glass flask set in the ring, its poison sloshing, bubbling,
 *  glowing, a wisp of bubbles escaping its mouth. */
function Flask({ t, x, y, k }: { t: Clock; x: number; y: number; k: number }) {
  const clip = useMemo(() => toPath(FLASK), []);
  const back = useMemo(() => flaskBack(), []);
  const front = useMemo(() => flaskFront(), []);
  const glow = useDerivedValue(
    () => 0.3 + 0.22 * Math.sin(t.value * 1.6 + k * 1.7),
  );
  const slosh = useDerivedValue(() => [
    { translateY: 0.6 + 0.5 * Math.sin(t.value * 1.3 + k) },
    { rotate: 0.12 * Math.sin(t.value * 1.9 + k * 2.1) },
  ]);
  return (
    <Group
      transform={[
        { translateX: x },
        { translateY: y - 3 * FLASK_SCALE },
        { scale: FLASK_SCALE },
      ]}
    >
      <Circle cx={0} cy={3} r={10} color="#8AFF3A" opacity={glow}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Picture picture={back} />
      {clip ? (
        <Group clip={clip}>
          <Group transform={slosh}>
            <Rect x={-9} y={0} width={18} height={14}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, 10)}
                colors={["#D6FF6A", "#5AD01A", "#1E6A0A"]}
              />
            </Rect>
            <Rect x={-9} y={-0.4} width={18} height={1.1} color="#F0FFB8" />
          </Group>
          {[0, 1, 2].map((j) => (
            <FlaskBubble key={j} t={t} i={k * 10 + j} />
          ))}
        </Group>
      ) : null}
      <Picture picture={front} />
    </Group>
  );
}

/** A bubble rising off the ring and popping. */
function ToxBubble({ t, i }: { t: Clock; i: number }) {
  const life = 2.4 + rnd(i) * 1.8;
  const a = (-168 + 156 * rnd(i + 11)) * DEG;
  const start = polar(a, 71 + rnd(i + 4) * 3);
  const size = 1.3 + rnd(i + 8) * 1.5;
  const transform = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 3) * life) % life) / life;
    const s = p < 0.88 ? 0.55 + (0.45 * p) / 0.88 : 1 + ((p - 0.88) / 0.12) * 0.7;
    return [
      { translateX: start.x + Math.sin(p * 5 + i) * 2.4 },
      { translateY: start.y - p * 15 },
      { scale: s },
    ];
  });
  const opacity = useDerivedValue(() => {
    const p = ((t.value + rnd(i + 3) * life) % life) / life;
    return p < 0.12 ? p / 0.12 : p < 0.88 ? 1 : 1 - (p - 0.88) / 0.12;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={size} color="#7AE02A" opacity={0.35} />
      <Circle cx={0} cy={0} r={size} style="stroke" strokeWidth={0.7} color="#D6FF7A" />
      <Circle cx={-size * 0.35} cy={-size * 0.35} r={size * 0.3} color="#FFFFFF" />
    </Group>
  );
}

function ToxicBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.32 + 0.1 * Math.sin(t.value * 1.4));
  return (
    <Group>
      <Halo r={92} color="#7AE82A" opacity={glow} />
      {Array.from({ length: 9 }, (_, i) => (
        <ToxBubble key={i} t={t} i={i + 600} />
      ))}
    </Group>
  );
}

const FLASK_AT = FLASK_ANGLES.map((a) => polar(a * DEG, FLASK_R));

function ToxicFront({ t }: { t: Clock }) {
  const ring = useMemo(() => toxicRing(), []);
  const goo = useMemo(() => gooPicture(), []);
  return (
    <Group>
      <Fx sksl={RIM_GLOW} t={t} values={TOXIC_RIM} extent={72} />
      {/* ooze running down from under the ring's inner lip */}
      {[-128, -58, -96].map((a, i) => {
        const p = polar(a * DEG, 58.6);
        return <Strand key={i} t={t} x={p.x} y={p.y} i={i + 30} size={0.5} fall={4} />;
      })}
      <Picture picture={ring} />
      <Sweep t={t} d={TOX_RING} evenOdd every={5} />
      {/* slime dripping off the ring's foot */}
      {GOO_TIPS.map((p, i) => (
        <Strand key={i} t={t} x={p.x} y={p.y} i={i + 10} size={0.66} />
      ))}
      <Picture picture={goo} />
      {FLASK_AT.map((p, k) => (
        <Flask key={k} t={t} x={p.x} y={p.y} k={k} />
      ))}
      <Glint t={t} x={FLASK_AT[1].x - 2.5} y={FLASK_AT[1].y - 2} size={4.5} phase={0.5} />
      <Glint t={t} x={FLASK_AT[2].x - 2.5} y={FLASK_AT[2].y - 2} size={3.5} phase={2.6} />
      <Glint t={t} x={-50} y={-36} size={3.5} phase={4.2} />
    </Group>
  );
}

// ══ Divine Light ═════════════════════════════════════════════════════

const DIV_IN = 59;
const DIV_OUT = 70.5;
const IVORY_IN = 61.7;
const IVORY_OUT = 67.9;
const DIV_RING = band(DIV_OUT, DIV_IN);
const DIAMOND: [string, string, string] = ["#FFFFFF", "#BFE4FF", "#2E5A9A"];

/** Gold wire filigree laid in the ivory: hearts of two scrolls, back to
 *  back, a bead between each. */
const FILIGREE = (() => {
  const rc = (IVORY_IN + IVORY_OUT) / 2;
  const units = 16;
  const wires: string[] = [];
  const beads: { x: number; y: number }[] = [];
  for (let k = 0; k < units; k++) {
    const a = (k * 360) / units + 360 / units / 2;
    const q = polar(a * DEG, rc + 2.3);
    for (const dir of [1, -1]) {
      const c = curl(q.x, q.y, (a + dir * 128) * DEG, 10.5, dir * 5.2, 1, 0.6);
      wires.push(c.vein);
    }
    beads.push(polar((a + 180 / units) * DEG, rc));
  }
  return { d: wires.join(""), beads };
})();

const divineRing = lazy(() =>
  record((c) => {
    engrave(c, {
      d: DIV_RING,
      evenOdd: true,
      fill: linear(-60, -70, 60, 70, GOLD),
      ink: INK_GOLD,
      width: 1.3,
      shine: arc(69.5, -168, -108),
    });
    engrave(c, {
      d: band(IVORY_OUT, IVORY_IN),
      evenOdd: true,
      fill: linear(-60, -70, 60, 70, IVORY),
      ink: INK_GOLD,
      width: 0.8,
      shine: arc(66.6, -165, -115),
    });
    const ch = toPath(band(IVORY_OUT, IVORY_IN), true);
    if (ch) {
      c.save();
      c.clipPath(ch, ClipOp.Intersect, true);
      const wire = toPath(FILIGREE.d);
      if (wire) {
        c.drawPath(wire, pen(1.9, VEIN_GOLD));
        c.drawPath(wire, pen(0.9, "#F6D274"));
      }
      c.restore();
    }
    for (const b of FILIGREE.beads) {
      const near = [0, 90, 180, 270].some(
        (d) => Math.hypot(b.x - polar(d * DEG, 64.8).x, b.y - polar(d * DEG, 64.8).y) < 6,
      );
      if (!near) stud(c, b.x, b.y, 1.15, GOLD.slice(0, 3), INK_GOLD, 0.4);
    }
    // pearls in gold cups at the top and the shoulders
    for (const a of [-90, 0, 180]) {
      const p = polar(a * DEG, (IVORY_IN + IVORY_OUT) / 2);
      stud(c, p.x, p.y, 4.4, GOLD.slice(0, 3), INK_GOLD, 0.9);
      stud(c, p.x, p.y, 2.9, ["#FFFFFF", "#F6F0FA", "#B8AEC6"], INK_GOLD, 0.5);
    }
    // the diamond's bezel at the foot
    stud(c, 0, (IVORY_IN + IVORY_OUT) / 2, 6.6, GOLD.slice(0, 3), INK_GOLD, 1.1);
  }),
);

/** One small ivory wing, the right one, rooted behind the ring's side. */
const WING_ROOT = { x: 58, y: -18 };
const wingPicture = lazy(() =>
  record((c) => {
    const feather = (
      a: number,
      ra: number,
      rr: number,
      len: number,
      w: number,
      fill: string[],
    ) => {
      const root = polar(ra * DEG, rr);
      c.save();
      c.translate(root.x, root.y);
      c.rotate(a + 90, 0, 0);
      const barbs = [0.35, 0.55, 0.75]
        .map((s) => {
          const y = -len * s;
          return `M0 ${f2(y)}L${f2(w * 0.7)} ${f2(y - len * 0.12)}`;
        })
        .join("");
      engrave(c, {
        d: FEATHER(len, w),
        fill: linear(-w, -len, w, 0, fill),
        ink: INK_GOLD,
        width: 0.9,
        vein: `M0 -1L0 ${f2(-len * 0.9)}${barbs}`,
        veinColor: VEIN_GOLD,
        veinWidth: 0.55,
        shine: `M${f2(-w * 0.45)} ${f2(-len * 0.25)}L${f2(-w * 0.35)} ${f2(-len * 0.75)}`,
        shineWidth: 0.8,
      });
      c.restore();
    };
    // long flight feathers, back to front from the top
    const long = [
      [-84, -34, 20, 3.6],
      [-70, -29, 24, 4],
      [-56, -24, 28, 4.4],
      [-43, -19, 30, 4.7],
      [-30, -14, 30, 4.8],
      [-17, -9, 28.5, 4.8],
      [-5, -4, 26, 4.6],
    ];
    for (const [a, ra, len, w] of long)
      feather(a, ra, 62.5, len, w, ["#FFFFFF", "#F4EEDF", "#D8CCB0"]);
    // short coverts over their roots, warmer
    const short = [
      [-66, -27, 13, 4],
      [-50, -21, 15, 4.3],
      [-34, -15, 16.5, 4.5],
      [-18, -9, 17, 4.6],
      [-4, -4, 15, 4.4],
    ];
    for (const [a, ra, len, w] of short)
      feather(a, ra, 64.5, len, w, ["#FFFDF4", "#F2E6C8", "#D2BC8A"]);
  }),
);

function Wing({ t, flip }: { t: Clock; flip: boolean }) {
  const pic = useMemo(() => wingPicture(), []);
  const sway = useDerivedValue(() => [
    { rotate: Math.sin(t.value * 1.1 + (flip ? 0.5 : 0)) * 0.035 },
  ]);
  return (
    <Group transform={flip ? [{ scaleX: -1 }] : undefined}>
      <Group transform={sway} origin={vec(WING_ROOT.x, WING_ROOT.y)}>
        <Picture picture={pic} />
      </Group>
    </Group>
  );
}

/** A soft wave of light breathing out from the ring. */
function ChoirWave({ t, k }: { t: Clock; k: number }) {
  const every = 4.4;
  const r = useDerivedValue(
    () => 68 + (((t.value + k * every * 0.5) % every) / every) * 22,
  );
  const opacity = useDerivedValue(() => {
    const p = ((t.value + k * every * 0.5) % every) / every;
    return Math.min(1, p * 5) * (1 - p) * 0.55;
  });
  return (
    <Circle cx={0} cy={0} r={r} style="stroke" strokeWidth={5} color="#FFF4C8" opacity={opacity}>
      <BlurMask blur={4} style="normal" />
    </Circle>
  );
}

/** Long and short shafts of light, fanned out from behind the ring. */
const SHAFTS = Array.from({ length: 32 }, (_, k) => {
  const a = ((k * 360) / 32) * DEG;
  const long = k % 2 === 0;
  const w = long ? 3 : 2;
  const across = { x: -Math.sin(a) * w, y: Math.cos(a) * w };
  const base = polar(a, 62);
  const tip = polar(a, long ? 91 : 80);
  return `M${f2(base.x + across.x)} ${f2(base.y + across.y)}L${pt(tip)}L${f2(base.x - across.x)} ${f2(base.y - across.y)}Z`;
}).join("");

function DivineBack({ t }: { t: Clock }) {
  const glow = useDerivedValue(() => 0.42 + 0.14 * Math.sin(t.value * 0.9));
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.04 }]);
  const shine = useDerivedValue(() => 0.7 + 0.25 * Math.sin(t.value * 0.9));
  return (
    <Group>
      <Halo r={94} color="#FFE08A" opacity={glow} />
      <Fx sksl={RAYS} t={t} />
      <Group transform={turn} opacity={shine} blendMode="screen">
        <Path path={SHAFTS}>
          <RadialGradient
            c={vec(0, 0)}
            r={91}
            colors={["#FFFFFF", "#FFF0B8", "#FFE08A00"]}
            positions={[0.68, 0.82, 1]}
          />
        </Path>
      </Group>
      <ChoirWave t={t} k={0} />
      <ChoirWave t={t} k={1} />
      <Wing t={t} flip={false} />
      <Wing t={t} flip />
    </Group>
  );
}

const HALO_RING = ellipse(0, 0, 19, 6) + ellipse(0, 0, 14.4, 2.9);
const haloPicture = lazy(() =>
  record((c) => {
    engrave(c, {
      d: HALO_RING,
      evenOdd: true,
      fill: linear(-16, -6, 16, 6, GOLD),
      ink: INK_GOLD,
      width: 1,
      vein: ellipse(0, 0, 16.6, 4.4),
      veinColor: VEIN_GOLD,
      shine: "M-16.8 -1.8Q-11.5 -5.2 -2 -5.5",
    });
  }),
);

/** The gold halo floating over the ring, bobbing, glowing. */
function FloatingHalo({ t }: { t: Clock }) {
  const pic = useMemo(() => haloPicture(), []);
  const bob = useDerivedValue(() => [
    { translateY: -81 + Math.sin(t.value * 1.2) * 1.5 },
  ]);
  const glow = useDerivedValue(() => 0.55 + 0.3 * Math.sin(t.value * 0.9));
  return (
    <Group transform={bob}>
      <Path
        path={ellipse(0, 0, 16.6, 4.4)}
        style="stroke"
        strokeWidth={6}
        color="#FFE89A"
        opacity={glow}
      >
        <BlurMask blur={4} style="normal" />
      </Path>
      <Picture picture={pic} />
      <Sweep t={t} d={HALO_RING} evenOdd every={5.2} phase={2.4} />
    </Group>
  );
}

function DivineFront({ t }: { t: Clock }) {
  const ring = useMemo(() => divineRing(), []);
  const beat = useDerivedValue(() => 0.45 + 0.35 * Math.sin(t.value * 0.9));
  const yJ = (IVORY_IN + IVORY_OUT) / 2;
  return (
    <Group>
      <Fx sksl={GOLD_RIM} t={t} extent={68} />
      <Picture picture={ring} />
      <Sweep t={t} d={DIV_RING} evenOdd every={5.2} />
      <Circle cx={0} cy={yJ} r={9} color="#FFF4D0" opacity={beat}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Gem x={0} y={yJ} w={8.6} h={8.6} colors={DIAMOND} />
      <FloatingHalo t={t} />
      <Sparks
        t={t}
        count={7}
        from={-Math.PI}
        to={0}
        r={72}
        rise={16}
        color="#FFF0B0"
        size={1.5}
        seed={71}
      />
      <Glint t={t} x={-1.5} y={yJ - 1.5} size={5} phase={0.3} />
      <Glint t={t} x={-10} y={-83} size={4.5} phase={2} />
      <Glint t={t} x={-1} y={-66} size={3.5} phase={3.6} />
    </Group>
  );
}

// ══ Prism ════════════════════════════════════════════════════════════

const PR_IN = 59;
const PR_OUT = 70.5;
const GL_IN = 61.4;
const GL_OUT = 67.9;
const GL_MID = (GL_IN + GL_OUT) / 2;
const PRISM_RING = band(PR_OUT, PR_IN);
const GLASS = band(GL_OUT, GL_IN);
const FACETS = 24;

/** The cut-glass facets: each a little pyramid of four triangles. */
const FACET_CUTS = (() => {
  const outer: string[] = [];
  const inner: string[] = [];
  const left: string[] = [];
  const right: string[] = [];
  const lines: string[] = [];
  const step = 360 / FACETS;
  for (let k = 0; k < FACETS; k++) {
    const a0 = k * step;
    const a1 = a0 + step;
    const C = at(a0 + step / 2, GL_MID);
    const O0 = at(a0, GL_OUT);
    const O1 = at(a1, GL_OUT);
    const I0 = at(a0, GL_IN);
    const I1 = at(a1, GL_IN);
    outer.push(`M${O0}A${GL_OUT} ${GL_OUT} 0 0 1 ${O1}L${C}Z`);
    inner.push(`M${I0}A${GL_IN} ${GL_IN} 0 0 1 ${I1}L${C}Z`);
    left.push(`M${O0}L${I0}L${C}Z`);
    right.push(`M${O1}L${I1}L${C}Z`);
    lines.push(`M${O0}L${I0}M${C}L${O0}M${C}L${O1}M${C}L${I0}M${C}L${I1}`);
  }
  return {
    outer: outer.join(""),
    inner: inner.join(""),
    left: left.join(""),
    right: right.join(""),
    lines: lines.join(""),
  };
})();

const prismSilver = lazy(() =>
  record((c) => {
    engrave(c, {
      d: PRISM_RING,
      evenOdd: true,
      fill: linear(-60, -70, 60, 70, SILVER),
      ink: INK_STEEL,
      width: 1.2,
      shine: arc(69.5, -168, -108) + arc(60.1, -160, -116),
    });
  }),
);

/** Over the turning rainbow: frost the glass, shade the facets, cut
 *  their edges in. */
const prismFacets = lazy(() =>
  record((c) => {
    const glass = toPath(GLASS, true);
    if (!glass) return;
    c.save();
    c.clipPath(glass, ClipOp.Intersect, true);
    c.drawPath(glass, brush("#FFFFFF", 0.3));
    const shadeIn = (d: string, color: string, alpha: number) => {
      const p = toPath(d);
      if (p) c.drawPath(p, brush(color, alpha));
    };
    shadeIn(FACET_CUTS.outer, "#FFFFFF", 0.5);
    shadeIn(FACET_CUTS.left, "#FFFFFF", 0.18);
    shadeIn(FACET_CUTS.right, "#0A1424", 0.14);
    shadeIn(FACET_CUTS.inner, "#0A1424", 0.3);
    const lines = toPath(FACET_CUTS.lines);
    if (lines) c.drawPath(lines, pen(0.4, INK_STEEL, 0.55));
    c.restore();
    c.drawPath(glass, pen(0.8, INK_STEEL));
  }),
);

/** The prism on top: a glass triangle, bevelled, on a silver mount. */
const PRISM_TOP = -91;
const PRISM_BASE = -73.4;
const PRISM_HALF = 10.2;
const PRISM_TRI = `M0 ${PRISM_TOP}L${-PRISM_HALF} ${PRISM_BASE}L${PRISM_HALF} ${PRISM_BASE}Z`;
const prismPicture = lazy(() =>
  record((c) => {
    // the mount, gripping the ring's crown
    engrave(c, {
      d: `M-11.5 ${PRISM_BASE + 0.4}L11.5 ${PRISM_BASE + 0.4}L7.5 -68.4Q0 -66.6 -7.5 -68.4Z`,
      fill: linear(-10, -76, 10, -66, SILVER),
      ink: INK_STEEL,
      width: 0.9,
      shine: `M-9.4 ${PRISM_BASE + 1.6}L4 ${PRISM_BASE + 1.6}`,
    });
    // the glass
    const cy = (PRISM_TOP + 2 * PRISM_BASE) / 3;
    const k = 0.5;
    const ix = PRISM_HALF * k;
    const top = cy + (PRISM_TOP - cy) * k;
    const base = cy + (PRISM_BASE - cy) * k;
    const faceL = `M0 ${PRISM_TOP}L${-PRISM_HALF} ${PRISM_BASE}L${-ix} ${base}L0 ${top}Z`;
    const faceR = `M0 ${PRISM_TOP}L${PRISM_HALF} ${PRISM_BASE}L${ix} ${base}L0 ${top}Z`;
    const faceB = `M${-PRISM_HALF} ${PRISM_BASE}L${PRISM_HALF} ${PRISM_BASE}L${ix} ${base}L${-ix} ${base}Z`;
    const face = `M0 ${top}L${-ix} ${base}L${ix} ${base}Z`;
    engrave(c, {
      d: PRISM_TRI,
      fill: linear(-8, -90, 8, -74, ["#FFFFFF", "#DCEAFF", "#9AB4E0"]),
      ink: INK_STEEL,
      width: 0,
      alpha: 0.85,
    });
    const tint = (d: string, color: string, alpha: number) => {
      const p = toPath(d);
      if (p) c.drawPath(p, brush(color, alpha));
    };
    tint(faceL, "#FFFFFF", 0.55);
    tint(faceR, "#2A3A6A", 0.18);
    tint(faceB, "#2A3A6A", 0.3);
    tint(face, "#FFFFFF", 0.35);
    // the beam crossing inside it, splitting
    c.drawPath(
      toPath(`M${-PRISM_HALF / 2} -82.2L${PRISM_HALF / 2 - 0.4} -82.8`)!,
      pen(1, "#FFFFFF", 0.9),
    );
    for (const [dy, color] of [
      [-1.6, "#FF5A4A"],
      [0, "#5AE85A"],
      [1.6, "#7A6AFF"],
    ] as const) {
      const l = toPath(`M0.5 -82.4L${PRISM_HALF / 2 - 0.2} ${-82.8 + dy}`);
      if (l) c.drawPath(l, pen(0.8, color, 0.85));
    }
    const cuts = toPath(
      `M0 ${PRISM_TOP}L0 ${top}M${-PRISM_HALF} ${PRISM_BASE}L${-ix} ${base}M${PRISM_HALF} ${PRISM_BASE}L${ix} ${base}${face}`,
    );
    if (cuts) c.drawPath(cuts, pen(0.45, INK_STEEL, 0.7));
    const shine = toPath(`M-1.4 ${PRISM_TOP + 3.4}L${-PRISM_HALF + 3} ${PRISM_BASE - 1.6}`);
    if (shine) c.drawPath(shine, pen(0.9, "#FFFFFF", 0.95));
    const edge = toPath(PRISM_TRI);
    if (edge) c.drawPath(edge, pen(1, INK_STEEL));
  }),
);

/** The white beam coming in from the upper left, and the spectrum it
 *  splits into, wrapping round the ring clockwise and fading. */
const SPECTRUM = `
uniform float t;
uniform float flash;
vec3 hue(float h) { return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
half4 main(vec2 xy) {
  float r = length(xy);
  float ang = atan(xy.y, xy.x);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  // the fan: from just right of the top, clockwise round the ring
  float u = (ang + 1.5) / 2.9;
  if (u > 0.0 && u < 1.0) {
    float w = 2.2 + 6.8 * sqrt(u);
    float c = 82.0 - 3.0 * u;
    float s = (r - c) / w;
    if (abs(s) < 1.0) {
      float edge = 1.0 - smoothstep(0.7, 1.0, abs(s));
      float fade = smoothstep(0.0, 0.05, u) * (1.0 - smoothstep(0.35, 1.0, u));
      float shimmer = 0.7 + 0.3 * sin(u * 22.0 - t * 2.6);
      float a = edge * fade * shimmer * 0.85;
      col = hue((0.5 - s * 0.5) * 0.78) * a;
      alpha = a;
    }
  }
  // the beam
  vec2 A = vec2(-96.0, -91.5);
  vec2 B = vec2(-5.1, -82.2);
  vec2 ab = B - A;
  float h = clamp(dot(xy - A, ab) / dot(ab, ab), 0.0, 1.0);
  float d = length(xy - A - ab * h);
  float beam = (exp(-d * d / 1.4) + exp(-d * d / 14.0) * 0.35)
    * smoothstep(0.0, 0.35, h) * (0.85 + 0.15 * sin(t * 4.0 + h * 9.0) + flash * 0.1);
  beam = clamp(beam, 0.0, 1.0);
  col = col * (1.0 - beam) + vec3(1.0, 0.99, 0.94) * beam;
  alpha = alpha * (1.0 - beam) + beam;
  return half4(col, alpha);
}`;

/** A spark of refracted light running round the glass. */
function Refraction({
  t,
  speed,
  phase,
  color,
}: {
  t: Clock;
  speed: number;
  phase: number;
  color: string;
}) {
  const star = "M0 -5.6Q0.8 -0.8 5.6 0Q0.8 0.8 0 5.6Q-0.8 0.8 -5.6 0Q-0.8 -0.8 0 -5.6Z";
  const transform = useDerivedValue(() => {
    const a = t.value * speed + phase;
    const tw = 0.75 + 0.3 * Math.sin(t.value * 7 + phase * 3);
    return [
      { translateX: Math.cos(a) * GL_MID },
      { translateY: Math.sin(a) * GL_MID },
      { scale: tw },
    ];
  });
  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={4.4} color={color} opacity={0.75}>
        <BlurMask blur={3} style="normal" />
      </Circle>
      <Path path={star} color="#FFFFFF" />
    </Group>
  );
}

const RAINBOW = [
  "#FF4A4A",
  "#FFB23A",
  "#FFF04A",
  "#4AE87A",
  "#4AC8FF",
  "#7A6AFF",
  "#E85AE8",
  "#FF4A4A",
];

function PrismBack({ t }: { t: Clock }) {
  return (
    <Group>
      <Fx sksl={PRISM_GLOW} t={t} />
      <Fx sksl={SPECTRUM} t={t} extent={96} />
    </Group>
  );
}

function PrismFront({ t }: { t: Clock }) {
  const silver = useMemo(() => prismSilver(), []);
  const facets = useMemo(() => prismFacets(), []);
  const prism = useMemo(() => prismPicture(), []);
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.4 }]);
  return (
    <Group>
      <Fx sksl={PRISM_RIM} t={t} extent={68} />
      <Picture picture={silver} />
      {/* the glass, a rainbow turning in it */}
      <Group transform={turn}>
        <Path path={GLASS} fillType="evenOdd">
          <SweepGradient c={vec(0, 0)} colors={RAINBOW} />
        </Path>
      </Group>
      <Picture picture={facets} />
      <Sweep t={t} d={PRISM_RING} evenOdd every={4.6} />
      <Refraction t={t} speed={0.55} phase={0} color="#FF6A4A" />
      <Refraction t={t} speed={0.42} phase={2.1} color="#4AE8C8" />
      <Refraction t={t} speed={0.5} phase={4.2} color="#9A6AFF" />
      <Picture picture={prism} />
      <Glint t={t} x={-2} y={-85} size={5} phase={0.2} />
      <Glint t={t} x={-46} y={-44} size={4} phase={1.9} />
      <Glint t={t} x={40} y={50} size={3.5} phase={3.3} />
    </Group>
  );
}

export const RADIANCE_ART: Record<string, ArtBorderDrawing> = {
  toxic: { back: ToxicBack, front: ToxicFront },
  "divine-light": { back: DivineBack, front: DivineFront },
  prism: { back: PrismBack, front: PrismFront },
};

