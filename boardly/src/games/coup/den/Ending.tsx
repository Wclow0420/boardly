// The end of the night, on the stage: everyone under the lamps, the last
// one standing crowned in full light and the rest gone dim; the verdict;
// then every hand dealt face up — the cards each player lost and the
// ones the winner never had to show — and what follows a game (coins,
// badges), handed in by the game screen.

import { useContext, useEffect, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { StageInsets } from "@/features/game/stage/GameStage";
import type { Light, Standing } from "@/features/game/stage/StageLineup";
import { fontFamily } from "@/theme";
import { heavyHaptic, successHaptic } from "@/utils/haptics";
import { RoleCard, HustleBack } from "../cards";
import type { CoupState } from "../logic";
import { TableLineup } from "./TableLineup";

const STAGE_H = 250;
const CARD = 54;

export function Ending({
  state,
  mySeat,
  people,
  nameOf,
  afterGame,
  paused,
}: {
  state: CoupState;
  mySeat: number;
  people: Standing[];
  nameOf: (seat: number) => string;
  afterGame?: ReactNode;
  paused: boolean;
}) {
  const { t } = useTranslation();
  const insets = useContext(StageInsets);
  const winner = state.winner;
  useEffect(() => {
    const thud = setTimeout(() => {
      heavyHaptic();
      if (winner === mySeat) successHaptic();
    }, 1400);
    return () => clearTimeout(thud);
  }, [winner, mySeat]);
  const lights: Record<number, Light> = Object.fromEntries(
    people.map((p) => [p.seat, winner === null ? "soft" : p.seat === winner ? "lit" : "dim"]),
  );
  // the winner first, then the others by when they went out (last out first)
  const outOrder = state.log.flatMap((e) => (e.t === "out" ? [e.seat] : [])).reverse();
  const order = [
    ...(winner !== null ? [winner] : []),
    ...outOrder.filter((s) => s !== winner),
    ...people.map((p) => p.seat).filter((s) => s !== winner && !outOrder.includes(s)),
  ];
  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 10 }}
      scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: STAGE_H }}>
        <TableLineup people={people} table={state.players} lights={lights} crown={winner} bare paused={paused} />
      </View>
      <Animated.View entering={FadeIn.delay(1200).duration(500)} style={styles.verdict}>
        <AppText style={styles.title} numberOfLines={2}>
          {winner === null
            ? t("coup.result.none")
            : winner === mySeat
              ? t("coup.end.youWin")
              : t("coup.end.wins", { name: nameOf(winner) })}
        </AppText>
        <AppText style={styles.reason}>
          {winner === null ? t("coup.end.abandoned") : t("coup.end.reason", { count: turnsOf(state) })}
        </AppText>
      </Animated.View>
      <View style={styles.hands}>
        {order.map((seat, i) => {
          const info = state.players[seat];
          if (!info) return null;
          return (
            <Animated.View key={seat} entering={FadeInDown.delay(1500 + i * 140).duration(420)} style={[styles.hand, seat === winner && styles.won]}>
              <View style={styles.who}>
                <AppText style={[styles.name, seat === winner && styles.nameWon]} numberOfLines={1}>
                  {`${seat === winner ? "👑 " : ""}${nameOf(seat)}`}
                </AppText>
                <AppText style={styles.cash}>{seat === winner ? `🪙 ${info.coins}` : t("coup.out")}</AppText>
              </View>
              <View style={styles.cards}>
                {info.cards.map((card, k) =>
                  card.role ? (
                    <RoleCard key={k} role={card.role} width={CARD} lost={card.revealed} />
                  ) : (
                    <HustleBack key={k} width={CARD} />
                  ),
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>
      {afterGame ? (
        <Animated.View entering={FadeIn.delay(1600 + order.length * 140).duration(500)} style={styles.after}>
          {afterGame}
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const turnsOf = (state: CoupState) => state.log.filter((e) => e.t === "action").length;

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  verdict: { alignItems: "center", paddingHorizontal: 24, gap: 4, marginTop: 6 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    color: "#FFD58A",
    ...shadow,
  },
  reason: { fontFamily: fontFamily.medium, fontSize: 13.5, lineHeight: 19, color: "#F1E6D2", textAlign: "center", ...shadow },
  hands: { gap: 10, marginTop: 18, paddingHorizontal: 16 },
  hand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(20,8,8,0.55)",
    borderWidth: 1,
    borderColor: "#4A2A22",
  },
  won: { borderColor: "#E8B84A", backgroundColor: "rgba(80,50,10,0.45)" },
  who: { flex: 1, gap: 2 },
  name: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 19, color: "#F1E6D2", ...shadow },
  nameWon: { color: "#FFD58A" },
  cash: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 16, color: "#C8B8A8" },
  cards: { flexDirection: "row", gap: 8 },
  after: { marginTop: 20, paddingHorizontal: 20, gap: 12 },
});
