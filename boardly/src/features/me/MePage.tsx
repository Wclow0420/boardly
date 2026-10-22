// The Me page: my meeple, centre stage in the ground-floor lobby of the
// Boardly building. The lobby is one still picture (art.ts) with its life
// over it (LobbyLife); my meeple stands on the brass medallion in the
// spotlight (tap: the wardrobe); my avatar and name top left (my
// profile), my coins top right; the marquee over the lift's door turns
// its lines over; round brass buttons down both sides (the playing ones
// on the left: the mailbox, a code, practice; the wardrobe on the right,
// with room under it); my table's key above the big PLAY (the lift).
//
// It opens fast: the lobby is recorded once (stillSvg, kept for the app)
// and drawn once; the top shows first, the meeple, buttons and life the
// frames after. The clock stops when the tab isn't showing, a popup is
// over it, or with reduce motion.

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MascotLook } from "@/api/client";
import { stillSvg } from "@/components/badges/bake";
import { emblemData } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { AppText, LightSweep, StillPicture } from "@/components/ui";
import { CoinPill } from "@/features/coins/CoinPill";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import type { Look } from "@/features/mascot/dress";
import { MascotFigure } from "@/features/mascot/MascotStage";
import { useOnScreen } from "@/hooks/useOnScreen";
import { TABLE, fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { PLAY_PAD, buttonArt, dotArt, keyArt, labelArt, lobbyArt, plateArt, playArt } from "./art";
import { meLayout, type MeLayout } from "./layout";
import { LobbyLife } from "./LobbyLife";

export interface MePageProps {
  name: string;
  /** A line under my name (my record), if there's one. */
  title?: string | null;
  avatarUrl?: string | null;
  borderId?: string;
  mascot?: MascotLook | null;
  look: Look;
  coins: number;
  /** The marquee's lines, turned over in turn. */
  marquee: string[];
  /** Mail waiting (the dot on the mailbox). */
  unread: number;
  /** The table I'm at: what its key says ("3F · Hustle · back"). */
  table: string | null;
  onTable: () => void;
  onProfile: () => void;
  /** Tapped my meeple (the wardrobe). */
  onMascot: () => void;
  onMailbox: () => void;
  onCode: () => void;
  onPractice: () => void;
  onWardrobe: () => void;
  onPlay: () => void;
  /** Something is over the page (a popup): the lobby stands still. */
  paused?: boolean;
  /** Leave out the lobby's life (dev previews: measuring its cost). */
  lifeless?: boolean;
  /** Called once the lobby is on screen (for timing the opening). */
  onShown?: () => void;
}

const LINE_MS = 4200;

/** Whether a line fits `width` points in bold letters `size` high, by a
 *  close guess (a CJK character is about twice a Latin one). */
const fits = (text: string, width: number, size: number) => {
  let w = 0;
  for (const ch of text) w += /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(ch) ? size : size * 0.6;
  return w <= width;
};

/** The buttons' enamel faces: the playing ones crimson, green and blue,
 *  the wardrobe amber. */
const FACE = { mail: "#9A1828", code: "#2E6A30", practice: "#1E3E6A", wardrobe: "#A8661A" };

export function MePage(props: MePageProps) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };
  const L = useMemo(() => (size.w > 0 ? meLayout(size.w, size.h, insets.top) : null), [size.w, size.h, insets.top]);
  return (
    <View style={styles.page} onLayout={onLayout}>
      {L ? <Lobby L={L} {...props} /> : null}
    </View>
  );
}

function Lobby({ L, ...p }: MePageProps & { L: MeLayout }) {
  const { t } = useTranslation();
  const onScreen = useOnScreen();
  const reduced = useReducedMotion();
  const clock = useIsoClock(!onScreen || reduced || !!p.paused);
  // the top first, the rest a frame at a time
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage >= 2) return;
    const id = requestAnimationFrame(() => setStage((s) => s + 1));
    return () => cancelAnimationFrame(id);
  }, [stage]);
  const { onShown } = p;
  useEffect(() => {
    if (stage === 1) onShown?.();
  }, [stage, onShown]);

  const scene = useMemo(() => stillSvg(`me-lobby|${L.w}x${L.h}|${L.top}`, L.w, L.h, () => lobbyArt(L)), [L]);
  const M = L.mascot;

  return (
    <>
      <StillPicture picture={scene} style={{ width: L.w, height: L.h }} />
      {stage >= 2 && onScreen && !p.lifeless ? <LobbyLife L={L} scene={scene} clock={clock} /> : null}

      <Marquee L={L} lines={p.marquee} />

      {stage >= 1 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("me.wardrobe")}
          onPress={() => {
            tapHaptic();
            p.onMascot();
          }}
          style={[styles.abs, { left: M.x, top: M.y, width: M.w, height: M.h }]}
        >
          <MascotFigure look={p.look} width={M.w} seed="me" paused={!onScreen || !!p.paused} />
        </Pressable>
      ) : null}

      {stage >= 1 ? (
        <>
          <WallButton at={L.left[0]} size={L.button} face={FACE.mail} emoji="✉" label={t("me.mailbox")} dot={p.unread} onPress={p.onMailbox} />
          <WallButton at={L.left[1]} size={L.button} face={FACE.code} emoji="🎟" label={t("me.code")} onPress={p.onCode} />
          <WallButton at={L.left[2]} size={L.button} face={FACE.practice} emoji="🤖" label={t("me.practice")} onPress={p.onPractice} />
          <WallButton at={L.right[0]} size={L.button} face={FACE.wardrobe} emoji="👗" label={t("me.wardrobe")} onPress={p.onWardrobe} />
          {p.table ? <RoomKey L={L} label={p.table} onPress={p.onTable} /> : null}
          <PlayButton L={L} label={t("me.play")} onPress={p.onPlay} />
        </>
      ) : null}

      {/* last, so a border's wings draw over everything */}
      <Header L={L} {...p} />
    </>
  );
}

