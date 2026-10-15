// Engraved emblems: the house style's icons, for settings rows, menus
// and anywhere a flat emoji would otherwise stand. Each is drawn in a
// 48 × 48 box and takes a `size` in points. Check them all at
// boardly-dev://dev/emblems.

import { Circle, G, Path } from "react-native-svg";

import { EmblemSvg, Engraved, JewelDot } from "./Engraved";
import { FEATHER } from "./shapes";

export interface EmblemProps {
  size?: number;
}

const ring = (cx: number, cy: number, r: number, hole: number) =>
  `M${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Z` +
  `M${cx + hole} ${cy}A${hole} ${hole} 0 1 0 ${cx - hole} ${cy}A${hole} ${hole} 0 1 0 ${cx + hole} ${cy}Z`;
const disc = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Z`;

/** Language: a silver globe in a gold meridian, on its stand. */
export function GlobeEmblem({ size = 28 }: EmblemProps) {
  return (
    <EmblemSvg size={size}>
      <Engraved d="M15 45H33L31 41.5H17Z" />
      <Engraved d="M22 37H26V41.5H22Z" />
      <Engraved
        d={disc(24, 20, 13)}
        material="silver"
        vein="M11.4 20.5Q24 26 36.6 20.5M14 12.6Q24 16.6 34 12.6M14.4 28Q24 32 33.6 28M24 7A6 13 0 0 0 24 33A6 13 0 0 0 24 7"
        shine="M15.6 14.4A10 10 0 0 1 21 9.6"
      />
      <Engraved
        d="M24 2.5A17.5 17.5 0 0 0 24 37.5V35.5A15.5 15.5 0 0 1 24 4.5Z"
        shine="M14 9.6A15.6 15.6 0 0 0 9.2 18"
      />
      <Engraved d={disc(24, 3.5, 2)} ink={1.2} />
      <Engraved d={disc(24, 36.5, 2)} ink={1.2} />
    </EmblemSvg>
  );
}

/** Password: an ornate gold key, a ruby in its bow. */
export function KeyEmblem({ size = 28 }: EmblemProps) {
  return (
    <EmblemSvg size={size}>
      <G transform="rotate(-45 24 24)">
        <Engraved d="M22.4 21H25.6V42.5Q24 44.5 22.4 42.5Z" vein="M24 23V41" />
        <Engraved d="M25.6 33H31V35.5H29V37.5H31V40.5H25.6Z" />
        <Engraved d="M20 18.6H28V22H20Z" />
        <Engraved
          d="M20 7A4 4 0 1 1 28 7A4 4 0 1 1 28 15A4 4 0 1 1 20 15A4 4 0 1 1 20 7Z"
          shine="M17.6 9.6A3.4 3.4 0 0 1 20.4 5"
        />
        <JewelDot x={24} y={11} r={2.9} jewel="ruby" />
      </G>
    </EmblemSvg>
  );
}

/** Privacy: a gold padlock on a silver shackle. */
export function LockEmblem({ size = 28 }: EmblemProps) {
  return (
    <EmblemSvg size={size}>
      <Engraved
        d="M14 25V16A10 10 0 0 1 34 16V25H30V16A6 6 0 0 0 18 16V25Z"
        material="silver"
        shine="M16.3 14A8 8 0 0 1 21 8.6"
      />
      <Engraved
        d="M14 22H34Q38 22 38 26V40Q38 44 34 44H14Q10 44 10 40V26Q10 22 14 22Z"
        vein="M15 25.5H33Q34.5 25.5 34.5 27V39Q34.5 40.5 33 40.5H15Q13.5 40.5 13.5 39V27Q13.5 25.5 15 25.5Z"
        shine="M12.2 27V37"
      />
      <Path
        d="M24 28.5A3 3 0 0 1 25.6 34L26.6 38.5H21.4L22.4 34A3 3 0 0 1 24 28.5Z"
        fill="#2A1808"
      />
    </EmblemSvg>
  );
}

/** Terms: a parchment scroll on gold rollers, sealed in red. */
export function ScrollEmblem({ size = 28 }: EmblemProps) {
  return (
    <EmblemSvg size={size}>
      <Engraved
        d="M14 10H34Q32.5 24 34 38H14Q15.5 24 14 10Z"
        material="ivory"
        vein="M18 16.5H30M18 21H30M18 25.5H27M18 30H24"
      />
      {[9, 39].map((y) => (
        <G key={y}>
          <Engraved d={disc(10.5, y, 2.2)} material="wood" ink={1.2} />
          <Engraved d={disc(37.5, y, 2.2)} material="wood" ink={1.2} />
          <Engraved
            d={`M13 ${y - 3}H35A3 3 0 0 1 35 ${y + 3}H13A3 3 0 0 1 13 ${y - 3}Z`}
            shine={`M14 ${y - 1.4}H33`}
          />
        </G>
      ))}
      <Path
        d="M28.4 35L26.8 42.5L29.2 41L30.8 43L31.6 35Z"
        fill="#8A0A1E"
        stroke="#3A2408"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <JewelDot x={30} y={33.5} r={4} jewel="ruby" />
    </EmblemSvg>
  );
}

/** Log out: an arched oak door in a gold frame, iron-strapped. */
export function DoorEmblem({ size = 28 }: EmblemProps) {
  return (
    <EmblemSvg size={size}>
      <Engraved
        d="M13 44V20.5A11 11 0 0 1 35 20.5V44Z"
        material="wood"
        vein="M18.5 11.6V44M24 9.6V44M29.5 11.6V44"
      />
      <Engraved d="M13 26.5H35V29.5H13Z" material="silver" ink={1.2} />
      <Engraved d="M13 36.5H35V39.5H13Z" material="silver" ink={1.2} />
      <Engraved d={ring(30.5, 33, 2.8, 1.4)} evenOdd ink={1.1} />
      <Engraved
        d="M9 44V20A15 15 0 0 1 39 20V44H35V20.5A11 11 0 0 0 13 20.5V44Z"
        shine="M11 19A13 13 0 0 1 17 9"
      />
      <Engraved d="M6.5 43.5H41.5V46.5H6.5Z" material="silver" ink={1.2} />
    </EmblemSvg>
  );
}

/** Delete: a fluted silver bin under a gold lid. */
export function BinEmblem({ size = 28 }: EmblemProps) {
  return (
    <EmblemSvg size={size}>
      <Engraved
        d="M11.5 17H36.5L34 41.5Q33.8 43.5 31.8 43.5H16.2Q14.2 43.5 14 41.5Z"
        material="silver"
        vein="M18.4 21.5L19.3 39.5M24 21.5V39.5M29.6 21.5L28.7 39.5M12.2 19.8H35.8"
        shine="M14.6 22L16.2 39.5"
      />
      <Engraved d="M19.5 12.5V9.5Q19.5 7.5 21.5 7.5H26.5Q28.5 7.5 28.5 9.5V12.5H26.3V10.2Q26.3 9.7 25.8 9.7H22.2Q21.7 9.7 21.7 10.2V12.5Z" />
      <Engraved
        d="M10.5 12.5H37.5Q39 12.5 39 14V16.2H9V14Q9 12.5 10.5 12.5Z"
        shine="M11 14.2H36"
      />
    </EmblemSvg>
  );
}

/** Borders: a gold frame between little ivory wings, a sapphire on top. */
export function FrameEmblem({ size = 28 }: EmblemProps) {
  const wing = (
    <G>
      {[
        { len: 17, turn: 26 },
        { len: 14.5, turn: 52 },
        { len: 11.5, turn: 80 },
      ].map((f) => (
        <G key={f.turn} transform={`translate(32.5 27) rotate(${f.turn})`}>
          <Engraved d={FEATHER(f.len, 3.5)} material="ivory" ink={1.1} />
        </G>
      ))}
    </G>
  );
  return (
    <EmblemSvg size={size}>
      {wing}
      <G transform="translate(48 0) scale(-1 1)">{wing}</G>
      <Engraved d={disc(24, 26, 8.6)} material="ivory" ink={0} />
      <Engraved
        d={ring(24, 26, 12, 8.5)}
        evenOdd
        vein="M34.2 26A10.2 10.2 0 1 1 13.8 26A10.2 10.2 0 1 1 34.2 26"
        shine="M15 20A10.5 10.5 0 0 1 19.6 15.8"
      />
      <Circle cx={24} cy={38} r={1.4} fill="#F6D27A" />
      <JewelDot x={24} y={14} r={3.2} jewel="sapphire" />
    </EmblemSvg>
  );
}
