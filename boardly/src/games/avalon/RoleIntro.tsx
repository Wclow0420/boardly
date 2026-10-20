// The start of a game of Double Agent: the room goes dark and quiet (a
// heartbeat in the hand, light pulsing at the screen's edges), then the
// role card lies face down in the middle — the agency's back, the
// Boardly meeple in gold. A tap turns it over; once read it flies into
// my hand on the plinth (the stage's dock), where it can be lifted and
// looked at again. After
// Seal the Manor's set piece (nightwatch/Immersion.tsx), in the agency's
// words.

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { EdgeGlow } from "@/features/game/EdgeGlow";
import { heavyHaptic, moveHaptic, successHaptic, tapHaptic } from "@/utils/haptics";

const NIGHT = "#04080A";
const PAPER = "#E9E2CF";
const BEAT_MS = 1150;
/** The role card's width as a playing card. */
export const ROLE_CARD_W = 250;

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
      view.measureInWindow((x, y, width, height) => resolve(width || height ? { x, y, width, height } : null));
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
  ]);
}

export function RoleIntro({
  visible,
  tone,
  target,
  onLand,
  onDone,
  children,
  back,
}: {
  visible: boolean;
  /** The colour of the player's side, shown once the card is turned. */
  tone: string;
  /** Where the card is put away: the card in my hand. */
  target: RefObject<View | null>;
  onLand: () => void;
  onDone: () => void;
  /** The card's face. */
  children: ReactNode;
  /** Its back. */
  back: ReactNode;
}) {
  const { t } = useTranslation();
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

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={() => {}}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: NIGHT, opacity: fly.interpolate({ inputRange: [0, 1], outputRange: [0.96, 0] }) },
        ]}
      >
        <EdgeGlow color={turned ? tone : "#2DD4BF"} calm={turned} />
      </Animated.View>

      {stage === "hush" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("avalon.intro.continue")}
          onPress={() => {
            tapHaptic();
            setStage("card");
          }}
          style={styles.centre}
        >
          <Animated.View style={[styles.stack, { opacity: rise, transform: [{ scale: rise }] }]}>
            <AppText style={styles.hushIcon}>🤫</AppText>
            <AppText style={styles.hushWord}>{t("avalon.intro.hush")}</AppText>
            <AppText variant="bodyMedium" align="center" style={{ color: PAPER }}>
              {t("avalon.intro.hushHint")}
            </AppText>
          </Animated.View>
          <AppText variant="caption" style={[styles.foot, { color: PAPER }]}>
            {t("avalon.intro.continue")}
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
                opacity: Animated.multiply(rise, fly.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] })),
                transform: [
                  { translateX: Animated.multiply(fly, dx) },
                  { translateY: Animated.multiply(fly, dy) },
                  {
                    scale: Animated.add(
                      rise.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                      Animated.multiply(fly, Animated.subtract(shrink, 1)),
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
              <Pressable accessibilityRole="button" accessibilityLabel={t("avalon.intro.flip")} onPress={turn}>
                {back}
              </Pressable>
            </Animated.View>
          </Animated.View>

          <View style={styles.under}>
            {stage === "card" ? (
              <AppText variant="bodyMedium" style={{ color: PAPER }}>
                {t("avalon.intro.flip")}
              </AppText>
            ) : stage === "seen" ? (
              <Button label={t("avalon.intro.keep")} onPress={putAway} />
            ) : null}
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  stack: { alignItems: "center", gap: 12, width: "100%", maxWidth: 380 },
  foot: { position: "absolute", bottom: 56, opacity: 0.7 },
  hushIcon: { fontSize: 96, lineHeight: 116 },
  hushWord: { fontSize: 40, lineHeight: 48, fontWeight: "800", letterSpacing: 6, color: "#2DD4BF" },
  card: { width: ROLE_CARD_W },
  face: { backfaceVisibility: "hidden" },
  under: { height: 72, marginTop: 20, alignItems: "center", justifyContent: "center" },
});
