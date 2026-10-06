// Game-table furniture: section ribbons and framed panels. Drawn in
// code (gradient + borders) so they stretch to any size; the colours
// live in theme/table.ts.

import { LinearGradient } from "expo-linear-gradient";
import { useId, useState, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
  Image as SvgImage,
  Pattern,
} from "react-native-svg";

import { TABLE, fontFamily, shade } from "@/theme";
import { AppText } from "./AppText";
import { Texture } from "./Texture";

const FRAME_RADIUS = 18;
const FRAME_BORDER = 3;
// Same material as the panels (see Texture.tsx), drawn inside the SVG so
// it follows the ribbon's cut-out shape
const PAINTED_TEXTURE = require("../../../assets/ui/textures/painted.png");
const TEXTURE_TILE = 256;

const NOTCH = 11; // depth of the swallow-tail cut on the right
const FOLD = 8; // height of the tuck under the left end
const STITCH_INSET = 4;

/** The ribbon's outline: rounded left end, V-cut right end. `inset`
 *  shrinks it evenly, for the stitching that runs just inside the edge. */
function ribbonPath(w: number, h: number, inset = 0): string {
  const r = Math.max(2, 7 - inset);
  const left = inset;
  const top = inset;
  const bottom = h - inset;
  const right = w - inset * 1.6;
  const notchX = w - NOTCH - inset * 0.6;
  return [
    `M ${left + r} ${top}`,
    `H ${right}`,
    `L ${notchX} ${h / 2}`,
    `L ${right} ${bottom}`,
    `H ${left + r}`,
    `Q ${left} ${bottom} ${left} ${bottom - r}`,
    `V ${top + r}`,
    `Q ${left} ${top} ${left + r} ${top}`,
    "Z",
  ].join(" ");
}

/** Stitched fabric label that hangs over the top-left corner of a
 *  panel: swallow-tail on the right, tucked under on the left. Drawn as
 *  a vector shape sized to its text, so it fits any label in any
 *  language. */
export function Ribbon({
  label,
  colors = TABLE.ribbonRed,
  standalone = false,
  style,
}: {
  label: string;
  colors?: [string, string];
  /** A ribbon used on its own (a page title) rather than hanging over a
   *  panel: it keeps inside its row and has no end tucked underneath. */
  standalone?: boolean;
  /** Spacing around the ribbon. It must stay a direct sibling of the
   *  panel it hangs over (no wrapper view), or the panel covers it. */
  style?: StyleProp<ViewStyle>;
}) {
  // useId contains ":" which isn't safe inside an SVG url(#...) reference
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;
  const [top, bottom] = colors;

  return (
    <View
      style={[styles.ribbonWrap, standalone && styles.ribbonStandalone, style]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width !== w || height !== h) setSize({ w: width, h: height });
      }}
    >
      {w > 0 ? (
        <Svg
          width={w}
          height={h + FOLD}
          style={styles.ribbonArt}
          pointerEvents="none"
        >
          <Defs>
            <SvgGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={shade(top, 0.1)} />
              <Stop offset="0.55" stopColor={top} />
              <Stop offset="1" stopColor={bottom} />
            </SvgGradient>
            <Pattern
              id={`${id}-texture`}
              patternUnits="userSpaceOnUse"
              width={TEXTURE_TILE}
              height={TEXTURE_TILE}
            >
              <SvgImage
                href={PAINTED_TEXTURE}
                width={TEXTURE_TILE}
                height={TEXTURE_TILE}
              />
            </Pattern>
          </Defs>
          {/* the end tucked under the panel */}
          {standalone ? null : (
            <Path
              d={`M 0 ${h - 6} L 12 ${h - 1} L 12 ${h + FOLD} Q 2 ${h + FOLD - 1} 0 ${h - 6} Z`}
              fill={shade(bottom, -0.45)}
            />
          )}
          {/* soft drop shadow */}
          <Path
            d={ribbonPath(w, h)}
            fill="#000000"
            opacity={0.32}
            transform="translate(0 2.5)"
          />
          <Path d={ribbonPath(w, h)} fill={`url(#${id}-fill)`} />
          {/* the painted material, cut to the ribbon's shape */}
          <Path
            d={ribbonPath(w, h)}
            fill={`url(#${id}-texture)`}
            opacity={0.9}
          />
          {/* darker rim, then the stitching just inside it */}
          <Path
            d={ribbonPath(w, h, 0.75)}
            fill="none"
            stroke={shade(bottom, -0.35)}
            strokeWidth={1.5}
          />
          <Path
            d={ribbonPath(w, h, STITCH_INSET)}
            fill="none"
            stroke={shade(top, 0.55)}
            strokeOpacity={0.75}
            strokeWidth={1.3}
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        </Svg>
      ) : null}
      <AppText style={styles.ribbonText} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export interface FrameProps {
  tone: "yellow" | "blue" | "wood" | "dark";
  /** Stitched dashed line just inside the border. */
  stitched?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A thick-bordered panel, like a tray on the table. */
export function Frame({ tone, stitched = false, children, style }: FrameProps) {
  const t = TABLE[tone];
  return (
    <LinearGradient
      colors={t.fill}
      style={[styles.frame, { borderColor: t.border }, style]}
    >
      <Texture
        kind={tone === "blue" ? "felt" : "painted"}
        radius={FRAME_RADIUS - FRAME_BORDER}
      />
      {stitched ? (
        <View
          pointerEvents="none"
          style={[styles.stitch, { borderColor: t.inner }]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[styles.highlight, { borderColor: t.inner }]}
        />
      )}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ribbonWrap: {
    alignSelf: "flex-start",
    marginLeft: -6,
    marginBottom: -11,
    zIndex: 2,
    paddingVertical: 6,
    paddingLeft: 15,
    paddingRight: 15 + NOTCH,
  },
  ribbonStandalone: { alignSelf: "center", marginLeft: 0, marginBottom: 0 },
  ribbonArt: { position: "absolute", left: 0, top: 0 },
  ribbonText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
    color: TABLE.cream,
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  frame: {
    borderWidth: FRAME_BORDER,
    borderRadius: FRAME_RADIUS,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  highlight: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    opacity: 0.55,
  },
  stitch: {
    position: "absolute",
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: 9,
    borderWidth: 1.5,
    borderStyle: "dashed",
    opacity: 0.55,
  },
});
