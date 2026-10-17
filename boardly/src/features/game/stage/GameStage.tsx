// The game stage, for any game: the whole screen is the game. A game hands
// it its own header art (drawn across the top: Seal the Manor's stained-
// glass arch), what sits just under it (tags, a track), the middle, tools
// down the right side, lines above the plinth, and the main move on the
// plinth along the foot. Everything between the header and the plinth is
// behind the red curtain, which closes and opens whenever `sceneKey`
// changes; the plinth's move changes only once it's shut. Corner studs
// for back and rules. See "The stage" in AGENTS.md, and Seal the Manor's
// ManorStage for a game using it.

import { LinearGradient } from "expo-linear-gradient";
import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import type { Jewel } from "@/components/engraved/shapes";
import { BackIcon, Emblem } from "@/components/icons";
import { AppText, BezelOverlay, IconButton } from "@/components/ui";
import { fontFamily } from "@/theme";
import { Glow, Plinth } from "./parts";
import { StageCurtain } from "./StageCurtain";

/** How tall the plinth is above the home bar. */
export const PLINTH_H = 128;
/** How far the curtain reaches up behind the header and down behind the
 *  plinth, past the stage between them. */
const CURTAIN_UP = 14;
const CURTAIN_DOWN = 12;

/** For a middle that bleeds under the header and the plinth: how far its
 *  content should start from the top and stop from the bottom. */
export const StageInsets = createContext({ top: 0, bottom: 0 });

/** The stage's colours: the sky behind, top to bottom, and the warm light
 *  pooled in the middle. */
export interface StageLook {
  sky: readonly [string, string, ...string[]];
  glow: string;
  /** The jewel on the curtain's valance. */
  jewel?: Jewel;
}

/** Seal the Manor's night. */
export const NIGHT: StageLook = { sky: ["#1A2238", "#0E1220", "#0B0E16"], glow: "#F28B4B", jewel: "amber" };

/** A round metal stud in a top corner (back, rules). */
function Stud({
  label,
  onPress,
  children,
  side,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  side: "left" | "right";
}) {
  const insets = useSafeAreaInsets();
  return (
    <IconButton
      accessibilityLabel={label}
      onPress={onPress}
      size={40}
      style={[styles.corner, { top: insets.top + 6 }, side === "left" ? { left: 12 } : { right: 12 }]}
    >
      <LinearGradient colors={["#3A4258", "#1A1E2C"]} style={styles.stud} />
      <BezelOverlay r={20} t={3} />
      {children}
    </IconButton>
  );
}

