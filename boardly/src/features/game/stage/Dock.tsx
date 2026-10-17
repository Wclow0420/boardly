// The stage's dock: what a game keeps on the plinth instead of over its
// scene, so the scene can fill the whole middle (GameStage's `dock`).
//   - The hand, at the plinth's left: my secret card peeking up like a
//     card held in the hand, its back showing. A tap lifts it to the
//     middle of the screen and turns it over; a tap puts it back.
//   - The satchel, at the plinth's right: a leather satchel holding the
//     lookup tools. A tap fans them out above it (emblem and name, like
//     the old tools down the side); picking one opens its panel; a tap
//     anywhere else folds them back. A red dot says something is new.
//   - The hint: one line set in an enamel cartouche on the plinth's gold
//     crest, the one sentence that matters now; when there's more to say,
//     a gold info stud at its end (or a tap on the line) opens the rest.
// On a narrow phone (under 390 wide) the hand and the satchel shrink to
// round studs at the plinth's ends, so two buttons fit between them.
// Still art is baked once (dockArt.ts); every move is a native transform.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import {
  useEffect,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import type { Jewel } from "@/components/engraved/shapes";
import { AppText, BezelOverlay, type AppTextProps } from "@/components/ui";
import { fontFamily } from "@/theme";
import { heavyHaptic, tapHaptic } from "@/utils/haptics";
import { SATCHEL_BOX, finialArt, infoArt, satchelArt } from "./dockArt";
import { glowArt } from "./art";
import { ToolButton } from "./parts";

/** One tool in the satchel. */
export interface StageTool {
  key: string;
  emoji: string;
  label: string;
  onPress: () => void;
  /** Something new behind it: a dot on it, and on the satchel. */
  badge?: boolean;
}

/** My hand: one secret card (a role) held at the plinth's left. */
export interface StageHand {
  /** Its name, for screen readers and under the card. */
  label: string;
  /** The card's back, drawn `width` wide (its height is 1.4×). */
  back: (width: number) => ReactNode;
  /** Its face, large: shown when the card is lifted. */
  face: ReactNode;
  /** How big the face is. */
  faceSize: { width: number; height: number };
  /** Change it to make the card bounce in the hand (a dealt card has
   *  just landed there). */
  pulse?: number;
}

/** The one line on the plinth's crest. */
export interface StageHint {
  line: string;
  /** The line's colour (a result, an error). */
  tone?: string;
  /** The rest, line by line, opened from the info stud. */
  more?: string[];
  /** The title of the popup with the rest. */
  title?: string;
}

export interface StageDock {
  hand?: StageHand;
  satchel?: { tools: StageTool[]; jewel?: Jewel };
  hint?: StageHint | null;
  /** The game's own text (its icons in emoji, its colours). */
  Text?: ComponentType<AppTextProps>;
  /** The hand is lifted, the satchel open or the rest of the hint shown:
   *  a scene behind can stop moving. */
  onOpen?: (open: boolean) => void;
}

/** Narrower than this, the hand and the satchel are studs. */
export const DOCK_COMPACT = 390;
/** The hand's card, its place on the plinth (from the plinth's top
 *  left), and the satchel's. */
const HAND = { w: 46, left: 14, top: 30 };
const SATCHEL = { w: 60, right: 10, top: 34 };
const STUD = { d: 44, side: 6, top: 53 };
const LABEL_H = 14;

/** How far in from each end the plinth's move sits. */
export function dockInsets(width: number, dock: StageDock) {
  const compact = width < DOCK_COMPACT;
  const end = compact ? STUD.side + STUD.d + 6 : 0;
  return {
    left: dock.hand ? (compact ? end : HAND.left + HAND.w + 18) : 40,
    right: dock.satchel ? (compact ? end : SATCHEL.right + SATCHEL.w + 8) : 40,
  };
}

/** Where the satchel's (or its stud's) middle is, from the plinth's top
 *  left: the tools fan out from here. */
export function satchelCentre(width: number) {
  if (width < DOCK_COMPACT)
    return { x: width - STUD.side - STUD.d / 2, y: STUD.top + STUD.d / 2 };
  const h = (SATCHEL.w * SATCHEL_BOX[1]) / SATCHEL_BOX[0];
  return { x: width - SATCHEL.right - SATCHEL.w / 2, y: SATCHEL.top + h / 2 };
}

/** Where the hand's card (or its stud's) middle is, and how wide the
 *  card is there, from the plinth's top left. */
