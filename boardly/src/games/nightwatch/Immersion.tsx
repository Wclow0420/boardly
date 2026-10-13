// The game's set pieces: full-screen moments that stop the table for a
// breath — the hush before the roles are dealt, the role card turned
// over and tucked away, an anonymous letter arriving. Each one is felt
// as well as seen (see utils/haptics).

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { useTheme } from "@/theme";
import { GameText as AppText } from "./GameText";
import { heavyHaptic, moveHaptic, successHaptic, tapHaptic, tickHaptic } from "@/utils/haptics";

const NIGHT = "#05060B";
const PAPER = "#E9E2CF";
const INK = "#2A2433";
const BEAT_MS = 1150;

const clear = (color: string) => `${color}00`;

/** Light bleeding in from the four edges of the screen, beating like a
 *  heart. `color` is a six-digit hex. */
export function EdgeGlow({ color, calm = false }: { color: string; calm?: boolean }) {
  const [beat] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const to = (toValue: number, duration: number) =>
      Animated.timing(beat, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(
      calm
        ? Animated.sequence([to(0.85, 1600), to(0.4, 1600)])
        : // two beats and a rest
          Animated.sequence([to(1, 130), to(0.55, 170), to(0.95, 130), to(0.35, BEAT_MS - 430)])
    );
    loop.start();
    return () => loop.stop();
  }, [beat, calm]);

  // a thin rim: strong at the very edge, gone within a finger's width
  const fade = [`${color}CC`, clear(color)] as const;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: beat }]}>
      <LinearGradient colors={fade} style={[styles.edge, styles.top]} />
      <LinearGradient colors={fade} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={[styles.edge, styles.bottom]} />
      <LinearGradient colors={fade} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.edge, styles.left]} />
      <LinearGradient colors={fade} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={[styles.edge, styles.right]} />
    </Animated.View>
  );
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where a view is on screen; null when it can't be found in time. */
function boxOf(view: View | null): Promise<Box | null> {
  return Promise.race([
    new Promise<Box | null>((resolve) => {
      if (!view) return resolve(null);
      view.measureInWindow((x, y, width, height) =>
        resolve(width || height ? { x, y, width, height } : null)
      );
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
  ]);
}

export interface RoleIntroProps {
  visible: boolean;
  /** The colour of the player's side, shown once the card is turned. */
  tone: string;
  /** Where the card is put away: the Role button. */
  target: RefObject<View | null>;
  /** The card reaches the button. */
  onLand: () => void;
  onDone: () => void;
  /** The face of the role card. */
  children: ReactNode;
}

/** The start of a game: a hush, then the role card face down in the
 *  middle of the screen. A tap turns it over; once read, it flies to
 *  the Role button, where it can be looked at again. */
export function RoleIntro({ visible, tone, target, onLand, onDone, children }: RoleIntroProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [stage, setStage] = useState<"hush" | "card" | "seen" | "away">("hush");
  const card = useRef<View>(null);
  const [rise] = useState(() => new Animated.Value(0));
  const [flip] = useState(() => new Animated.Value(0));
  const [fly] = useState(() => new Animated.Value(0));
  const [dx] = useState(() => new Animated.Value(0));
  const [dy] = useState(() => new Animated.Value(0));
  const [shrink] = useState(() => new Animated.Value(1));

  // the hush has a heartbeat, in step with the light at the edges
  useEffect(() => {
    if (!visible || stage !== "hush") return;
    let second: ReturnType<typeof setTimeout>;
    const thump = () => {
      heavyHaptic();
      second = setTimeout(moveHaptic, 300);
    };
    thump();
    const pulse = setInterval(thump, BEAT_MS);
    return () => {
      clearInterval(pulse);
      clearTimeout(second);
    };
  }, [visible, stage]);

  // each stage comes up out of the dark
  useEffect(() => {
    if (!visible || stage === "seen" || stage === "away") return;
    rise.setValue(0);
    const up = Animated.spring(rise, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true });
    up.start();
    return () => up.stop();
  }, [visible, stage, rise]);

  const turn = () => {
    setStage("seen");
    heavyHaptic();
    Animated.timing(flip, {
      toValue: 1,
      duration: 620,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => successHaptic());
  };

  const putAway = async () => {
    setStage("away");
    tapHaptic();
    const [from, to] = await Promise.all([boxOf(card.current), boxOf(target.current)]);
    if (from && to) {
      dx.setValue(to.x + to.width / 2 - (from.x + from.width / 2));
      dy.setValue(to.y + to.height / 2 - (from.y + from.height / 2));
      shrink.setValue(Math.max(0.08, to.width / from.width));
    }
    Animated.timing(fly, {
      toValue: 1,
      duration: 720,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      moveHaptic();
      onLand();
      onDone();
    });
  };

  const turned = stage === "seen" || stage === "away";
  const glow = turned ? tone : colors.danger;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={() => {}}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: NIGHT, opacity: fly.interpolate({ inputRange: [0, 1], outputRange: [0.96, 0] }) },
        ]}
      >
        <EdgeGlow color={glow} calm={turned} />
      </Animated.View>

      {stage === "hush" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("nightwatch.intro.continue")}
          onPress={() => {
            tapHaptic();
            setStage("card");
          }}
          style={styles.centre}
        >
          <Animated.View style={[styles.stack, { opacity: rise, transform: [{ scale: rise }] }]}>
            <AppText style={styles.hushIcon}>🤫</AppText>
            <AppText style={[styles.hushWord, { color: colors.danger }]}>
              {t("nightwatch.intro.hush")}
            </AppText>
            <AppText variant="bodyMedium" align="center" style={{ color: PAPER }}>
              {t("nightwatch.intro.hushHint")}
            </AppText>
          </Animated.View>
          <AppText variant="caption" style={[styles.foot, { color: PAPER }]}>
            {t("nightwatch.intro.continue")}
          </AppText>
        </Pressable>
      ) : (
        <View style={styles.centre} pointerEvents="box-none">
          <Animated.View
            ref={card}
            collapsable={false}
            style={[
              styles.card,
              {
                opacity: Animated.multiply(
                  rise,
                  fly.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] })
                ),
                transform: [
                  { translateX: Animated.multiply(fly, dx) },
                  { translateY: Animated.multiply(fly, dy) },
                  {
                    scale: Animated.add(
                      rise.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                      Animated.multiply(fly, Animated.subtract(shrink, 1))
                    ),
                  },
                ],
              },
            ]}
          >
            <Animated.View
              pointerEvents={turned ? "auto" : "none"}
              style={[
                styles.face,
                {
                  transform: [
                    { perspective: 1000 },
                    { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] }) },
                  ],
                },
              ]}
            >
              {children}
            </Animated.View>
            <Animated.View
              pointerEvents={turned ? "none" : "auto"}
              style={[
                StyleSheet.absoluteFill,
                styles.face,
                {
                  transform: [
                    { perspective: 1000 },
                    { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) },
                  ],
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("nightwatch.intro.flip")}
                onPress={turn}
                style={[styles.back, { borderColor: colors.primary }]}
              >
                <View style={[styles.backInner, { borderColor: colors.primary }]}>
                  <AppText style={styles.backIcon}>🏮</AppText>
                  <AppText variant="label" style={{ color: colors.primary, letterSpacing: 4 }}>
                    ? ? ?
                  </AppText>
                </View>
              </Pressable>
            </Animated.View>
          </Animated.View>

          <View style={styles.under}>
            {stage === "card" ? (
              <AppText variant="bodyMedium" style={{ color: PAPER }}>
                {t("nightwatch.intro.flip")}
              </AppText>
            ) : stage === "seen" ? (
              <Button label={t("nightwatch.intro.keep")} onPress={putAway} />
            ) : null}
          </View>
        </View>
      )}
    </Modal>
  );
}

