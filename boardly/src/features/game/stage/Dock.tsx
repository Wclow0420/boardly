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
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
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
import { tapHaptic } from "@/utils/haptics";
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
/** The card on the narrow phone's stud. */
const STUD_CARD = 20;
const LABEL_H = 14;

/** How far in from each end the plinth's move sits (with a hand and a
 *  satchel, or either). */
export function dockInsets(width: number, dock: { hand?: unknown; satchel?: unknown }) {
  const compact = width < DOCK_COMPACT;
  const end = compact ? STUD.side + STUD.d + 6 : 0;
  const left = dock.hand ? (compact ? end : HAND.left + HAND.w + 18) : 40;
  const right = dock.satchel ? (compact ? end : SATCHEL.right + SATCHEL.w + 8) : 40;
  // the same at both ends, so the move stays in the middle of the screen
  // when only one of the two is there (a hand put away when the game ends)
  const side = Math.max(left, right);
  return { left: side, right: side };
}

/** Where the satchel's (or its stud's) middle is, from the plinth's top
 *  left: the tools fan out from here. */
export function satchelCentre(width: number) {
  if (width < DOCK_COMPACT)
    return { x: width - STUD.side - STUD.d / 2, y: STUD.top + STUD.d / 2 };
  const h = (SATCHEL.w * SATCHEL_BOX[1]) / SATCHEL_BOX[0];
  return { x: width - SATCHEL.right - SATCHEL.w / 2, y: SATCHEL.top + h / 2 };
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

/** The card's flight between my hand and the middle, shared by the card
 *  in the hand (`HandSlot`) and the lifted card (`HandUp`): `seat` is the
 *  hand card's place (measured for the flight), `out` is 1 while the card
 *  is out of the hand (up, or on its way back), so the hand shows it again
 *  the very frame it lands. */
export interface HandFlight {
  seat: RefObject<View | null>;
  out: SharedValue<number>;
}

export function useHandFlight(): HandFlight {
  const seat = useRef<View | null>(null);
  const out = useSharedValue(0);
  return useMemo(() => ({ seat, out }), [out]);
}

/** The card in my hand, at the plinth's left. */
export function HandSlot({
  hand,
  anchor,
  flight,
  width,
  onLift,
}: {
  hand: StageHand;
  /** Set on the card in the hand: where a dealt card is put away. */
  anchor?: RefObject<View | null>;
  flight: HandFlight;
  width: number;
  onLift: () => void;
}) {
  const compact = width < DOCK_COMPACT;
  const press = () => {
    tapHaptic();
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
  const out = flight.out;
  const bounced = useAnimatedStyle(() => ({
    opacity: out.get() > 0 ? 0 : 1,
    transform: [{ scale: bounce.get() }],
  }));
  // the seat is the card's unturned box: the flight starts and ends there
  const card = (w: number, style: object) => (
    <View ref={flight.seat} collapsable={false} style={{ width: w, height: w * 1.4 }}>
      <View ref={anchor} collapsable={false} style={style}>
        <Animated.View style={bounced}>{hand.back(w)}</Animated.View>
      </View>
    </View>
  );
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
        <Stud>{card(STUD_CARD, styles.studCard)}</Stud>
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
      {card(HAND.w, styles.handCard)}
      <AppText style={[styles.label, styles.handLabel]} numberOfLines={1}>
        {hand.label}
      </AppText>
    </Pressable>
  );
}

/** How long the card takes to fly up, and back down. */
const FLY_UP = 440;
const FLY_DOWN = 380;
/** How long the flying card waits over the hand's before it takes off. */
const TAKE_OFF = 40;
/** How the card in the hand is turned. */
const TILT = -8;

/** The card lifted out of my hand: it flies from its place in the hand to
 *  the middle of the screen, growing and turning over on the way; a tap
 *  anywhere flies it back, shrinking and turning back, to land exactly in
 *  its place. Stays mounted (`up` false) until it has landed. */
export function HandUp({
  hand,
  flight,
  up,
  onDown,
}: {
  hand: StageHand;
  flight: HandFlight;
  /** Lifted (true) or put back (false: it flies home, then goes). */
  up: boolean;
  onDown: () => void;
}) {
  const { t } = useTranslation();
  const still = useReducedMotion();
  const [shown, setShown] = useState(up);
  if (up && !shown) setShown(true);
  const upRef = useRef(up);
  useEffect(() => {
    upRef.current = up;
  }, [up]);
  const root = useRef<View>(null);
  const lift = useSharedValue(0);
  // where the hand's card is, from the middle of the screen, and its scale
  const from = useSharedValue({ dx: 0, dy: 0, s: 0.2 });
  const ready = useSharedValue(0);
  const out = flight.out;
  const { width: fw, height: fh } = hand.faceSize;

  useEffect(() => {
    if (!shown) return;
    if (up) {
      const go = () => {
        // put back before it had even taken off
        if (!upRef.current) return setShown(false);
        // the flying card shows first, exactly over the one in the hand,
        // and takes off a couple of frames later, once it's painted: the
        // hand is never seen empty with nothing flying
        const wait = ready.get() ? 0 : TAKE_OFF;
        ready.set(1);
        out.set(withDelay(wait, withTiming(1, { duration: 0 })));
        lift.set(
          withDelay(
            wait,
            still
              ? withTiming(1, { duration: 180 })
              : withTiming(1, { duration: FLY_UP, easing: Easing.inOut(Easing.cubic) }),
          ),
        );
      };
      if (ready.get()) return go();
      // measure the hand's card and the screen, then take off from there
      const seat = flight.seat.current;
      const screen = root.current;
      if (!seat || !screen) return go();
      screen.measureInWindow((sx, sy, sw, sh) => {
        seat.measureInWindow((x, y, w, h) => {
          if (w > 0 && sw > 0) {
            from.set({
              dx: x + w / 2 - (sx + sw / 2),
              dy: y + h / 2 - (sy + sh / 2),
              s: w / fw,
            });
          }
          go();
        });
      });
    } else {
      const landed = () => {
        setShown(false);
        ready.set(0);
        tapHaptic();
      };
      lift.set(
        withTiming(
          0,
          still
            ? { duration: 160 }
            : { duration: FLY_DOWN, easing: Easing.inOut(Easing.cubic) },
          (done) => {
            "worklet";
            if (!done) return;
            // back in the hand the same frame the flying card lands
            out.set(0);
            runOnJS(landed)();
          },
        ),
      );
    }
  }, [up, shown, still, fw, lift, from, ready, out, flight.seat]);

  const card = useAnimatedStyle(() => {
    const p = lift.get();
    if (still) return { opacity: ready.get() * p };
    const f = from.get();
    return {
      opacity: ready.get(),
      transform: [
        { translateX: f.dx * (1 - p) },
        { translateY: f.dy * (1 - p) - Math.sin(p * Math.PI) * 40 },
        { scale: f.s + (1 - f.s) * p },
        { rotate: `${TILT * (1 - p)}deg` },
      ],
    };
  });
  // the back shows until halfway, then the face, each turning edge-on
  const back = useAnimatedStyle(() => {
    const p = still ? 1 : lift.get();
    return {
      opacity: p < 0.5 ? 1 : 0,
      transform: [
        { perspective: 900 },
        { rotateY: `${interpolate(p, [0, 0.5], [0, 90], "clamp")}deg` },
      ],
    };
  });
  const face = useAnimatedStyle(() => {
    const p = still ? 1 : lift.get();
    return {
      opacity: p >= 0.5 ? 1 : 0,
      transform: [
        { perspective: 900 },
        { rotateY: `${interpolate(p, [0.5, 1], [-90, 0], "clamp")}deg` },
      ],
    };
  });
  const dim = useAnimatedStyle(() => ({ opacity: lift.get() * 0.82 }));
  const words = useAnimatedStyle(() => ({
    opacity: interpolate(lift.get(), [0.7, 1], [0, 1], "clamp"),
  }));
  if (!shown) return null;
  return (
    <View
      ref={root}
      collapsable={false}
      style={StyleSheet.absoluteFill}
      pointerEvents={up ? "auto" : "none"}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("game.stage.putAway")}
        onPress={onDown}
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
        </View>
        <Animated.View style={[styles.putAwayAt, { top: "50%", marginTop: fh / 2 + 18 }, words]} pointerEvents="none">
          <AppText style={styles.putAway}>{t("game.stage.putAway")}</AppText>
        </Animated.View>
      </Pressable>
    </View>
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

/** How long the fan takes to open (each tool a little after the one
 *  below it) and to fold. */
const FAN_OPEN = 220;
const FAN_STEP = 25;
const FAN_FOLD = 150;

function FanTool({
  tool,
  index,
  open,
  onPick,
}: {
  tool: StageTool;
  index: number;
  open: SharedValue<number>;
  onPick: () => void;
}) {
  const to = fanAt(index);
  // each tool runs its own stretch of the one open value, so they leave
  // the satchel one after another and fold back together
  const style = useAnimatedStyle(() => {
    const p = open.get();
    return {
      opacity: Math.min(1, p * 2),
      transform: [
        { translateX: to.x * p },
        { translateY: to.y * p },
        { scale: 0.5 + 0.5 * Math.min(p, 1.04) },
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

/** One tool's share of the fan's opening. */
function useFanValue(index: number, open: boolean, still: boolean) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (still) v.set(withTiming(open ? 1 : 0, { duration: 120 }));
    else if (open)
      v.set(
        withDelay(
          index * FAN_STEP,
          withTiming(1, {
            duration: FAN_OPEN,
            // out quickly, with the slightest settle at the end
            easing: Easing.out(Easing.back(1.15)),
          }),
        ),
      );
    else v.set(withTiming(0, { duration: FAN_FOLD, easing: Easing.in(Easing.quad) }));
  }, [v, index, open, still]);
  return v;
}

function FanSlot(props: {
  tool: StageTool;
  index: number;
  open: boolean;
  still: boolean;
  onPick: () => void;
}) {
  const v = useFanValue(props.index, props.open, props.still);
  return (
    <FanTool tool={props.tool} index={props.index} open={v} onPick={props.onPick} />
  );
}

/** The tools fanned out of the open satchel, over a dimmed stage; a tap
 *  anywhere else folds them back. `at` is the satchel's middle on screen.
 *  The tools take touches the moment it opens, mid-flight; it stays
 *  mounted (`open` false) while it folds. */
export function SatchelFan({
  tools,
  at,
  open,
  onClose,
}: {
  tools: StageTool[];
  at: { x: number; y: number };
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const still = useReducedMotion();
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);
  const dim = useSharedValue(0);
  useEffect(() => {
    if (!shown) return;
    if (open) dim.set(withTiming(1, { duration: 140 }));
    else
      dim.set(
        withTiming(0, { duration: FAN_FOLD }, (done) => {
          "worklet";
          if (done) runOnJS(setShown)(false);
        }),
      );
  }, [open, shown, dim]);
  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.get() }));
  if (!shown) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? "box-none" : "none"}>
      <Animated.View style={[StyleSheet.absoluteFill, dimStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("game.stage.fold")}
          onPress={onClose}
          style={[StyleSheet.absoluteFill, styles.fanDim]}
        />
      </Animated.View>
      <View
        style={[styles.fanFrom, { left: at.x, top: at.y }]}
        pointerEvents="box-none"
      >
        {tools.map((tool, i) => (
          <FanSlot
            key={tool.key}
            tool={tool}
            index={i}
            open={open}
            still={still}
            onPick={() => {
              onClose();
              tool.onPress();
            }}
          />
        ))}
      </View>
    </View>
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
    transform: [{ rotate: `${TILT}deg` }],
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 3 },
  },
  // the hand's name may run wider than the card ("Your mark"), up to the
  // screen's edge, centred under it
  handLabel: { width: HAND.w + 2 * HAND.left, textAlign: "center" },
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
  studCard: {
    width: STUD_CARD,
    height: STUD_CARD * 1.4,
    transform: [{ rotate: `${TILT}deg` }],
  },
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
  },
  putAwayAt: { position: "absolute", left: 0, right: 0, alignItems: "center" },
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