export function handCentre(width: number) {
  if (width < DOCK_COMPACT)
    return { x: STUD.side + STUD.d / 2, y: STUD.top + STUD.d / 2, w: 20 };
  return {
    x: HAND.left + HAND.w / 2,
    y: HAND.top + (HAND.w * 1.4) / 2,
    w: HAND.w,
  };
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

/** A round dark metal stud (the narrow phone's hand and satchel). */
function Stud({ children }: { children: ReactNode }) {
  return (
    <View style={styles.stud}>
      <LinearGradient
        colors={["#3A4258", "#1A1E2C"]}
        style={StyleSheet.absoluteFill}
      />
      <BezelOverlay r={STUD.d / 2} t={3} />
      {children}
    </View>
  );
}

function Dot() {
  return <View style={styles.dot} />;
}

/** The card in my hand, at the plinth's left. */
export function HandSlot({
  hand,
  anchor,
  width,
  lifted,
  onLift,
}: {
  hand: StageHand;
  /** Set on the card in the hand: where a dealt card is put away. */
  anchor?: RefObject<View | null>;
  width: number;
  lifted: boolean;
  onLift: () => void;
}) {
  const compact = width < DOCK_COMPACT;
  const press = () => {
    heavyHaptic();
    onLift();
  };
  // a card landing in the hand bounces it
  const bounce = useSharedValue(1);
  const pulse = hand.pulse ?? 0;
  useEffect(() => {
    if (pulse > 0) {
      bounce.set(withSequence(withTiming(1.3, { duration: 120 }), withSpring(1, { damping: 6, stiffness: 220 })));
    }
  }, [pulse, bounce]);
  const bounced = useAnimatedStyle(() => ({ transform: [{ scale: bounce.get() }] }));
  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hand.label}
        onPress={press}
        hitSlop={6}
        style={({ pressed }) => [
          styles.studAt,
          { left: STUD.side },
          pressed && styles.pressed,
        ]}
      >
        <Stud>
          <View
            ref={anchor}
            collapsable={false}
            style={[styles.studCard, lifted && styles.gone]}
          >
            <Animated.View style={bounced}>{hand.back(20)}</Animated.View>
          </View>
        </Stud>
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hand.label}
      onPress={press}
      hitSlop={8}
      style={({ pressed }) => [styles.hand, pressed && styles.handPressed]}
    >
      <View
        ref={anchor}
        collapsable={false}
        style={[styles.handCard, lifted && styles.gone]}
      >
        <Animated.View style={bounced}>{hand.back(HAND.w)}</Animated.View>
      </View>
      <AppText style={styles.label} numberOfLines={1}>
        {hand.label}
      </AppText>
    </Pressable>
  );
}

/** The card lifted out of my hand: it rises from the plinth to the middle
 *  of the screen, turning over on the way; a tap anywhere puts it back. */
export function HandUp({
  hand,
  width,
  height,
  plinthTop,
  onDown,
}: {
  hand: StageHand;
  width: number;
  height: number;
  /** Where the plinth's top is on screen. */
  plinthTop: number;
  onDown: () => void;
}) {
  const { t } = useTranslation();
  const still = useReducedMotion();
  const lift = useSharedValue(0);
  useEffect(() => {
    lift.set(
      still
        ? 1
        : withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [lift, still]);
  const from = handCentre(width);
  const { width: fw, height: fh } = hand.faceSize;
  const dx = from.x - width / 2;
  const dy = plinthTop + from.y - height / 2;
  const s0 = from.w / fw;
  const card = useAnimatedStyle(() => {
    const p = lift.get();
    return {
      transform: [
        { translateX: dx * (1 - p) },
        { translateY: dy * (1 - p) - Math.sin(p * Math.PI) * 30 },
        { scale: s0 + (1 - s0) * p },
        { rotate: `${-8 * (1 - p)}deg` },
      ],
    };
  });
  // the back shows until halfway, then the face, each turning edge-on
  const back = useAnimatedStyle(() => ({
    opacity: lift.get() < 0.5 ? 1 : 0,
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(lift.get(), [0, 0.5], [0, 90], "clamp")}deg` },
    ],
  }));
  const face = useAnimatedStyle(() => ({
    opacity: lift.get() >= 0.5 ? 1 : 0,
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(lift.get(), [0.5, 1], [-90, 0], "clamp")}deg` },
    ],
  }));
  const dim = useAnimatedStyle(() => ({ opacity: lift.get() * 0.82 }));
  const words = useAnimatedStyle(() => ({
    opacity: interpolate(lift.get(), [0.7, 1], [0, 1], "clamp"),
  }));
  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      exiting={FadeOut.duration(160)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("game.stage.putAway")}
        onPress={() => {
          tapHaptic();
          onDown();
        }}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dim]} />
        <View style={styles.liftCentre} pointerEvents="none">
          <Animated.View style={[{ width: fw, height: fh }, card]}>
            <Animated.View style={[StyleSheet.absoluteFill, back]}>
              {hand.back(fw)}
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, face]}>
              {hand.face}
            </Animated.View>
          </Animated.View>
          <Animated.View style={words}>
            <AppText style={styles.putAway}>{t("game.stage.putAway")}</AppText>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** The satchel at the plinth's right. */
