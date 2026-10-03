import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, AvatarStack, Card } from "@/components/ui";
import type { TableSummary } from "@/data/types";
import { fontFamily, useTheme } from "@/theme";

export interface TableCardProps {
  table: TableSummary;
  onPress?: () => void;
}

/** A "Your Tables" card: cover, game, players, avatars, status. */
export function TableCard({ table, onPress }: TableCardProps) {
  const { t } = useTranslation();
  const { colors, radius } = useTheme();

  const statusColor =
    table.status === "inProgress"
      ? colors.primaryPressed
      : table.status === "waiting"
        ? colors.info
        : colors.textSubtle;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View
        style={[
          styles.cover,
          { borderRadius: radius.sm, backgroundColor: table.coverColor },
        ]}
      />
      <AppText
        style={{ fontFamily: fontFamily.semiBold, fontSize: 14, marginTop: 10 }}
      >
        {table.gameName}
      </AppText>
      <AppText variant="tiny" color="textSubtle" style={{ marginTop: 2 }}>
        {t("home.playersCount", {
          current: table.players.length,
          max: table.maxPlayers,
        })}
      </AppText>
      <View style={{ marginTop: 8 }}>
        <AvatarStack names={table.players} max={3} />
      </View>
      <AppText variant="tiny" style={{ marginTop: 8, color: statusColor }}>
        {t(`table.${table.status}`)}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  cover: { height: 66 },
});
