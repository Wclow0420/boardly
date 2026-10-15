import type { BottomTabBarProps } from "expo-router/js-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, type ComponentType } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  FriendsEmblem,
  GamesEmblem,
  HomeEmblem,
  ProfileEmblem,
  type EmblemProps,
} from "@/components/engraved";
import { AppText, Texture } from "@/components/ui";
import { useFriendsQuery } from "@/features/friends/hooks";
import { fontFamily } from "@/theme";
import { TABLE } from "@/theme/table";
import { tapHaptic } from "@/utils/haptics";

const TAB_CONFIG: Record<
  string,
  { labelKey: string; Icon: ComponentType<EmblemProps> }
> = {
  index: { labelKey: "tabs.home", Icon: HomeEmblem },
  games: { labelKey: "tabs.games", Icon: GamesEmblem },
  friends: { labelKey: "tabs.friends", Icon: FriendsEmblem },
  profile: { labelKey: "tabs.profile", Icon: ProfileEmblem },
};

// A wooden rail along the edge of the table, its tabs engraved emblems:
// the current one lifts and shines, the rest sit back, dimmed.
const ACTIVE = TABLE.yellow.fill[0];

function TabItem({
  label,
  Icon,
  focused,
  badge,
  onPress,
}: {
  label: string;
  Icon: ComponentType<EmblemProps>;
  focused: boolean;
  badge: boolean;
  onPress: () => void;
}) {
  const color = focused ? ACTIVE : TABLE.creamMuted;
  const still = useReducedMotion();
  const on = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    const to = focused ? 1 : 0;
    on.set(
      still ? to : focused ? withSpring(to, { damping: 11 }) : withTiming(to),
    );
  }, [focused, still, on]);
  const lift = useAnimatedStyle(() => ({
    opacity: 0.65 + on.value * 0.35,
    transform: [
      { translateY: -3 * on.value },
      { scale: 0.92 + on.value * 0.16 },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.item}
    >
      <View style={styles.iconSlot}>
        <Animated.View style={lift}>
          <Icon size={34} />
        </Animated.View>
        {badge ? <View style={styles.badge} /> : null}
      </View>
      <AppText
        numberOfLines={1}
        style={[
          styles.label,
          { color, fontFamily: focused ? fontFamily.bold : fontFamily.medium },
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

/** Game-styled bottom tab bar. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pendingRequests = useFriendsQuery().data?.incoming.length ?? 0;

  return (
    <LinearGradient
      colors={TABLE.wood.fill}
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <Texture />
      <View style={styles.highlight} />
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const focused = state.index === index;

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
          <TabItem
            key={route.key}
            label={t(config.labelKey)}
            Icon={config.Icon}
            focused={focused}
            badge={route.name === "friends" && pendingRequests > 0}
            onPress={onPress}
          />
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 3,
    borderTopColor: TABLE.wood.border,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  // Light line just under the dark edge, like the lip of a board
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: TABLE.wood.inner,
    opacity: 0.7,
  },
  item: { flex: 1, alignItems: "center", gap: 3 },
  iconSlot: {
    width: 48,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E5533C",
    borderWidth: 2,
    borderColor: TABLE.wood.border,
  },
  label: { fontSize: 10, lineHeight: 14 },
});
