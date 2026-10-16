// One game's badges on its board: dark planks in a riveted iron frame,
// the game's name on a gold-framed plate over the top edge and its
// count, the cards hanging inside three to a row; each swings in on its
// clip the first time the board is shown, then hangs still.
//
// The whole board (its frame, every card and every badge) is one canvas
// drawing images and pictures made once for the app (components/badges/
// bake.ts); only the names and progress are text over it, and invisible
// buttons over each card. While the cards swing it redraws; then it
// stops.

import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import type { BadgeRecord } from "@/api/client";
import { TIER_GLOW } from "@/components/badges/Badge";
import { badgePicture, bakedSvg } from "@/components/badges/bake";
import { AppText, BezelOverlay } from "@/components/ui";
import { TABLE, fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { badgeArt } from "../art";
import { goalOf, nextTier, sortBadges } from "../order";
import { badgeText } from "../strings";
import { boardArt, cardArt } from "./art";

const COLUMNS = 3;
const PAD_X = 12;
const PAD_TOP = 30;
const PAD_BOTTOM = 14;
const GAP = 10;
/** How long the cards take to swing in, all told (seconds). */
const SWING = 1.6;

/** A card's swing at time `s` after it was let go: a damped swing from
 *  -16° to hanging still. */
const swingAt = (s: number) => {
  "worklet";
  if (s <= 0) return -16;
  return -16 * Math.exp(-4.2 * s) * Math.cos(10 * s);
};
const startOf = (i: number) => {
  "worklet";
  return 0.1 + i * 0.07;
};

export function GameBoard({
  name,
  badges,
  onOpen,
}: {
  name: string;
  badges: BadgeRecord[];
  onOpen: (badge: BadgeRecord) => void;
}) {
  const { t } = useTranslation();
  const still = useReducedMotion();
  const [width, setWidth] = useState(0);
  const sorted = useMemo(() => sortBadges(badges), [badges]);
  const earned = badges.filter((b) => b.tier).length;

  // the board's measure, and where each card hangs
  const cell = width > 0 ? (width - 2 * PAD_X) / COLUMNS : 0;
  const cardW = cell - 8;
  const cardH = cell * 0.78 + 66;
  const rows = Math.ceil(sorted.length / COLUMNS);
  const height = PAD_TOP + rows * cardH + (rows - 1) * GAP + PAD_BOTTOM;
  const cards = useMemo(
    () =>
      sorted.map((badge, i) => ({
        badge,
        x: PAD_X + (i % COLUMNS) * cell + 4,
        y: PAD_TOP + Math.floor(i / COLUMNS) * (cardH + GAP),
      })),
    [sorted, cell, cardH],
  );

  // what each card draws: its card and its badge, made once for the app
  const parts = useMemo(() => {
    if (width === 0) return null;
    const size = cell * 0.78;
    return {
      board: bakedSvg("board", width, height, () => boardArt(width, height)),
      size,
      cards: cards.map(({ badge, x, y }) => {
        const metal = badge.tier === "silver" || badge.tier === "diamond" ? "silver" : "gold";
        const look = badgeArt(badge.key, badge.gameType);
        return {
          x,
          y,
          image: bakedSvg(`card|${metal}|${!badge.tier}`, cardW + 8, cardH + 8, () =>
            cardArt(cardW, cardH, metal, !badge.tier),
          ),
          picture: badgePicture(
            {
              art: look.art,
              tier: badge.tier ?? "bronze",
              frames: look.frames,
              tint: look.art.face ?? look.face,
            },
            !badge.tier,
          ),
        };
      }),
    };
  }, [width, height, cell, cardW, cardH, cards]);

  // the swing: once, when the board is first laid out
  const clock = useSharedValue(still ? SWING : 0);
  useEffect(() => {
    if (width === 0 || still) return;
    clock.value = withTiming(SWING, { duration: SWING * 1000, easing: Easing.linear });
  }, [width, still, clock]);

  const picture = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, Math.max(1, width), Math.max(1, height)));
    if (parts) {
      const plain = Skia.Paint();
      if (parts.board)
        c.drawImageRect(
          parts.board,
          Skia.XYWHRect(0, 0, parts.board.width(), parts.board.height()),
          Skia.XYWHRect(0, 0, width, height),
          plain,
        );
      const t = clock.value;
      parts.cards.forEach((card, i) => {
        const s = t - startOf(i);
        const alpha = Math.max(0, Math.min(1, s * 5 + 1));
        c.save();
        // swing about the clip at the card's top centre
        c.translate(card.x + cardW / 2, card.y);
        c.rotate(swingAt(s), 0, 0);
        c.translate(-cardW / 2, 0);
        if (alpha < 1) {
          const fade = Skia.Paint();
          fade.setAlphaf(alpha);
          c.saveLayer(fade);
        }
        if (card.image)
          c.drawImageRect(
            card.image,
            Skia.XYWHRect(0, 0, card.image.width(), card.image.height()),
            Skia.XYWHRect(-4, -4, cardW + 8, cardH + 8),
            plain,
          );
        c.translate(cardW / 2 - parts.size / 2, 8);
        c.scale(parts.size / 120, parts.size / 120);
        c.drawPicture(card.picture);
        if (alpha < 1) c.restore();
        c.restore();
      });
    }
    return recorder.finishRecordingAsPicture();
  });

  return (
    <View style={styles.wrap}>
      <View
        style={{ height: width > 0 ? height : 200 }}
        onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      >
        {parts ? (
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Picture picture={picture} />
          </Canvas>
        ) : null}
        {parts
          ? cards.map(({ badge, x, y }, i) => (
              <CardWords
                key={badge.key}
                badge={badge}
                name={badgeText(t, badge.key).name}
                x={x}
                y={y}
                w={cardW}
                h={cardH}
                top={cell * 0.78 + 12}
                order={i}
                clock={clock}
                onPress={() => {
                  tapHaptic();
                  onOpen(badge);
                }}
              />
            ))
          : null}
      </View>
      {/* the name plate over the top edge */}
      <View style={styles.plate} pointerEvents="none">
        <View style={styles.plateFace}>
          <BezelOverlay r={11} t={3} />
          <AppText style={styles.plateText} numberOfLines={1}>
            {name}
          </AppText>
          <AppText style={styles.plateCount}>{`${earned}/${badges.length}`}</AppText>
        </View>
      </View>
    </View>
  );
}

