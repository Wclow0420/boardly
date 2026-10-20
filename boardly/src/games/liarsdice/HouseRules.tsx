// The house rules of this table, as a card held in my hand on the dock
// (GameStage's dock): its back in the den's wine with a lamp-amber jewel;
// lifted, its face shows two dice in a wine window, "House rules" on a
// felt plaque, and under it the table's way of calling with its
// thresholds for the players still in, what a lost open or split costs,
// and when you're out (or, endless, how the night ends). The lines are
// the lobby's table notes (notes.ts), so the two always agree.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { CardBack, CardFront, FRONT, type BackStyle, type FrontStyle } from "@/components/tabletop/cards/PlayingCard";
import { fontFamily } from "@/theme";
import { DRINKS, KNOCKOUT_CUPS, activeSeats, callingOf, type LiarsDiceState } from "./logic";
import { callingNote } from "./notes";
import { DiceRow } from "./pieces";

export const DEN_BACK: BackStyle = {
  colors: ["#B8382A", "#7A1810", "#3A0806"],
  pattern: "scales",
  jewel: ["#FFE7B0", "#F2A24B", "#7A3A08"],
};
const DEN_FRONT: FrontStyle = {
  window: ["#C8503A", "#7A1810", "#2E0606"],
  plaque: ["#3E7A54", "#1A4A30", "#0E2E1C"],
  arch: "round",
};

/** The card's back, `width` wide. */
export function HouseRulesBack({ width }: { width: number }) {
  return <CardBack width={width} back={DEN_BACK} />;
}

/** The lines on the card's face: the way of calling, what a lost call
 *  costs, how you leave the table. */
export function houseLines(state: LiarsDiceState, t: ReturnType<typeof useTranslation>["t"]) {
  const players = activeSeats(state).length;
  return {
    at: t("liarsdice.house.at", { count: players }),
    lines: [
      { emoji: "🎯", text: callingNote(callingOf(state), players, t) },
      { emoji: "🍺", text: t("liarsdice.table.drinks", DRINKS) },
      state.mode === "endless"
        ? { emoji: "🛑", text: t("gameOptions.liarsdice.mode.endless.desc") }
        : { emoji: "🍻", text: t("liarsdice.table.knockout", { count: state.maxCups ?? KNOCKOUT_CUPS }) },
    ],
  };
}

/** The card's face, `width` wide (its height is 1.4×). */
export function HouseRulesFace({ state, width }: { state: LiarsDiceState; width: number }) {
  const { t } = useTranslation();
  const s = width / 100;
  const { at, lines } = houseLines(state, t);
  const W = FRONT.window;
  const P = FRONT.plaque;
  const B = FRONT.body;
  const die = 19 * s;
  return (
    <CardFront width={width} front={DEN_FRONT}>
      <View
        style={[styles.centre, { position: "absolute", left: W.x * s, top: (W.y + 12) * s, width: W.w * s, height: (W.h - 12) * s }]}
        pointerEvents="none"
      >
        <DiceRow faces={[5, 1]} tones={["plain", "lit"]} size={die} gap={5 * s} />
      </View>
      <View style={[styles.centre, { position: "absolute", left: P.x * s, top: P.y * s, width: P.w * s, height: P.h * s }]}>
        <AppText style={[styles.name, { fontSize: 6.6 * s, lineHeight: 8.6 * s }]} numberOfLines={1}>
          {t("liarsdice.house.title")}
        </AppText>
      </View>
      <View style={[styles.body, { position: "absolute", left: B.x * s, top: B.y * s, width: B.w * s, height: (B.h + 4) * s, gap: 2.2 * s }]}>
        <AppText style={[styles.at, { fontSize: 3.3 * s, lineHeight: 4.4 * s }]} numberOfLines={1}>
          {at}
        </AppText>
        {lines.map((line) => (
          <AppText key={line.emoji} style={[styles.line, { fontSize: 3.65 * s, lineHeight: 4.9 * s }]}>
            {`${line.emoji} ${line.text}`}
          </AppText>
        ))}
      </View>
    </CardFront>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: "center", justifyContent: "center" },
  name: {
    fontFamily: fontFamily.bold,
    color: "#FFF6E0",
    letterSpacing: 1,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  body: { alignItems: "center" },
  at: { fontFamily: fontFamily.bold, color: "#8A1424", letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center" },
  line: { fontFamily: fontFamily.medium, color: "#3A2408", textAlign: "center" },
});