export interface LetterSceneProps {
  visible: boolean;
  letters: string[];
  onDone: () => void;
}

/** An anonymous letter arrives: the screen goes dark, the envelope
 *  drops, and the words write themselves out, one letter at a time. */
export function LetterScene({ visible, letters, onDone }: LetterSceneProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [drop] = useState(() => new Animated.Value(0));
  const text = letters[index] ?? "";
  const written = typed >= text.length;

  // the envelope lands, then the hand starts to write
  useEffect(() => {
    if (!visible) return;
    drop.setValue(0);
    const fall = Animated.spring(drop, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true });
    fall.start();
    const thud = setTimeout(heavyHaptic, 180);
    return () => {
      fall.stop();
      clearTimeout(thud);
    };
  }, [visible, index, drop]);

  useEffect(() => {
    if (!visible || written) return;
    const pen = setTimeout(
      () => {
        if (typed % 3 === 0) tickHaptic();
        setTyped(typed + 1);
      },
      typed === 0 ? 700 : 48
    );
    return () => clearTimeout(pen);
  }, [visible, typed, written]);

  const next = () => {
    if (!written) {
      setTyped(text.length);
      return;
    }
    tapHaptic();
    setTyped(0);
    if (index + 1 < letters.length) {
      setIndex(index + 1);
    } else {
      setIndex(0);
      onDone();
    }
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={next}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: NIGHT, opacity: 0.96 }]}>
        <EdgeGlow color="#7C5CFF" calm />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("nightwatch.intro.continue")}
        onPress={next}
        style={styles.centre}
      >
        <Animated.View
          style={[
            styles.stack,
            {
              opacity: drop,
              transform: [
                { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] }) },
                { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ["-14deg", "0deg"] }) },
              ],
            },
          ]}
        >
          <AppText style={styles.letterIcon}>✉️</AppText>
          <AppText variant="label" style={{ color: "#B9A8FF", letterSpacing: 2 }}>
            {t("nightwatch.letter.title")}
            {letters.length > 1 ? `  ${index + 1}/${letters.length}` : ""}
          </AppText>
          <View style={styles.paper}>
            <AppText style={styles.script}>
              {`“${text.slice(0, typed)}${written ? "”" : "▍"}`}
            </AppText>
            {written ? (
              <AppText variant="caption" style={styles.unsigned}>
                {`— ${t("nightwatch.letter.unsigned")}`}
              </AppText>
            ) : null}
          </View>
        </Animated.View>
        {written ? (
          <AppText variant="caption" style={[styles.foot, { color: PAPER }]}>
            {t("nightwatch.intro.continue")}
          </AppText>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  edge: { position: "absolute" },
  top: { top: 0, left: 0, right: 0, height: 56 },
  bottom: { bottom: 0, left: 0, right: 0, height: 56 },
  left: { top: 0, bottom: 0, left: 0, width: 36 },
  right: { top: 0, bottom: 0, right: 0, width: 36 },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  stack: { alignItems: "center", gap: 12, width: "100%", maxWidth: 380 },
  foot: { position: "absolute", bottom: 56, opacity: 0.7 },
  hushIcon: { fontSize: 96, lineHeight: 116 },
  hushWord: { fontSize: 40, lineHeight: 48, fontWeight: "800", letterSpacing: 6 },
  card: { width: "100%", maxWidth: 360 },
  face: { backfaceVisibility: "hidden" },
  back: {
    flex: 1,
    minHeight: 180,
    borderWidth: 2,
    borderRadius: 18,
    padding: 8,
    backgroundColor: "#171B2C",
  },
  backInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
  },
  backIcon: { fontSize: 56, lineHeight: 70 },
  under: { height: 72, marginTop: 20, alignItems: "center", justifyContent: "center" },
  letterIcon: { fontSize: 64, lineHeight: 80 },
  paper: {
    alignSelf: "stretch",
    minHeight: 150,
    padding: 20,
    borderRadius: 6,
    backgroundColor: PAPER,
    transform: [{ rotate: "-1.5deg" }],
  },
  script: { fontSize: 20, lineHeight: 30, fontStyle: "italic", color: INK },
  unsigned: { marginTop: 14, textAlign: "right", color: "#6B6478" },
});
