// Development only: Double Agent's board in every moment of a game, with
// sample states, to look at on a device without playing. Open with
// boardly-dev://dev/avalon?sample=<name> (the `dev` tab on the left
// lists them; add &perf=1 for the frame rate).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { AppText, Button } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { AvalonBoard } from "@/games/avalon/AvalonBoard";
import type { AvalonState, Role } from "@/games/avalon/logic";
import { setPiecesKey } from "@/games/avalon/useSetPieces";
import { GAMES } from "@/games/registry";
import { ThemeScope, useTheme } from "@/theme";

const ROLES5: Role[] = ["merlin", "percival", "assassin", "servant", "morgana"];
const ROLES10: Role[] = ["merlin", "percival", "servant", "assassin", "servant", "morgana", "servant", "mordred", "servant", "oberon"];

const base: AvalonState = {
  numPlayers: 5,
  phase: "team",
  quest: 2,
  leader: 0,
  rejections: 0,
  team: [],
  questSizes: [2, 3, 2, 3, 3],
  failsRequired: [1, 1, 1, 1, 1],
  questResults: [
    { team: [0, 1], fails: 0, success: true },
    { team: [1, 2, 4], fails: 1, success: false },
  ],
  history: [
    { quest: 0, leader: 3, team: [0, 1], votes: [true, true, false, true, false], approved: true },
    { quest: 1, leader: 4, team: [1, 3, 4], votes: [false, true, false, false, true], approved: false },
    { quest: 1, leader: 0, team: [1, 2, 4], votes: [true, true, true, false, true], approved: true },
  ],
  rolesInGame: ["assassin", "merlin", "morgana", "percival", "servant"],
  voted: [false, false, false, false, false],
  questPlayed: [],
  myVote: null,
  myCard: null,
  myRole: "merlin",
  known: [
    { seat: 2, as: "evil" },
    { seat: 4, as: "evil" },
  ],
  evilSeats: null,
  assassinSeat: null,
  assassinTarget: null,
  winner: null,
  winReason: null,
  roles: null,
};

const S = (over: Partial<AvalonState>): AvalonState => ({ ...base, ...over });
const first = S({ quest: 0, questResults: [], history: [], leader: 1 });
const proposal = (approved: boolean, team: number[], votes: boolean[], leader = 1) => ({
  quest: 2,
  leader,
  team,
  votes,
  approved,
});

/** A full table of ten. */
const T = (over: Partial<AvalonState>) =>
  S({
    numPlayers: 10,
    questSizes: [3, 4, 4, 5, 5],
    failsRequired: [1, 1, 1, 2, 1],
    voted: Array(10).fill(false),
    rolesInGame: [...ROLES10].sort(),
    history: [],
    questResults: [
      { team: [0, 1, 2], fails: 0, success: true },
      { team: [1, 2, 5, 6], fails: 1, success: false },
    ],
    quest: 2,
    known: [
      { seat: 3, as: "evil" },
      { seat: 5, as: "evil" },
      { seat: 9, as: "evil" },
    ],
    ...over,
  });
const TEN_VOTES = [true, false, true, true, false, false, true, false, true, true];

/** Each moment, whether the role card is still to be dealt in it, and
 *  whether its last vote or operation is still to be revealed. */
