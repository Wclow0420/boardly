// Development only: Shelter's board in each phase with a sample state,
// to look at on a device without playing a game. Open with
// boardly-dev://dev/shelter.

import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { ShelterBoard } from "@/games/shelter/ShelterBoard";
import type { ShelterState } from "@/games/shelter/logic";
import { useTheme } from "@/theme";

const base = {
  numPlayers: 5, phase: "search", day: 2, days: 6, places: ["farm", "market", "hospital"], store: 7,
  medicine: 1, status: ["ok", "ok", "ok", "ok", "ok"], injured: [false, false, true, false, false],
  weak: [false, false, false, false, false], infectedTotal: 1, rescueNeeded: 2, famineAt: 2, coughs: 1,
  roles: [null, null, null, null, null], waiting: [0, 1, 3, 4], searches: [], nights: [], exiles: [],
  myRole: "survivor", myStatus: "ok", myPlace: null, myHand: [], myPlay: null, myPost: null,
  myVote: null, myTired: false, myStealth: 0, canAct: true, log: [], winner: null, winReason: null,
} as unknown as ShelterState;

const SAMPLES: Record<string, ShelterState> = {
  search: base,
  play: { ...base, phase: "play", myPlace: "market", myHand: ["f3", "zombie"] },
  playInfected: { ...base, phase: "play", myRole: "infected", myPlace: "farm", myHand: ["f1"] },
  night: { ...base, phase: "night", store: 13 },
  nightInfected: { ...base, phase: "night", myRole: "infected", myStealth: 1, store: 3 },
  vote: { ...base, phase: "vote" },
  over: { ...base, phase: "finished", winner: "infected", winReason: "famine", canAct: false, roles: ["survivor", "infected", "survivor", "survivor", "survivor"] },
};
const NAMES = ["You", "Ming", "Hua", "Qiang", "Mei"].map((username, seat) => ({ seat, userId: `u${seat}`, username, borderId: null, avatarUrl: null }));

export default function ShelterPreview() {
  const { colors, spacing } = useTheme();
  const [sample, setSample] = useState("search");
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {Object.keys(SAMPLES).map((key) => (
            <Pressable
              key={key}
              onPress={() => setSample(key)}
              style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1.5, borderColor: key === sample ? colors.primary : colors.border }}
            >
              <AppText variant="caption">{key}</AppText>
            </Pressable>
          ))}
        </View>
        <ShelterBoard
          key={sample}
          state={SAMPLES[sample]}
          mySeat={0}
          isMyTurn={false}
          players={NAMES}
          busy={false}
          finished={false}
          onMove={() => {}}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
