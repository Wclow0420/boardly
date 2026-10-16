// Someone's player card, pulled out like a drawer: who they are and the
// title their rarest badge gives them, their numbers on wooden tokens,
// what we've played together, the badges they've earned (alive), and
// what I can do — which depends on how we know each other: add them,
// answer their request, invite a friend to my table, or let them go.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forwardRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError, api, type MascotLook } from "@/api/client";
import { Badge, TIER_METAL } from "@/components/badges/Badge";
import { useIsoClock } from "@/components/iso";
import { Meeple } from "@/components/tabletop/Meeple";
import {
  AppText,
  Medallion,
  BottomSheetModal,
  Button,
  GorhomBottomSheetModal,
  Skeleton,
} from "@/components/ui";
import { badgeArt } from "@/features/badges/art";
import { sortBadges, titleBadge } from "@/features/badges/order";
import { badgeText } from "@/features/badges/strings";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { meepleColor } from "@/features/friends/seat";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily } from "@/theme";
import { successHaptic } from "@/utils/haptics";
import { timeAgo } from "@/utils/timeAgo";

/** Who the card is about, as far as the caller knows (the card itself
 *  fills in the rest). */
export interface CardPerson {
  id: string;
  name: string;
  borderId?: string | null;
  avatarUrl?: string | null;
  mascot?: MascotLook | null;
  isBot?: boolean;
}

export const PlayerCardSheet = forwardRef<
  GorhomBottomSheetModal,
  {
    person: CardPerson | null;
    /** Invite a friend to my table (or go and open one). */
    onInvite: (person: CardPerson) => Promise<void> | void;
    onRemove: (person: CardPerson) => void;
  }
>(function PlayerCardSheet({ person, onInvite, onRemove }, ref) {
  return (
    <BottomSheetModal ref={ref}>
      {person ? (
        <Body
          key={person.id}
          person={person}
          onInvite={onInvite}
          onRemove={onRemove}
        />
      ) : null}
    </BottomSheetModal>
  );
});

/** The sheet's contents: mounted only while it is open, so the badges'
 *  clock runs only then. */
