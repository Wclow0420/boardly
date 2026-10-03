import { useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BellIcon } from "@/components/icons";
import {
  AppText,
  EmptyState,
  GorhomBottomSheetModal,
  IconButton,
  Screen,
  SectionHeader,
  SkeletonCard,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { FriendsOnlineRow } from "@/features/home/FriendsOnlineRow";
import { JoinTableSheet } from "@/features/home/JoinTableSheet";
import { QuickPlayCard } from "@/features/home/QuickPlayCard";
import { TableCard } from "@/features/home/TableCard";
import {
  useAlreadyInRoomRedirect,
  useCreateRoom,
  useMyTables,
  useOnlineFriends,
} from "@/features/home/hooks";
import { useGamesQuery } from "@/features/games/hooks";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useSession();
  const { colors, spacing } = useTheme();
  const { tables, isLoading: tablesLoading } = useMyTables();
  const onlineFriends = useOnlineFriends();
  const games = useGamesQuery();
  const createRoom = useCreateRoom();
  const redirectIfInRoom = useAlreadyInRoomRedirect();
  const joinSheetRef = useRef<GorhomBottomSheetModal>(null);

  const quickPlay = () => {
    const catalogue = games.data ?? [];
    if (catalogue.length === 0 || createRoom.isPending) return;
    const game = catalogue[Math.floor(Math.random() * catalogue.length)];
    createRoom.mutate(game.id, {
      onSuccess: ({ room }) => router.push(`/lobby/${room.code}`),
      onError: (err) => redirectIfInRoom(err),
    });
  };

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greeting}>
          <AppText variant="h2">{t("home.greeting", { name: user?.username ?? "" })}</AppText>
          <AppText style={styles.wave}>👋</AppText>
        </View>
        <View>
          <IconButton accessibilityLabel="Notifications">
            <BellIcon size={22} color={colors.icon} />
          </IconButton>
          <View style={[styles.badge, { backgroundColor: colors.primaryPressed, borderColor: colors.surface }]} />
        </View>
      </View>

      {/* Quick Start */}
      <AppText variant="label" style={{ marginTop: spacing.xl, marginBottom: spacing.sm + 2 }}>
        {t("home.quickStart")}
      </AppText>
      <QuickPlayCard onPress={quickPlay} />
      <Pressable
        onPress={() => {
          tapHaptic();
          joinSheetRef.current?.present();
        }}
        style={{ alignSelf: "center", marginTop: spacing.md }}
        hitSlop={8}
      >
        <AppText variant="label" color="primary">
          {t("home.joinWithCode")}
        </AppText>
      </Pressable>

      {/* Your Tables */}
      <View style={{ marginTop: spacing.xl }}>
        <SectionHeader
          title={t("home.yourTables")}
          actionLabel={t("common.seeAll")}
        />
        {tablesLoading ? (
          <View style={styles.tables}>
            <SkeletonCard style={styles.tableCell} />
            <SkeletonCard style={styles.tableCell} />
          </View>
        ) : tables.length === 0 ? (
          <EmptyState emoji="🪑" title={t("home.noTables")} />
        ) : (
          <View style={styles.tables}>
            {tables.slice(0, 2).map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onPress={() => router.push(`/lobby/${table.code}`)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Friends Online */}
      <View style={{ marginTop: spacing.xxl }}>
        <SectionHeader title={t("home.friendsOnline")} />
        <FriendsOnlineRow
          friends={onlineFriends.slice(0, 5)}
          onInvite={() => router.push("/friends")}
        />
      </View>

      <JoinTableSheet ref={joinSheetRef} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: { flexDirection: "row", alignItems: "center", gap: 6 },
  wave: { fontSize: 18, lineHeight: 24 },
  badge: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  tables: { flexDirection: "row", gap: 12 },
  tableCell: { flex: 1 },
});
