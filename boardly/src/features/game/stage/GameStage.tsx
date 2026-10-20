// The game stage, for any game: the whole screen is the game. A game hands
// it its own header art (drawn across the top: Seal the Manor's stained-
// glass arch), what sits just under it (tags, a track), the middle, tools
// down the right side, lines above the plinth, and the main move on the
// plinth along the foot. Everything between the header and the plinth is
// behind the red curtain, which closes and opens whenever `sceneKey`
// changes; the plinth's move changes only once it's shut. Corner studs
// for back and rules. See "The stage" in AGENTS.md, and Seal the Manor's
// ManorStage for a game using it.
//
// A game can instead hand it a `dock` (Dock.tsx): then nothing is laid
// over the scene, which fills the whole middle. My secret card sits in
// my hand at the plinth's left, the lookup tools in a satchel at its
// right (they fan out above it when tapped), and the hint is one line on
// the plinth's crest, the rest behind an info stud. The plinth's move
// sits between hand and satchel. `tools` and `hint` are then unused.

import { LinearGradient } from "expo-linear-gradient";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import type { Jewel } from "@/components/engraved/shapes";
import { BackIcon, Emblem } from "@/components/icons";
import { AppText, BezelOverlay, IconButton } from "@/components/ui";
import { fontFamily } from "@/theme";
import { Popup, type PopupLook } from "../Popup";
import {
  HandSlot,
  HandUp,
  HintLip,
  HintMore,
  SatchelFan,
  SatchelSlot,
  dockInsets,
  satchelCentre,
  useHandFlight,
  type StageDock,
} from "./Dock";
import { Glow, Plinth } from "./parts";
import { StageCurtain } from "./StageCurtain";

export type { StageDock, StageHand, StageHint, StageTool } from "./Dock";

/** How tall the plinth is above the home bar. */
export const PLINTH_H = 128;
/** How far the curtain reaches up behind the header and down behind the
 *  plinth, past the stage between them. */
const CURTAIN_UP = 14;
const CURTAIN_DOWN = 12;
/** How far the middle stands clear of what's under the header (above)
 *  and of the hint lines (below). A middle that wants the whole height
 *  between header and plinth reaches out by this much. */
export const MIDDLE_PAD = { top: 26, bottom: 34 };
/** The same, on a stage with a dock: nothing stands over the scene's
 *  foot, so the middle reaches nearly down to the plinth. */
export const DOCK_PAD = { top: 26, bottom: 10 };
/** How long the dock takes to put away what was open (the card flying
 *  home): a scene behind rests until then. */
const DOCK_SETTLE = 420;

/** Development only: lay the stage out as if the screen were this wide
 *  (a narrow phone, on a wide simulator). */
export const StageWidth = createContext<number | null>(null);

/** The stage's size: the screen's, unless a dev page narrows it. */
export function useStageSize() {
  const window = useWindowDimensions();
  const width = useContext(StageWidth);
  return { width: width ?? window.width, height: window.height };
}

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
  /** The dock's popups (the rest of the hint) wear this. */
  popup?: PopupLook;
}

