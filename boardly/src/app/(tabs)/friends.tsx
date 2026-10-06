import { useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PlusIcon } from "@/components/icons";
import {
  AppText,
  Chip,
  ConfirmSheet,
  EmptyState,
  ErrorState,
  Frame,
  GorhomBottomSheetModal,
  IconButton,
  Ribbon,
  Screen,
  SkeletonListItem,
  TableBackdrop,
} from "@/components/ui";
import type { Friend } from "@/data/types";
import { AddFriendSheet } from "@/features/friends/AddFriendSheet";
import { FriendRow } from "@/features/friends/FriendRow";
import {
  FRIEND_TABS,
  useFriends,
  useRemoveFriend,
} from "@/features/friends/hooks";
import { TABLE, useTheme } from "@/theme";

type Row =
  | { kind: "header"; key: string; label: string }
  | { kind: "friend"; key: string; friend: Friend };

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { data, tab, setTab, isLoading, isError, refetch } = useFriends();
  const removeFriend = useRemoveFriend();
  const addSheetRef = useRef<GorhomBottomSheetModal>(null);
  const removeSheetRef = useRef<GorhomBottomSheetModal>(null);
  const [removing, setRemoving] = useState<Friend | null>(null);

  const rows: Row[] = useMemo(() => {
    if (!data) return [];
    const people = (prefix: string, list: Friend[]): Row[] =>
      list.map((friend) => ({
        kind: "friend",
        key: `${prefix}:${friend.id}`,
        friend,
      }));

    if (tab === "friends") return people("friend", data.friends);
    if (tab === "recent") return people("recent", data.recent);

    const result: Row[] = [];
    if (data.incoming.length > 0) {
      result.push({
        kind: "header",
        key: "h:incoming",
        label: t("friends.sections.incoming"),
      });
      result.push(...people("incoming", data.incoming));
    }
    if (data.outgoing.length > 0) {
      result.push({
        kind: "header",
        key: "h:outgoing",
        label: t("friends.sections.outgoing"),
      });
      result.push(...people("outgoing", data.outgoing));
    }
    return result;
  }, [data, tab, t]);

  const incomingCount = data?.incoming.length ?? 0;

  const header = (
    <View>
      <View style={styles.header}>
        <Ribbon
          label={t("friends.title")}
          colors={TABLE.ribbonGreen}
          standalone
        />
        <IconButton
          accessibilityLabel={t("friends.add.title")}
          onPress={() => addSheetRef.current?.present()}
        >
          <View style={[styles.addCircle, { borderColor: colors.icon }]}>
            <PlusIcon size={12} color={colors.icon} strokeWidth={2.4} />
          </View>
        </IconButton>
      </View>
      <View style={[styles.tabs, { marginTop: spacing.xl }]}>
        {FRIEND_TABS.map((key) => (
          <Chip
            key={key}
            label={
              key === "requests" && incomingCount > 0
                ? `${t("friends.tabs.requests")} (${incomingCount})`
                : t(`friends.tabs.${key}`)
            }
            selected={tab === key}
            onPress={() => setTab(key)}
          />
        ))}
      </View>
    </View>
  );

  const empty = isLoading ? (
    <View>
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </View>
  ) : isError ? (
    <ErrorState
      title={t("common.errorTitle")}
      subtitle={t("common.errorSubtitle")}
      retryLabel={t("common.retry")}
      onRetry={() => refetch()}
    />
  ) : tab === "friends" ? (
    <EmptyState
      emoji="👋"
      title={t("friends.empty.friendsTitle")}
      subtitle={t("friends.empty.friendsSubtitle")}
      actionLabel={t("friends.add.title")}
      onAction={() => addSheetRef.current?.present()}
    />
  ) : tab === "requests" ? (
    <EmptyState emoji="📭" title={t("friends.empty.requestsTitle")} />
  ) : (
    <EmptyState
      emoji="🎲"
      title={t("friends.empty.recentTitle")}
      subtitle={t("friends.empty.recentSubtitle")}
    />
  );

  return (
    <Screen scroll={false} backdrop={<TableBackdrop dim={0.45} />}>
      {header}
      <Frame tone="dark" style={styles.list}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={({ item }) =>
          item.kind === "header" ? (
            <AppText
              variant="caption"
              color="textMuted"
              style={{ marginTop: spacing.md, marginBottom: spacing.xs }}
            >
              {item.label}
            </AppText>
          ) : (
            <FriendRow
              friend={item.friend}
              onMore={(friend) => {
                setRemoving(friend);
                removeSheetRef.current?.present();
              }}
            />
          )
        }
        ListEmptyComponent={empty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      </Frame>

      <AddFriendSheet ref={addSheetRef} />
      <ConfirmSheet
        ref={removeSheetRef}
        title={t("friends.removeTitle", { name: removing?.name ?? "" })}
        message={t("friends.removeMessage")}
        confirmLabel={t("friends.actions.remove")}
        cancelLabel={t("common.cancel")}
        destructive
        loading={removeFriend.isPending}
        onConfirm={() => {
          if (!removing) return;
          removeFriend.mutate(removing.id, {
            onSettled: () => removeSheetRef.current?.dismiss(),
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: { flexDirection: "row", gap: 8 },
  // Grows with the list, and scrolls inside itself once it fills the page
  list: { flexShrink: 1, marginTop: 16, paddingVertical: 8 },
});
