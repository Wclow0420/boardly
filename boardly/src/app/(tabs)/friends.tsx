import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { PlusIcon } from "@/components/icons";
import { AppText, Chip, EmptyState, IconButton, Screen } from "@/components/ui";
import { FriendListItem } from "@/features/friends/FriendListItem";
import { FRIEND_TABS, useFriends } from "@/features/friends/hooks";
import { useTheme } from "@/theme";

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { friends, tab, setTab } = useFriends();

  const header = (
    <View>
      <View style={styles.header}>
        <AppText variant="h2">{t("friends.title")}</AppText>
        <IconButton accessibilityLabel={t("common.invite")}>
          <View style={[styles.addCircle, { borderColor: colors.icon }]}>
            <PlusIcon size={12} color={colors.icon} strokeWidth={2.4} />
          </View>
        </IconButton>
      </View>
      <View style={[styles.tabs, { marginTop: spacing.lg }]}>
        {FRIEND_TABS.map((key) => (
          <Chip
            key={key}
            label={t(`friends.tabs.${key}`)}
            selected={tab === key}
            onPress={() => setTab(key)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={friends}
        keyExtractor={(friend) => friend.id}
        renderItem={({ item }) => <FriendListItem friend={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title={t("common.emptyTitle")} />}
        ListHeaderComponentStyle={{ marginBottom: spacing.md }}
        showsVerticalScrollIndicator={false}
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
});
