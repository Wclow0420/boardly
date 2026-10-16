// Development only: Seal the Manor's board in every moment of a game,
// with sample states, to look at on a device without playing. Open with
// boardly-dev://dev/manor?sample=<name> (start, evil, announce, patrol,
// room, team, vote, mission, assassin, won, lost).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { NightwatchBoard } from "@/games/nightwatch/NightwatchBoard";
import type { NightwatchState } from "@/games/nightwatch/logic";
import { useTheme } from "@/theme";

const base = {
  numPlayers: 5, phase: "team", round: 2, rounds: 5, missionRoom: 2, nextMissionRoom: 7,
  missionSizes: [2, 3, 2, 3, 3], failsRequired: [1, 1, 1, 1, 1], event: "fog", collapsed: [], doors: [],
  lockedDoor: null, leader: 3, nextLeader: 4, rejections: 0, team: [],
  results: [
    { round: 0, room: 6, team: [0, 1], missing: [], fails: 0, success: true },
    { round: 1, room: 1, team: [1, 2, 3], missing: [], fails: 1, success: false },
  ],
  history: [
    { round: 0, leader: 0, bell: false, team: [0, 1], votes: [true, true, false, true, false], approved: true },
    { round: 1, leader: 1, bell: false, team: [1, 2, 4], votes: [false, true, true, false, false], approved: false },
    { round: 1, leader: 2, bell: true, team: [1, 2, 3], votes: [false, true, true, true, false], approved: true },
  ],
  timeline: [
    { round: 0, kind: "letters", texts: ["Trust no one in the cellar"] },
    { round: 1, kind: "night", event: "secretDoor" },
    { round: 1, kind: "door", rooms: [0, 8] },
    { round: 2, kind: "night", event: "fog" },
  ],
  rolesInGame: ["apprentice", "double", "hermit", "prophet", "tracker"],
  ready: [true, true, true, true, true], voted: [false, false, false, false, false], missionPlayed: [],
  myRole: "prophet", known: [{ seat: 2, as: "evil" }], assassinSeat: null, evilSeats: null,
  myRoom: 5, myFake: null, myFn: null, abilityLeft: 0, lastUsed: null, freeMove: false,
  patrolRooms: [2, 4, 5, 8], doorOptions: [], studyOptions: [], letterLimit: 1, myOrder: null,
  myVote: null, myCard: null, assassinTarget: null, winner: null, winReason: null, roles: null, positions: null,
  log: [
    { round: 0, kind: "patrol", room: 4, seen: [1, 3], company: true, fake: null, tracked: null, blocked: "hall" },
    { round: 1, kind: "patrol", room: 3, seen: [2], company: true, fake: null, tracked: null, blocked: null },
    { round: 1, kind: "dining", seat: 2, camp: "evil" },
    { round: 2, kind: "patrol", room: 5, seen: [], company: false, fake: null, tracked: null, blocked: null },
    { round: 2, kind: "kitchen", seat: 4, room: 7 },
  ],
} as unknown as NightwatchState;

const first = {
  ...base, phase: "announce", round: 0, results: [], history: [], timeline: [], log: [], event: null,
  ready: [false, false, false, false, false],
} as unknown as NightwatchState;
const S = (over: Record<string, unknown>) => ({ ...base, ...over }) as unknown as NightwatchState;

/** Each moment, and whether the role card is still to be dealt in it. */
const SAMPLES: Record<string, { state: NightwatchState; deal?: boolean }> = {
  start: { state: first, deal: true },
  evil: {
    state: { ...first, myRole: "double", known: [{ seat: 4, as: "evil" }], assassinSeat: 4, abilityLeft: 2 } as NightwatchState,
    deal: true,
  },
  announce: { state: S({ phase: "announce", ready: [false, true, true, false, true] }) },
  patrol: { state: S({ phase: "patrol", ready: [false, false, true, false, false] }) },
  room: { state: S({ phase: "room", myRoom: 5, myFn: "dining", ready: [false, false, false, false, false] }) },
  team: { state: S({ phase: "team", leader: 0 }) },
  vote: { state: S({ phase: "vote", leader: 3, team: [0, 3] }) },
  mission: { state: S({ phase: "mission", team: [0, 3], missionPlayed: [] }) },
  assassin: {
    state: S({ phase: "assassinate", myRole: "double", known: [{ seat: 4, as: "evil" }], assassinSeat: 0 }),
  },
  won: {
    state: S({ phase: "finished", winner: "good", winReason: "missions", assassinTarget: 2, roles: ["prophet", "tracker", "double", "apprentice", "hermit"] }),
  },
  lost: {
    state: S({ phase: "finished", winner: "evil", winReason: "assassination", assassinTarget: 0, roles: ["prophet", "tracker", "double", "apprentice", "hermit"] }),
  },
};
const NAMES = ["You", "Ming", "Hua", "Qiang", "Mei"].map((username, seat) => ({ seat, userId: `u${seat}`, username, borderId: null, avatarUrl: null }));

export default function ManorPreview() {
  const { colors, spacing } = useTheme();
  const { sample: asked } = useLocalSearchParams<{ sample?: string }>();
  const [sample, setSample] = useState(asked && SAMPLES[asked] ? asked : "team");
  const [rules, setRules] = useState(false);
  // moments after the deal: the card counts as dealt for this session
  const session = `dev-${sample}`;
  const [seeded, setSeeded] = useState<string | null>(null);
  useEffect(() => {
    const watched = SAMPLES[sample].deal
      ? { dealt: false, letters: 99, books: [], walked: "dev" }
      : { dealt: true, letters: 99, books: [0, 1, 2], walked: "dev" };
    AsyncStorage.setItem(`boardly.nightwatch.watched.${session}`, JSON.stringify(watched))
      .catch(() => {})
      .finally(() => setSeeded(sample));
  }, [sample, session]);
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
        {seeded === sample ? <NightwatchBoard
          key={sample}
          sessionId={session}
          state={SAMPLES[sample].state}
          mySeat={0}
          isMyTurn={false}
          players={NAMES}
          busy={false}
          finished={false}
          onMove={() => {}}
        /> : null}
      </ScrollView>
      <RulesSheet gameKey="nightwatch" gameName="Seal the Manor" visible={rules} onClose={() => setRules(false)} />
    </SafeAreaView>
  );
}
