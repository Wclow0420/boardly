// Tic-Tac-Toe on the stage (the shared GameStage, see "A game's flow on
// the stage" in CLAUDE.md): the parlour crest across the top (the two
// marks' medallions, whose turn it is, the moves counted in studs), the
// inlaid board in the middle with both players standing under their
// lamps below it, whose turn it is on the plinth. The plinth's dock holds
// my mark as a token in my hand (MarkCard: tap, and it turns over into a
// card saying which mark I play and that the cross moves first), the
// moves so far in the satchel, and the one line that matters on the
// crest. A mark drops onto its square the moment it's tapped; three in a
// row lights up and is drawn through, and a Continue takes the table
// behind the curtain to the ending: the medal, the verdict, the winner
// crowned.

import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText, Button, useBox } from "@/components/ui";
import { Journal, type JournalPage } from "@/features/game/Journal";
import { Popup, type PopupLook } from "@/features/game/Popup";
import {
  GameStage,
  stageText,
  useStageSize,
  type StageDock,
  type StageHint,
  type StageLook,
} from "@/features/game/stage/GameStage";
import { shortName } from "@/features/game/stage/PlayerName";
import { StageLineup, type Light, type Standing } from "@/features/game/stage/StageLineup";
import { asLook } from "@/features/mascot/dress";
import type { GameBoardProps } from "../types";
import type { Mark } from "./art";
import { BoardView } from "./BoardView";
import { Crest } from "./Crest";
import { crestLayout } from "./art";
import { Ending } from "./Ending";
import { isLegalMove, winningLine, type Cell, type TicTacToeState } from "./logic";
import { MarkFace, MarkImage, MarkToken } from "./MarkCard";
import { useEndSeen } from "./useEndSeen";

/** A warm parlour by lamplight; its popups a sapphire sign. */
const PARLOUR_POPUP: PopupLook = { enamel: ["#5A7ABE", "#22356A", "#0C1634"], jewel: "sapphire", glow: "#FFD58A" };
const PARLOUR: StageLook = {
  sky: ["#2C1D12", "#1A110A", "#0E0906"],
  glow: "#F2B84B",
  jewel: "sapphire",
  popup: PARLOUR_POPUP,
};

const MARKS: Mark[] = ["X", "O"];
/** The players' boards stop a little short of the stage's foot. */
const LIFT = 10;
const Token = MarkImage;

type T = ReturnType<typeof useTranslation>["t"];

/** The moves so far, as a Journal page: each mark, who put it down, and
 *  on which square. */
export function tttPages(state: TicTacToeState, nameOf: (seat: number) => string, t: T): JournalPage[] {
  if (state.moves.length === 0) return [];
  return [
    {
      key: "moves",
      title: t("tictactoe.record.title"),
      sections: [
        {
          key: "moves",
          entries: state.moves.map((m, i) => ({
            text: t("tictactoe.record.move", {
              n: i + 1,
              name: nameOf(m.seat),
              mark: t(`tictactoe.marks.${MARKS[m.seat]}`),
              cell: t(`tictactoe.cells.${m.cell}`),
            }),
          })),
        },
      ],
    },
  ];
}

/** Which way a line runs: a row, a column or a diagonal. */
const lineKind = (line: number[]) =>
  line[1] - line[0] === 1 ? "row" : line[1] - line[0] === 3 ? "column" : "diagonal";