/** My avatar (my profile) and name plate, my coins. */
function Header({ L, name, title, avatarUrl, borderId, mascot, coins, onProfile }: MePageProps & { L: MeLayout }) {
  const { t } = useTranslation();
  const plateW = Math.round(Math.min(148, L.w * 0.37));
  const plateH = 42;
  const plate = useMemo(() => stillSvg(`me-plate|${plateW}`, plateW, plateH + 3, () => plateArt(plateW, plateH)), [plateW]);
  return (
    <View style={[styles.header, { top: L.top + 6, width: L.w }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("tabs.profile")}
        onPress={() => {
          tapHaptic();
          onProfile();
        }}
        style={({ pressed }) => [styles.me, { width: 34 + plateW }, pressed && styles.pressed]}
      >
        <View style={[styles.plate, { left: 34, width: plateW, height: plateH }]}>
          <StillPicture picture={plate} style={{ position: "absolute", left: 0, top: 0, width: plateW, height: plateH + 3 }} />
          <View style={[styles.plateText, { paddingLeft: 30 }]}>
            <AppText style={styles.name} numberOfLines={1}>
              {name}
            </AppText>
            {title ? (
              <AppText style={styles.title} numberOfLines={1}>
                {title}
              </AppText>
            ) : null}
          </View>
        </View>
        <AvatarBorder name={name} borderId={borderId} avatarUrl={avatarUrl} mascot={mascot} size={50} />
      </Pressable>
      <View style={{ flex: 1 }} />
      <CoinPill amount={coins} />
    </View>
  );
}

/** The marquee's line, turning over to the next every few seconds: the
 *  old one rises away, the new one rises in. */
function Marquee({ L, lines }: { L: MeLayout; lines: string[] }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const turn = useSharedValue(0);
  const key = lines.join("\n");
  const n = lines.length;
  useEffect(() => {
    turn.set(0);
    if (n < 2) return;
    const next = () => setI((k) => k + 1);
    const id = setInterval(() => {
      if (reduced) return next();
      // out (0 → 1), the next line, then in (−1 → 0)
      turn.set(
        withTiming(1, { duration: 240, easing: Easing.in(Easing.quad) }, (done) => {
          if (!done) return;
          scheduleOnRN(next);
          turn.set(-1);
          turn.set(withTiming(0, { duration: 340, easing: Easing.out(Easing.quad) }));
        }),
      );
    }, LINE_MS);
    return () => {
      clearInterval(id);
      cancelAnimation(turn);
    };
  }, [key, n, reduced, turn]);
  const style = useAnimatedStyle(() => {
    const v = turn.get();
    return { opacity: 1 - Math.abs(v), transform: [{ translateY: -v * 12 }] };
  });
  const Q = L.marquee;
  const line = lines[i % Math.max(1, n)] ?? "";
  return (
    <View
      pointerEvents="none"
      style={[styles.abs, styles.marquee, { left: Q.x + 12, top: Q.y + 10, width: Q.w - 24, height: Q.h - 20 }]}
    >
      <Animated.View style={[styles.marqueeLine, style]}>
        {/* a long line in smaller letters, so it reads whole */}
        <AppText style={[styles.marqueeText, !fits(line, Q.w - 24, 14) && styles.marqueeLong]} numberOfLines={1}>
          {line}
        </AppText>
      </Animated.View>
    </View>
  );
}

/** A round brass button on the wall with its name under it, and a ruby
 *  with a count when something waits. */
function WallButton({
  at,
  size,
  face,
  emoji,
  label,
  dot = 0,
  onPress,
}: {
  at: { x: number; y: number };
  size: number;
  face: string;
  emoji: string;
  label: string;
  dot?: number;
  onPress: () => void;
}) {
  const art = useMemo(
    () => stillSvg(`me-btn|${emoji}|${face}|${size}`, size, size + 3, () => buttonArt(size, face, emblemData(emoji))),
    [emoji, face, size],
  );
  const lw = size + 20;
  const lh = 16;
  const plate = useMemo(() => stillSvg(`me-label|${lw}`, lw, lh + 2, () => labelArt(lw, lh)), [lw]);
  const ds = 18;
  const ruby = useMemo(() => (dot > 0 ? stillSvg(`me-dot|${ds}`, ds, ds, () => dotArt(ds)) : null), [dot]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dot > 0 ? `${label} (${dot})` : label}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.abs,
        { left: at.x - lw / 2, top: at.y - size / 2, width: lw, height: size + lh + 2 },
        pressed && styles.pressedButton,
      ]}
    >
      <StillPicture picture={art} style={{ position: "absolute", left: (lw - size) / 2, top: 0, width: size, height: size + 3 }} />
      <StillPicture picture={plate} style={{ position: "absolute", left: 0, top: size - 2, width: lw, height: lh + 2 }} />
      <View style={[styles.label, { top: size - 2, width: lw, height: lh }]}>
        <AppText style={styles.labelText} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      {ruby ? (
        <View style={[styles.dot, { left: (lw + size) / 2 - ds + 2, width: ds, height: ds }]}>
          <StillPicture picture={ruby} style={StyleSheet.absoluteFill} />
          <AppText style={styles.dotText}>{dot > 9 ? "9+" : String(dot)}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

/** My table's key, above PLAY: tap to go back to it. */
function RoomKey({ L, label, onPress }: { L: MeLayout; label: string; onPress: () => void }) {
  const K = L.key;
  const art = useMemo(() => stillSvg(`me-key|${K.w}x${K.h}`, K.w, K.h + 3, () => keyArt(K.w, K.h)), [K.w, K.h]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.abs, { left: K.x, top: K.y, width: K.w, height: K.h + 3 }, pressed && styles.pressedButton]}
    >
      <StillPicture picture={art} style={StyleSheet.absoluteFill} />
      <View style={[styles.keyText, { paddingLeft: K.h + 6, paddingRight: K.h * 0.5 + 6, height: K.h }]}>
        <AppText style={[styles.keyLabel, !fits(label, K.w - K.h * 1.5 - 12, 13) && styles.keyLong]} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

/** The big PLAY: to the lift. */
function PlayButton({ L, label, onPress }: { L: MeLayout; label: string; onPress: () => void }) {
  const B = L.play;
  const art = useMemo(() => stillSvg(`me-play|${B.w}x${B.h}`, B.w, B.h + PLAY_PAD + 4, () => playArt(B.w, B.h)), [B.w, B.h]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.abs, { left: B.x, top: B.y, width: B.w, height: B.h }, pressed && styles.pressedButton]}
    >
      <StillPicture picture={art} style={{ position: "absolute", left: 0, top: -PLAY_PAD, width: B.w, height: B.h + PLAY_PAD + 4 }} />
      <View style={[StyleSheet.absoluteFill, { margin: 5 }]} pointerEvents="none">
        <LightSweep r={11} every={5.5} />
      </View>
      <View style={styles.playText} pointerEvents="none">
        <AppText style={styles.playLabel} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const shadow = { textShadowColor: "rgba(20,8,2,0.9)", textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 2 };

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: TABLE.table[1], overflow: "hidden" },
  abs: { position: "absolute" },
  pressed: { opacity: 0.85 },
  pressedButton: { transform: [{ scale: 0.95 }] },
  header: { position: "absolute", left: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  me: { flexDirection: "row", alignItems: "center", height: 56 },
  plate: { position: "absolute", top: 7 },
  plateText: { flex: 1, justifyContent: "center", paddingRight: 10 },
  name: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 18, color: TABLE.cream, ...shadow },
  title: { fontFamily: fontFamily.medium, fontSize: 10, lineHeight: 13, color: TABLE.yellow.fill[0], ...shadow },
  marquee: { overflow: "hidden", justifyContent: "center" },
  marqueeLine: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  marqueeText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0.6,
    color: "#FFE9B0",
    textShadowColor: "rgba(40,0,6,0.9)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
  marqueeLong: { fontSize: 12, lineHeight: 17, letterSpacing: 0.2 },
  label: { position: "absolute", left: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  labelText: { fontFamily: fontFamily.bold, fontSize: 9.5, lineHeight: 12, color: TABLE.cream, ...shadow },
  dot: { position: "absolute", top: -3, alignItems: "center", justifyContent: "center" },
  dotText: { fontFamily: fontFamily.bold, fontSize: 9, lineHeight: 11, color: "#FFFFFF", ...shadow },
  keyText: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, justifyContent: "center" },
  keyLabel: { fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 17, color: TABLE.cream, ...shadow },
  keyLong: { fontSize: 11.5, lineHeight: 15 },
  playText: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  playLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 3,
    color: "#FFFFFF",
    textShadowColor: "rgba(122,42,4,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
});
