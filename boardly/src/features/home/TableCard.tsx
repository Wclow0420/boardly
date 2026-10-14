// A "Your Tables" entry: the game's box lying on the felt, a meeple for
// every seat (filled for each player, outlined for each seat still
// open), and how the table stands.

import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { MEEPLE_COLORS, Meeple } from "@/components/tabletop/Meeple";
import { AppText } from "@/components/ui";
import type { TableSummary } from "@/data/types";
import { BOX_DEPTH, GameBox } from "@/features/games/GameBox";
import { useGamesQuery } from "@/features/games/hooks";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export interface TableCardProps {
  table: TableSummary;
  onPress?: () => void;
}

export function TableCard({ table, onPress }: TableCardProps) {
  const { t } = useTranslation();
  const gameName = useGameName();
  const { colors } = useTheme();
  const catalogue = useGamesQuery();
  const entry = catalogue.data?.find((game) => game.id === table.gameKey);
  const [width, setWidth] = useState(0);

  const statusColor =
    table.status === "inProgress"
      ? colors.primary
      : table.status === "waiting"
        ? colors.info
        : colors.textSubtle;
  const seats = Array.from({ length: table.maxPlayers }, (_, seat) => seat);
  const meeple = table.maxPlayers > 8 ? 13 : 15;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={gameName(table.gameKey, table.gameName)}
      onPress={() => {
        tapHaptic();
        onPress?.();
      }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {width > 0 ? (
        <GameBox
          gameKey={table.gameKey}
          name={gameName(table.gameKey, table.gameName)}
          emoji={entry?.emoji}
          tileColor={entry?.tileColor}
          width={width - BOX_DEPTH}
          aspect={0.56}
        />
      ) : null}
      <View style={styles.seats}>
        {seats.map((seat) => (
          <Meeple
            key={seat}
            size={meeple}
            color={
              seat < table.players.length
                ? MEEPLE_COLORS[seat % MEEPLE_COLORS.length]
                : TABLE.creamMuted
            }
            empty={seat >= table.players.length}
          />
        ))}
      </View>
      <View style={styles.status}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <AppText
          variant="tiny"
          style={{ color: statusColor, fontFamily: fontFamily.semiBold }}
        >
          {t(`table.${table.status}`)}
        </AppText>
        <AppText variant="tiny" style={styles.count}>
          {`${table.players.length}/${table.maxPlayers}`}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // half the felt each; a lone table keeps its size
  card: { flex: 1, maxWidth: "50%" },
  pressed: { transform: [{ translateY: -3 }], opacity: 0.92 },
  seats: { flexDirection: "row", flexWrap: "wrap", gap: 2, marginTop: 8 },
  status: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  count: { color: TABLE.creamMuted, marginLeft: "auto" },
});