export function SatchelSlot({
  width,
  tools,
  jewel,
  open,
  onToggle,
}: {
  width: number;
  tools: StageTool[];
  jewel?: Jewel;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const compact = width < DOCK_COMPACT;
  const sw = compact ? 32 : SATCHEL.w;
  const sh = (sw * SATCHEL_BOX[1]) / SATCHEL_BOX[0];
  const image = bakedSvg(`satchel|${jewel ?? "amber"}`, sw, sh, () =>
    satchelArt(jewel),
  );
  const fresh = tools.some((tool) => tool.badge);
  const art = (
    <View style={{ width: sw, height: sh }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {image ? (
          <SkImage image={image} x={0} y={0} width={sw} height={sh} />
        ) : null}
      </Canvas>
    </View>
  );
  const label = t("game.stage.tools");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: open }}
      onPress={() => {
        tapHaptic();
        onToggle();
      }}
      hitSlop={8}
      style={({ pressed }) => [
        compact ? [styles.studAt, { right: STUD.side }] : styles.satchel,
        pressed && styles.pressed,
      ]}
    >
      {compact ? <Stud>{art}</Stud> : art}
      {!compact ? (
        <AppText style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
      ) : null}
      {fresh && !open ? (
        <View style={compact ? styles.studDot : styles.satchelDot}>
          <Dot />
        </View>
      ) : null}
    </Pressable>
  );
}

/** Where each tool lands when the satchel opens, from the satchel's
 *  middle: up in a column that leans left as it rises, like cards fanned
 *  from a hand. */
function fanAt(i: number) {
  return { x: -(i * i * 9 + i * 4), y: -(82 + i * 58) };
}

/** A pool of dark behind a fanned tool, so it reads over any scene. */
function Shade() {
  const image = bakedSvg("fan-shade", 96, 96, () =>
    glowArt(96, "#05060B", 0.8),
  );
  return (
    <Canvas style={styles.fanGlow} pointerEvents="none">
      {image ? (
        <SkImage image={image} x={0} y={0} width={96} height={96} />
      ) : null}
    </Canvas>
  );
}

function FanTool({
  tool,
  index,
  onPick,
}: {
  tool: StageTool;
  index: number;
  onPick: () => void;
}) {
  const still = useReducedMotion();
  const out = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still)
      out.set(
        withDelay(index * 45, withSpring(1, { damping: 14, stiffness: 180 })),
      );
  }, [out, index, still]);
  const to = fanAt(index);
  const style = useAnimatedStyle(() => {
    const p = out.get();
    return {
      opacity: Math.min(1, p * 1.6),
      transform: [
        { translateX: to.x * p },
        { translateY: to.y * p },
        { scale: 0.45 + 0.55 * p },
      ],
    };
  });
  return (
    <Animated.View style={[styles.fanTool, style]}>
      <Shade />
      <ToolButton
        emoji={tool.emoji}
        label={tool.label}
        badge={tool.badge}
        onPress={onPick}
      />
    </Animated.View>
  );
}

/** The tools fanned out of the open satchel, over a dimmed stage; a tap
 *  anywhere else folds them back. `at` is the satchel's middle on screen. */
