// Development only: Hustle's board in every moment of a game, with
// sample states, to look at on a device without playing. Open with
// boardly-dev://dev/coup?sample=<name> (the `dev` tab on the left lists
// them; add &perf=1 for the frame rate). The samples sit at the largest
// table, six players; `duel` is two.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { AppText, Button } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { CoupBoard } from "@/games/coup/CoupBoard";
import type { ActionType, CoupCard, CoupState, LogEvent, Role } from "@/games/coup/logic";
import { GAMES } from "@/games/registry";
import { ThemeScope, useTheme } from "@/theme";

const hidden = (role: Role | null): CoupCard => ({ revealed: false, role });
const lost = (role: Role): CoupCard => ({ revealed: true, role });

/** Six at the table: me (seat 0) with a Boss and a Fixer. */
const PLAYERS = [
  { coins: 4, alive: true, cards: [hidden("duke"), hidden("ambassador")] },
  { coins: 3, alive: true, cards: [hidden(null), lost("captain")] },
  { coins: 6, alive: true, cards: [hidden(null), hidden(null)] },
  { coins: 2, alive: true, cards: [hidden(null), hidden(null)] },
  { coins: 0, alive: false, cards: [lost("assassin"), lost("contessa")] },
  { coins: 5, alive: true, cards: [hidden(null), hidden(null)] },
];

const LOG: LogEvent[] = [
  { t: "action", actor: 0, action: "income", target: null },
  { t: "action", actor: 1, action: "tax", target: null },
  { t: "challenge", challenger: 2, claimant: 1, role: "duke", caught: true },
  { t: "lose", seat: 1, role: "captain", why: "challenge" },
  { t: "action", actor: 2, action: "foreignAid", target: null },
  { t: "action", actor: 3, action: "steal", target: 4 },
  { t: "action", actor: 4, action: "income", target: null },
  { t: "action", actor: 5, action: "coup", target: 4 },
  { t: "lose", seat: 4, role: "assassin", why: "coup" },
  { t: "action", actor: 0, action: "tax", target: null },
  { t: "action", actor: 1, action: "assassinate", target: 4 },
  { t: "lose", seat: 4, role: "contessa", why: "assassinate" },
  { t: "out", seat: 4 },
];

const base: CoupState = {
  numPlayers: 6,
  players: PLAYERS,
  deckCount: 3,
  turn: 2,
  phase: "action",
  action: null,
  block: null,
  passed: [],
  waitingOn: [2],
  exchange: null,
  losing: null,
  log: LOG,
  winner: null,
};
const S = (over: Partial<CoupState>): CoupState => ({ ...base, ...over });
const CLAIM: Partial<Record<ActionType, Role>> = { tax: "duke", steal: "captain", exchange: "ambassador", assassinate: "assassin" };
const act = (actor: number, type: ActionType, target: number | null = null) => ({ type, actor, target, claim: CLAIM[type] ?? null });

/** Each moment; `deal`: my cards still to be dealt; `reveal`: the last
 *  log event still to be played on the stage. */
