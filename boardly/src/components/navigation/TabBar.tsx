import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  FriendsIcon,
  GamesIcon,
  HomeIcon,
  ProfileIcon,
} from "@/components/icons";
import { AppText } from "@/components/ui";
import { fontFamily, useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

const TAB_CONFIG: Record<
  string,
  { labelKey: string; Icon: typeof HomeIcon }
> = {
  index: { labelKey: "tabs.home", Icon: HomeIcon },
  games: { labelKey: "tabs.games", Icon: GamesIcon },
  friends: { labelKey: "tabs.friends", Icon: FriendsIcon },
  profile: { labelKey: "tabs.profile", Icon: ProfileIcon },
};

/** Design-styled bottom tab bar (filled home glyph, stroke icons). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.divider,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const focused = state.index === index;
        const color = focused ? colors.primary : colors.iconMuted;
        const { Icon } = config;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            tapHaptic();
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.item}
          >
            <View style={styles.iconSlot}>
              <Icon size={22} color={color} />
            </View>
            <AppText
              style={{
                fontFamily: focused ? fontFamily.semiBold : fontFamily.medium,
                fontSize: 10,
                color,
              }}
            >
              {t(config.labelKey)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  item: { flex: 1, alignItems: "center", gap: 5 },
  iconSlot: { height: 22, justifyContent: "center" },
});
