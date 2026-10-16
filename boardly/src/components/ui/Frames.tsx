// Game-table furniture in the house style: the page's title plaque,
// section heads and framed panels. The trays keep their wood and felt;
// the trim is engraved gold (see Trim.tsx). Drawn in code so they fit
// any size and any language; the colours live in theme/table.ts.

import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, G, Path } from "react-native-svg";

import { INKS, MATERIALS } from "@/components/engraved/shapes";
import {
  plaqueScrolls,
  sectionRule,
  tab,
} from "@/components/engraved/trim";
import { TABLE, fontFamily, shade } from "@/theme";
import { AppText } from "./AppText";
import { Texture } from "./Texture";
import {
  Bezel,
  BezelOverlay,
  LightSweep,
  Gradient,
  MetalParts,
  SetJewel,
  useBox,
  useSvgId,
} from "./Trim";

const FRAME_RADIUS = 18;
/** The gold moulding round a panel. */
const FRAME_RIM = 4.5;

/** The plaque's height, and the room round it its scrolls and jewel
 *  take (measured from engraved/trim.ts's plaqueScrolls at this height). */
const PLAQUE_H = 32;
const PLAQUE_REACH = 28;
const PLAQUE_TOP = 11;
const PLAQUE_BOTTOM = 3;

const GOLD_INK = INKS.gold.ink;

