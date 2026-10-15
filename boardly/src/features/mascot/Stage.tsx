// Where the mascot stands on show: a warm spotlight from above and a
// round wooden plinth under its feet.

import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

/** The stage: a warm spotlight from above and a round wooden plinth. */
export function Stage({ width, children }: { width: number; children: ReactNode }) {
  const height = width * 0.86;
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "flex-end" }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* fades to nothing well inside its ellipse: no edge to see */}
          <RadialGradient id="light" cx="50%" cy="42%" r="50%">
            <Stop offset="0" stopColor="#FFE6A8" stopOpacity="0.55" />
            <Stop offset="0.5" stopColor="#F7C948" stopOpacity="0.14" />
            <Stop offset="0.85" stopColor="#F7C948" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="plinth" cx="50%" cy="35%" r="70%">
            <Stop offset="0" stopColor="#B07A48" />
            <Stop offset="1" stopColor="#5A3A22" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={height * 0.52} rx={width * 0.48} ry={height * 0.46} fill="url(#light)" />
        <Ellipse cx={width / 2} cy={height * 0.9} rx={width * 0.36} ry={height * 0.075} fill="#2A180D" />
        <Ellipse cx={width / 2} cy={height * 0.88} rx={width * 0.36} ry={height * 0.075} fill="url(#plinth)" />
      </Svg>
      <View style={{ marginBottom: height * 0.035 }}>{children}</View>
    </View>
  );
}
