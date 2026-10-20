// Friends, around the table. Those online stand at the table as tiles —
// their meeple, what they're doing, one tap to invite them to my table —
// and those away wait below. Tap anyone for their player card. Requests
// and the people I played with recently have tabs of their own.

import { useRouter } from "expo-router";
import { useRef } from "react";
import { FlashList } from "@shopify/flash-list";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PlusIcon } from "@/components/icons";
import {
  AppText,
  Chip,
  EmptyState,
  ErrorState,
  Frame,
  GorhomBottomSheetModal,
  IconButton,
  SectionTitle, TitlePlaque,
  Screen,
  SkeletonListItem,
  TableBackdrop,
} from "@/components/ui";
import type { Friend } from "@/data/types";
import { AddFriendSheet } from "@/features/friends/AddFriendSheet";
import { FriendLine, RecentAction } from "@/features/friends/FriendLine";
import { FriendRow } from "@/features/friends/FriendRow";
import { FriendTile } from "@/features/friends/FriendTile";
import {
  FRIEND_TABS,
  type FriendTab,
  useFriendActions,
  useFriends,
} from "@/features/friends/hooks";
import { useMyTables } from "@/features/home/hooks";
import { usePlayerCard } from "@/features/players/PlayerCardProvider";
import { TABLE, useTheme } from "@/theme";

export default function FriendsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { data, tab, setTab, isLoading, isError, refetch } = useFriends();
  const { tables } = useMyTables();
  const playerCard = usePlayerCard();
  const addSheetRef = useRef<GorhomBottomSheetModal>(null);

  // invites go to the table I'm waiting at; without one, pick a game first
  const waiting = tables.some((table) => table.status === "waiting");
  const open = (friend: Friend) =>
    playerCard.show({
      id: friend.id,
      name: friend.name,
      borderId: friend.borderId,
      avatarUrl: friend.avatarUrl,
      mascot: friend.mascot,
    });

  const atTable =
    data?.friends.filter(
      (f) => f.presence === "online" || f.presence === "inGame",
    ) ?? [];
  const away =
    data?.friends.filter(
      (f) => f.presence !== "online" && f.presence !== "inGame",
    ) ?? [];
  const incomingCount = data?.incoming.length ?? 0;

  const header = (
    <View>
      <View style={styles.header}>
        <TitlePlaque label={t("friends.title")} />
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

  // The page as a list of blocks, so only the blocks near the screen are
  // built. Each tray (the table, the away list, the requests) stays one
  // block: its fill, gold rim and shadow run the whole height of the
  // tray, and cutting it into one cell per friend would show seams.
  let rows: Row[];
  if (isLoading) {
    rows = [{ kind: "loading", key: "loading" }];
  } else if (isError || !data) {
    rows = [{ kind: "error", key: "error" }];
  } else if (tab === "friends") {
    rows =
      data.friends.length === 0
        ? [{ kind: "empty", key: "empty-friends", tab }]
        : [
            {
              kind: "title",
              key: "title-table",
              label: t("friends.table.atTable"),
              colors: TABLE.ribbonBlue,
              first: true,
            },
            { kind: "table", key: "table", friends: atTable, waiting },
            ...(away.length
              ? ([
                  {
                    kind: "title",
                    key: "title-away",
                    label: t("friends.table.away"),
                    colors: TABLE.ribbonRed,
                    first: false,
                  },
                  { kind: "away", key: "away", friends: away },
                ] satisfies Row[])
              : []),
          ];
  } else if (tab === "requests") {
    const pending = [
      ...(data.incoming.length
        ? [{ label: t("friends.sections.incoming"), list: data.incoming }]
        : []),
      ...(data.outgoing.length
        ? [{ label: t("friends.sections.outgoing"), list: data.outgoing }]
        : []),
    ];
    rows = pending.length
      ? [{ kind: "requests", key: "requests", sections: pending }]
      : [{ kind: "empty", key: "empty-requests", tab }];
  } else {
    rows = data.recent.length
      ? [{ kind: "recent", key: "recent", people: data.recent }]
      : [{ kind: "empty", key: "empty-recent", tab }];
  }

  const renderRow = (row: Row) => {
    switch (row.kind) {
      case "loading":
        return (
          <Frame tone="dark" style={styles.frame}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </Frame>
        );
      case "error":
        return (
          <ErrorState
            title={t("common.errorTitle")}
            subtitle={t("common.errorSubtitle")}
            retryLabel={t("common.retry")}
            onRetry={() => refetch()}
          />
        );
      case "empty":
        if (row.tab === "friends") {
          return (
            <EmptyState
              emoji="👋"
              title={t("friends.empty.friendsTitle")}
              subtitle={t("friends.empty.friendsSubtitle")}
              actionLabel={t("friends.add.title")}
              onAction={() => addSheetRef.current?.present()}
            />
          );
        }
        if (row.tab === "requests") {
          return <EmptyState emoji="📭" title={t("friends.empty.requestsTitle")} />;
        }
        return (
          <EmptyState
            emoji="🎲"
            title={t("friends.empty.recentTitle")}
            subtitle={t("friends.empty.recentSubtitle")}
          />
        );
      case "title":
        return (
          <SectionTitle
            label={row.label}
            colors={row.colors}
            style={row.first ? styles.firstSection : { marginTop: spacing.xl }}
          />
        );
      case "table":
        return (
          <Frame tone="blue" stitched style={styles.table}>
            {row.friends.length ? (
              <View style={styles.tiles}>
                {/* keyed by friend, so a recycled cell never shows one
                    friend's "Invite sent!" on another */}
                {row.friends.map((friend) => (
                  <InviteTile
                    key={friend.id}
                    friend={friend}
                    waiting={row.waiting}
                    onOpen={() => open(friend)}
                    onNoTable={() => router.push("/games")}
                  />
                ))}
              </View>
            ) : (
              <AppText variant="caption" align="center" style={styles.nobody}>
                {t("friends.table.nobody")}
              </AppText>
            )}
            {row.friends.length && !row.waiting ? (
              <AppText variant="tiny" align="center" style={styles.hint}>
                {t("friends.table.openFirst")}
              </AppText>
            ) : null}
          </Frame>
        );
      case "away":
        return (
          <Frame tone="wood" style={styles.frame}>
            {row.friends.map((friend, i) => (
              <FriendLine
                key={friend.id}
                friend={friend}
                dim
                divided={i > 0}
                onOpen={() => open(friend)}
              />
            ))}
          </Frame>
        );
      case "requests":
        return (
          <Frame tone="dark" style={styles.frame}>
            {row.sections.map((section) => (
              <View key={section.label}>
                <AppText
                  variant="caption"
                  color="textMuted"
                  style={{ marginTop: spacing.md, marginBottom: spacing.xs }}
                >
                  {section.label}
                </AppText>
                {section.list.map((friend) => (
                  <FriendRow key={friend.id} friend={friend} />
                ))}
              </View>
            ))}
          </Frame>
        );
      case "recent":
        return (
          <Frame tone="wood" style={styles.frame}>
            {row.people.map((person, i) => (
              <FriendLine
                key={person.id}
                friend={person}
                divided={i > 0}
                onOpen={() => open(person)}
                trailing={<RecentAction friend={person} />}
              />
            ))}
          </Frame>
        );
    }
  };

  return (
    <Screen scroll={false} backdrop={<TableBackdrop dim={0.45} />}>
      {header}
      <FlashList
        data={rows}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.kind}
        renderItem={({ item }) => renderRow(item)}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // as the ScrollView did: when someone comes online and the table
        // grows, the page doesn't scroll to hold its place
        maintainVisibleContentPosition={{ disabled: true }}
      />

      <AddFriendSheet ref={addSheetRef} />
    </Screen>
  );
}

