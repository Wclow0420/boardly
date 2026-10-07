import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PlusIcon } from "@/components/icons";
import { assetUrl } from "@/api/client";
import { AppText, Avatar } from "@/components/ui";
import type { Friend } from "@/data/types";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

export interface FriendsOnlineRowProps {
  friends: Friend[];
  onInvite?: () => void;
}

/** Horizontal row of online friends + dashed invite bubble. */
export function FriendsOnlineRow({ friends, onInvite }: FriendsOnlineRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {friends.map((friend) => (
        <View key={friend.id} style={styles.item}>
          <Avatar
            name={friend.name}
            size={46}
            presence={friend.presence}
            imageUri={assetUrl(friend.avatarUrl)}
          />
          <AppText variant="tiny" color="textMuted" numberOfLines={1}>
            {friend.name}
          </AppText>
        </View>
      ))}
      <Pressable
        onPress={() => {
          tapHaptic();
          onInvite?.();
        }}
        style={styles.item}
      >
        <View style={[styles.invite, { borderColor: colors.border }]}>
          <PlusIcon size={16} color={colors.textSubtle} />
        </View>
        <AppText variant="tiny" color="textSubtle">
          {t("common.invite")}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  item: { alignItems: "center", gap: 6, width: 50 },
  invite: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
