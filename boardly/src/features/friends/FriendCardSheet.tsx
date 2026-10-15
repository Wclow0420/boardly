// A friend's player card, pulled out like a drawer: who they are and the
// title their rarest badge gives them, their numbers on wooden tokens,
// what we've played together, the badges they've earned (alive), and
// what I can do — invite them to my table, or let them go.

import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { api } from "@/api/client";
import { Badge, TIER_METAL } from "@/components/badges/Badge";
import { useIsoClock } from "@/components/iso";
import { Meeple } from "@/components/tabletop/Meeple";
import {
  AppText,
  BottomSheetModal,
  Button,
  GorhomBottomSheetModal,
  Skeleton,
  Texture,
} from "@/components/ui";
import type { Friend } from "@/data/types";
import { badgeArt } from "@/features/badges/art";
import { sortBadges, titleBadge } from "@/features/badges/order";
import { badgeText } from "@/features/badges/strings";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily } from "@/theme";
import { timeAgo } from "@/utils/timeAgo";
import { meepleColor } from "./seat";

export const FriendCardSheet = forwardRef<
  GorhomBottomSheetModal,
  {
    friend: Friend | null;
    onInvite: (friend: Friend) => void;
    onRemove: (friend: Friend) => void;
  }
>(function FriendCardSheet({ friend, onInvite, onRemove }, ref) {
  return (
    <BottomSheetModal ref={ref}>
      {friend ? (
        <Body friend={friend} onInvite={onInvite} onRemove={onRemove} />
      ) : null}
    </BottomSheetModal>
  );
});

/** The sheet's contents: mounted only while it is open, so the badges'
 *  clock runs only then. */
function Body({
  friend,
  onInvite,
  onRemove,
}: {
  friend: Friend;
  onInvite: (friend: Friend) => void;
  onRemove: (friend: Friend) => void;
}) {
  const { t } = useTranslation();
  const gameName = useGameName();
  const clock = useIsoClock(false);
  const query = useQuery({
    queryKey: ["friendCard", friend.id],
    queryFn: async () => (await api.friends.card(friend.id)).card,
  });
  const card = query.data;
  const title = card ? titleBadge(card.badges) : null;
  const presence = card?.presence ?? friend.presence ?? "offline";
  const playing = card?.playing ?? friend.playing;
  const together = card?.together ?? friend.together;

  const status =
    presence === "inGame" && playing
      ? {
          text: t("friends.table.playing", { game: gameName(playing) }),
          color: "#E9A92B",
        }
      : presence === "online"
        ? { text: `● ${t("friends.status.online")}`, color: "#7FD672" }
        : { text: t("friends.status.offline"), color: TABLE.creamMuted };

  const tokens = card
    ? [
        { label: t("profile.gamesPlayed"), value: card.gamesPlayed },
        { label: t("profile.wins"), value: card.wins },
        {
          label: t("profile.card.winRate"),
          value: card.gamesPlayed
            ? `${Math.round((card.wins / card.gamesPlayed) * 100)}%`
            : "–",
        },
        { label: t("profile.card.bestStreak"), value: card.bestStreak },
      ]
    : [];

  return (
    <View style={styles.body}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <AvatarBorder
            name={friend.name}
            borderId={friend.borderId}
            avatarUrl={friend.avatarUrl}
            size={64}
            presence={presence === "offline" ? undefined : presence}
          />
        </View>
        <View style={styles.who}>
          <View style={styles.nameRow}>
            <Meeple size={16} color={meepleColor(friend.id)} />
            <AppText numberOfLines={1} style={styles.name}>
              {friend.name}
            </AppText>
          </View>
          <AppText
            numberOfLines={1}
            style={[
              styles.title,
              { color: title ? TIER_METAL[title.tier].glow : TABLE.creamMuted },
            ]}
          >
            {title ? badgeText(t, title.key).name : t("profile.card.newcomer")}
          </AppText>
          <AppText variant="tiny" style={{ color: status.color }}>
            {status.text}
          </AppText>
        </View>
      </View>

      {card ? (
        <View style={styles.tokens}>
          {tokens.map((token) => (
            <View key={token.label} style={styles.tokenWrap}>
              <LinearGradient colors={TABLE.woodButton} style={styles.token}>
                <Texture radius={22} />
                <AppText style={styles.tokenValue}>{token.value}</AppText>
              </LinearGradient>
              <AppText
                variant="tiny"
                align="center"
                numberOfLines={2}
                style={styles.muted}
              >
                {token.label}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <Skeleton height={70} radius={14} />
      )}

      {/* what we've played together */}
      <View style={styles.together}>
        <AppText style={styles.togetherText}>
          {`🎲  ${
            together?.games
              ? t("friends.together.count", { count: together.games })
              : t("friends.together.none")
          }`}
        </AppText>
        {together?.games && together.lastGameType && together.lastPlayedAt ? (
          <AppText variant="tiny" style={styles.muted}>
            {t("friends.together.last", {
              game: gameName(together.lastGameType),
              when: timeAgo(t, together.lastPlayedAt),
            })}
          </AppText>
        ) : null}
      </View>

      {/* their badges, rarest first */}
      {card ? (
        <View style={styles.badges}>
          <AppText variant="caption" style={styles.label}>
            {`${t("friends.card.badges")} · ${card.badges.length}`}
          </AppText>
          {card.badges.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgeRow}
            >
              {sortBadges(card.badges).map((badge, i) => {
                const { art, face } = badgeArt(badge.key, badge.gameType);
                return (
                  <View key={badge.key} style={styles.badge}>
                    <Badge
                      art={art}
                      face={face}
                      tier={badge.tier}
                      size={70}
                      clock={clock}
                      phase={i * 0.9}
                    />
                    <AppText
                      variant="tiny"
                      align="center"
                      numberOfLines={2}
                      style={styles.badgeName}
                    >
                      {badgeText(t, badge.key).name}
                    </AppText>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <AppText variant="tiny" style={styles.muted}>
              {t("friends.card.noBadges")}
            </AppText>
          )}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={t("friends.actions.remove")}
          variant="tertiary"
          size="md"
          style={styles.grow}
          onPress={() => onRemove(friend)}
        />
        {presence === "online" ? (
          <Button
            label={t("common.invite")}
            size="md"
            style={styles.grow}
            onPress={() => onInvite(friend)}
          />
        ) : null}
      </View>
    </View>
  );
}

const TOKEN = 46;

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 16 },
  identity: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { padding: 4 },
  who: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    color: TABLE.cream,
    flexShrink: 1,
  },
  title: { fontFamily: fontFamily.semiBold, fontSize: 13 },
  tokens: { flexDirection: "row" },
  tokenWrap: { flex: 1, alignItems: "center", gap: 4 },
  token: {
    width: TOKEN,
    height: TOKEN,
    borderRadius: TOKEN / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: TABLE.woodButtonBorder,
  },
  tokenValue: { fontFamily: fontFamily.bold, fontSize: 14, color: TABLE.cream },
  muted: { color: TABLE.creamMuted },
  together: {
    gap: 2,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  togetherText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: TABLE.cream,
  },
  badges: { gap: 8 },
  label: { color: TABLE.creamMuted, fontFamily: fontFamily.semiBold },
  badgeRow: { gap: 4 },
  badge: { width: 76, alignItems: "center" },
  badgeName: { color: TABLE.cream, marginTop: -6 },
  actions: { flexDirection: "row", gap: 10 },
  grow: { flex: 1 },
});