/** A card's name and how far it is to the next level, over the drawn
 *  card (they appear as it settles), and the button that opens it. */
function CardWords({
  badge,
  name,
  x,
  y,
  w,
  h,
  top,
  order,
  clock,
  onPress,
}: {
  badge: BadgeRecord;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Where the words start, under the badge. */
  top: number;
  order: number;
  clock: SharedValue<number>;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const next = nextTier(badge);
  const appear = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, (clock.value - startOf(order) - 0.35) * 4)),
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { left: x, top: y, width: w, height: h },
        pressed && styles.pressed,
      ]}
    >
      <Animated.View style={[styles.words, { top }, appear]}>
        <View style={styles.nameBox}>
          <AppText
            variant="tiny"
            align="center"
            numberOfLines={2}
            style={[styles.name, !badge.tier && styles.dim]}
          >
            {name}
          </AppText>
        </View>
        {next ? (
          <AppText
            variant="tiny"
            align="center"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.full, { color: TIER_GLOW[next] }]}
          >
            {t("badges.hall.toTier", {
              n: badge.progress ?? 0,
              goal: goalOf(badge, next),
              tier: t(`badges.tiers.${next}`),
            })}
          </AppText>
        ) : (
          // the ★ is drawn as an emblem in the line: centre the line itself
          <View style={styles.centred}>
            <AppText variant="tiny" style={{ color: TIER_GLOW.diamond }}>
              {`★ ${t("badges.tiers.diamond")}`}
            </AppText>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  card: { position: "absolute", borderRadius: 12 },
  pressed: { backgroundColor: "rgba(0,0,0,0.25)" },
  words: { position: "absolute", left: 0, right: 0 },
  full: { alignSelf: "stretch", textAlign: "center" },
  centred: { alignItems: "center" },
  nameBox: { height: 30, justifyContent: "center", paddingHorizontal: 4 },
  name: { color: TABLE.cream, fontFamily: fontFamily.medium },
  dim: { color: TABLE.creamMuted, opacity: 0.75 },
  plate: { position: "absolute", top: -12, left: 0, right: 0, alignItems: "center" },
  plateFace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 26,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#F4EEDF",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  plateText: { fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 17, color: "#3A2408", letterSpacing: 0.5 },
  plateCount: { fontFamily: fontFamily.semiBold, fontSize: 11, lineHeight: 15, color: "#8A6A3A" },
});
