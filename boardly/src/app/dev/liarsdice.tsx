// Development only: Liar's Dice's stage in every moment, with sample
// states, to look at on a device without a table of players. Open with
// boardly-dev://dev/liarsdice?sample=<name> (the `dev` tab on the left
// lists them; add &perf=1 for the frame rate, &lang=zh for Chinese, and
// &narrow=1 to see the plinth's calls as wide as on a 375pt phone,
// &settings=1 for the lobby's settings card).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { AppText, Button } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import type { RoomInfo } from "@/api/client";
import { GameSettings } from "@/features/lobby/GameSettings";
import { CallGrid } from "@/games/liarsdice/CallScene";
import { LiarsDiceBoard } from "@/games/liarsdice/LiarsDiceBoard";
import { callPlan, startFace, type Bid, type LiarsDiceState, type Reveal } from "@/games/liarsdice/logic";
import type { ShakeStep } from "@/games/liarsdice/ShakeScene";
import { shakenKey } from "@/games/liarsdice/useShaken";
import { GAMES } from "@/games/registry";
import { useLocale } from "@/i18n/LocaleContext";
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
  calling: "classic",
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

/** A new round: nobody has called yet, so my cup is still to be shaken. */
const fresh = (n: number, over: Partial<LiarsDiceState> = {}) => S(n, { bid: null, bids: [], turn: 2, myDice: [2, 6, 2, 5, 3], ...over });

/** Each moment; `reveal`: its last reveal is still to be shown; `shake`:
 *  my shake for the round is still to come (opened at that step). */