const SAMPLES: Record<string, { state: CoupState; deal?: boolean; reveal?: boolean }> = {
  deal: { state: S({ log: [], turn: 3, waitingOn: [3], players: PLAYERS.map((p, i) => (i === 0 ? p : { coins: 2, alive: true, cards: [hidden(null), hidden(null)] })) }), deal: true },
  table: { state: S({}) },
  felt: { state: S({ turn: 0, waitingOn: [0] }) },
  forced: { state: S({ turn: 0, waitingOn: [0], players: PLAYERS.map((p, i) => (i === 0 ? { ...p, coins: 10 } : p)) }) },
  claim: {
    state: S({ phase: "challengeAction", action: act(2, "tax"), passed: [3], waitingOn: [1, 5], log: [...LOG, { t: "action", actor: 2, action: "tax", target: null }] }),
  },
  answer: {
    state: S({ phase: "challengeAction", action: act(2, "steal", 0), passed: [5], waitingOn: [0, 1, 3], log: [...LOG, { t: "action", actor: 2, action: "steal", target: 0 }] }),
  },
  block: {
    state: S({ phase: "block", action: act(2, "steal", 0), passed: [], waitingOn: [0], log: [...LOG, { t: "action", actor: 2, action: "steal", target: 0 }] }),
  },
  borrow: {
    state: S({ phase: "block", action: act(3, "foreignAid"), turn: 3, passed: [1], waitingOn: [0, 2, 5], log: [...LOG, { t: "action", actor: 3, action: "foreignAid", target: null }] }),
  },
  blocked: {
    state: S({
      phase: "challengeBlock",
      turn: 0,
      action: act(0, "assassinate", 3),
      block: { seat: 3, role: "contessa" },
      passed: [1],
      waitingOn: [0, 2, 5],
      log: [...LOG, { t: "action", actor: 0, action: "assassinate", target: 3 }, { t: "block", seat: 3, role: "contessa" }],
    }),
  },
  caught: {
    state: S({
      phase: "loseInfluence",
      action: act(2, "tax"),
      losing: { seat: 2, why: "challenge" },
      waitingOn: [2],
      log: [...LOG, { t: "action", actor: 2, action: "tax", target: null }, { t: "challenge", challenger: 5, claimant: 2, role: "duke", caught: true }],
    }),
    reveal: true,
  },
  proved: {
    state: S({
      phase: "loseInfluence",
      action: act(2, "tax"),
      losing: { seat: 0, why: "challenge" },
      waitingOn: [0],
      log: [...LOG, { t: "action", actor: 2, action: "tax", target: null }, { t: "challenge", challenger: 0, claimant: 2, role: "duke", caught: false }],
    }),
    reveal: true,
  },
  out: {
    state: S({
      turn: 2,
      players: PLAYERS.map((p, i) => (i === 1 ? { coins: 0, alive: false, cards: [lost("duke"), lost("captain")] } : p)),
      log: [...LOG, { t: "action", actor: 5, action: "coup", target: 1 }, { t: "lose", seat: 1, role: "duke", why: "coup" }, { t: "out", seat: 1 }],
    }),
    reveal: true,
  },
  lose: {
    state: S({
      phase: "loseInfluence",
      turn: 5,
      action: act(5, "coup", 0),
      losing: { seat: 0, why: "coup" },
      waitingOn: [0],
      log: [...LOG, { t: "action", actor: 5, action: "coup", target: 0 }],
    }),
  },
  doomed: {
    state: S({
      phase: "loseInfluence",
      turn: 0,
      action: act(0, "assassinate", 3),
      losing: { seat: 3, why: "assassinate" },
      waitingOn: [3],
      log: [...LOG, { t: "action", actor: 0, action: "assassinate", target: 3 }],
    }),
  },
  exchange: {
    state: S({
      phase: "exchange",
      turn: 0,
      action: act(0, "exchange"),
      waitingOn: [0],
      exchange: ["duke", "ambassador", "contessa", "captain"],
      log: [...LOG, { t: "action", actor: 0, action: "exchange", target: null }],
    }),
  },
  swapping: {
    state: S({ phase: "exchange", action: act(2, "exchange"), waitingOn: [2], log: [...LOG, { t: "action", actor: 2, action: "exchange", target: null }] }),
  },
  won: {
    state: S({
      phase: "finished",
      winner: 0,
      waitingOn: [],
      players: [
        { coins: 7, alive: true, cards: [hidden("duke"), lost("ambassador")] },
        { coins: 0, alive: false, cards: [lost("assassin"), lost("captain")] },
        { coins: 0, alive: false, cards: [lost("duke"), lost("contessa")] },
        { coins: 0, alive: false, cards: [lost("ambassador"), lost("captain")] },
        { coins: 0, alive: false, cards: [lost("assassin"), lost("contessa")] },
        { coins: 0, alive: false, cards: [lost("duke"), lost("assassin")] },
      ],
      log: [...LOG, { t: "out", seat: 1 }, { t: "out", seat: 3 }, { t: "out", seat: 5 }, { t: "out", seat: 2 }],
    }),
  },
  lost: {
    state: S({
      phase: "finished",
      winner: 2,
      waitingOn: [],
      players: [
        { coins: 0, alive: false, cards: [lost("duke"), lost("ambassador")] },
        { coins: 0, alive: false, cards: [lost("assassin"), lost("captain")] },
        { coins: 9, alive: true, cards: [hidden("contessa"), hidden("captain")] },
        { coins: 0, alive: false, cards: [lost("ambassador"), lost("captain")] },
        { coins: 0, alive: false, cards: [lost("assassin"), lost("contessa")] },
        { coins: 0, alive: false, cards: [lost("duke"), lost("assassin")] },
      ],
      log: [...LOG, { t: "out", seat: 1 }, { t: "out", seat: 3 }, { t: "out", seat: 5 }, { t: "out", seat: 0 }],
    }),
  },
  duel: {
    state: S({
      numPlayers: 2,
      turn: 1,
      waitingOn: [1],
      players: [PLAYERS[0], { coins: 5, alive: true, cards: [hidden(null), lost("contessa")] }],
      log: [
        { t: "action", actor: 0, action: "income", target: null },
        { t: "action", actor: 1, action: "assassinate", target: 0 },
      ],
    }),
  },
};

