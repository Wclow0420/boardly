// Development only: Liar's Dice's stage in every moment, with sample
// states, to look at on a device without a table of players. Open with
// boardly-dev://dev/liarsdice?sample=<name> (the `dev` tab on the left
// lists them; add &perf=1 for the frame rate).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { AppText, Button } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { LiarsDiceBoard } from "@/games/liarsdice/LiarsDiceBoard";
import type { Bid, LiarsDiceState, Reveal } from "@/games/liarsdice/logic";
import { GAMES } from "@/games/registry";
import { ThemeScope, useTheme } from "@/theme";

const HANDS = [
  [1, 3, 4, 4, 6],
  [2, 2, 5, 5, 6],
  [1, 1, 3, 5, 5],
  [3, 4, 4, 6, 6],
  [5, 5, 5, 1, 5],
  [2, 3, 3, 4, 6],
  [1, 2, 4, 5, 6],
  [6, 6, 2, 3, 1],
  [4, 4, 4, 2, 2],
  [3, 5, 6, 6, 1],
];

const bid = (quantity: number, face: number, zhai: boolean, seat: number): Bid => ({ quantity, face, zhai, seat });

/** A table of `n` in round 4, me at seat 0. */
const S = (n: number, over: Partial<LiarsDiceState> = {}): LiarsDiceState => ({
  numPlayers: n,
  mode: "knockout",
  phase: "bidding",
  turn: 2,
  round: 4,
  cups: [1, 3, 0, 2, 4, 1, 0, 2, 3, 1].slice(0, n),
  maxCups: 5,
  diceEach: 5,
  myDice: HANDS[0],
  diceCount: Array(n).fill(5),
  bid: bid(n + 2, 5, false, 1),
  bids: [bid(n + 1, 4, false, 0), bid(n + 2, 5, false, 1)],
  split: null,
  endVotes: [],
  rerolls: [],
  reveal: null,
  winner: null,
  winners: null,
  ...over,
});

const revealOf = (n: number, over: Partial<Reveal> = {}): Reveal => ({
  round: 3,
  dice: HANDS.slice(0, n),
  bid: bid(n + 3, 5, false, 2),
  challenger: 3,
  kind: "open",
  found: 0,
  loser: 2,
  drink: 1,
  out: false,
  ...over,
});

/** Counted as the server counts: wild 1s unless zhai, five of a kind +1. */
const found = (r: Reveal) =>
  r.dice.reduce((sum, hand) => {
    const n = hand.filter((d) => d === r.bid.face || (!r.bid.zhai && r.bid.face !== 1 && d === 1)).length;
    return sum + (n === 5 ? 6 : n);
  }, 0);
const counted = (r: Reveal): Reveal => ({
  ...r,
  found: found(r),
  loser: found(r) >= r.bid.quantity ? r.challenger : r.bid.seat,
});

/** Each moment; `reveal`: its last reveal is still to be shown. */
const SAMPLES: Record<string, { state: LiarsDiceState; reveal?: boolean }> = {
  opening: { state: S(5, { turn: 0, bid: null, bids: [] }) },
  call: { state: S(5, { turn: 0, bid: bid(7, 5, false, 4), bids: [bid(6, 3, false, 3), bid(7, 5, false, 4)] }) },
  callZhai: { state: S(5, { turn: 0, bid: bid(4, 3, true, 4), bids: [bid(4, 3, true, 4)] }) },
  table: { state: S(5) },
  table10: { state: S(10, { turn: 6, bid: bid(14, 6, false, 5), bids: [bid(12, 6, false, 4), bid(14, 6, false, 5)] }) },
  myCall: { state: S(5, { turn: 1, bid: bid(7, 4, false, 0), bids: [bid(7, 4, false, 0)] }) },
  reshake: { state: S(5, { myDice: [1, 2, 3, 5, 6], bid: null, bids: [], turn: 3 }) },
  split: { state: S(5, { phase: "split", bid: bid(7, 4, false, 0), bids: [bid(7, 4, false, 0)], split: { by: 3 } }) },
  splitWatch: { state: S(5, { phase: "split", split: { by: 4 } }) },
  reveal: { state: S(5, { round: 4, bid: null, bids: [], turn: 2, reveal: counted(revealOf(5)) }), reveal: true },
  revealLie: {
    state: S(5, { bid: null, bids: [], reveal: counted(revealOf(5, { bid: bid(9, 6, false, 1), challenger: 0, loser: 1, kind: "split", drink: 2 })) }),
    reveal: true,
  },
  reveal10: {
    state: S(10, {
      bid: null,
      bids: [],
      cups: [1, 5, 0, 2, 4, 1, 0, 2, 3, 1],
      reveal: counted(revealOf(10, { bid: bid(16, 4, false, 1), challenger: 0, loser: 1, kind: "counter", drink: 4, out: true })),
    }),
    reveal: true,
  },
  out: { state: S(5, { cups: [5, 3, 0, 2, 4], myDice: [], diceCount: [0, 5, 5, 5, 5] }) },
  endless: { state: S(5, { mode: "endless", maxCups: null, cups: [3, 7, 2, 9, 4], endVotes: [2, 3] }) },
  won: { state: S(5, { phase: "finished", cups: [3, 5, 5, 5, 5], winner: 0, bid: null, bids: [] }) },
  lost10: {
    state: S(10, { phase: "finished", cups: [5, 5, 2, 5, 5, 5, 5, 5, 5, 5], winner: 2, bid: null, bids: [] }),
  },
  tied: {
    state: S(5, { phase: "finished", mode: "endless", maxCups: null, cups: [2, 7, 2, 9, 4], winner: null, winners: [0, 2], bid: null, bids: [] }),
  },
};