function Body({
  person,
  onInvite,
  onRemove,
}: {
  person: CardPerson;
  onInvite: (person: CardPerson) => Promise<void> | void;
  onRemove: (person: CardPerson) => void;
}) {
  const { t } = useTranslation();
  const gameName = useGameName();
  const queryClient = useQueryClient();
  const clock = useIsoClock(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const query = useQuery({
    queryKey: ["playerCard", person.id],
    queryFn: async () => (await api.friends.card(person.id)).card,
  });
  const card = query.data;
  const bot = person.isBot || card?.user.isBot;
  const relation = card?.relation;
  const title = card ? titleBadge(card.badges) : null;
  const together = card?.together;

  // answering, asking, inviting: then the lists and this card are stale
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["playerCard", person.id] });
  };
  const fail = (err: unknown) =>
    setNote({
      ok: false,
      text:
        err instanceof ApiError
          ? t([`errors.${err.code}`, err.message])
          : t("common.errorTitle"),
    });
  const add = useMutation({
    mutationFn: () => api.friends.sendRequest(person.id),
    onSuccess: () => {
      successHaptic();
      setNote({ ok: true, text: t("friends.requestPending") });
      refresh();
    },
    onError: fail,
  });
  const answer = useMutation({
    mutationFn: async (accept: boolean) => {
      const id = card?.requestId ?? "";
      if (accept) await api.friends.acceptRequest(id);
      else await api.friends.removeRequest(id);
    },
    onSuccess: () => refresh(),
    onError: fail,
  });
  const invite = useMutation({
    mutationFn: async () => onInvite(person),
    onSuccess: () => setNote({ ok: true, text: t("friends.inviteSent") }),
    onError: fail,
  });

  const status = bot
    ? { text: `🤖  ${t("lobby.bots.bot")}`, color: TABLE.creamMuted }
    : card?.presence === "inGame" && card.playing
      ? {
          text: t("friends.table.playing", { game: gameName(card.playing) }),
          color: "#E9A92B",
        }
      : card?.presence === "online"
        ? { text: `● ${t("friends.status.online")}`, color: "#7FD672" }
        : card?.presence === "offline"
          ? { text: t("friends.status.offline"), color: TABLE.creamMuted }
          : null;

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
            name={person.name}
            borderId={card?.user.borderId ?? person.borderId ?? undefined}
            avatarUrl={card?.user.avatarUrl ?? person.avatarUrl}
            mascot={card?.user.mascot ?? person.mascot}
            size={64}
            presence={
              card?.presence === "online" || card?.presence === "inGame"
                ? card.presence
                : undefined
            }
          />
        </View>
        <View style={styles.who}>
          <View style={styles.nameRow}>
            <Meeple size={16} color={meepleColor(person.id)} />
            <AppText numberOfLines={1} style={styles.name}>
              {person.name}
            </AppText>
          </View>
          {!bot ? (
            <AppText
              numberOfLines={1}
              style={[
                styles.title,
                {
                  color: title ? TIER_METAL[title.tier].glow : TABLE.creamMuted,
                },
              ]}
            >
              {title
                ? badgeText(t, title.key).name
                : t("profile.card.newcomer")}
            </AppText>
          ) : null}
          {status ? (
            <AppText variant="tiny" style={{ color: status.color }}>
              {status.text}
            </AppText>
          ) : null}
        </View>
      </View>

      {bot ? null : card ? (
        <View style={styles.tokens}>
          {tokens.map((token) => (
            <View key={token.label} style={styles.tokenWrap}>
              <Medallion size={TOKEN}>
                <AppText style={styles.tokenValue}>{token.value}</AppText>
              </Medallion>
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
      ) : query.isError ? null : (
        <Skeleton height={70} radius={14} />
      )}

      {/* what we've played together */}
      {!bot ? (
        <View style={styles.together}>
          <AppText style={styles.togetherText}>
            {`🎲  ${together?.games ? t("friends.together.count", { count: together.games }) : t("friends.together.none")}`}
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
      ) : null}

      {/* their badges, rarest first */}
      {card && !bot ? (
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

      {note ? (
        <AppText
          variant="caption"
          align="center"
          style={{ color: note.ok ? "#7FD672" : "#F0605D" }}
        >
          {note.text}
        </AppText>
      ) : null}

      {/* what I can do, by how we know each other */}
      {!bot && relation ? (
        <View style={styles.actions}>
          {relation === "friend" ? (
            <>
              <Button
                label={t("friends.actions.remove")}
                variant="tertiary"
                size="md"
                style={styles.grow}
                onPress={() => onRemove(person)}
              />
              {card?.presence === "online" ? (
                <Button
                  label={t("common.invite")}
                  size="md"
                  style={styles.grow}
                  loading={invite.isPending}
                  onPress={() => invite.mutate()}
                />
              ) : null}
            </>
          ) : relation === "incoming" ? (
            <>
              <Button
                label={t("friends.actions.decline")}
                variant="tertiary"
                size="md"
                style={styles.grow}
                disabled={answer.isPending}
                onPress={() => answer.mutate(false)}
              />
              <Button
                label={t("friends.actions.accept")}
                size="md"
                style={styles.grow}
                loading={answer.isPending}
                onPress={() => answer.mutate(true)}
              />
            </>
          ) : relation === "outgoing" ? (
            <Button
              label={`${t("friends.requestPending")} · ${t("common.cancel")}`}
              variant="secondary"
              size="md"
              style={styles.grow}
              loading={answer.isPending}
              onPress={() => answer.mutate(false)}
            />
          ) : (
            <Button
              label={t("friends.add.title")}
              size="md"
              style={styles.grow}
              loading={add.isPending}
              onPress={() => add.mutate()}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const TOKEN = 46;

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36, gap: 16 },
  identity: { flexDirection: "row", alignItems: "center", gap: 14 },
  // the widest glowing borders reach ~24pt past a 64pt avatar: room for
  // all of it, or the sheet's edge cuts the glow off
  avatar: { padding: 12, marginLeft: -8 },
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