const SAMPLES: Record<string, { state: AvalonState; deal?: boolean; reveal?: "vote" | "mission" }> = {
  start: { state: first, deal: true },
  evilStart: { state: { ...first, myRole: "morgana", known: [{ seat: 2, as: "evil" }] }, deal: true },
  team: { state: S({ phase: "team", leader: 0 }) },
  picking: { state: S({ phase: "team", leader: 3, team: [1, 3] }) },
  vote: { state: S({ phase: "vote", leader: 3, team: [0, 3] }) },
  voted: { state: S({ phase: "vote", leader: 3, team: [0, 3], voted: [true, true, false, true, false], myVote: true }) },
  approved: {
    state: S({ phase: "quest", team: [0, 3], history: [...base.history, proposal(true, [0, 3], [true, true, false, true, false])] }),
    reveal: "vote",
  },
  rejected: {
    state: S({
      phase: "team",
      leader: 2,
      rejections: 4,
      history: [...base.history, proposal(false, [0, 3], [true, false, false, true, false])],
    }),
    reveal: "vote",
  },
  mission: { state: S({ phase: "quest", team: [0, 3] }) },
  evilMission: {
    state: S({ phase: "quest", team: [0, 3], myRole: "morgana", known: [{ seat: 2, as: "evil" }] }),
  },
  playing: { state: S({ phase: "quest", team: [1, 3, 4], quest: 1, questResults: base.questResults.slice(0, 1), questPlayed: [3] }) },
  succeeded: {
    state: S({ phase: "team", quest: 3, leader: 1, questResults: [...base.questResults, { team: [0, 3], fails: 0, success: true }] }),
    reveal: "mission",
  },
  failed: {
    state: S({ phase: "team", quest: 3, leader: 1, questResults: [...base.questResults, { team: [0, 2, 3], fails: 2, success: false }] }),
    reveal: "mission",
  },
  // the last operations, still to be revealed: the third success (on to
  // the Hitman's shot) and the third failure (on to the ending)
  thirdWin: {
    state: S({
      phase: "assassinate",
      quest: 3,
      assassinSeat: 2,
      evilSeats: [2, 4],
      questResults: [...base.questResults, { team: [0, 3], fails: 0, success: true }, { team: [1, 2, 3], fails: 0, success: true }],
    }),
    reveal: "mission",
  },
  thirdFail: {
    state: S({
      phase: "finished",
      quest: 4,
      winner: "evil",
      winReason: "failedQuests",
      roles: ROLES5,
      assassinSeat: 2,
      evilSeats: [2, 4],
      questResults: [...base.questResults, { team: [0, 3], fails: 0, success: true }, { team: [1, 2, 4], fails: 1, success: false }, { team: [0, 2, 4], fails: 1, success: false }],
    }),
    reveal: "mission",
  },
  assassin: {
    state: S({
      phase: "assassinate",
      quest: 3,
      myRole: "assassin",
      known: [{ seat: 4, as: "evil" }],
      assassinSeat: 0,
      evilSeats: [0, 4],
      questResults: [...base.questResults, { team: [0, 3], fails: 0, success: true }, { team: [1, 2, 3], fails: 0, success: true }],
    }),
  },
  watching: {
    state: S({
      phase: "assassinate",
      quest: 3,
      assassinSeat: 2,
      evilSeats: [2, 4],
      questResults: [...base.questResults, { team: [0, 3], fails: 0, success: true }, { team: [1, 2, 3], fails: 0, success: true }],
    }),
  },
  won: {
    state: S({
      phase: "finished",
      quest: 3,
      winner: "good",
      winReason: "quests",
      assassinTarget: 3,
      roles: ROLES5,
      assassinSeat: 2,
      evilSeats: [2, 4],
      questResults: [...base.questResults, { team: [0, 3], fails: 0, success: true }, { team: [1, 2, 3], fails: 0, success: true }],
    }),
  },
  lost: {
    state: S({
      phase: "finished",
      quest: 3,
      winner: "evil",
      winReason: "assassination",
      assassinTarget: 0,
      roles: ROLES5,
      assassinSeat: 2,
      evilSeats: [2, 4],
      questResults: [...base.questResults, { team: [0, 3], fails: 0, success: true }, { team: [1, 2, 3], fails: 0, success: true }],
    }),
  },
  team10: { state: T({ phase: "team", leader: 0, team: [2, 5] }) },
  vote10: {
    state: T({ phase: "vote", leader: 4, team: [0, 2, 6, 9], voted: [true, false, true, true, false, true, false, true, false, false] }),
  },
  rejected10: {
    state: T({
      phase: "team",
      leader: 5,
      rejections: 1,
      history: [{ quest: 2, leader: 4, team: [0, 2, 6, 9], votes: TEN_VOTES.map((v, i) => (i % 3 ? v : !v)), approved: false }],
    }),
    reveal: "vote",
  },
  mission10: { state: T({ phase: "quest", team: [0, 1, 4, 7] }) },
  playing10: {
    state: T({
      phase: "quest",
      quest: 3,
      team: [1, 3, 5, 7, 8],
      questPlayed: [3, 7],
      questResults: [...T({}).questResults, { team: [0, 1, 2, 4], fails: 0, success: true }],
    }),
  },
  failed10: {
    state: T({
      phase: "team",
      quest: 3,
      leader: 6,
      questResults: [...T({}).questResults, { team: [1, 3, 5, 7], fails: 1, success: false }],
    }),
    reveal: "mission",
  },
  assassin10: {
    state: T({
      phase: "assassinate",
      quest: 4,
      myRole: "assassin",
      questResults: [
        ...T({}).questResults,
        { team: [0, 1, 2, 4], fails: 0, success: true },
        { team: [0, 1, 2, 4, 6], fails: 0, success: true },
      ],
      known: [
        { seat: 5, as: "evil" },
        { seat: 7, as: "evil" },
      ],
      assassinSeat: 0,
      evilSeats: [0, 5, 7, 9],
    }),
  },
  won10: {
    state: T({
      phase: "finished",
      quest: 4,
      winner: "good",
      winReason: "quests",
      assassinTarget: 2,
      assassinSeat: 3,
      roles: ROLES10,
      questResults: [
        ...T({}).questResults,
        { team: [0, 1, 2, 4], fails: 0, success: true },
        { team: [0, 1, 2, 4, 6], fails: 0, success: true },
      ],
    }),
  },
};