const LOOKS: { skin: string; colour: string; wear: Record<string, string> }[] = [
  { skin: "glossy", colour: "#F5922E", wear: { hand: "lantern" } },
  { skin: "glossy", colour: "#3A78D8", wear: { eyes: "googly", mouth: "grin", hat: "beanie", top: "hoodie" } },
  { skin: "gingerbread", colour: "#F5922E", wear: { eyes: "icing", mouth: "icing", hat: "bow" } },
  { skin: "glossy", colour: "#3AA65A", wear: {} },
  { skin: "glossy", colour: "#8A5AD0", wear: { hat: "beanie" } },
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

export default function LiarsDicePreview() {
  const skin = GAMES.liarsdice?.skin;
  return (
    <ThemeScope colors={skin?.colors} active={skin !== undefined}>
      <Samples />
    </ThemeScope>
  );
}

function Samples() {
  const { colors, spacing } = useTheme();
  const { sample: asked, perf } = useLocalSearchParams<{ sample?: string; perf?: string }>();
  const [sample, setSample] = useState(asked && SAMPLES[asked] ? asked : "table");
  // a new link picks its sample
  const [linked, setLinked] = useState(asked);
  if (asked !== linked) {
    setLinked(asked);
    if (asked && SAMPLES[asked]) setSample(asked);
  }
  const [rules, setRules] = useState(false);
  const [picking, setPicking] = useState(false);
  const fps = useFps(perf === "1");
  const router = useRouter();
  const session = `dev-ld-${sample}`;
  const [seeded, setSeeded] = useState<string | null>(null);
  useEffect(() => {
    const { state, reveal } = SAMPLES[sample];
    const round = state.reveal?.round ?? 0;
    AsyncStorage.setItem(`boardly.liarsdice.watched.${session}`, String(reveal ? round - 1 : round))
      .catch(() => {})
      .finally(() => setSeeded(sample));
  }, [sample, session]);

  if (!__DEV__) return <Redirect href="/" />;
  const { state } = SAMPLES[sample];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {seeded === sample ? (
        <LiarsDiceBoard
          key={sample}
          sessionId={session}
          state={state}
          mySeat={0}
          isMyTurn={state.turn === 0}
          players={NAMES.slice(0, state.numPlayers)}
          busy={false}
          finished={false}
          onMove={() => {}}
          stage={{
            onBack: () => router.back(),
            onRules: () => setRules(true),
            onward: (
              <View style={{ flexDirection: "row", gap: 12, alignSelf: "stretch" }}>
                <Button label="Back to Home" variant="secondary" style={{ flex: 1 }} onPress={() => router.back()} />
                <Button label="Play Again" style={{ flex: 1 }} onPress={() => {}} />
              </View>
            ),
          }}
        />
      ) : null}
      <Pressable onPress={() => setPicking(true)} style={[styles.devTab, { borderColor: colors.primary }]}>
        <AppText variant="tiny">{perf === "1" ? `dev\n${fps}` : "dev"}</AppText>
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
      <RulesSheet gameKey="liarsdice" gameName="Liar's Dice" visible={rules} onClose={() => setRules(false)} />
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
