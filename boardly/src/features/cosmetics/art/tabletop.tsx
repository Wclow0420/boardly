// Dice Orbit and Card Fan, engraved in the house style.
//   Dice Orbit — a gold track ring cut like a game board's edge (two
//     grooves, a notch for every space, studs between), and six ivory
//     dice rolling round it. Each die is a real little cube, seen from
//     a little above: it tips over edge by edge as it goes, so its faces
//     come and go, and now and then one hops, turns over in the air and
//     lands with a bounce.
//   Card Fan — a hand of seven cards fanned behind the top of the
//     picture, breathing open and shut: engraved crimson and navy backs,
//     two number cards, and a gold-edged ace of spades on top. Now and
//     then a card lifts and turns over to show its face, then turns
//     back. A gold ring round the picture is set with suit studs and a
//     ruby heart at its foot.
// See heraldry.tsx and crest.tsx for the house style.

import {
  BlurMask,
  Circle,
  FillType,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Skia,
  vec,
  type Matrix4,
} from "@shopify/react-native-skia";
import { useMemo, type ReactNode } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { Sweep } from "./crowns";
import {
  Glint,
  Halo,
  TAU,
  polar,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

const GOLD = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
const IVORY = ["#FFFFFF", "#F4EEDF", "#D8CCB0"];
const CRIMSON = ["#E05A6A", "#B01C34", "#6A0A18"];
const NAVY = ["#6A8AC8", "#2A4A8A", "#14244A"];
const EBONY = ["#6A7080", "#2A2E36", "#0E1014"];
const RUBY: [string, string, string] = ["#FF9AA6", "#D0102E", "#5A0410"];
const INK = "#3A2408";
const VEIN_GOLD = "#7A5212";
const VEIN_IVORY = "#A08A60";
const DEG = Math.PI / 180;

const f2 = (n: number) => n.toFixed(2);
const circle = (r: number) =>
  `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
/** A ring between two radii; the hole winds the other way, so it stays
 *  open even where the path is used as a plain clip (the Sweep). */
const ring = (outer: number, inner: number) =>
  circle(outer) +
  `M${inner} 0A${inner} ${inner} 0 1 0 ${-inner} 0A${inner} ${inner} 0 1 0 ${inner} 0Z`;
const arc = (r: number, a0: number, a1: number) => {
  const p = polar(a0 * DEG, r);
  const q = polar(a1 * DEG, r);
  return `M${f2(p.x)} ${f2(p.y)}A${r} ${r} 0 0 1 ${f2(q.x)} ${f2(q.y)}`;
};
/** A rounded rectangle centred on the origin, as path data. */
const rrect = (w: number, h: number, r: number) => {
  const x = w / 2;
  const y = h / 2;
  return (
    `M${-x + r} ${-y}H${x - r}Q${x} ${-y} ${x} ${-y + r}V${y - r}` +
    `Q${x} ${y} ${x - r} ${y}H${-x + r}Q${-x} ${y} ${-x} ${y - r}` +
    `V${-y + r}Q${-x} ${-y} ${-x + r} ${-y}Z`
  );
};

/** An engraved piece: filled with its material, veins and shine cut in,
 *  inked round. */
function Metal({
  d,
  colors,
  ink = INK,
  vein,
  veinColor = VEIN_GOLD,
  veinWidth = 0.8,
  shine,
  evenOdd,
  width = 1.4,
  from = vec(-60, -70),
  to = vec(60, 70),
}: {
  d: string;
  colors: readonly string[];
  ink?: string;
  vein?: string;
  veinColor?: string;
  veinWidth?: number;
  shine?: string;
  evenOdd?: boolean;
  width?: number;
  from?: ReturnType<typeof vec>;
  to?: ReturnType<typeof vec>;
}) {
  const fill = evenOdd ? "evenOdd" : "winding";
  const clip = useMemo(() => {
    const path = Skia.Path.MakeFromSVGString(d);
    if (path && evenOdd) path.setFillType(FillType.EvenOdd);
    return path;
  }, [d, evenOdd]);
  return (
    <Group>
      <Path path={d} fillType={fill}>
        <LinearGradient start={from} end={to} colors={[...colors]} />
      </Path>
      {clip ? (
        <Group clip={clip}>
          {vein ? (
            <Path
              path={vein}
              style="stroke"
              strokeWidth={veinWidth}
              strokeCap="round"
              color={veinColor}
              opacity={0.75}
            />
          ) : null}
          {shine ? (
            <Path
              path={shine}
              style="stroke"
              strokeWidth={width * 0.85}
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

/** A domed gold stud. */
function Stud({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <Group>
      <Circle cx={x} cy={y} r={r}>
        <RadialGradient
          c={vec(x - r * 0.4, y - r * 0.45)}
          r={r * 1.6}
          colors={["#FFFBE0", "#E2B04A", "#7A5212"]}
        />
      </Circle>
      <Circle
        cx={x}
        cy={y}
        r={r}
        style="stroke"
        strokeWidth={0.7}
        color={INK}
      />
    </Group>
  );
}

// ── Dice Orbit ───────────────────────────────────────────────────────

/** The track: a gold band from the picture's edge to 62. */
const TRACK = ring(62, 50.5);
const TRACK_VEINS =
  circle(53.4) +
  circle(59.2) +
  Array.from({ length: 36 }, (_, k) => {
    const a = (k * 10 + 5) * DEG;
    const p = polar(a, 59.2);
    const q = polar(a, 62);
    return `M${f2(p.x)} ${f2(p.y)}L${f2(q.x)} ${f2(q.y)}`;
  }).join("");
/** The sunk channel between the grooves, darker where the light misses. */
const TRACK_CHANNEL = ring(59.2, 53.4);
const TRACK_SHINE = arc(60.6, -168, -112) + arc(51.9, -160, -122);
const TRACK_STUDS = Array.from({ length: 12 }, (_, k) =>
  polar((k * 30 + 15) * DEG, 56.3),
);

const DICE = 6;
/** The dice roll round at this radius, just off the track. */
const ORBIT = 72;
/** A die's edge. */
const EDGE = 16;
/** How long one step takes: a quick tip over, then a rest. */
const STEP = 1.8;
/** The camera looks down a little from in front, so a die shows its top
 *  and a side or two. */
const TILT = 0.62;
/** Every sixth step is a hop. */
const HOP_AT = 3;

type M3 = number[];

const mul = (a: M3, b: M3): M3 => {
  "worklet";
  const out = new Array<number>(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 3 + c] =
        a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    }
  }
  return out;
};
/** Turned by `a` about the x axis (the way the die is going: across it). */
const rotX = (a: number): M3 => {
  "worklet";
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
};
const rotY = (a: number): M3 => {
  "worklet";
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
};
const rotZ = (a: number): M3 => {
  "worklet";
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};
const round = (m: M3) => m.map((v) => Math.round(v));
const smooth = (x: number) => {
  "worklet";
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

// In a die's own frame x points out from the picture, y the way it
// rolls and z up off the table. A roll tips the top forward; a hop turns
// it over end to end and onto its side.
const ROLL = round(rotX(-Math.PI / 2));
const HOP = round(mul(rotY(Math.PI / 2), rotX(-Math.PI)));
/** How far each step of the six carries a die, in edges. */
const STEP_LEN = [1, 1, 1, 2, 1, 1];
const CYCLE_LEN = STEP_LEN.reduce((a, b) => a + b, 0);
/** The resting turn after every step, round until it repeats. */
const ORIENT: number[] = (() => {
  const all: M3[] = [];
  let m: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let k = 0; k < 6 * 24; k++) {
    if (k > 0 && k % 6 === 0 && m.join() === "1,0,0,0,1,0,0,0,1") break;
    all.push(m);
    m = round(mul(k % 6 === HOP_AT ? HOP : ROLL, m));
  }
  return all.flat();
})();
const PERIOD = ORIENT.length / 9;
/** How each die lies at the start, so no two show the same. */
const START: M3[] = [
  [1, 0, 0, 0, 1, 0, 0, 0, 1],
  round(rotY(Math.PI / 2)),
  round(rotX(Math.PI / 2)),
  round(mul(rotZ(Math.PI / 2), rotY(-Math.PI / 2))),
  round(rotX(Math.PI)),
  round(mul(rotZ(Math.PI / 2), rotX(-Math.PI / 2))),
];

/** The faces: value, normal, and the two edges the face is drawn on. */
const FACES: { value: number; n: number[]; u: number[]; v: number[] }[] = [
  { value: 1, n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { value: 6, n: [0, 0, -1], u: [1, 0, 0], v: [0, -1, 0] },
  { value: 2, n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, -1] },
  { value: 5, n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { value: 3, n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { value: 4, n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, -1] },
];

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
};

/** Light from the top left, a little in front. */
const LIGHT = [-0.45, -0.55, 0.7];

// A face is drawn on a unit square, then laid on the cube.
const FACE = rrect(1, 1, 0.13);
const FACE_BODY = rrect(1.02, 1.02, 0.02);
const FACE_BEVEL = rrect(0.78, 0.78, 0.1);
const FACE_SHINE = "M-0.36 -0.4H0.22M-0.4 -0.34V0.1";

interface DiePose {
  /** Body frame to screen (3×3, rows), at the die's size. */
  m: M3;
  x: number;
  y: number;
  /** Height off the table. */
  lift: number;
}

function useDiePose(t: Clock, i: number): SharedValue<DiePose> {
  // each die rolls a little after the one before; the hops come round
  // one die at a time
  // (so they tip in a ripple round the ring, and all lie still at the
  // moment a small border's clock stands still on)
  const late = (i / DICE) * (STEP / 2) + 1.1;
  const first = (DICE - i) % DICE;
  const start = START[i];
  // where the die stands at its first step, so the six start evenly
  let skip = Math.floor(first / 6) * CYCLE_LEN;
  for (let s = 0; s < first % 6; s++) skip += STEP_LEN[s];
  const home = (i / DICE) * TAU - Math.PI / 2 - (skip * EDGE) / ORBIT;
  return useDerivedValue(() => {
    const clock = (t.value + late) / STEP;
    const k = Math.floor(clock) + first;
    const u = clock - Math.floor(clock);
    const j = ((k % 6) + 6) % 6;
    const hop = j === HOP_AT;
    // the step: a tip over in the first third, a hop in the first half
    const e = smooth(u / (hop ? 0.5 : 0.32));
    let along = Math.floor(k / 6) * CYCLE_LEN;
    for (let s = 0; s < j; s++) along += STEP_LEN[s];
    along += e * STEP_LEN[j];
    const a = home + (along * EDGE) / ORBIT;
    let turn: M3;
    let lift: number;
    if (hop) {
      turn = mul(rotY((Math.PI / 2) * e), rotX(-Math.PI * e));
      const b = (u - 0.5) / 0.32;
      lift =
        u < 0.5
          ? 4 * e * (1 - e) * 5
          : b < 1
            ? 1.8 * Math.abs(Math.sin(b * TAU)) * (1 - b)
            : 0;
    } else {
      turn = rotX((-Math.PI / 2) * e);
      // tipping over its edge lifts its middle a little
      lift =
        (EDGE / 2) *
        (Math.SQRT2 * Math.cos(Math.PI / 4 - (e * Math.PI) / 2) - 1);
    }
    const o = (((k % PERIOD) + PERIOD) % PERIOD) * 9;
    const rest = [
      ORIENT[o],
      ORIENT[o + 1],
      ORIENT[o + 2],
      ORIENT[o + 3],
      ORIENT[o + 4],
      ORIENT[o + 5],
      ORIENT[o + 6],
      ORIENT[o + 7],
      ORIENT[o + 8],
    ];
    // body → table (facing along the orbit) → camera
    const body = mul(mul(turn, rest), start);
    const table = mul(rotZ(a), body);
    const view = mul(rotX(-TILT), table);
    const p = polar(a, ORBIT);
    return { m: view, x: p.x, y: p.y, lift };
  });
}

function DieFace({
  pose,
  face,
}: {
  pose: SharedValue<DiePose>;
  face: (typeof FACES)[number];
}) {
  const { n, u, v, value } = face;
  const look = useDerivedValue(() => {
    const { m, x, y, lift } = pose.value;
    const at = (w: number[]) => [
      m[0] * w[0] + m[1] * w[1] + m[2] * w[2],
      m[3] * w[0] + m[4] * w[1] + m[5] * w[2],
      m[6] * w[0] + m[7] * w[1] + m[8] * w[2],
    ];
    const N = at(n);
    const U = at(u);
    const V = at(v);
    const grow = 1 + lift * 0.022;
    const s = EDGE * grow;
    const cx = x + N[0] * (s / 2);
    const cy = y - lift + N[1] * (s / 2);
    const lit = (N[0] * LIGHT[0] + N[1] * LIGHT[1] + N[2] * LIGHT[2]) / 0.997;
    return {
      matrix: [
        U[0] * s,
        V[0] * s,
        0,
        cx,
        U[1] * s,
        V[1] * s,
        0,
        cy,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      ] as unknown as Matrix4,
      shown: Math.min(1, Math.max(0, N[2] * 10)),
      shade: 0.46 * (1 - Math.max(0, lit)) ** 1.2,
    };
  });
  const transform = useDerivedValue(() => [{ matrix: look.value.matrix }]);
  const opacity = useDerivedValue(() => look.value.shown);
  const shade = useDerivedValue(() => look.value.shade);
  return (
    <Group transform={transform} opacity={opacity}>
      {/* ink under the face fills the cube's corners */}
      <Path path={FACE_BODY} color={INK} />
      <Path path={FACE}>
        <LinearGradient
          start={vec(-0.5, -0.5)}
          end={vec(0.5, 0.5)}
          colors={IVORY}
        />
      </Path>
      <Path
        path={FACE_BEVEL}
        style="stroke"
        strokeWidth={0.035}
        color={VEIN_IVORY}
        opacity={0.6}
      />
      <Path
        path={FACE_SHINE}
        style="stroke"
        strokeWidth={0.06}
        strokeCap="round"
        color="#FFFFFF"
      />
      {PIPS[value].map(([px, py], k) =>
        value === 1 ? (
          <Group key={k}>
            <Circle cx={0} cy={0} r={0.19}>
              <RadialGradient c={vec(-0.06, -0.07)} r={0.26} colors={RUBY} />
            </Circle>
            <Circle
              cx={0}
              cy={0}
              r={0.19}
              style="stroke"
              strokeWidth={0.045}
              color="#3A0408"
            />
            <Circle cx={-0.06} cy={-0.07} r={0.05} color="#FFFFFFCC" />
          </Group>
        ) : (
          <Circle key={k} cx={px * 0.26} cy={py * 0.26} r={0.105}>
            <RadialGradient
              c={vec(px * 0.26 + 0.03, py * 0.26 + 0.04)}
              r={0.14}
              colors={["#5A4028", "#1E140A"]}
            />
          </Circle>
        ),
      )}
      <Path path={FACE} color="#5A3A14" opacity={shade} />
      <Path
        path={FACE}
        style="stroke"
        strokeWidth={0.075}
        strokeJoin="round"
        color={INK}
      />
    </Group>
  );
}

function Die({ pose }: { pose: SharedValue<DiePose> }) {
  return (
    <Group>
      {FACES.map((face) => (
        <DieFace key={face.value} pose={pose} face={face} />
      ))}
    </Group>
  );
}

function DieShadow({ pose }: { pose: SharedValue<DiePose> }) {
  const transform = useDerivedValue(() => {
    const { x, y, lift } = pose.value;
    return [
      { translateX: x + 1.5 },
      { translateY: y + 4 },
      { scale: 1 - lift * 0.03 },
    ];
  });
  const opacity = useDerivedValue(() => 0.4 - pose.value.lift * 0.025);
  return (
    <Group transform={transform} opacity={opacity}>
      <Oval x={-10} y={-6.5} width={20} height={13} color="#000000">
        <BlurMask blur={2.6} style="normal" />
      </Oval>
    </Group>
  );
}

function DiceFront({ t }: { t: Clock }) {
  const p0 = useDiePose(t, 0);
  const p1 = useDiePose(t, 1);
  const p2 = useDiePose(t, 2);
  const p3 = useDiePose(t, 3);
  const p4 = useDiePose(t, 4);
  const p5 = useDiePose(t, 5);
  const poses = [p0, p1, p2, p3, p4, p5];
  return (
    <Group>
      <Metal
        d={TRACK}
        evenOdd
        colors={GOLD}
        vein={TRACK_VEINS}
        shine={TRACK_SHINE}
      />
      <Path path={TRACK_CHANNEL} fillType="evenOdd">
        <LinearGradient
          start={vec(-50, -50)}
          end={vec(50, 50)}
          colors={["#7A5212", "#C8943A", "#E8C06A"]}
        />
      </Path>
      <Path
        path={TRACK_CHANNEL}
        fillType="evenOdd"
        style="stroke"
        strokeWidth={0.8}
        color={INK}
        opacity={0.8}
      />
      {TRACK_STUDS.map((p, k) => (
        <Stud key={k} x={p.x} y={p.y} r={1.55} />
      ))}
      <Sweep t={t} d={TRACK} every={4.6} evenOdd />
      <Glint t={t} x={-44} y={-40} size={4.5} phase={1.2} />
      <Glint t={t} x={40} y={45} size={3.5} phase={3.4} />
      {poses.map((p, k) => (
        <DieShadow key={k} pose={p} />
      ))}
      {poses.map((p, k) => (
        <Die key={k} pose={p} />
      ))}
    </Group>
  );
}

const DiceOrbit: ArtBorderDrawing = {
  back: () => <Halo r={90} color="#FFE6A0" opacity={0.18} />,
  front: DiceFront,
};

// ── Card Fan ─────────────────────────────────────────────────────────

const CARD_W = 27;
const CARD_H = 40;
/** Card centres sit this far from the picture's centre (the fan's pivot). */
const REACH = 66;
/** The angle between neighbouring cards. */
const SPREAD = 17 * DEG;
const CARD = rrect(CARD_W, CARD_H, 3.2);
const PANEL = rrect(CARD_W - 5.4, CARD_H - 5.4, 1.8);
const PANEL_FRAME = rrect(CARD_W - 9, CARD_H - 9, 1.2);
const ACE_EDGE =
  rrect(CARD_W - 1.8, CARD_H - 1.8, 2.6) +
  rrect(CARD_W - 5.6, CARD_H - 5.6, 1.4);
/** Fine diagonal lines across a card back. */
const LATTICE = Array.from({ length: 22 }, (_, k) => {
  const c = -36 + k * 3.4;
  return `M${c} -22L${c + 44} 22M${c} 22L${c + 44} -22`;
}).join("");

// The suits, two units tall, centred.
const HEART =
  "M0 0.92C-0.6 0.42 -1 0.02 -1 -0.4C-1 -0.82 -0.62 -1 -0.34 -1C-0.14 -1 0 -0.86 0 -0.7C0 -0.86 0.14 -1 0.34 -1C0.62 -1 1 -0.82 1 -0.4C1 0.02 0.6 0.42 0 0.92Z";
const DIAMOND =
  "M0 -1Q0.32 -0.42 0.74 0Q0.32 0.42 0 1Q-0.32 0.42 -0.74 0Q-0.32 -0.42 0 -1Z";
const SPADE =
  "M0 -1C0.55 -0.5 1 -0.18 1 0.24C1 0.62 0.62 0.78 0.36 0.74C0.2 0.72 0.1 0.62 0.05 0.5Q0.1 0.84 0.4 1H-0.4Q-0.1 0.84 -0.05 0.5C-0.1 0.62 -0.2 0.72 -0.36 0.74C-0.62 0.78 -1 0.62 -1 0.24C-1 -0.18 -0.55 -0.5 0 -1Z";
const CLUB =
  "M-0.310 -0.221A0.38 0.38 0 1 1 0.310 -0.221A0.38 0.38 0 1 1 0.101 0.330Q0.1 0.62 0.36 0.98H-0.36Q-0.1 0.62 -0.101 0.330A0.38 0.38 0 1 1 -0.310 -0.221Z";
type Suit = "spade" | "heart" | "diamond" | "club";
const SUIT_PATH: Record<Suit, string> = {
  spade: SPADE,
  heart: HEART,
  diamond: DIAMOND,
  club: CLUB,
};
const RED = (s: Suit) => s === "heart" || s === "diamond";

/** A suit sign at (x, y), `size` half-tall, in gold or its own colour. */
function SuitMark({
  suit,
  x,
  y,
  size,
  gold,
}: {
  suit: Suit;
  x: number;
  y: number;
  size: number;
  gold?: boolean;
}) {
  const colors = gold ? GOLD : RED(suit) ? CRIMSON : EBONY;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: size }]}>
      <Path path={SUIT_PATH[suit]}>
        <LinearGradient
          start={vec(-0.8, -1)}
          end={vec(0.8, 1)}
          colors={colors}
        />
      </Path>
      <Path
        path={SUIT_PATH[suit]}
        style="stroke"
        strokeWidth={(gold ? 0.9 : 0.8) / size}
        strokeJoin="round"
        color={gold ? INK : RED(suit) ? "#3A0408" : "#E2B04A"}
      />
      {size > 3 ? (
        <Path
          path="M-0.62 -0.3Q-0.6 -0.62 -0.3 -0.72"
          style="stroke"
          strokeWidth={0.7 / size}
          strokeCap="round"
          color="#FFFFFF"
          opacity={0.8}
        />
      ) : null}
    </Group>
  );
}

function CardStock({ children }: { children?: ReactNode }) {
  return (
    <Group>
      <Path path={CARD}>
        <LinearGradient
          start={vec(-CARD_W / 2, -CARD_H / 2)}
          end={vec(CARD_W / 2, CARD_H / 2)}
          colors={IVORY}
        />
      </Path>
      {children}
      <Path
        path={CARD}
        style="stroke"
        strokeWidth={1.1}
        strokeJoin="round"
        color={INK}
      />
    </Group>
  );
}

/** An engraved back: a coloured panel, gold-lined lattice, a gold frame
 *  and a medallion in the middle. */
function CardBack({ colors }: { colors: string[] }) {
  const clip = useMemo(() => Skia.Path.MakeFromSVGString(PANEL), []);
  return (
    <CardStock>
      <Path path={PANEL}>
        <LinearGradient
          start={vec(-10, -18)}
          end={vec(10, 18)}
          colors={colors}
        />
      </Path>
      {clip ? (
        <Group clip={clip}>
          <Path
            path={LATTICE}
            style="stroke"
            strokeWidth={0.45}
            color="#F0CC72"
            opacity={0.4}
          />
          <Path
            path={`M${-CARD_W / 2 + 3.6} ${CARD_H / 2 - 8}V${-CARD_H / 2 + 4.4}H${CARD_W / 2 - 9}`}
            style="stroke"
            strokeWidth={0.8}
            strokeCap="round"
            color="#FFFFFF"
            opacity={0.55}
          />
        </Group>
      ) : null}
      <Path
        path={PANEL_FRAME}
        style="stroke"
        strokeWidth={1.3}
        color={INK}
        opacity={0.8}
      />
      <Path
        path={PANEL_FRAME}
        style="stroke"
        strokeWidth={0.7}
        color="#F0CC72"
      />
      <Path path={PANEL} style="stroke" strokeWidth={0.8} color={INK} />
      {/* the medallion: a gold lozenge with a jewel of the back's colour */}
      <Metal
        d="M0 -9.5Q2.4 -3.6 6.2 0Q2.4 3.6 0 9.5Q-2.4 3.6 -6.2 0Q-2.4 -3.6 0 -9.5Z"
        colors={GOLD}
        width={0.8}
        vein="M0 -6.6V6.6M-3.6 0H3.6"
        veinWidth={0.5}
        shine="M-1.2 -6.4Q-2.4 -3 -4.4 -0.8"
        from={vec(-6, -9)}
        to={vec(6, 9)}
      />
      <Circle cx={0} cy={0} r={2.1}>
        <RadialGradient
          c={vec(-0.6, -0.7)}
          r={3}
          colors={["#FFFFFF", ...colors.slice(0, 2)]}
        />
      </Circle>
      <Circle
        cx={0}
        cy={0}
        r={2.1}
        style="stroke"
        strokeWidth={0.6}
        color={INK}
      />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sy], k) => (
        <Circle
          key={k}
          cx={sx * (CARD_W / 2 - 6.3)}
          cy={sy * (CARD_H / 2 - 6.3)}
          r={0.9}
          color="#F0CC72"
        />
      ))}
    </CardStock>
  );
}

/** The rank, as a pen would write it, centred on (x, y). */
const RANK: Record<number, (x: number, y: number) => string> = {
  1: (x, y) =>
    `M${x - 1.8} ${y + 2.3}L${x} ${y - 2.6}L${x + 1.8} ${y + 2.3}M${x - 1.05} ${y + 0.5}H${x + 1.05}`,
  2: (x, y) =>
    `M${x - 1.5} ${y - 1.4}Q${x - 1.3} ${y - 2.7} ${x} ${y - 2.7}Q${x + 1.6} ${y - 2.7} ${x + 1.5} ${y - 1.2}Q${x + 1.3} ${y - 0.1} ${x - 1.6} ${y + 2.4}H${x + 1.7}`,
  3: (x, y) =>
    `M${x - 1.5} ${y - 2.6}H${x + 1.5}L${x - 0.1} ${y - 0.5}Q${x + 1.8} ${y - 0.6} ${x + 1.7} ${y + 0.9}Q${x + 1.5} ${y + 2.5} ${x - 0.1} ${y + 2.4}Q${x - 1.2} ${y + 2.4} ${x - 1.7} ${y + 1.6}`,
};

/** The corner of a face: the rank over a gold suit, on the corner that
 *  shows (left of the fan: top left; right: top right). */
function Corner({
  suit,
  rank,
  side,
}: {
  suit: Suit;
  rank: number;
  side: number;
}) {
  const x = side * (-CARD_W / 2 + 4.6);
  const y = -CARD_H / 2 + 5;
  return (
    <Group>
      <Path
        path={RANK[rank](x, y)}
        style="stroke"
        strokeWidth={1.05}
        strokeJoin="round"
        strokeCap="round"
        color={rank === 1 ? INK : RED(suit) ? "#9A1024" : INK}
      />
      <SuitMark suit={suit} x={x} y={y + 5.6} size={2.6} gold />
    </Group>
  );
}

/** A number card: gold corner suit and the pips down the middle. */
function CardFace({
  suit,
  rank,
  side,
}: {
  suit: Suit;
  rank: number;
  side: number;
}) {
  return (
    <CardStock>
      <Path
        path={rrect(CARD_W - 4, CARD_H - 4, 1.8)}
        style="stroke"
        strokeWidth={0.5}
        color={VEIN_IVORY}
      />
      <Corner suit={suit} rank={rank} side={side} />
      {Array.from({ length: rank }, (_, k) => (
        <SuitMark
          key={k}
          suit={suit}
          x={side * 1.6}
          y={(k - (rank - 1) / 2) * 12 - 2}
          size={4.4}
        />
      ))}
    </CardStock>
  );
}

/** The ace of spades, edged in gold. */
function AceFace() {
  return (
    <CardStock>
      <Metal
        d={ACE_EDGE}
        evenOdd
        colors={GOLD}
        width={0.7}
        from={vec(-14, -20)}
        to={vec(14, 20)}
        shine={`M${-CARD_W / 2 + 1.8} 8V${-CARD_H / 2 + 4}`}
      />
      <Corner suit="spade" rank={1} side={1} />
      {/* a filigree under the spade */}
      <Path
        path="M-9 8Q-6 3 -2.4 6.4M9 8Q6 3 2.4 6.4M-7.6 8.4Q-9.6 10.6 -7 11.4M7.6 8.4Q9.6 10.6 7 11.4"
        style="stroke"
        strokeWidth={0.8}
        strokeCap="round"
        color={VEIN_GOLD}
      />
      <SuitMark suit="spade" x={0} y={-3.2} size={8.2} />
      <Path
        path="M0 -9.6V2"
        style="stroke"
        strokeWidth={0.5}
        color="#8A92A4"
        opacity={0.8}
      />
    </CardStock>
  );
}

interface FanCardSpec {
  /** Place in the fan, -3 (left) to 3 (right). */
  at: number;
  back?: string[];
  suit: Suit;
  rank: number;
}

/** Outside in, so the two halves overlap toward the ace on top. */
const HAND: FanCardSpec[] = [
  { at: -3, back: CRIMSON, suit: "diamond", rank: 2 },
  { at: 3, back: CRIMSON, suit: "club", rank: 2 },
  { at: -2, suit: "club", rank: 3 },
  { at: 2, suit: "heart", rank: 2 },
  { at: -1, back: NAVY, suit: "heart", rank: 3 },
  { at: 1, back: NAVY, suit: "diamond", rank: 3 },
  { at: 0, suit: "spade", rank: 1 },
];
/** Which card turns over in each turn of the cycle. */
const FLIPPERS = [-1, 3, 1, -3];
const FLIP_EVERY = 5.5;

function FanCard({ t, card }: { t: Clock; card: FanCardSpec }) {
  const { at, back } = card;
  const turn = FLIPPERS.indexOf(at);
  // 0 → 1 lifted, and the turn of the card (1 back, -1 face)
  const play = useDerivedValue(() => {
    if (turn < 0) return { lift: 0, flip: 1 };
    const c = t.value + 3;
    const n = Math.floor(c / FLIP_EVERY);
    if (((n % 4) + 4) % 4 !== turn) return { lift: 0, flip: 1 };
    const p = c - n * FLIP_EVERY;
    const lift = smooth(p / 0.4) * (1 - smooth((p - 3.05) / 0.45));
    const over = smooth((p - 0.4) / 0.5) * (1 - smooth((p - 2.55) / 0.5));
    return { lift, flip: Math.cos(over * Math.PI) };
  });
  const transform = useDerivedValue(() => {
    // the hand breathes open and shut
    const open = 1 + 0.055 * Math.sin(t.value * 1.05);
    const sway = Math.sin(t.value * 0.9 + at * 1.3) * 0.008;
    return [
      { rotate: at * SPREAD * open + sway },
      { translateY: -REACH - play.value.lift * 4 },
      { scaleX: play.value.flip },
    ];
  });
  const faceUp = useDerivedValue(() =>
    back ? (play.value.flip < 0 ? 1 : 0) : 1,
  );
  const backUp = useDerivedValue(() => 1 - faceUp.value);
  const face =
    at === 0 ? (
      <AceFace />
    ) : (
      <CardFace suit={card.suit} rank={card.rank} side={at > 0 ? -1 : 1} />
    );
  return (
    <Group transform={transform}>
      <Group transform={[{ translateX: 1.4 }, { translateY: 2.2 }]}>
        <Path path={CARD} color="#000000" opacity={0.35}>
          <BlurMask blur={1.6} style="normal" />
        </Path>
      </Group>
      {back ? (
        <Group>
          <Group opacity={backUp}>
            <CardBack colors={back} />
          </Group>
          {/* seen from behind while turned, so turned back again */}
          <Group opacity={faceUp} transform={[{ scaleX: -1 }]}>
            {face}
          </Group>
        </Group>
      ) : (
        face
      )}
    </Group>
  );
}

function FanBack({ t }: { t: Clock }) {
  return (
    <Group>
      <Halo r={90} color="#FFE6A0" opacity={0.16} />
      {HAND.map((card) => (
        <FanCard key={card.at} t={t} card={card} />
      ))}
      <Glint t={t} x={-8} y={-80} size={5} phase={0.8} speed={1} />
    </Group>
  );
}

/** The ring round the picture, set with suits; the ruby heart at its foot. */
const FAN_RING = ring(57.6, 50.5);
const RING_STUDS: { a: number; suit: Suit }[] = [
  { a: -135, suit: "spade" },
  { a: -45, suit: "heart" },
  { a: 0, suit: "club" },
  { a: 45, suit: "diamond" },
  { a: 135, suit: "club" },
  { a: 180, suit: "diamond" },
  { a: -90, suit: "spade" },
];

function SuitStud({ a, suit }: { a: number; suit: Suit }) {
  const p = polar(a * DEG, 54.05);
  return (
    <Group>
      <Stud x={p.x} y={p.y} r={3.5} />
      <SuitMark suit={suit} x={p.x} y={p.y + 0.1} size={2.05} />
    </Group>
  );
}

function FanFront({ t }: { t: Clock }) {
  return (
    <Group>
      <Metal
        d={FAN_RING}
        evenOdd
        colors={GOLD}
        width={1.3}
        vein={circle(52.2) + circle(55.9)}
        shine={arc(56.7, -170, -118) + arc(51.4, -158, -128)}
      />
      {RING_STUDS.map((s) => (
        <SuitStud key={s.a} {...s} />
      ))}
      <Sweep t={t} d={FAN_RING} every={4.8} phase={1.4} evenOdd />
      {/* the ruby heart at the foot, in a gold bezel */}
      <Group transform={[{ translateX: 0 }, { translateY: 57 }]}>
        <Path path={HEART} transform={[{ scale: 7.6 }]} color={INK} />
        <Group transform={[{ scale: 6.8 }]}>
          <Path path={HEART}>
            <LinearGradient start={vec(-1, -1)} end={vec(1, 1)} colors={GOLD} />
          </Path>
        </Group>
        <Group transform={[{ translateY: -0.4 }, { scale: 5 }]}>
          <Path path={HEART}>
            <LinearGradient
              start={vec(-0.8, -1)}
              end={vec(0.6, 0.9)}
              colors={RUBY}
            />
          </Path>
          <Path
            path={HEART}
            style="stroke"
            strokeWidth={0.12}
            color="#3A0408"
          />
          <Path
            path="M-0.66 -0.36Q-0.64 -0.72 -0.32 -0.8"
            style="stroke"
            strokeWidth={0.16}
            strokeCap="round"
            color="#FFFFFF"
            opacity={0.85}
          />
        </Group>
      </Group>
      <Glint t={t} x={-2} y={55} size={5} phase={2.2} />
    </Group>
  );
}

const CardFan: ArtBorderDrawing = {
  back: FanBack,
  front: FanFront,
};

export const TABLETOP_ART: Record<string, ArtBorderDrawing> = {
  "dice-orbit": DiceOrbit,
  "card-fan": CardFan,
};
