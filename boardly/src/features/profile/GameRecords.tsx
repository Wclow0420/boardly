// The player card's line per game: its lid, games and wins, a win-rate
// bar, and for games with hidden sides how the player does on each.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { GameRecord } from "@/api/client";
import { AppText } from "@/components/ui";
import { GameBox } from "@/features/games/GameBox";
import { useGamesQuery } from "@/features/games/hooks";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily } from "@/theme";

const SIDE_COLOR = { good: "#7BE3B0", evil: "#F0605D" } as const;

export function GameRecords({ games }: { games: GameRecord[] }) {
  const { t } = useTranslation();
  const gameName = useGameName();
  const catalogue = useGamesQuery().data ?? [];

  if (games.length === 0) {
    return (
      <AppText variant="caption" align="center" style={styles.empty}>
        {t("profile.card.noGames")}
      </AppText>
    );
  }
  return (
    <View style={styles.list}>
      {games.map((game, index) => {
        const rate = game.played ? game.wins / game.played : 0;
        return (
          <View
            key={game.gameType}
            style={[styles.row, index > 0 && styles.divided]}
          >
            <GameBox
              gameKey={game.gameType}
              emoji={catalogue.find((g) => g.id === game.gameType)?.emoji}
              tileColor={
                catalogue.find((g) => g.id === game.gameType)?.tileColor
              }
              width={46}
              flat
            />
            <View style={styles.body}>
              <View style={styles.head}>
                <AppText numberOfLines={1} style={styles.name}>
                  {gameName(game.gameType)}
                </AppText>
                <AppText
                  style={styles.rate}
                >{`${Math.round(rate * 100)}%`}</AppText>
              </View>
              <View style={styles.bar}>
                <View style={[styles.fill, { width: `${rate * 100}%` }]} />
              </View>
              <View style={styles.foot}>
                <AppText variant="tiny" style={styles.muted}>
                  {t("profile.card.playedWon", {
                    played: game.played,
                    wins: game.wins,
                  })}
                </AppText>
                {(["good", "evil"] as const).map((side) => {
                  const record = game.sides[side];
                  return record ? (
                    <AppText
                      key={side}
                      variant="tiny"
                      style={{
                        color: SIDE_COLOR[side],
                        fontFamily: fontFamily.semiBold,
                      }}
                    >
                      {`${t(`profile.card.${side}`)} ${record.wins}/${record.played}`}
                    </AppText>
                  ) : null;
                })}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  empty: { color: TABLE.creamMuted, paddingVertical: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  divided: { borderTopWidth: 1, borderTopColor: "rgba(255,230,190,0.12)" },
  body: { flex: 1, gap: 5 },
  head: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: TABLE.cream,
  },
  rate: { fontFamily: fontFamily.bold, fontSize: 14, color: "#F2B630" },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: "#F2B630" },
  foot: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  muted: { color: TABLE.creamMuted },
});
