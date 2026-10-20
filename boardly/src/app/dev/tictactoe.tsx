// Development only: Tic-Tac-Toe's stage in every moment, with sample
// states, to look at on a device without a second player. Open with
// boardly-dev://dev/tictactoe?sample=<name> (the `dev` tab on the left
// lists them; add &perf=1 for the frame rate, &lang=zh for Chinese,
// &narrow=375 to lay the stage out as on a phone that wide, &error=1 for a
// move that didn't go through). The board is playable: a stand-in
// opponent answers each move.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { AppText, Button } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { StageWidth } from "@/features/game/stage/GameStage";
import { TicTacToeBoard } from "@/games/tictactoe/TicTacToeBoard";
import { winningLine, type Cell, type TicTacToeState } from "@/games/tictactoe/logic";
import { useLocale } from "@/i18n/LocaleContext";
import { useTheme } from "@/theme";

/** A state from the cells played, in order (seat 0 first). */
const played = (cells: number[]): TicTacToeState => {
  const board: Cell[] = Array(9).fill(null);
  cells.forEach((cell, i) => (board[cell] = i % 2 ? "O" : "X"));
  return {
    board,
    currentSeat: cells.length % 2,
    symbols: ["X", "O"],
    moves: cells.map((cell, i) => ({ seat: i % 2, cell })),
  };
};

/** Each moment; `end`: the player has already gone on to the ending;
 *  `finished`: the session is over (a walk-out). */
const SAMPLES: Record<string, { state: TicTacToeState; end?: boolean; finished?: boolean; mySeat?: number }> = {
  start: { state: played([]) },
  theirs: { state: played([4]) },
  mid: { state: played([4, 0, 8, 2]) },
  nought: { state: played([4, 0, 8]), mySeat: 1 },
  won: { state: played([4, 0, 8, 2, 1, 6, 7]) },
  lost: { state: played([0, 4, 1, 2, 8, 6]) },
  draw: { state: played([4, 0, 8, 2, 1, 7, 6, 3, 5]) },
  wonEnd: { state: played([4, 0, 8, 2, 1, 6, 7]), end: true },
  lostEnd: { state: played([0, 4, 1, 2, 8, 6]), end: true },
  drawEnd: { state: played([4, 0, 8, 2, 1, 7, 6, 3, 5]), end: true },
  leftEnd: { state: played([4, 0]), end: true, finished: true },
};

const LOOKS: { skin: string; colour: string; wear: Record<string, string> }[] = [
  { skin: "glossy", colour: "#3A78D8", wear: { eyes: "googly", mouth: "grin", hat: "beanie", top: "hoodie" } },
  { skin: "gingerbread", colour: "#F5922E", wear: { eyes: "icing", mouth: "icing", hat: "bow" } },
];
const NAMES = ["You", "🤖 Christopher Wellington"].map((username, seat) => ({
  seat,
  userId: `u${seat}`,
  username,
  borderId: null,
  avatarUrl: null,
  mascot: LOOKS[seat],
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

const place = (state: TicTacToeState, seat: number, cell: number): TicTacToeState => ({
  ...state,
  board: state.board.map((c, i) => (i === cell ? state.symbols[seat] : c)),
  currentSeat: (seat + 1) % 2,
  moves: [...state.moves, { seat, cell }],
});

export default function TicTacToePreview() {
  const { colors, spacing } = useTheme();
  const { sample: asked, perf, lang, narrow, error } = useLocalSearchParams<{
    sample?: string;
    perf?: string;
    lang?: string;
    narrow?: string;
    error?: string;
  }>();
  // &lang=zh (en, ms): look at a sample in another language
  const { language, setLanguage } = useLocale();
  useEffect(() => {
    if ((lang === "en" || lang === "zh" || lang === "ms") && lang !== language) setLanguage(lang);
  }, [lang, language, setLanguage]);
  const [sample, setSample] = useState(asked && SAMPLES[asked] ? asked : "start");
  // a new link picks its sample; a new sample starts from its state
  const [linked, setLinked] = useState(asked);
  if (asked !== linked) {
    setLinked(asked);
    if (asked && SAMPLES[asked]) setSample(asked);
  }
  const [playing, setPlaying] = useState({ sample, state: SAMPLES[sample].state });
  if (playing.sample !== sample) setPlaying({ sample, state: SAMPLES[sample].state });
  const state = playing.state;
  const setState = (next: TicTacToeState) => setPlaying({ sample, state: next });
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });
  const [rules, setRules] = useState(false);
  const [picking, setPicking] = useState(false);
  const fps = useFps(perf === "1");
  const router = useRouter();
  const session = `dev-ttt-${sample}`;
  const [seeded, setSeeded] = useState<string | null>(null);
  const reply = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (reply.current) clearTimeout(reply.current);
  }, []);
  useEffect(() => {
    const key = `boardly.tictactoe.watched.${session}`;
    (SAMPLES[sample].end ? AsyncStorage.setItem(key, "1") : AsyncStorage.removeItem(key))
      .catch(() => {})
      .finally(() => setSeeded(sample));
  }, [sample, session]);
  const mySeat = SAMPLES[sample].mySeat ?? 0;

  if (!__DEV__) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {seeded === sample ? (
        <StageWidth.Provider value={narrow ? Number(narrow) : null}>
        <View style={narrow ? { width: Number(narrow), flex: 1, alignSelf: "center", overflow: "hidden" } : { flex: 1 }}>
        <TicTacToeBoard
          key={sample}
          sessionId={session}
          state={state}
          mySeat={mySeat}
          isMyTurn={state.currentSeat === mySeat}
          players={NAMES}
          busy={false}
          finished={!!SAMPLES[sample].finished}
          onMove={(move) => {
            const cell = move.cell as number;
            // the server's answer, then the stand-in opponent's move
            setTimeout(() => {
              const next = place(latest.current, mySeat, cell);
              setState(next);
              if (winningLine(next) || next.board.every((c) => c !== null)) return;
              reply.current = setTimeout(() => {
                const now = latest.current;
                const open = now.board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
                setState(place(now, (mySeat + 1) % 2, open[Math.floor(Math.random() * open.length)]));
              }, 1100);
            }, 250);
          }}
          stage={{
            error: error === "1" ? "That square is already taken." : null,
            onBack: () => router.back(),
            onRules: () => setRules(true),
            // stand-ins for the game screen's own
            onward: (
              <View style={{ flexDirection: "row", gap: 12, alignSelf: "stretch" }}>
                <Button label="Back to Home" variant="secondary" style={{ flex: 1 }} onPress={() => router.back()} />
                <Button label="Play Again" style={{ flex: 1 }} onPress={() => setSample("start")} />
              </View>
            ),
          }}
        />
        </View>
        </StageWidth.Provider>
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
      <RulesSheet gameKey="tictactoe" gameName="Tic-Tac-Toe" visible={rules} onClose={() => setRules(false)} />
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