export function TicTacToeBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  sessionId,
  onMove,
  stage,
}: GameBoardProps<TicTacToeState>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useStageSize();
  const step = state.moves.length;

  // my mark goes down the moment I tap; a move that failed is taken back
  const [pending, setPending] = useState<{ step: number; cell: number } | null>(null);
  const mine = pending?.step === step && !(stage?.error && !busy) ? pending : null;
  const board: Cell[] = useMemo(
    () => (mine && mySeat >= 0 ? state.board.map((c, i) => (i === mine.cell ? state.symbols[mySeat] : c)) : state.board),
    [mine, mySeat, state.board, state.symbols],
  );
  const shown = { ...state, board };
  const line = winningLine(shown);
  const full = board.every((c) => c !== null);
  const ended = line !== null || full || finished;
  const winnerSeat = line ? state.symbols.indexOf(board[line[0]] as "X" | "O") : null;
  const myTurn = !ended && mySeat >= 0 && state.currentSeat === mySeat && !mine;
  const turnSeat = ended ? null : mine ? (mySeat + 1) % 2 : state.currentSeat;

  const memory = useEndSeen(sessionId);
  const atEnding = ended && memory.ready && memory.seen;

  const nameOf = (seat: number) =>
    seat === mySeat ? t("game.you") : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
  // a name inside a sentence, cut so the words round it still show
  const short = (seat: number) => shortName(nameOf(seat));
  const people: Standing[] = [0, 1].map((seat) => ({
    seat,
    name: nameOf(seat),
    look: asLook(players.find((p) => p.seat === seat)?.mascot),
  }));
  const lights: Record<number, Light> = Object.fromEntries(
    [0, 1].map((seat) => [
      seat,
      ended ? (winnerSeat === null || seat === winnerSeat ? "lit" : "dim") : seat === turnSeat ? "lit" : "soft",
    ]),
  );

  const verdict =
    winnerSeat !== null
      ? winnerSeat === mySeat
        ? t("tictactoe.result.youWin")
        : t("tictactoe.result.winner", { name: short(winnerSeat) })
      : full
        ? t("tictactoe.result.draw")
        : t("tictactoe.result.ended");
  const reason = line
    ? t(`tictactoe.reason.${lineKind(line)}`)
    : full
      ? t("tictactoe.reason.full")
      : t("tictactoe.reason.left");
  const title = ended
    ? verdict
    : turnSeat === mySeat
      ? t("tictactoe.turn.mine")
      : t("tictactoe.turn.theirs", { name: short(turnSeat ?? 0) });

  const L = crestLayout(width, insets.top);
  const moves = state.moves.map((m) => MARKS[m.seat]);
  if (mine && mySeat >= 0) moves.push(MARKS[mySeat]);

  const play = (cell: number) => {
    if (!myTurn || busy || !isLegalMove(shown, cell)) return;
    setPending({ step, cell });
    onMove({ cell });
  };

  // the moves so far, open from the satchel; the hand lifted or the
  // moves out: the players under their lamps rest
  const [record, setRecord] = useState(false);
  const [docked, setDocked] = useState(false);
  const [box, onLayout] = useBox();
  // the board above, the two players below it on the boards
  const boardSize = Math.max(150, Math.min(box.w * 0.68, box.h - LIFT - 230));
  const boardTop = 42 + Math.max(0, (box.h - LIFT - 222 - boardSize) / 2);

  const centre = atEnding ? (
    <Ending
      board={board}
      line={line}
      winner={winnerSeat}
      title={verdict}
      reason={reason}
      mine={winnerSeat === null || mySeat < 0 ? null : winnerSeat === mySeat}
      people={people}
      afterGame={stage?.afterGame}
      paused={false}
    />
  ) : (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {box.w > 0 ? (
        <>
          <View style={styles.lineup}>
            <StageLineup people={people} lights={lights} crown={ended ? winnerSeat : null} paused={docked || record} />
          </View>
          {[0, 1].map((seat) => (
            <View
              key={seat}
              pointerEvents="none"
              style={[
                styles.token,
                { left: box.w * (seat === 0 ? 0.27 : 0.73) + (seat === 0 ? -66 : 36), top: box.h - LIFT - 128 },
                lights[seat] === "soft" || lights[seat] === "dim" ? styles.faint : null,
              ]}
            >
              <Token kind={MARKS[seat]} size={30} />
            </View>
          ))}
          <View style={[styles.board, { top: boardTop }]}>
            <BoardView board={board} size={boardSize} canTap={myTurn && !busy} onTap={play} line={line} />
          </View>
        </>
      ) : null}
    </View>
  );

  // the one line on the plinth's crest, the rest behind its info stud
  const myMark = mySeat >= 0 ? MARKS[mySeat] : null;
  const verdictTone = winnerSeat === null ? "#FFD58A" : winnerSeat === mySeat || mySeat < 0 ? "#8CFFB0" : "#FF8A94";
  const lipNow: StageHint | null = atEnding
    ? null
    : ended
      ? { line: reason, tone: verdictTone, more: [verdict] }
      : myTurn && myMark
        ? { line: t("tictactoe.plinth.mine", { mark: t(`tictactoe.marks.${myMark}`) }), more: [t("tictactoe.hint")] }
        : null;
  // a move that didn't go through says so first
  const lip: StageHint | null =
    stage?.error && !atEnding
      ? { line: stage.error, tone: "#FF8A94", more: lipNow ? [lipNow.line, ...(lipNow.more ?? [])] : [] }
      : lipNow;

  // the dock: my mark in my hand, the moves so far in the satchel
  const liftedW = Math.min(300, width - 80);
  const dock: StageDock = {
    // kept through the ending too, so the plinth's move stays centred
    hand:
      myMark
        ? {
            label: t("tictactoe.hand.label"),
            back: (w) => <MarkToken kind={myMark} width={w} />,
            face: <MarkFace kind={myMark} width={liftedW} />,
            faceSize: { width: liftedW, height: liftedW * 1.4 },
          }
        : undefined,
    satchel: {
      tools: [
        {
          key: "moves",
          emoji: "📜",
          label: t("tictactoe.record.title"),
          // every move is on the board already: no dot for new ones
          onPress: () => setRecord(true),
        },
      ],
    },
    hint: lip,
    onOpen: setDocked,
  };

  const bottom = atEnding ? (
    (stage?.onward ?? <AppText style={stageText.strong}>{verdict}</AppText>)
  ) : ended ? (
    <Button label={t("tictactoe.continue")} size="lg" style={styles.main} onPress={memory.mark} disabled={!memory.ready} />
  ) : (
    <View style={styles.turn}>
      {turnSeat !== null ? <Token kind={MARKS[turnSeat]} size={34} /> : null}
      <AppText style={[stageText.strong, styles.turnText]} numberOfLines={2}>
        {myTurn
          ? t("tictactoe.plinth.tap")
          : mySeat >= 0 && turnSeat === mySeat
            ? t("tictactoe.plinth.placing")
            : t("tictactoe.plinth.theirs", { name: short(turnSeat ?? 0) })}
      </AppText>
    </View>
  );

  return (
    <GameStage
      header={
        <Crest
          width={width}
          top={insets.top}
          title={title}
          names={[nameOf(0), nameOf(1)]}
          lit={ended ? (winnerSeat === 0 || winnerSeat === 1 ? winnerSeat : null) : turnSeat === 0 || turnSeat === 1 ? turnSeat : null}
          won={ended && winnerSeat !== null}
          moves={moves}
        />
      }
      headerHeight={L.h}
      sceneKey={atEnding ? "ending" : "play"}
      centre={centre}
      dock={dock}
      bottom={bottom}
      onBack={stage?.onBack}
      onRules={stage?.onRules}
      away={atEnding}
      bleed={atEnding}
      look={PARLOUR}
      overlays={
        <Popup look={PARLOUR_POPUP} visible={record} title={t("tictactoe.record.title")} onClose={() => setRecord(false)}>
          <Journal pages={tttPages(state, nameOf, t)} emptyText={t("tictactoe.record.empty")} order="oldest" />
        </Popup>
      }
    />
  );
}

const styles = StyleSheet.create({
  board: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  lineup: { position: "absolute", left: 0, right: 0, top: 0, bottom: LIFT },
  token: { position: "absolute" },
  faint: { opacity: 0.55 },
  main: { alignSelf: "stretch" },
  turn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 56 },
  turnText: { fontSize: 16, lineHeight: 21, flexShrink: 1 },
});
