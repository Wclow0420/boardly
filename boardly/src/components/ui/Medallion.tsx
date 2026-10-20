// A number on a gold medallion: a beaded gold rim round a dark wooden
// face, lit from the upper left. For stats (games played, wins...).

import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Path } from "react-native-svg";

import { INKS, MATERIALS } from "@/components/engraved/shapes";
import { Gradient, useSvgId } from "./Trim";

const BEADS = 22;

export function Medallion({ size, children }: { size: number; children: ReactNode }) {
  const id = useSvgId();
  const c = size / 2;
  const r = c - 1.5;
  const face = r - size * 0.14;
  const bead = Math.max(1, size * 0.028);
  const { ink, vein } = INKS.gold;
  const a0 = -2.5;
  const a1 = -1.75;
  const arc = r - 1.6;
  return (
    <View style={{ width: size, height: size + 3, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size + 3} style={StyleSheet.absoluteFill}>
        <Defs>
          <Gradient id={`${id}g`} colors={MATERIALS.gold} />
          <Gradient id={`${id}b`} colors={["#FFF6D0", "#E2B04A", "#8A5A16"]} radial />
          <Gradient id={`${id}f`} colors={["#6A4428", "#3A2414", "#24160C"]} radial />
        </Defs>
        <Circle cx={c} cy={c + 3} r={r} fill="#000000" opacity={0.35} />
        <Circle cx={c} cy={c} r={r} fill={`url(#${id}g)`} stroke={ink} strokeWidth={1.2} />
        {Array.from({ length: BEADS }, (_, i) => {
          const a = (i / BEADS) * Math.PI * 2;
          const d = (r + face) / 2;
          return (
            <Circle
              key={i}
              cx={c + Math.cos(a) * d}
              cy={c + Math.sin(a) * d}
              r={bead}
              fill={`url(#${id}b)`}
              stroke={vein}
              strokeWidth={0.4}
            />
          );
        })}
        <Circle cx={c} cy={c} r={face} fill={`url(#${id}f)`} stroke={ink} strokeWidth={1} />
        <Path
          d={`M${c + Math.cos(a0) * arc} ${c + Math.sin(a0) * arc}A${arc} ${arc} 0 0 1 ${c + Math.cos(a1) * arc} ${c + Math.sin(a1) * arc}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1}
          strokeOpacity={0.9}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ marginTop: -3 }}>{children}</View>
    </View>
  );
}
