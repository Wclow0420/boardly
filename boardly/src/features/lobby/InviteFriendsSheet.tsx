import { forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { LinkIcon } from "@/components/icons";
import {
  AppText,
  BottomSheetModal,
  Button,
  GorhomBottomSheetModal,
} from "@/components/ui";
import { FriendRow } from "@/features/friends/FriendRow";
import { useFriendsQuery } from "@/features/friends/hooks";
import { useTheme } from "@/theme";

const MAX_FRIENDS = 6;

export interface InviteFriendsSheetProps {
  onShareLink: () => void;
}

/** Lobby sheet: invite friends to this table (online ones first), or
 *  fall back to sharing the invite link. */
export const InviteFriendsSheet = forwardRef<
  GorhomBottomSheetModal,
  InviteFriendsSheetProps
>(function InviteFriendsSheet({ onShareLink }, ref) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const friends = useFriendsQuery().data?.friends ?? [];

  return (
    <BottomSheetModal ref={ref} title={t("lobby.inviteFriends")}>
      <View style={styles.body}>
        {friends.length === 0 ? (
          <AppText variant="caption" color="textSubtle" align="center">
            {t("lobby.noFriends")}
          </AppText>
        ) : (
          <View>
            {friends.slice(0, MAX_FRIENDS).map((friend) => (
              <FriendRow key={friend.id} friend={friend} />
            ))}
          </View>
        )}
        <Button
          label={t("lobby.shareInvite")}
          variant="secondary"
          leftIcon={<LinkIcon size={16} color={colors.primary} />}
          onPress={onShareLink}
        />
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
});
