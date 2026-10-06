import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { DotsIcon, MailIcon } from "@/components/icons";
import { AppText, Button, IconButton } from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import type { Friend } from "@/data/types";
import { fontFamily, useTheme } from "@/theme";
import type { FriendNote } from "./hooks";

export interface FriendListItemProps {
  friend: Friend;
  /** Short-lived feedback shown in place of the status line. */
  note?: FriendNote | null;
  busy?: boolean;
  /** friend: invite to my table */
  onInvite?: () => void;
  /** friend: more options (remove) */
  onMore?: () => void;
  /** none: send a friend request */
  onAdd?: () => void;
  /** incoming: accept / decline */
  onAccept?: () => void;
  onDecline?: () => void;
  /** outgoing: cancel my request */
  onCancel?: () => void;
}

/** Friends list row: avatar, name + status, actions for the relation. */
export function FriendListItem({
  friend,
  note,
  busy = false,
  onInvite,
  onMore,
  onAdd,
  onAccept,
  onDecline,
  onCancel,
}: FriendListItemProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const presence = friend.presence ?? "offline";
  const presenceColor = {
    online: colors.success,
    inGame: colors.primary,
    away: colors.accent,
    offline: colors.iconMuted,
  }[presence];

  const status =
    friend.relation === "friend"
      ? { text: t(`friends.status.${presence}`), color: presenceColor }
      : friend.relation === "incoming"
        ? { text: t("friends.wantsToBeFriends"), color: colors.textSubtle }
        : friend.relation === "outgoing"
          ? { text: t("friends.requestPending"), color: colors.textSubtle }
          : null;
  const line = note
    ? {
        text: note.text,
        color: note.tone === "success" ? colors.success : colors.danger,
      }
    : status;

  return (
    <View style={[styles.row, { borderBottomColor: colors.divider }]}>
      <AvatarBorder name={friend.name} borderId={friend.borderId} size={40} />
      <View style={styles.body}>
        <AppText
          numberOfLines={1}
          style={{ fontFamily: fontFamily.semiBold, fontSize: 13.5 }}
        >
          {friend.name}
        </AppText>
        {line ? (
          <AppText
            variant="tiny"
            numberOfLines={1}
            style={{ color: line.color, marginTop: 2 }}
          >
            {line.text}
          </AppText>
        ) : null}
      </View>

      {friend.relation === "friend" ? (
        <View style={styles.actions}>
          {onInvite ? (
            <IconButton
              filled
              size={32}
              onPress={busy ? undefined : onInvite}
              accessibilityLabel={t("common.invite")}
              // Invites are delivered live, so only online friends get them
              style={{ opacity: presence === "online" ? 1 : 0.4 }}
            >
              <MailIcon size={16} color={colors.textSubtle} />
            </IconButton>
          ) : null}
          {onMore ? (
            <IconButton
              size={32}
              onPress={onMore}
              accessibilityLabel={t("friends.actions.more")}
            >
              <DotsIcon size={16} color={colors.textSubtle} />
            </IconButton>
          ) : null}
        </View>
      ) : null}

      {friend.relation === "incoming" ? (
        <View style={styles.actions}>
          <Button
            size="sm"
            variant="tertiary"
            label={t("friends.actions.decline")}
            disabled={busy}
            onPress={onDecline}
            style={styles.compact}
          />
          <Button
            size="sm"
            label={t("friends.actions.accept")}
            loading={busy}
            onPress={onAccept}
            style={styles.compact}
          />
        </View>
      ) : null}

      {friend.relation === "outgoing" ? (
        <Button
          size="sm"
          variant="secondary"
          label={t("common.cancel")}
          loading={busy}
          onPress={onCancel}
          style={styles.compact}
        />
      ) : null}

      {friend.relation === "none" ? (
        <Button
          size="sm"
          label={t("friends.actions.add")}
          loading={busy}
          onPress={onAdd}
          style={styles.compact}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  body: { flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  compact: { paddingHorizontal: 14 },
});
