// Development only: Seal the Manor's board in every moment of a game,
// with sample states, to look at on a device without playing. Open with
// boardly-dev://dev/manor?sample=<name> (start, evil, announce, patrol,
// room, team, vote, mission, assassin, won, lost).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { NightwatchBoard } from "@/games/nightwatch/NightwatchBoard";
import type { NightwatchState } from "@/games/nightwatch/logic";
import { GAMES } from "@/games/registry";
import { ThemeScope, useTheme } from "@/theme";

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

const proposal = (approved: boolean, team: number[], votes: boolean[]) => ({ round: 2, leader: 3, bell: false, team, votes, approved });
const result = (success: boolean, fails: number) => ({ round: 2, room: 2, team: [0, 3], missing: [], fails, success });

/** Each moment, whether the role card is still to be dealt in it, and
 *  whether the lanterns are still to reveal its last vote or mission. */
const SAMPLES: Record<string, { state: NightwatchState; deal?: boolean; reveal?: "vote" | "mission" }> = {
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
  voted: { state: S({ phase: "vote", leader: 3, team: [0, 3], voted: [true, true, false, true, false], myVote: true }) },
  approved: {
    state: S({ phase: "mission", team: [0, 3], history: [...base.history, proposal(true, [0, 3], [true, true, false, true, false])] }),
    reveal: "vote",
  },
  rejected: {
    state: S({ phase: "team", leader: 4, rejections: 1, history: [...base.history, proposal(false, [0, 3], [true, false, false, true, false])] }),
    reveal: "vote",
  },
  mission: { state: S({ phase: "mission", team: [0, 3], missionPlayed: [] }) },
  evilMission: { state: S({ phase: "mission", team: [0, 3], missionPlayed: [], myRole: "double", known: [{ seat: 4, as: "evil" }] }) },
  playing: { state: S({ phase: "mission", team: [1, 3], missionPlayed: [3] }) },
  succeeded: { state: S({ phase: "announce", round: 3, ready: [false, true, true, false, true], results: [...base.results, result(true, 0)] }), reveal: "mission" },
  failed: { state: S({ phase: "announce", round: 3, ready: [false, true, true, false, true], results: [...base.results, result(false, 1)] }), reveal: "mission" },
  assassin: {
    state: S({ phase: "assassinate", myRole: "double", known: [{ seat: 4, as: "evil" }], assassinSeat: 0, evilSeats: [0, 4] }),
  },
  watching: { state: S({ phase: "assassinate", assassinSeat: 4 }) },
  won: {
    state: S({ phase: "finished", winner: "good", winReason: "missions", assassinTarget: 2, roles: ["prophet", "tracker", "double", "apprentice", "hermit"] }),
  },
  lost: {
    state: S({ phase: "finished", winner: "evil", winReason: "assassination", assassinTarget: 0, roles: ["prophet", "tracker", "double", "apprentice", "hermit"] }),
  },
};
const LOOKS: { skin: string; colour: string; wear: Record<string, string> }[] = [
  { skin: "glossy", colour: "#F5922E", wear: { hat: "crown", hand: "lantern" } },
  { skin: "glossy", colour: "#3A78D8", wear: { eyes: "googly", mouth: "grin", hat: "beanie", top: "hoodie" } },
  { skin: "gingerbread", colour: "#F5922E", wear: { eyes: "icing", mouth: "icing", hat: "bow" } },
  { skin: "glossy", colour: "#3AA65A", wear: {} },
  { skin: "glossy", colour: "#8A5AD0", wear: { hat: "beanie" } },
];
const NAMES = ["You", "Ming", "Hua", "Qiang", "Mei"].map((username, seat) => ({
  seat,
  userId: `u${seat}`,
  username,
  borderId: null,
  avatarUrl: null,
  mascot: LOOKS[seat],
}));

export default function ManorPreview() {
  const skin = GAMES.nightwatch?.skin;
  return (
    <ThemeScope colors={skin?.colors} active={skin !== undefined}>
      <ManorSamples />
    </ThemeScope>
  );
}

function ManorSamples() {
  const { colors, spacing } = useTheme();
  const { sample: asked } = useLocalSearchParams<{ sample?: string }>();
  const [sample, setSample] = useState(asked && SAMPLES[asked] ? asked : "team");
  const [rules, setRules] = useState(false);
  const [picking, setPicking] = useState(false);
  const router = useRouter();
  // moments after the deal: the card counts as dealt for this session
  const session = `dev-${sample}`;
  const [seeded, setSeeded] = useState<string | null>(null);
  useEffect(() => {
    const { state, deal, reveal } = SAMPLES[sample];
    const counts = {
      votes: state.history.length - (reveal === "vote" ? 1 : 0),
      missions: state.results.length - (reveal === "mission" ? 1 : 0),
    };
    const watched = deal
      ? { dealt: false, letters: 99, books: [], walked: "dev", ...counts }
      : { dealt: true, letters: 99, books: [0, 1, 2], walked: "dev", ...counts };
    AsyncStorage.setItem(`boardly.nightwatch.watched.${session}`, JSON.stringify(watched))
      .catch(() => {})
      .finally(() => setSeeded(sample));
  }, [sample, session]);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {seeded === sample ? (
        <NightwatchBoard
          key={sample}
          sessionId={session}
          state={SAMPLES[sample].state}
          mySeat={0}
          isMyTurn={false}
          players={NAMES}
          busy={false}
          finished={false}
          onMove={() => {}}
          stage={{ onBack: () => router.back(), onRules: () => setRules(true) }}
        />
      ) : null}
      {/* the samples, behind a small tab on the left edge */}
      <Pressable onPress={() => setPicking(true)} style={[styles.devTab, { borderColor: colors.primary }]}>
        <AppText variant="tiny">dev</AppText>
      </Pressable>
      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.devDim} onPress={() => setPicking(false)}>
          <View style={[styles.devSheet, { backgroundColor: colors.card, padding: spacing.lg }]}>
            {Object.keys(SAMPLES).map((key) => (
              <Pressable
                key={key}
                onPress={() => {
                  setSample(key);
                  setPicking(false);
                }}
                style={[styles.devChip, { borderColor: key === sample ? colors.primary : colors.border }]}
              >
                <AppText variant="caption">{key}</AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <RulesSheet gameKey="nightwatch" gameName="Seal the Manor" visible={rules} onClose={() => setRules(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  devTab: {
    position: "absolute",
    left: 0,
    top: "46%",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  devDim: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  devSheet: { flexDirection: "row", flexWrap: "wrap", gap: 8, borderRadius: 16 },
  devChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1.5 },
});