const SAMPLES: Record<string, { state: LiarsDiceState; reveal?: boolean; shake?: ShakeStep }> = {
  shake: { state: fresh(5), shake: "closed" },
  shakeShaken: { state: fresh(5), shake: "shaken" },
  shakeScattered: { state: fresh(5, { myDice: [1, 5, 3, 6, 2] }), shake: "open" },
  shakeOpen: { state: fresh(5), shake: "open" },
  shakeTurn: { state: fresh(5, { turn: 0 }), shake: "closed" },
  shake10: {
    state: fresh(10, { turn: 4, bid: bid(12, 3, false, 3), bids: [bid(11, 2, false, 2), bid(12, 3, false, 3)] }),
    shake: "closed",
  },
  shake2: { state: fresh(2, { turn: 1 }), shake: "open" },
  opening: { state: S(5, { turn: 0, bid: null, bids: [] }) },
  // the calls on the plinth under each way of calling
  jijiji3: { state: S(3, { calling: "jijiji", turn: 0, bid: null, bids: [], myDice: [1, 3, 4, 4, 6] }) },
  jijiji10: { state: S(10, { calling: "jijiji", turn: 0, bid: null, bids: [] }) },
  jijijiZhai: {
    state: S(5, { calling: "jijiji", turn: 0, bid: bid(6, 4, true, 4), bids: [bid(5, 1, true, 3), bid(6, 4, true, 4)] }),
  },
  jijijiKai: {
    state: S(5, { calling: "jijiji", turn: 0, bid: bid(8, 5, false, 4), bids: [bid(6, 3, true, 3), bid(8, 5, false, 4)] }),
  },
  jijijiTop: {
    state: S(2, { calling: "jijiji", turn: 0, bid: bid(10, 5, true, 1), bids: [bid(10, 5, true, 1)], myDice: [1, 1, 6, 6, 3] }),
  },
  tableOpening: { state: S(5, { calling: "jijiji", turn: 2, bid: null, bids: [] }) },
  classicOpen: { state: S(5, { calling: "classic", turn: 0, bid: null, bids: [] }) },
  classicZhai: { state: S(5, { calling: "classic", turn: 0, bid: bid(5, 3, true, 4), bids: [bid(5, 3, true, 4)] }) },
  nozhaiOpen: { state: S(5, { calling: "nozhai", turn: 0, bid: null, bids: [] }) },
  nozhai: { state: S(5, { calling: "nozhai", turn: 0, bid: bid(7, 5, false, 4), bids: [bid(6, 3, false, 3), bid(7, 5, false, 4)] }) },
  splitPending: {
    state: S(5, { calling: "jijiji", phase: "split", bid: bid(6, 4, true, 0), bids: [bid(6, 4, true, 0)], split: { by: 3 } }),
  },
  call: { state: S(5, { turn: 0, bid: bid(7, 5, false, 4), bids: [bid(6, 3, false, 3), bid(7, 5, false, 4)] }) },
  callZhai: { state: S(5, { turn: 0, bid: bid(4, 3, true, 4), bids: [bid(4, 3, true, 4)] }) },
  table: { state: S(5) },
  table10: { state: S(10, { turn: 6, bid: bid(14, 6, false, 5), bids: [bid(12, 6, false, 4), bid(14, 6, false, 5)] }) },
  myCall: { state: S(5, { turn: 1, bid: bid(7, 4, false, 0), bids: [bid(7, 4, false, 0)] }) },
  opening10: { state: S(10, { turn: 0, bid: null, bids: [] }) },
  table2: { state: S(2, { turn: 1, bid: bid(4, 6, true, 0), bids: [bid(4, 6, true, 0)] }) },
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
  const { sample: asked, perf, lang, narrow, settings } = useLocalSearchParams<{
    sample?: string;
    perf?: string;
    lang?: string;
    narrow?: string;
    settings?: string;
  }>();
  // &lang=zh (en, ms): look at a sample in another language
  const { language, setLanguage } = useLocale();
  useEffect(() => {
    if ((lang === "en" || lang === "zh" || lang === "ms") && lang !== language) setLanguage(lang);
  }, [lang, language, setLanguage]);
  const [sample, setSample] = useState(asked && SAMPLES[asked] ? asked : "table");
  // picking a sample (again) starts it afresh
  const [nonce, setNonce] = useState(0);
  // a new link picks its sample
  const [linked, setLinked] = useState(asked);
  if (asked !== linked) {
    setLinked(asked);
    if (asked && SAMPLES[asked]) {
      setSample(asked);
      setNonce((n) => n + 1);
    }
  }
  // the sample as it is played: a reshake rolls new dice here
  const [live, setLive] = useState<{ key: string; state: LiarsDiceState } | null>(null);
  const [rules, setRules] = useState(false);
  const [picking, setPicking] = useState(false);
  const fps = useFps(perf === "1");
  const router = useRouter();
  const session = `dev-ld-${sample}`;
  const [seeded, setSeeded] = useState<string | null>(null);
  const run = `${sample}#${nonce}`;
  useEffect(() => {
    const { state, reveal, shake } = SAMPLES[sample];
    const round = state.reveal?.round ?? 0;
    Promise.all([
      AsyncStorage.setItem(`boardly.liarsdice.watched.${session}`, String(reveal ? round - 1 : round)),
      AsyncStorage.setItem(shakenKey(session), String(shake ? state.round - 1 : state.round)),
    ])
      .catch(() => {})
      .finally(() => setSeeded(run));
  }, [sample, session, run]);

  if (!__DEV__) return <Redirect href="/" />;
  const { shake } = SAMPLES[sample];
  const state = live?.key === run ? live.state : SAMPLES[sample].state;
  const onMove = (move: Record<string, unknown>) => {
    if (move.type !== "reroll") return;
    // roll five fresh dice, as the server would
    const dice = Array.from({ length: 5 }, () => 1 + Math.floor(Math.random() * 6));
    setTimeout(
      () => setLive({ key: run, state: { ...state, myDice: dice, rerolls: [...state.rerolls, { seat: 0, dice: [...state.myDice].sort() }] } }),
      300,
    );
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {seeded === run ? (
        <LiarsDiceBoard
          key={run}
          devShake={shake}
          sessionId={session}
          state={state}
          mySeat={0}
          isMyTurn={state.turn === 0}
          players={NAMES.slice(0, state.numPlayers)}
          busy={false}
          finished={false}
          onMove={onMove}
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
      {narrow === "1" ? <NarrowCalls state={state} /> : null}
      {settings === "1" ? (
        <View style={styles.settings}>
          <GameSettings room={LOBBY} code={LOBBY.code} isHost={false} />
        </View>
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
                  setNonce((n) => n + 1);
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

/** A waiting Liar's Dice table, for the lobby's settings card. */
const LOBBY: RoomInfo = {
  id: "dev-room",
  code: "DEVLD",
  gameType: "liarsdice",
  hostId: "u1",
  status: "waiting",
  players: [],
  game: {
    key: "liarsdice",
    name: "Liar's Dice",
    minPlayers: 2,
    maxPlayers: 10,
    emoji: "🎲",
    tileColor: "#FFE0E0",
    category: "party",
    tag: "party",
    options: { mode: ["knockout", "endless"], calling: ["jijiji", "classic", "nozhai"] },
  },
  options: { mode: "knockout", calling: "jijiji" },
  rematchCode: null,
};

/** The plinth's calls at a 375pt phone's width (375 less the plinth's
 *  40 each side), over the top of the page. */
function NarrowCalls({ state }: { state: LiarsDiceState }) {
  const open = useSharedValue(0);
  const split = useSharedValue(0);
  return (
    <View style={styles.narrow} pointerEvents="box-none">
      <View style={{ width: 375 - 80 }}>
        <CallGrid
          plan={callPlan(state, startFace(state))}
          canLie={state.bid !== null}
          busy={false}
          openHold={open}
          splitHold={split}
          holdKey="narrow"
          onCall={() => {}}
          onOpen={() => {}}
          onSplit={() => {}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  settings: { position: "absolute", top: 120, left: 0, right: 0, paddingHorizontal: 16 },
  narrow: { position: "absolute", top: 300, left: 0, right: 0, alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)", paddingVertical: 12 },
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