export function GameStage({
  header,
  headerHeight,
  under,
  sceneKey,
  centre,
  tools,
  hint,
  bottom,
  overlays,
  onBack,
  onRules,
  away = false,
  bleed = false,
  look = NIGHT,
}: {
  /** The game's header art across the top (it starts at the screen's top
   *  edge: leave the status bar's height clear, `useSafeAreaInsets().top`). */
  header: ReactNode;
  /** How tall the header is, status bar included. */
  headerHeight: number;
  /** Just under the header (tags, a score): steps aside with the tools. */
  under?: ReactNode;
  /** What's on the stage now: the curtain closes and opens as it changes. */
  sceneKey: string;
  /** The middle of the stage. */
  centre: ReactNode;
  /** Down the right side of the middle (ToolButtons). */
  tools?: ReactNode;
  /** Lines just above the plinth. */
  hint?: ReactNode;
  /** On the plinth: the main move. */
  bottom: ReactNode;
  /** Full-screen pieces over everything (set pieces, popups). */
  overlays?: ReactNode;
  onBack?: () => void;
  onRules?: () => void;
  /** A moment has the stage: what's under the header and the tools step
   *  aside. */
  away?: boolean;
  /** The middle runs the screen's full height, under the header and the
   *  plinth (a long scroll, like an ending's): it's handed the room to
   *  leave at either end through `StageInsets`. */
  bleed?: boolean;
  look?: StageLook;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // the move on the plinth changes with the scene, once the curtain has
  // closed on the old one
  const [aside, setAside] = useState<{ key: string; bottom: ReactNode }>(() => ({ key: sceneKey, bottom }));
  if (aside.key === sceneKey && aside.bottom !== bottom) setAside({ key: sceneKey, bottom });
  const settled = aside.key === sceneKey;
  const plinthH = PLINTH_H + insets.bottom;

  // what's under the header and the tools slide off when a moment takes
  // the stage
  const gone = useSharedValue(away ? 1 : 0);
  useEffect(() => {
    gone.set(withTiming(away ? 1 : 0, { duration: 450 }));
  }, [away, gone]);
  // and once the curtain has shut on a new scene they're set again from
  // what that scene says, so a slide cut short can't leave the tools (and
  // the player's own cards behind them) hidden for the rest of the game
  const awayRef = useRef(away);
  useEffect(() => {
    awayRef.current = away;
  }, [away]);
  const toolsOut = useAnimatedStyle(() => ({
    opacity: 1 - gone.value,
    transform: [{ translateX: gone.value * 80 }],
  }));
  const underOut = useAnimatedStyle(() => ({
    opacity: 1 - gone.value,
    transform: [{ translateY: -gone.value * 16 }],
  }));

  return (
    <View style={styles.screen}>
      <LinearGradient colors={look.sky} style={StyleSheet.absoluteFill} />
      <Glow size={520} color={look.glow} style={{ top: height * 0.24, left: width * 0.5 - 260 }} />

      {/* everything between the header and the plinth is behind the
          curtain: what's under the header, the middle, the tools and the
          lines over the plinth */}
      <View style={[styles.stage, { top: headerHeight - CURTAIN_UP, bottom: plinthH - CURTAIN_DOWN }]}>
        <StageCurtain sceneKey={sceneKey} jewel={look.jewel} onSwap={(key) => {
            setAside({ key, bottom: null });
            gone.set(withTiming(awayRef.current ? 1 : 0, { duration: 250 }));
          }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {bleed ? (
              <View style={[styles.centre, { top: CURTAIN_UP - headerHeight, bottom: CURTAIN_DOWN - plinthH }]}>
                <StageInsets.Provider value={{ top: headerHeight + 26, bottom: plinthH + 34 }}>
                  {centre}
                </StageInsets.Provider>
              </View>
            ) : (
              <View style={[styles.centre, { top: CURTAIN_UP + 26, bottom: CURTAIN_DOWN + 34 }]}>{centre}</View>
            )}
            {under ? (
              <Animated.View
                style={[styles.under, { top: CURTAIN_UP - 8 }, underOut]}
                pointerEvents={away ? "none" : "box-none"}
              >
                {under}
              </Animated.View>
            ) : null}
            {tools ? (
              <Animated.View
                style={[styles.tools, { top: CURTAIN_UP + 46 }, toolsOut]}
                pointerEvents={away ? "none" : "box-none"}
              >
                {tools}
              </Animated.View>
            ) : null}
            <View style={[styles.hint, { bottom: CURTAIN_DOWN + 2 }]} pointerEvents="box-none">
              {hint}
            </View>
          </View>
        </StageCurtain>
      </View>

      <View style={styles.top} pointerEvents="box-none">
        {header}
      </View>
      {onBack ? (
        <Stud label={t("common.back")} onPress={onBack} side="left">
          <BackIcon size={18} />
        </Stud>
      ) : null}
      {onRules ? (
        <Stud label={t("rules.title")} onPress={onRules} side="right">
          <Emblem emoji="📖" size={20} />
        </Stud>
      ) : null}

      <View style={styles.bottom} pointerEvents="box-none">
        <Plinth width={width} height={plinthH}>
          {settled ? bottom : aside.bottom}
        </Plinth>
      </View>
      {overlays}
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0E16", overflow: "hidden" },
  stage: { position: "absolute", left: 0, right: 0 },
  centre: { position: "absolute", left: 0, right: 0, justifyContent: "center" },
  tools: { position: "absolute", right: 4, gap: 12 },
  top: { position: "absolute", left: 0, right: 0, top: 0, alignItems: "center" },
  under: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  corner: { position: "absolute" },
  stud: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 20 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  hint: { position: "absolute", left: 0, right: 0, alignItems: "center", paddingHorizontal: 26, gap: 2 },
});

/** The stage's lines of text: a hint over the plinth, and a stronger one
 *  (what to do now, a result). */
export const stageText = StyleSheet.create({
  hint: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#F1E6D2",
    textAlign: "center",
    ...shadow,
  },
  strong: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 19,
    color: "#FFD9A8",
    textAlign: "center",
    ...shadow,
  },
});

/** Plain stage text, for games without a GameText of their own. */
export function StageText({ strong = false, children }: { strong?: boolean; children: ReactNode }) {
  return (
    <AppText style={strong ? stageText.strong : stageText.hint} numberOfLines={3}>
      {children}
    </AppText>
  );
}
