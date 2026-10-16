// Friends, around the table. Those online stand at the table as tiles —
// their meeple, what they're doing, one tap to invite them to my table —
// and those away wait below. Tap anyone for their player card. Requests
// and the people I played with recently have tabs of their own.

import { useRouter } from "expo-router";
import { useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
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

  let body;
  if (isLoading) {
    body = (
      <Frame tone="dark" style={styles.frame}>
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
      </Frame>
    );
  } else if (isError || !data) {
    body = (
      <ErrorState
        title={t("common.errorTitle")}
        subtitle={t("common.errorSubtitle")}
        retryLabel={t("common.retry")}
        onRetry={() => refetch()}
      />
    );
  } else if (tab === "friends") {
    body =
      data.friends.length === 0 ? (
        <EmptyState
          emoji="👋"
          title={t("friends.empty.friendsTitle")}
          subtitle={t("friends.empty.friendsSubtitle")}
          actionLabel={t("friends.add.title")}
          onAction={() => addSheetRef.current?.present()}
        />
      ) : (
        <>
          <SectionTitle
            label={t("friends.table.atTable")}
            colors={TABLE.ribbonBlue}
            style={styles.firstSection}
          />
          <Frame tone="blue" stitched style={styles.table}>
            {atTable.length ? (
              <View style={styles.tiles}>
                {atTable.map((friend) => (
                  <InviteTile
                    key={friend.id}
                    friend={friend}
                    waiting={waiting}
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
            {atTable.length && !waiting ? (
              <AppText variant="tiny" align="center" style={styles.hint}>
                {t("friends.table.openFirst")}
              </AppText>
            ) : null}
          </Frame>

          {away.length ? (
            <>
              <SectionTitle
                label={t("friends.table.away")}
                colors={TABLE.ribbonRed}
                style={{ marginTop: spacing.xl }}
              />
              <Frame tone="wood" style={styles.frame}>
                {away.map((friend, i) => (
                  <FriendLine
                    key={friend.id}
                    friend={friend}
                    dim
                    divided={i > 0}
                    onOpen={() => open(friend)}
                  />
                ))}
              </Frame>
            </>
          ) : null}
        </>
      );
  } else if (tab === "requests") {
    const pending = [
      ...(data.incoming.length
        ? [{ label: t("friends.sections.incoming"), list: data.incoming }]
        : []),
      ...(data.outgoing.length
        ? [{ label: t("friends.sections.outgoing"), list: data.outgoing }]
        : []),
    ];
    body = pending.length ? (
      <Frame tone="dark" style={styles.frame}>
        {pending.map((section) => (
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
    ) : (
      <EmptyState emoji="📭" title={t("friends.empty.requestsTitle")} />
    );
  } else {
    body = data.recent.length ? (
      <Frame tone="wood" style={styles.frame}>
        {data.recent.map((person, i) => (
          <FriendLine
            key={person.id}
            friend={person}
            divided={i > 0}
            onOpen={() => open(person)}
            trailing={<RecentAction friend={person} />}
          />
        ))}
      </Frame>
    ) : (
      <EmptyState
        emoji="🎲"
        title={t("friends.empty.recentTitle")}
        subtitle={t("friends.empty.recentSubtitle")}
      />
    );
  }

  return (
    <Screen scroll={false} backdrop={<TableBackdrop dim={0.45} />}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {body}
      </ScrollView>

      <AddFriendSheet ref={addSheetRef} />
    </Screen>
  );
}

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