/** How light a colour is, 0..1 ("#rrggbb" or "rgb(r,g,b)"). */
function lightness(color: string) {
  const parts = color.startsWith("#")
    ? [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
    : (color.match(/\d+/g) ?? []).slice(0, 3).map(Number);
  const [r = 0, g = 0, b = 0] = parts;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** A page's title: an ivory plaque in a gold bezel, scrolls curling off
 *  both ends and a sapphire on top. Sized to its text. */
export function TitlePlaque({
  label,
  style,
}: {
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [{ w, h }, onLayout] = useBox();
  const pw = w - PLAQUE_REACH * 2;
  const scrolls = plaqueScrolls(PLAQUE_H);
  return (
    <View style={[styles.plaqueWrap, style]} onLayout={onLayout}>
      {w > 0 ? (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <G transform={`translate(${PLAQUE_REACH} ${PLAQUE_TOP})`}>
            <MetalParts parts={scrolls} />
          </G>
          <G transform={`translate(${w - PLAQUE_REACH} ${PLAQUE_TOP}) scale(-1 1)`}>
            <MetalParts parts={scrolls} />
          </G>
          <Bezel
            x={PLAQUE_REACH}
            y={PLAQUE_TOP}
            w={pw}
            h={PLAQUE_H}
            r={9}
            t={3.6}
            face={MATERIALS.ivory}
            shadow={2.5}
          />
          <SetJewel x={w / 2} y={PLAQUE_TOP + 0.5} r={2.9} />
        </Svg>
      ) : null}
      <View style={styles.plaqueFace}>
        <LightSweep r={9} every={6} />
        <AppText style={styles.plaqueText} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </AppText>
      </View>
    </View>
  );
}

/** A section's head: its name on a small enamel tab in the section's
 *  colour, framed in gold, and a gold rule running on to the right edge
 *  (or to `right`, e.g. a "See all" link or a count). */
export function SectionTitle({
  label,
  colors = TABLE.ribbonRed,
  right,
  style,
}: {
  label: string;
  /** The section's colour (its first is used for the enamel). */
  colors?: readonly [string, string] | readonly string[];
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [tabBox, onTab] = useBox();
  const [ruleBox, onRule] = useBox();
  const id = useSvgId();
  const color = colors[0];
  const enamel = [shade(color, 0.35), color, shade(color, -0.35)];
  // on a pale enamel (ivory, cream) the name is cut in dark ink instead
  const pale = lightness(color) > 0.7;
  const rule = ruleBox.w > 30 ? sectionRule(ruleBox.w - 2) : null;
  return (
    <View style={[styles.sectionRow, style]}>
      <View style={styles.tab} onLayout={onTab}>
        {tabBox.w > 0 ? (
          <Svg
            width={tabBox.w}
            height={tabBox.h + 2}
            style={styles.tabArt}
            pointerEvents="none"
          >
            <Defs>
              <Gradient id={`${id}g`} colors={MATERIALS.gold} />
              <Gradient id={`${id}e`} colors={enamel} vertical />
            </Defs>
            <Path d={tab(tabBox.w, tabBox.h)} fill="#000000" opacity={0.35} transform="translate(0 2)" />
            <Path d={tab(tabBox.w, tabBox.h)} fill={`url(#${id}g)`} stroke={GOLD_INK} strokeWidth={1.1} />
            <Path
              d={tab(tabBox.w, tabBox.h, 2.6)}
              fill={`url(#${id}e)`}
              stroke={GOLD_INK}
              strokeWidth={0.8}
            />
            <Path
              d={`M${tabBox.h * 0.42} 1.3H${tabBox.w * 0.45}`}
              stroke="#FFFFFF"
              strokeWidth={0.8}
              strokeOpacity={0.9}
              strokeLinecap="round"
            />
          </Svg>
        ) : null}
        <AppText style={[styles.tabText, pale && styles.tabTextDark]} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <View style={styles.rule} onLayout={onRule}>
        {rule ? (
          <Svg width={ruleBox.w} height={ruleBox.h} pointerEvents="none">
            <Defs>
              <Gradient id={`${id}r`} colors={MATERIALS.gold} vertical />
              <Gradient id={`${id}b`} colors={MATERIALS.gold} radial />
            </Defs>
            <G transform={`translate(0 ${ruleBox.h / 2 + 1})`}>
              <Path d={rule.band.outline} fill={`url(#${id}r)`} stroke={GOLD_INK} strokeWidth={0.7} />
              <Path d={rule.band.shine} fill="none" stroke="#FFFFFF" strokeWidth={0.6} strokeOpacity={0.8} />
              <MetalParts parts={[rule.tail]} ink={0.7} />
              <Circle
                cx={rule.bead.cx}
                cy={rule.bead.cy}
                r={rule.bead.r}
                fill={`url(#${id}b)`}
                stroke={GOLD_INK}
                strokeWidth={0.7}
              />
            </G>
          </Svg>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export interface FrameProps {
  tone: "yellow" | "blue" | "wood" | "dark";
  /** Stitched dashed line just inside the rim. */
  stitched?: boolean;
  /** Gold scrolls in the corners, for the few panels that lead a page
   *  (a feature card, a preview); lists stay plain. */
  ornate?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A tray on the table: wood or felt in a thin engraved gold moulding. */
export function Frame({
  tone,
  stitched = false,
  ornate = false,
  children,
  style,
}: FrameProps) {
  const t = TABLE[tone];
  return (
    <LinearGradient colors={t.fill} style={[styles.frame, style]}>
      <Texture
        kind={tone === "blue" ? "felt" : "painted"}
        radius={FRAME_RADIUS}
      />
      {stitched ? (
        <View pointerEvents="none" style={[styles.stitch, { borderColor: t.inner }]} />
      ) : null}
      <BezelOverlay r={FRAME_RADIUS} t={FRAME_RIM} ornate={ornate} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  plaqueWrap: {
    alignSelf: "center",
    paddingTop: PLAQUE_TOP,
    paddingBottom: PLAQUE_BOTTOM,
    paddingHorizontal: PLAQUE_REACH,
  },
  plaqueFace: {
    height: PLAQUE_H,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  plaqueText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 20,
    color: "#4A2E10",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  sectionRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  tab: {
    height: 24,
    justifyContent: "center",
    paddingHorizontal: 15,
    flexShrink: 1,
  },
  tabArt: { position: "absolute", left: 0, top: 0 },
  tabText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 17,
    color: TABLE.cream,
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  tabTextDark: { color: "#3A2408", textShadowColor: "rgba(255,255,255,0.4)" },
  rule: { flex: 1, height: 16, minWidth: 30 },
  frame: {
    borderRadius: FRAME_RADIUS,
    padding: 17,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  stitch: {
    position: "absolute",
    top: FRAME_RIM + 4,
    left: FRAME_RIM + 4,
    right: FRAME_RIM + 4,
    bottom: FRAME_RIM + 4,
    borderRadius: FRAME_RADIUS - FRAME_RIM - 2,
    borderWidth: 1.5,
    borderStyle: "dashed",
    opacity: 0.55,
  },
});
