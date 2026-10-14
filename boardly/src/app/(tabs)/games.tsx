import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { SearchIcon, SortIcon } from "@/components/icons";
import {
  AppText,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Ribbon,
  Screen,
  SkeletonListItem,
  TableBackdrop,
} from "@/components/ui";
import type { GameCatalogEntry } from "@/data/types";
import { RulesSheet } from "@/features/game/RulesSheet";
import { BOX_DEPTH, GameBox } from "@/features/games/GameBox";
import { OpenBox } from "@/features/games/OpenBox";
import { GAME_FILTERS, useGameCatalog } from "@/features/games/hooks";
import { useAlreadyInRoomRedirect, useCreateRoom } from "@/features/home/hooks";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

/** Boxes per shelf. */
const PER_SHELF = 2;
const GAP = 14;

export default function GamesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { games, filter, setFilter, isLoading, isError, refetch } =
    useGameCatalog();
  const createRoom = useCreateRoom();
  const redirectIfInRoom = useAlreadyInRoomRedirect();
  const gameName = useGameName();
  // the box taken off the shelf, and the rules being read
  const [opened, setOpened] = useState<GameCatalogEntry | null>(null);
  const [rulesFor, setRulesFor] = useState<GameCatalogEntry | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [shelfWidth, setShelfWidth] = useState(0);
  const boxWidth =
    shelfWidth > 0
      ? (shelfWidth - GAP * (PER_SHELF - 1)) / PER_SHELF - BOX_DEPTH
      : 0;

  const startTable = (gameId: string) => {
    if (createRoom.isPending) return;
    createRoom.mutate(gameId, {
      onSuccess: ({ room }) => {
        setOpened(null);
        router.push(`/lobby/${room.code}`);
      },
      onError: (err) => {
        setOpened(null);
        redirectIfInRoom(err);
      },
    });
  };

  // the catalogue, a shelf at a time
  const shelves: GameCatalogEntry[][] = [];
  for (let i = 0; i < games.length; i += PER_SHELF)
    shelves.push(games.slice(i, i + PER_SHELF));

  const header = (
    <View>
      <View style={styles.header}>
        <Ribbon label={t("games.title")} colors={TABLE.ribbonRed} standalone />
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
        data={shelfWidth > 0 ? shelves : []}
        keyExtractor={(shelf) => shelf.map((game) => game.id).join(",")}
        onLayout={(e) => setShelfWidth(e.nativeEvent.layout.width)}
        renderItem={({ item: shelf }) => (
          <View style={styles.shelf}>
            <View style={styles.boxes}>
              {shelf.map((game) => (
                <Pressable
                  key={game.id}
                  accessibilityRole="button"
                  accessibilityLabel={gameName(game.id, game.name)}
                  onPress={() => {
                    tapHaptic();
                    setOpened(game);
                  }}
                  style={({ pressed }) => [
                    styles.slot,
                    { width: boxWidth + BOX_DEPTH },
                    pressed && styles.lifted,
                  ]}
                >
                  <GameBox
                    gameKey={game.id}
                    name={gameName(game.id, game.name)}
                    emoji={game.emoji}
                    tileColor={game.tileColor}
                    width={boxWidth}
                  />
                </Pressable>
              ))}
            </View>
            {/* the plank they stand on, with each box's player count */}
            <LinearGradient colors={TABLE.woodButton} style={styles.plank}>
              <View style={styles.plankEdge} />
            </LinearGradient>
            <View style={styles.plankFront} />
            <View style={styles.labels}>
              {shelf.map((game) => (
                <AppText
                  key={game.id}
                  variant="tiny"
                  align="center"
                  style={[styles.label, { width: boxWidth + BOX_DEPTH }]}
                >
                  {`👥 ${t("games.playersRange", { min: game.minPlayers, max: game.maxPlayers })}`}
                </AppText>
              ))}
            </View>
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyComponent}
        ListHeaderComponentStyle={{ marginBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      />
      <OpenBox
        game={opened}
        busy={createRoom.isPending}
        onClose={() => setOpened(null)}
        onPlay={(game) => startTable(game.id)}
        onRules={(game) => {
          // one window at a time: close the box, then open its rules
          setOpened(null);
          setRulesFor(game);
          setTimeout(() => setRulesOpen(true), 350);
        }}
      />
      {/* kept after closing, so the sheet slides away with its pages */}
      {rulesFor ? (
        <RulesSheet
          gameKey={rulesFor.id}
          gameName={gameName(rulesFor.id, rulesFor.name)}
          visible={rulesOpen}
          onClose={() => setRulesOpen(false)}
        />
      ) : null}
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
  shelf: { marginBottom: 22 },
  boxes: {
    flexDirection: "row",
    gap: GAP,
    alignItems: "flex-end",
    paddingHorizontal: 2,
  },
  slot: { alignItems: "flex-start" },
  lifted: { transform: [{ translateY: -6 }, { scale: 1.02 }] },
  plank: {
    height: 12,
    borderRadius: 3,
    marginTop: -3,
    marginHorizontal: -6,
    borderWidth: 1.5,
    borderColor: TABLE.woodButtonBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  plankEdge: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: "rgba(255,230,190,0.18)",
  },
  // the plank's front edge, in shadow
  plankFront: {
    height: 8,
    marginHorizontal: -6,
    marginTop: -2,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#2A180D",
  },
  labels: {
    flexDirection: "row",
    gap: GAP,
    paddingHorizontal: 2,
    marginTop: 5,
  },
  label: { color: TABLE.creamMuted, fontFamily: fontFamily.medium },
});
