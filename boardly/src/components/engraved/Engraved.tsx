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

import { INKS, JEWELS, MATERIALS, type Jewel, type Material } from "./shapes";

/** A gradient id that's safe in url(#…). */
function useGradientId() {
  return `g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** One engraved shape: `d` filled with `material`, the `vein` and
 *  `shine` lines cut into it, the ink outline over all. */
export function Engraved({
  d,
  material = "gold",
  vein,
  shine,
  evenOdd,
  ink = 1.5,
}: {
  d: string;
  material?: Material;
  /** Engraved lines: grooves, ribs, a leaf's midrib. */
  vein?: string;
  /** Where the light catches: one white line. */
  shine?: string;
  /** Cut holes (rings, keyholes) with the even-odd rule. */
  evenOdd?: boolean;
  ink?: number;
}) {
  const id = useGradientId();
  const colors = MATERIALS[material];
  const rule = evenOdd ? "evenodd" : "nonzero";
  return (
    <G>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {colors.map((color, i) => (
            <Stop key={i} offset={i / (colors.length - 1)} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Path d={d} fill={`url(#${id})`} fillRule={rule} />
      {vein ? (
        <Path
          d={vein}
          fill="none"
          stroke={INKS[material].vein}
          strokeWidth={0.9}
          strokeLinecap="round"
        />
      ) : null}
      {shine ? (
        <Path
          d={shine}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.85}
          strokeWidth={1.1}
          strokeLinecap="round"
        />
      ) : null}
      <Path
        d={d}
        fill="none"
        fillRule={rule}
        stroke={INKS[material].ink}
        strokeWidth={ink}
        strokeLinejoin="round"
      />
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

/** An icon's canvas: 48 × 48 units drawn at `size` points. */
export function EmblemSvg({
  size,
  children,
}: {
  size: number;
  children: ReactNode;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {children}
    </Svg>
  );
}