const LOOKS: { skin: string; colour: string; wear: Record<string, string> }[] = [
  { skin: "glossy", colour: "#F5922E", wear: { hat: "crown", hand: "lantern" } },
  { skin: "glossy", colour: "#3A78D8", wear: { eyes: "googly", mouth: "grin", hat: "beanie", top: "hoodie" } },
  { skin: "gingerbread", colour: "#F5922E", wear: { eyes: "icing", mouth: "icing", hat: "bow" } },
  { skin: "glossy", colour: "#3AA65A", wear: {} },
  { skin: "glossy", colour: "#8A5AD0", wear: { hat: "beanie" } },
  { skin: "glossy", colour: "#D23A4A", wear: { top: "hoodie" } },
];
const NAMES = ["Lin", "Ming", "Hua", "Qiang", "Mei", "Wei"].map((username, seat) => ({
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

export default function HustlePreview() {
  const skin = GAMES.coup?.skin;
  return (
    <ThemeScope colors={skin?.colors} active={skin !== undefined}>
      <HustleSamples />
    </ThemeScope>
  );
}

function HustleSamples() {
  const { colors, spacing } = useTheme();
  const { sample: asked, perf } = useLocalSearchParams<{ sample?: string; perf?: string }>();
  const [sample, setSample] = useState(asked && SAMPLES[asked] ? asked : "table");
  // a new deep link to this page picks its sample
  const [lastAsked, setLastAsked] = useState(asked);
  if (asked !== lastAsked) {
    setLastAsked(asked);
    if (asked && SAMPLES[asked]) setSample(asked);
  }
  const [rules, setRules] = useState(false);
  const [picking, setPicking] = useState(false);
  const fps = useFps(perf === "1");
  const router = useRouter();
  const session = `dev-${sample}`;
  const [seeded, setSeeded] = useState<string | null>(null);
  useEffect(() => {
    const { state, deal, reveal } = SAMPLES[sample];
    const watched = { dealt: !deal, shown: state.log.length - (reveal ? 1 : 0) };
    AsyncStorage.setItem(`boardly.coup.watched.${session}`, JSON.stringify(watched))
      .catch(() => {})
      .finally(() => setSeeded(sample));
  }, [sample, session]);
  if (!__DEV__) return <Redirect href="/" />;
  const { state } = SAMPLES[sample];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {seeded === sample ? (
        <CoupBoard
          key={sample}
          sessionId={session}
          state={state}
          mySeat={0}
          isMyTurn={state.turn === 0}
          players={NAMES.slice(0, state.numPlayers)}
          busy={false}
          finished={state.phase === "finished"}
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
      <RulesSheet gameKey="coup" gameName="Hustle" visible={rules} onClose={() => setRules(false)} />
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