/** Seal the Manor's night. */
export const NIGHT: StageLook = {
  sky: ["#1A2238", "#0E1220", "#0B0E16"],
  glow: "#F28B4B",
  jewel: "amber",
  popup: { enamel: ["#3A4A7A", "#1E2A50", "#0E1430"], jewel: "amber", glow: "#FFB45E" },
};

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
  dock,
  handRef,
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
  /** Keep the tools, my card and the hint on the plinth instead (see the
   *  top of the file): the scene gets the whole middle. */
  dock?: StageDock;
  /** Set on the card in the dock's hand: where a dealt card is put away. */
  handRef?: RefObject<View | null>;
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
  const { width, height } = useStageSize();
  // the move on the plinth changes with the scene, once the curtain has
  // closed on the old one
  const [aside, setAside] = useState<{ key: string; bottom: ReactNode }>(() => ({ key: sceneKey, bottom }));
  if (aside.key === sceneKey && aside.bottom !== bottom) setAside({ key: sceneKey, bottom });
  const settled = aside.key === sceneKey;
  const plinthH = PLINTH_H + insets.bottom;
  const pad = dock ? DOCK_PAD : MIDDLE_PAD;

  // the dock: one thing open at a time (the hand lifted, the satchel's
  // tools fanned out, the rest of the hint); a scene behind can rest
  const [open, setOpen] = useState<"hand" | "satchel" | "hint" | null>(null);
  const onOpen = dock?.onOpen;
  useEffect(() => {
    if (open !== null) return onOpen?.(true);
    // the scene wakes once the card has flown home or the tools folded
    const wake = setTimeout(() => onOpen?.(false), DOCK_SETTLE);
    return () => clearTimeout(wake);
  }, [open, onOpen]);
  const toggle = (what: "hand" | "satchel" | "hint") => setOpen((now) => (now === what ? null : what));
  const hand = dock?.hand;
  const satchel = dock?.satchel;
  const lip = dock?.hint ?? null;
  // a dock part that goes away takes its open view with it
  if ((open === "hand" && !hand) || (open === "satchel" && !satchel) || (open === "hint" && !lip)) {
    setOpen(null);
  }
  const fanFrom = satchelCentre(width);
  const flight = useHandFlight();

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
                <StageInsets.Provider value={{ top: headerHeight + pad.top, bottom: plinthH + pad.bottom }}>
                  {centre}
                </StageInsets.Provider>
              </View>
            ) : (
              <View style={[styles.centre, { top: CURTAIN_UP + pad.top, bottom: CURTAIN_DOWN + pad.bottom }]}>
                {centre}
              </View>
            )}
            {under ? (
              <Animated.View
                style={[styles.under, { top: CURTAIN_UP - 8 }, underOut]}
                pointerEvents={away ? "none" : "box-none"}
              >
                {under}
              </Animated.View>
            ) : null}
            {tools && !dock ? (
              <Animated.View
                style={[styles.tools, { top: CURTAIN_UP + 46 }, toolsOut]}
                pointerEvents={away ? "none" : "box-none"}
              >
                {tools}
              </Animated.View>
            ) : null}
            {!dock ? (
              <View style={[styles.hint, { bottom: CURTAIN_DOWN + 2 }]} pointerEvents="box-none">
                {hint}
              </View>
            ) : null}
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
        <Plinth width={width} height={plinthH} inset={dock ? dockInsets(width, dock) : undefined}>
          {settled ? bottom : aside.bottom}
        </Plinth>
        {dock ? (
          <View style={[styles.dock, { width, height: plinthH }]} pointerEvents="box-none">
            {hand ? <HandSlot hand={hand} anchor={handRef} flight={flight} width={width} onLift={() => toggle("hand")} /> : null}
            {satchel ? (
              <SatchelSlot
                width={width}
                tools={satchel.tools}
                jewel={satchel.jewel ?? look.jewel}
                open={open === "satchel"}
                onToggle={() => toggle("satchel")}
              />
            ) : null}
            {lip ? <HintLip hint={lip} width={width} Text={dock.Text} onMore={() => toggle("hint")} /> : null}
          </View>
        ) : null}
      </View>
      {satchel ? (
        <SatchelFan
          tools={satchel.tools}
          at={{ x: fanFrom.x, y: height - plinthH + fanFrom.y }}
          open={open === "satchel"}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {hand ? <HandUp hand={hand} flight={flight} up={open === "hand"} onDown={() => setOpen(null)} /> : null}
      {dock ? (
        <Popup
          look={look.popup}
          visible={open === "hint" && lip !== null}
          title={lip?.title ?? t("game.stage.more")}
          onClose={() => setOpen(null)}
        >
          {lip ? <HintMore hint={lip} Text={dock.Text} /> : null}
        </Popup>
      ) : null}
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
  dock: { position: "absolute", top: 0 },
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
