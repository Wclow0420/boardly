// My two cards in the stage's dock (features/game/stage/Dock.tsx): held
// at the plinth's left as two backs fanned in the hand, a card already
// lost lying face up behind, struck through. Lifted, they fly to the
// middle and turn face up side by side, large enough to read what each
// does. Both pictures share one box (`width` wide, 1.4× as tall), so the
// pair in the hand grows into the pair lifted without a jump.

import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { fontFamily } from "@/theme";
import { CARD_RATIO, HustleBack, RoleCard } from "../cards";
import type { Role } from "../logic";

/** One of my cards as the hand shows it. */
export interface HandCard {
  role: Role | null;
  lost: boolean;
}

/** The dock's box is 1.4× as tall as it's wide. */
export const HAND_RATIO = 1.4;

/** My cards held in the hand: their backs fanned, a lost one face up
 *  behind them and struck through. Drawn in a `width` × 1.4 box. */
export function HandBacks({ width, cards }: { width: number; cards: HandCard[] }) {
  const h = width * HAND_RATIO;
  const cw = width * 0.68;
  const ch = cw * CARD_RATIO;
  // the lost ones behind, the ones still held in front
  const order = cards.map((card, i) => ({ card, i })).sort((a, b) => Number(b.card.lost) - Number(a.card.lost));
  const n = cards.length;
  return (
    <View style={{ width, height: h }} pointerEvents="none">
      {order.map(({ card, i }) => {
        const k = n > 1 ? i / (n - 1) : 0.5;
        return (
          <View
            key={i}
            style={[
              styles.held,
              {
                left: (width - cw) * k,
                top: (h - ch) / 2 + (k - 0.5) * width * 0.08,
                transform: [{ rotate: `${(k - 0.5) * 18}deg` }],
              },
            ]}
          >
            {card.lost && card.role ? (
              <View style={styles.lost}>
                <RoleCard role={card.role} width={cw} />
                <View style={[styles.strike, { width: ch * 1.05, height: Math.max(2, cw * 0.09), left: (cw - ch * 1.05) / 2, top: ch / 2 }]} />
              </View>
            ) : (
              <HustleBack width={cw} />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** My cards lifted out of the hand: face up side by side, readable, with
 *  a word on keeping them secret. The same `width` × 1.4 box. */
export function HandFace({
  width,
  cards,
  title,
  caption,
}: {
  width: number;
  cards: HandCard[];
  title: string;
  caption: string;
}) {
  const gap = 14;
  const cw = (width - gap) / Math.max(2, cards.length);
  return (
    <View style={[styles.face, { width, height: width * HAND_RATIO, gap: 12 }]} pointerEvents="none">
      <AppText style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      <View style={[styles.row, { gap }]}>
        {cards.map((card, i) =>
          card.role ? (
            <RoleCard key={i} role={card.role} width={cw} lost={card.lost} />
          ) : (
            <HustleBack key={i} width={cw} />
          ),
        )}
      </View>
      <AppText style={styles.caption} numberOfLines={2}>
        {caption}
      </AppText>
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  held: {
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 2 },
  },
  lost: { opacity: 0.8 },
  strike: {
    position: "absolute",
    backgroundColor: "#D8283C",
    borderRadius: 2,
    transform: [{ rotate: "-56deg" }],
  },
  face: { alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", justifyContent: "center" },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#FFE7A8",
    ...shadow,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#F1E6D2",
    textAlign: "center",
    paddingHorizontal: 8,
    ...shadow,
  },
});
