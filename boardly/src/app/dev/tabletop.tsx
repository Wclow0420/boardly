// Development only: the table's pieces — the die and the game boxes —
// to look at and roll on a device. Open with boardly-dev://dev/tabletop.

import { Redirect } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Die, type DieHandle } from "@/components/tabletop/Die";
import { MEEPLE_COLORS, Meeple } from "@/components/tabletop/Meeple";
import { AppText } from "@/components/ui";
import type { Friend } from "@/data/types";
import { FriendTile } from "@/features/friends/FriendTile";
import { GameBox } from "@/features/games/GameBox";
import { GAMES } from "@/games/registry";
import { useTheme } from "@/theme";

/** Friends at the table: one free, one in a game. */
const AT_TABLE: Friend[] = [
  { id: "u-ming", name: "Ming", relation: "friend", presence: "online" },
  {
    id: "u-hua",
    name: "Hua",
    relation: "friend",
    presence: "inGame",
    playing: "shelter",
  },
];

export default function TabletopPreview() {
  const { colors, spacing } = useTheme();
  const die = useRef<DieHandle>(null);
  const [face, setFace] = useState<number | null>(null);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      >
        <Pressable
          accessibilityLabel="Roll"
          onPress={() => die.current?.roll().then(setFace)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            paddingTop: 40,
          }}
        >
          <Die ref={die} size={64} />
          <AppText>{face ? `Landed on ${face}` : "Tap to roll"}</AppText>
        </Pressable>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {MEEPLE_COLORS.map((color, i) => (
            <Meeple key={color} size={24} color={color} empty={i > 6} />
          ))}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {AT_TABLE.map((friend) => (
            <FriendTile
              key={friend.id}
              friend={friend}
              note={null}
              busy={false}
              onOpen={() => {}}
              onInvite={() => {}}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {Object.values(GAMES).map((game) => (
            <GameBox
              key={game.key}
              gameKey={game.key}
              name={game.name}
              width={150}
              aspect={0.56}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
