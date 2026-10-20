// Development only: Shelter's board in each phase with a sample state,
// to look at on a device without playing a game. Open with
// boardly-dev://dev/shelter.

import type { MascotLook } from "@/api/client";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { ShelterBoard } from "@/games/shelter/ShelterBoard";
import type { ShelterState } from "@/games/shelter/logic";
import { useTheme } from "@/theme";

const base = {
  numPlayers: 5, phase: "search", day: 2, days: 6, places: ["farm", "market", "hospital"], store: 7,
  medicine: 1, status: ["ok", "ok", "ok", "ok", "ok"], injured: [false, false, true, false, false],
  weak: [false, false, false, false, false], infectedTotal: 1, rescueNeeded: 2, famineAt: 2, coughs: 1,
  roles: [null, null, null, null, null], waiting: [0, 1, 3, 4],
  // two days already played, for the record and the news
  searches: [
    { day: 0, injured: [], places: { farm: { players: [0, 2], cards: ["f1", "f2"], food: 3 }, market: { players: [1, 3, 4], cards: ["f3", "none", "f2"], food: 5 } } },
    { day: 1, injured: [2], places: { farm: { players: [1, 4], cards: ["f1", "mold2"], food: -1 }, market: { players: [0, 2], cards: ["zombie", "f2"], food: 2 }, hospital: { players: [3], cards: ["medicine"], food: 0 } } },
  ],
  nights: [
    { day: 0, before: 12, after: 7, stolen: 0, opened: false, injured: [], hungry: [], fallen: [], cough: false },
    { day: 1, before: 8, after: 1, stolen: 2, opened: false, injured: [], hungry: [], fallen: [], cough: true },
  ],
  exiles: [{ day: 1, votes: [1, 4, -1, 1, 1], exiled: null, role: null }],
  myRole: "survivor", myStatus: "ok", myPlace: null, myHand: [], myPlay: null, myPost: null,
  myVote: null, myTired: false, myStealth: 0, canAct: true, winner: null, winReason: null,
  log: [
    { day: 0, kind: "played", card: "f1", place: "farm" },
    { day: 0, kind: "guarded", post: "store", with: [], saw: [] },
    { day: 1, kind: "played", card: "zombie", place: "market" },
    { day: 1, kind: "guarded", post: "door", with: [3], saw: [] },
  ],
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
/** Each player's mascot, so the house shows them as they'd look. */
const LOOKS: MascotLook[] = [
  { skin: "glossy", colour: "#F5922E", wear: { eyes: "dots", mouth: "smile", hat: "beanie", top: "sweater" } },
  { skin: "glossy", colour: "#3A78D8", wear: { eyes: "googly", mouth: "grin", top: "hoodie" } },
  { skin: "gingerbread", colour: "#F5922E", wear: { eyes: "icing", mouth: "icing" } },
  { skin: "robot", colour: "#F5922E", wear: { eyes: "determined", mouth: "flat", hand: "lantern" } },
  { skin: "panda", colour: "#EDEDED", wear: { eyes: "sleepy", mouth: "cat" } },
];
const NAMES = ["You", "Ming", "Hua", "Qiang", "Mei"].map((username, seat) => ({ seat, userId: `u${seat}`, username, borderId: null, avatarUrl: null, mascot: LOOKS[seat] }));

export default function ShelterPreview() {
  const { colors, spacing } = useTheme();
  const [sample, setSample] = useState("search");
  const [rules, setRules] = useState(false);
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
          <Pressable
            onPress={() => setRules(true)}
            style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border }}
          >
            <AppText variant="caption">rules</AppText>
          </Pressable>
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
      <RulesSheet gameKey="shelter" gameName="Shelter" visible={rules} onClose={() => setRules(false)} />
    </SafeAreaView>
  );
}
