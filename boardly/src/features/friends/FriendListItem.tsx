import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { MailIcon } from "@/components/icons";
import { AppText, Avatar, IconButton } from "@/components/ui";
import type { Friend } from "@/data/types";
import { fontFamily, useTheme } from "@/theme";

export interface FriendListItemProps {
  friend: Friend;
  onInvite?: () => void;
}

/** Friends list row: avatar, name + presence, invite action. */
export function FriendListItem({ friend, onInvite }: FriendListItemProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const presenceColor = {
    online: colors.success,
    inGame: colors.primary,
    away: colors.accent,
    offline: colors.iconMuted,
  }[friend.presence];

  return (
    <View style={[styles.row, { borderBottomColor: colors.divider }]}>
      <Avatar name={friend.name} size={40} />
      <View style={styles.body}>
        <AppText style={{ fontFamily: fontFamily.semiBold, fontSize: 13.5 }}>
          {friend.name}
        </AppText>
        <AppText variant="tiny" style={{ color: presenceColor, marginTop: 2 }}>
          {t(`friends.status.${friend.presence}`)}
        </AppText>
      </View>
      <IconButton
        filled
        size={32}
        onPress={onInvite}
        accessibilityLabel={t("common.invite")}
      >
        <MailIcon size={16} color={colors.textSubtle} />
      </IconButton>
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
});
