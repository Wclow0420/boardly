import { useRouter } from "expo-router";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { SearchIcon, SortIcon } from "@/components/icons";
import {
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Ribbon,
  Screen,
  SkeletonListItem,
  TableBackdrop,
} from "@/components/ui";
import { GameListItem } from "@/features/games/GameListItem";
import { GAME_FILTERS, useGameCatalog } from "@/features/games/hooks";
import { useAlreadyInRoomRedirect, useCreateRoom } from "@/features/home/hooks";
import { TABLE, useTheme } from "@/theme";

export default function GamesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { games, filter, setFilter, isLoading, isError, refetch } =
    useGameCatalog();
  const createRoom = useCreateRoom();
  const redirectIfInRoom = useAlreadyInRoomRedirect();

  const startTable = (gameId: string) => {
    if (createRoom.isPending) return;
    createRoom.mutate(gameId, {
      onSuccess: ({ room }) => router.push(`/lobby/${room.code}`),
      onError: (err) => redirectIfInRoom(err),
    });
  };

  const header = (
    <View>
      <View style={styles.header}>
        <Ribbon
          label={t("games.title")}
          colors={TABLE.ribbonRed}
          standalone
        />
        <View style={styles.actions}>
          <IconButton accessibilityLabel="Search">
            <SearchIcon size={20} color={colors.icon} />
          </IconButton>
          <IconButton accessibilityLabel="Sort">
            <SortIcon size={20} color={colors.icon} />
          </IconButton>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: spacing.xl }}
        contentContainerStyle={styles.filters}
      >
        {GAME_FILTERS.map((key) => (
          <Chip
            key={key}
            label={t(`games.filters.${key}`)}
            selected={filter === key}
            onPress={() => setFilter(key)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const emptyComponent = isLoading ? (
    <View style={styles.skeletons}>
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  ) : isError ? (
    <ErrorState
      title={t("common.errorTitle")}
      subtitle={t("common.errorSubtitle")}
      retryLabel={t("common.retry")}
      onRetry={() => refetch()}
    />
  ) : (
    <EmptyState title={t("common.emptyTitle")} />
  );

  return (
    <Screen
      scroll={false}
      style={styles.screen}
      backdrop={<TableBackdrop dim={0.45} />}
    >
      <FlatList
        data={games}
        keyExtractor={(game) => game.id}
        renderItem={({ item }) => (
          <GameListItem game={item} onPress={() => startTable(item.id)} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListHeaderComponentStyle={{ marginBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: { flexDirection: "row", gap: 4 },
  filters: { gap: 7 },
  skeletons: { gap: 4 },
});
