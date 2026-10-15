// A compact row for someone not at the table: a friend who is away, or
// someone I played with recently. The last game we shared shows as its
// lid, with how often and how long ago.

import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { Meeple } from "@/components/tabletop/Meeple";
import { AppText, Button, EmblemText } from "@/components/ui";
import type { Friend } from "@/data/types";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { GameBox } from "@/features/games/GameBox";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { timeAgo } from "@/utils/timeAgo";
import { useFriendActions } from "./hooks";
import { meepleColor } from "./seat";

/** "Shelter · 3 games together · 2d ago", or that we haven't yet. */
export function useTogetherLine() {
  const { t } = useTranslation();
  const gameName = useGameName();
  return (friend: Friend) => {
    const together = friend.together;
    if (!together?.games) return t("friends.together.none");
    const parts = [t("friends.together.count", { count: together.games })];
    if (together.lastGameType) parts.unshift(gameName(together.lastGameType));
    if (together.lastPlayedAt) parts.push(timeAgo(t, together.lastPlayedAt));
    return parts.join(" · ");
  };
}

export function FriendLine({
  friend,
  dim = false,
  trailing,
  onOpen,
  divided,
}: {
  friend: Friend;
  /** Away: the avatar fades back. */
  dim?: boolean;
  trailing?: ReactNode;
  onOpen?: () => void;
  divided?: boolean;
}) {
  const togetherLine = useTogetherLine();
  const lastGame = friend.together?.lastGameType;
  return (
    <Pressable
      accessibilityRole={onOpen ? "button" : undefined}
      accessibilityLabel={friend.name}
      disabled={!onOpen}
      onPress={() => {
        tapHaptic();
        onOpen?.();
      }}
      style={({ pressed }) => [
        styles.row,
        divided && styles.divided,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.avatar, dim && styles.dim]}>
        <AvatarBorder
          name={friend.name}
          borderId={friend.borderId}
          avatarUrl={friend.avatarUrl}
          size={40}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Meeple size={12} color={meepleColor(friend.id)} empty={dim} />
          <AppText numberOfLines={1} style={styles.name}>
            {friend.name}
          </AppText>
        </View>
        <View style={styles.subRow}>
          {lastGame ? <GameBox gameKey={lastGame} width={16} flat /> : null}
          <AppText variant="tiny" numberOfLines={1} style={styles.sub}>
            {togetherLine(friend)}
          </AppText>
        </View>
      </View>
      {trailing}
    </Pressable>
  );
}

/** What I can do about someone on the Recent list. */
export function RecentAction({ friend }: { friend: Friend }) {
  const { t } = useTranslation();
  const actions = useFriendActions(friend);
  if (actions.note) {
    return (
      <AppText
        variant="tiny"
        style={{
          color: actions.note.tone === "success" ? "#7FD672" : "#F0605D",
          maxWidth: 110,
        }}
      >
        {actions.note.text}
      </AppText>
    );
  }
  if (friend.relation === "friend") {
    return (
      <EmblemText
        variant="tiny"
        style={styles.muted}
      >{`✓ ${t("friends.tabs.friends")}`}</EmblemText>
    );
  }
  if (friend.relation === "outgoing") {
    return (
      <AppText variant="tiny" style={styles.muted}>
        {t("friends.requestPending")}
      </AppText>
    );
  }
  if (friend.relation === "incoming") {
    return (
      <Button
        size="sm"
        label={t("friends.actions.accept")}
        loading={actions.busy}
        onPress={actions.accept}
        style={styles.compact}
      />
    );
  }
  return (
    <Button
      size="sm"
      label={t("friends.actions.add")}
      loading={actions.busy}
      onPress={actions.add}
      style={styles.compact}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  divided: { borderTopWidth: 1, borderTopColor: "rgba(255,230,190,0.12)" },
  pressed: { opacity: 0.75 },
  avatar: { padding: 2 },
  dim: { opacity: 0.55 },
  body: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: TABLE.cream,
    flexShrink: 1,
  },
  subRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  sub: { color: TABLE.creamMuted, flexShrink: 1 },
  muted: { color: TABLE.creamMuted },
  compact: { paddingHorizontal: 14 },
});
