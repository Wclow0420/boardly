// The house style in still SVG: a shape filled with its material's
// gradient, engraved, and outlined in ink. Icons and emblems are built
// from these (see ./icons).

import { useId, type ReactNode } from "react";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

import { LIGHT, shadeOf, type EmblemData, type Shade } from "./emblem";
import { JEWELS, type Jewel } from "./shapes";

/** A gradient id that's safe in url(#…). */
function useGradientId() {
  return `g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** One engraved shape: `d` filled with `material`, the `vein` and
 *  `shine` lines cut into it, the ink outline over all. */
export function Engraved({
  d,
  material = "gold",
  tint,
  vein,
  shine,
  evenOdd,
  ink = 1.5,
  vw = 0.9,
  sw = 1.1,
  round,
  op,
}: {
  d: string;
  material?: Shade;
  /** The colour "tint" stands for. */
  tint?: string;
  /** Engraved lines: grooves, ribs, a leaf's midrib. */
  vein?: string;
  /** Where the light catches: one white line. */
  shine?: string;
  /** Cut holes (rings, keyholes) with the even-odd rule. */
  evenOdd?: boolean;
  ink?: number;
  /** Widths of the vein and shine lines. */
  vw?: number;
  sw?: number;
  /** Lit like something round, from the upper left. */
  round?: boolean;
  /** See-through, for soft shadows and highlights. */
  op?: number;
}) {
  const id = useGradientId();
  const { colors, ink: inkColor, vein: veinColor } = shadeOf(material, tint);
  const rule = evenOdd ? "evenodd" : "nonzero";
  const stops = colors.map((color, i) => (
    <Stop key={i} offset={i / (colors.length - 1)} stopColor={color} />
  ));
  return (
    <G opacity={op}>
      <Defs>
        {round ? (
          <RadialGradient id={id} cx={LIGHT.cx} cy={LIGHT.cy} r={LIGHT.r}>
            {stops}
          </RadialGradient>
        ) : (
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {stops}
          </LinearGradient>
        )}
      </Defs>
      <Path d={d} fill={`url(#${id})`} fillRule={rule} />
      {vein ? (
        <Path
          d={vein}
          fill="none"
          stroke={veinColor}
          strokeWidth={vw}
          strokeLinecap="round"
        />
      ) : null}
      {shine ? (
        <Path
          d={shine}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.85}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      ) : null}
      {ink > 0 ? (
        <Path
          d={d}
          fill="none"
          fillRule={rule}
          stroke={inkColor}
          strokeWidth={ink}
          strokeLinejoin="round"
        />
      ) : null}
    </G>
  );
}

/** A round cabochon jewel with its glint. */
export function JewelDot({
  x,
  y,
  r,
  jewel = "ruby",
}: {
  x: number;
  y: number;
  r: number;
  jewel?: Jewel;
}) {
  const id = useGradientId();
  const [light, body, deep] = JEWELS[jewel];
  return (
    <G>
      <Defs>
        <RadialGradient id={id} cx="0.35" cy="0.3" r="0.75">
          <Stop offset={0} stopColor={light} />
          <Stop offset={0.45} stopColor={body} />
          <Stop offset={1} stopColor={deep} />
        </RadialGradient>
      </Defs>
      <Circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
      <Circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke="#3A2408"
        strokeWidth={1.2}
      />
      <Circle
        cx={x - r * 0.35}
        cy={y - r * 0.38}
        r={r * 0.25}
        fill="#FFFFFF"
        opacity={0.9}
      />
    </G>
  );
}

/** An icon's canvas: 48 × 48 units drawn at `size` points wide (or a
 *  drawing of another `box`, such as a figure, at its own proportions). */
export function EmblemSvg({
  size,
  box = [48, 48],
  children,
}: {
  size: number;
  box?: [number, number];
  children: ReactNode;
}) {
  const [w, h] = box;
  return (
    <Svg width={size} height={(size * h) / w} viewBox={`0 0 ${w} ${h}`}>
      {children}
    </Svg>
  );
}

/** An emblem's parts, to place inside an Svg of your own (in the
 *  emblem's own units); "tint" parts take `color`. */
export function EmblemParts({ data, color }: { data: EmblemData; color?: string }) {
  return (
    <>
      {data.map((part, i) => {
        const body =
          "dark" in part ? (
            <Path d={part.dark} fill="#1A1008" />
          ) : "jewel" in part ? (
            <JewelDot x={part.x} y={part.y} r={part.r} jewel={part.jewel} />
          ) : (
            <Engraved
              d={part.d}
              material={part.m}
              tint={color}
              vein={part.vein}
              shine={part.shine}
              evenOdd={part.evenOdd}
              ink={part.ink}
              vw={part.vw}
              sw={part.sw}
              round={part.round}
              op={part.op}
            />
          );
        return (
          <G key={i} transform={part.t}>
            {body}
          </G>
        );
      })}
    </>
  );
}

/** An emblem written as data (see ./emblem), at `size` points; "tint"
 *  parts take `color`. */
export function EmblemGlyph({
  data,
  size,
  color,
  box,
}: {
  data: EmblemData;
  size: number;
  color?: string;
  box?: [number, number];
}) {
  return (
    <EmblemSvg size={size} box={box}>
      <EmblemParts data={data} color={color} />
    </EmblemSvg>
  );
}