export function SatchelFan({
  tools,
  at,
  onClose,
}: {
  tools: StageTool[];
  at: { x: number; y: number };
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(140)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("game.stage.fold")}
        onPress={onClose}
        style={[StyleSheet.absoluteFill, styles.fanDim]}
      />
      <View
        style={[styles.fanFrom, { left: at.x, top: at.y }]}
        pointerEvents="box-none"
      >
        {tools.map((tool, i) => (
          <FanTool
            key={tool.key}
            tool={tool}
            index={i}
            onPick={() => {
              onClose();
              tool.onPress();
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

/** The hint's one line, in an enamel cartouche on the plinth's crest. */
export function HintLip({
  hint,
  width,
  Text = AppText,
  onMore,
}: {
  hint: StageHint;
  width: number;
  Text?: ComponentType<AppTextProps>;
  onMore: () => void;
}) {
  const { t } = useTranslation();
  const maxWidth = width - 68;
  // there's more to read when the moment says more, or when the line is
  // too long for the cartouche (then the popup shows it whole)
  const more =
    (hint.more?.length ?? 0) > 0 || roughWidth(hint.line) > maxWidth - 30;
  const info = bakedSvg("stage-info", 18, 18, infoArt);
  const finial = bakedSvg("stage-finial", 28, 24, finialArt);
  const end = (flip: boolean) => (
    <Canvas style={[styles.finial, flip && styles.flip]} pointerEvents="none">
      {finial ? (
        <SkImage image={finial} x={0} y={0} width={28} height={24} />
      ) : null}
    </Canvas>
  );
  return (
    <View style={styles.lipRow} pointerEvents="box-none">
      {end(true)}
      <Pressable
        accessibilityRole={more ? "button" : "text"}
        accessibilityLabel={
          more ? `${hint.line} · ${t("game.stage.more")}` : hint.line
        }
        disabled={!more}
        onPress={() => {
          tapHaptic();
          onMore();
        }}
        hitSlop={6}
        style={({ pressed }) => [
          styles.lip,
          { maxWidth },
          pressed && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={["#262C42", "#141826", "#0C0F18"]}
          style={StyleSheet.absoluteFill}
        />
        <BezelOverlay r={12} t={2.5} />
        <Text
          style={[styles.lipText, hint.tone ? { color: hint.tone } : null]}
          numberOfLines={1}
        >
          {hint.line}
        </Text>
        {more ? (
          <View style={styles.info}>
            <Canvas style={StyleSheet.absoluteFill}>
              {info ? (
                <SkImage image={info} x={0} y={0} width={18} height={18} />
              ) : null}
            </Canvas>
          </View>
        ) : null}
      </Pressable>
      {end(false)}
    </View>
  );
}

/** About how wide a line is at the hint's size: wide for Chinese, an
 *  icon for an emoji, narrow for the rest. */
function roughWidth(line: string) {
  let w = 0;
  for (const ch of line) {
    const c = ch.codePointAt(0) ?? 0;
    w += c > 0xffff ? 16 : c >= 0x2e80 && c <= 0xffef ? 12.8 : 6.9;
  }
  return w;
}

/** The rest of the hint, line by line, for the popup. */
export function HintMore({
  hint,
  Text = AppText,
}: {
  hint: StageHint;
  Text?: ComponentType<AppTextProps>;
}) {
  return (
    <View style={{ gap: 10 }}>
      {[hint.line, ...(hint.more ?? [])].map((line, i) => (
        <Text key={i} style={i === 0 ? styles.moreFirst : styles.moreLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  gone: { opacity: 0 },
  hand: {
    position: "absolute",
    left: HAND.left - 4,
    top: HAND.top,
    width: HAND.w + 8,
    alignItems: "center",
  },
  handPressed: { transform: [{ translateY: -4 }] },
  handCard: {
    width: HAND.w,
    height: HAND.w * 1.4,
    transform: [{ rotate: "-8deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 3 },
  },
  satchel: {
    position: "absolute",
    right: SATCHEL.right,
    top: SATCHEL.top,
    alignItems: "center",
  },
  label: {
    marginTop: 2,
    height: LABEL_H,
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    lineHeight: LABEL_H,
    color: "#F1E6D2",
    ...shadow,
  },
  studAt: { position: "absolute", top: STUD.top },
  stud: {
    width: STUD.d,
    height: STUD.d,
    borderRadius: STUD.d / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  studCard: { width: 20, height: 28, transform: [{ rotate: "-8deg" }] },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#D8283C",
    borderWidth: 1.5,
    borderColor: "#3A0408",
  },
  satchelDot: { position: "absolute", right: 0, top: 4 },
  studDot: { position: "absolute", right: -1, top: -1 },
  fanDim: { backgroundColor: "rgba(5,6,11,0.58)" },
  fanGlow: { position: "absolute", width: 96, height: 96, left: -17, top: -22 },
  fanFrom: { position: "absolute", width: 0, height: 0 },
  fanTool: { position: "absolute", left: -31, top: -28 },
  dim: { backgroundColor: "#05060B" },
  liftCentre: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  putAway: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#E9E2CF",
    ...shadow,
  },
  lipRow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -4,
    flexDirection: "row",
    justifyContent: "center",
  },
  finial: { width: 28, height: 24, marginTop: 6, marginHorizontal: -3 },
  flip: { transform: [{ scaleX: -1 }] },
  lip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 26,
    paddingHorizontal: 14,
    borderRadius: 12,
    overflow: "hidden",
  },
  lipText: {
    flexShrink: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: "#F1E6D2",
    ...shadow,
  },
  info: { width: 18, height: 18, marginRight: -6 },
  moreFirst: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: "#FFE7C8",
  },
  moreLine: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: "#F1E6D2",
  },
});