/** One block of the page. */
type Row =
  | { kind: "loading"; key: string }
  | { kind: "error"; key: string }
  | { kind: "empty"; key: string; tab: FriendTab }
  | {
      kind: "title";
      key: string;
      label: string;
      colors: readonly string[];
      first: boolean;
    }
  | { kind: "table"; key: string; friends: Friend[]; waiting: boolean }
  | { kind: "away"; key: string; friends: Friend[] }
  | {
      kind: "requests";
      key: string;
      sections: { label: string; list: Friend[] }[];
    }
  | { kind: "recent"; key: string; people: Friend[] };

/** A tile with its own invite (and its own "Invite sent!"). */
function InviteTile({
  friend,
  waiting,
  onOpen,
  onNoTable,
}: {
  friend: Friend;
  waiting: boolean;
  onOpen: () => void;
  onNoTable: () => void;
}) {
  const actions = useFriendActions(friend);
  return (
    <FriendTile
      friend={friend}
      note={actions.note}
      busy={actions.busy}
      onOpen={onOpen}
      onInvite={waiting ? actions.invite : onNoTable}
    />
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
  scroll: { flex: 1, marginTop: 8 },
  content: { paddingBottom: 32, paddingTop: 8 },
  firstSection: { marginTop: 4 },
  table: { paddingTop: 20, paddingHorizontal: 12, paddingBottom: 14 },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  nobody: { color: TABLE.creamMuted, paddingVertical: 18 },
  hint: { color: TABLE.creamMuted, marginTop: 12 },
  frame: { paddingTop: 14, paddingBottom: 6 },
});