const LOOKS: { skin: string; colour: string; wear: Record<string, string> }[] = [
  { skin: "glossy", colour: "#2DD4BF", wear: { hat: "beanie" } },
  { skin: "glossy", colour: "#3A78D8", wear: { eyes: "googly", mouth: "grin", hat: "beanie", top: "hoodie" } },
  { skin: "gingerbread", colour: "#F5922E", wear: { eyes: "icing", mouth: "icing", hat: "bow" } },
  { skin: "glossy", colour: "#3AA65A", wear: {} },
  { skin: "glossy", colour: "#8A5AD0", wear: { hat: "crown" } },
];
const NAMES = ["You", "🤖 Ming", "Christopher Wellington", "Qiang", "MeiMei_1999", "🤖 Wei", "Lan", "Jun", "Fang", "Kai"].map((username, seat) => ({
  seat,
  userId: `u${seat}`,
  username,
  borderId: null,
  avatarUrl: null,
  mascot: LOOKS[seat % LOOKS.length],
}));

/** Frames drawn in the last second, counted on the UI thread. */
function useFps(on: boolean) {
  const [fps, setFps] = useState(0);
  const frames = useSharedValue(0);
  const since = useSharedValue(0);
  useFrameCallback((frame) => {
    if (!on) return;
    frames.set(frames.get() + 1);
    if (frame.timestamp - since.get() >= 1000) {
      scheduleOnRN(setFps, frames.get());
      frames.set(0);
      since.set(frame.timestamp);
    }
  });
  return fps;
}

export default function AvalonPreview() {
  const skin = GAMES.avalon?.skin;
  return (
    <ThemeScope colors={skin?.colors} active={skin !== undefined}>
      <AvalonSamples />
    </ThemeScope>
  );
}

function AvalonSamples() {
  const { colors, spacing } = useTheme();
  const { sample: asked, perf } = useLocalSearchParams<{ sample?: string; perf?: string }>();
  const [sample, setSample] = useState(asked && SAMPLES[asked] ? asked : "team");
  const [rules, setRules] = useState(false);
  const [picking, setPicking] = useState(false);
  const fps = useFps(perf === "1");
  const router = useRouter();
  // a fresh session each time a sample opens, so its moments play again
  const [run, setRun] = useState(0);
  // a deep link to another sample opens it here
  const [linked, setLinked] = useState(asked);
  if (asked !== linked) {
    setLinked(asked);
    if (asked && SAMPLES[asked]) {
      setSample(asked);
      setRun((n) => n + 1);
    }
  }
  const session = `dev-avalon-${sample}-${run}`;
  const [seeded, setSeeded] = useState<string | null>(null);
  useEffect(() => {
    const { state, deal, reveal } = SAMPLES[sample];
    const watched = {
      dealt: !deal,
      votes: state.history.length - (reveal === "vote" ? 1 : 0),
      missions: state.questResults.length - (reveal === "mission" ? 1 : 0),
    };
    AsyncStorage.setItem(setPiecesKey(session), JSON.stringify(watched))
      .catch(() => {})
      .finally(() => setSeeded(session));
  }, [sample, session]);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {seeded === session ? (
        <AvalonBoard
          key={session}
          sessionId={session}
          state={SAMPLES[sample].state}
          mySeat={0}
          isMyTurn={false}
          players={NAMES.slice(0, SAMPLES[sample].state.numPlayers)}
          busy={false}
          finished={false}
          onMove={() => {}}
          stage={{
            onBack: () => router.back(),
            onRules: () => setRules(true),
            // stand-ins for the game screen's own
            onward: (
              <View style={{ flexDirection: "row", gap: 12, alignSelf: "stretch" }}>
                <Button label="Back to Home" variant="secondary" style={{ flex: 1 }} onPress={() => router.back()} />
                <Button label="Play Again" style={{ flex: 1 }} onPress={() => {}} />
              </View>
            ),
          }}
        />
      ) : null}
      {/* the samples, behind a small tab on the left edge */}
      <Pressable onPress={() => setPicking(true)} style={[styles.devTab, { borderColor: colors.primary }]}>
        <AppText variant="tiny">{perf === "1" ? `dev\n${fps}` : "dev"}</AppText>
      </Pressable>
      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.devDim} onPress={() => setPicking(false)}>
          <ScrollView contentContainerStyle={[styles.devSheet, { backgroundColor: colors.card, padding: spacing.lg }]}>
            {Object.keys(SAMPLES).map((key) => (
              <Pressable
                key={key}
                onPress={() => {
                  setSample(key);
                  setRun((n) => n + 1);
                  setPicking(false);
                }}
                style={[styles.devChip, { borderColor: key === sample ? colors.primary : colors.border }]}
              >
                <AppText variant="caption">{key}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Modal>
      <RulesSheet gameKey="avalon" gameName="Double Agent" visible={rules} onClose={() => setRules(false)} />
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
