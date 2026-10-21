// Liar's Dice (大话骰) on the stage (the shared GameStage, see "A game's
// flow on the stage" in CLAUDE.md). The dice den's back bar across the
// top: the round, the dice on the table, a stein per player filling with
// every cup they drink. My own dice sit on a board hung from its shelf on
// two chains (HangingBoard), in the middle in front of the curtain. The
// plinth's dock holds the rest: the table's house rules as a card in my
// hand (HouseRules), the calls (and in endless the vote to stop) in the
// satchel, and the one line that matters on the crest. Every moment is
// its own scene behind the curtain:
//   shake  — each round starts with my cup on the mat: tap to shake it,
//            drag it up to look, shake again if all five differ (散骰),
//            then Start: the cup flies off, the dice fly up to my board
//   table  — everyone on the stage, cups down at their feet, the call on
//            the slate over them; anyone but the bidder may split (劈) it,
//            holding the button while red light streams to the bidder
//   call   — my turn: the face picked and the count nudged on the stage;
//            on the plinth each call button shows exactly the call a tap
//            makes (rising together with the count), Open and Split held
//   split  — the splitter in red light, the bidder to accept or to hold
//            for the counter-split (反劈)
//   reveal — every cup lifted, the dice counted toward the call, the one
//            who drinks lit red (played once on each device)
//   ending — the tankard, the winner crowned, the night's tally.

import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { Journal, type JournalPage } from "@/features/game/Journal";
import { Popup, type PopupLook } from "@/features/game/Popup";
import {
  GameStage,
  PLINTH_H,
  stageText,
  useStageSize,
  type StageDock,
  type StageHint,
  type StageLook,
  type StageTool,
} from "@/features/game/stage/GameStage";
import { dockInsets } from "@/features/game/stage/Dock";
import { shortName } from "@/features/game/stage/PlayerName";
import type { Light, Standing } from "@/features/game/stage/StageLineup";
import { asLook } from "@/features/mascot/dress";
import { HoldButton } from "@/games/nightwatch/lantern/HoldButton";
import { fontFamily } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps } from "../types";
import { denLayout, type DieTone } from "./art";
import { CallGrid, CallScene, callGridHeight, openRule, stacksCalls } from "./CallScene";
import { Den } from "./Den";
import { Ending } from "./Ending";
import { BOARD_DROP, BOARD_TUCK, HangingBoard, type Flight } from "./HangingBoard";
import { HouseRulesBack, HouseRulesFace } from "./HouseRules";
import {
  activeSeats,
  callPlan,
  callingOf,
  canReroll,
  canSplit,
  isKaizhai,
  isOut,
  isScattered,
  myCount,
  startFace,
  storedZhai,
  taskFor,
  thresholds,
  totalDice,
  type Bid,
  type CallChoice,
  type LiarsDiceState,
} from "./logic";
import { Call, Slate } from "./pieces";
import { RevealScene } from "./RevealScene";
import { ShakeScene, useShake, type ShakeStep } from "./ShakeScene";
import { TableScene } from "./TableScene";
import { useSeenReveals } from "./useSeenReveals";
import { useShaken } from "./useShaken";

/** A dice den late at night: dark wine, amber lamplight. */
const DEN_POPUP: PopupLook = { enamel: ["#B8382A", "#7A1810", "#3A0806"], jewel: "ruby", glow: "#FFC870" };
const DEN: StageLook = { sky: ["#2E1410", "#1C0C0A", "#100606"], glow: "#F2A24B", jewel: "ruby", popup: DEN_POPUP };

/** The slate over the cup while I shake, with room under it. */
const SHAKE_CALL_H = 80;

type T = ReturnType<typeof useTranslation>["t"];
type Panel = "calls" | "stop";

/** What has happened, as Journal pages: the round being played (its
 *  calls and any cups shaken again), and the round before it (how its
 *  call was challenged and counted, everyone's dice). */
export function liarsPages(state: LiarsDiceState, nameOf: (seat: number) => string, mySeat: number, t: T): JournalPage[] {
  const bidText = (bid: Pick<Bid, "quantity" | "face" | "zhai">) =>
    `${t("liarsdice.bid", { count: bid.quantity, face: bid.face })} · ${t(bid.zhai ? "liarsdice.zhai" : "liarsdice.kaizhai")}`;
  const pages: JournalPage[] = [];
  const r = state.reveal;
  if (r) {
    pages.push({
      key: `r${r.round}`,
      title: t("liarsdice.stage.round", { round: r.round }),
      sections: [
        {
          key: "reveal",
          title: `🔍 ${t("liarsdice.stage.theReveal")}`,
          entries: [
            {
              text: t(`liarsdice.revealBy.${r.kind ?? "open"}`, { name: nameOf(r.challenger), bid: bidText(r.bid), bidder: nameOf(r.bid.seat) }),
              detail: [
                t("liarsdice.found", { count: r.found, face: r.bid.face }),
                `${t("liarsdice.drinks", { name: nameOf(r.loser), count: r.drink })}${r.out ? ` ${t("liarsdice.drunkOut")}` : ""}`,
              ],
              tone: mySeat < 0 ? "neutral" : r.loser === mySeat ? "bad" : "good",
            },
            ...r.dice
              .map((hand, seat) => ({ hand, seat }))
              .filter(({ hand }) => hand.length > 0)
              .map(({ hand, seat }) => ({
                text: `🎲 ${nameOf(seat)}: ${[...hand].sort((a, b) => a - b).join(" ")}`,
                detail: [`${myCount(hand, r.bid.face, r.bid.zhai)} × ${r.bid.face}`],
              })),
          ],
        },
      ],
    });
  }
  if (state.phase !== "finished") {
    pages.push({
      key: `r${state.round}`,
      title: t("liarsdice.stage.round", { round: state.round }),
      sections: [
        {
          key: "calls",
          title: `🎲 ${t("liarsdice.calls")}`,
          entries: [
            ...state.rerolls.map((x) => ({ text: `🎲 ${t("liarsdice.rerolled", { name: nameOf(x.seat), dice: x.dice.join(" ") })}` })),
            ...state.bids.map((bid, i) => ({
              text: `${nameOf(bid.seat)}: ${bidText(bid)}`,
              detail: !bid.zhai && state.bids[i - 1]?.zhai ? [`🍖 ${t("liarsdice.broke")}`] : undefined,
            })),
          ],
        },
      ],
    });
  }
  return pages;
}

export function LiarsDiceBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  sessionId,
  onMove,
  stage,
  devShake,
}: GameBoardProps<LiarsDiceState> & {
  /** Development only: open the shake part way (the dev page's samples). */
  devShake?: ShakeStep;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useStageSize();

  const over = finished || state.phase === "finished";
  const task = over ? null : taskFor(state, mySeat);
  const step = `${state.round}:${state.bids.length}:${state.phase}`;
  const allSeats = Array.from({ length: state.numPlayers }, (_, seat) => seat);
  const out = allSeats.filter((seat) => isOut(state, seat));
  const iAmOut = mySeat >= 0 && isOut(state, mySeat);

  const nameOf = (seat: number) =>
    seat === mySeat ? t("game.you") : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
  // a name inside a sentence, cut so the words round it still show
  const short = (seat: number) => shortName(nameOf(seat));
  const people: Standing[] = allSeats.map((seat) => ({
    seat,
    name: nameOf(seat),
    look: asLook(players.find((p) => p.seat === seat)?.mascot),
  }));

  // each reveal plays once on the device; the first time the board
  // opens it counts what's already happened
  const memory = useSeenReveals(sessionId);
  const { ready: memoryReady, revealed, mark } = memory;
  useEffect(() => {
    if (memoryReady && revealed === null) mark(state.reveal?.round ?? 0);
  });
  const reveal = state.reveal;
  const revealing = memoryReady && revealed !== null && reveal !== null && reveal.round > revealed;
  const [countedRound, setCountedRound] = useState<number | null>(null);
  const counted = revealing && countedRound === reveal.round;

  // the call being made on my turn: the face I'm on and the count I've
  // nudged to (0: each call's least), tagged with the step it's for
  const fresh = () => ({ step, face: startFace(state), quantity: 0 });
  const [pick0, setPick] = useState(fresh);
  const pick = pick0.step === step ? pick0 : fresh();
  const plan = callPlan(state, pick.face, pick.quantity);

  // what I've just done shows at once, before the server answers
  const [said, setSaid] = useState<{ step: string; text: string } | null>(null);
  const saying = said?.step === step && !(stage?.error && !busy) ? said.text : null;
  const send = (move: Record<string, unknown>, text?: string) => {
    moveHaptic();
    if (text) setSaid({ step, text });
    onMove(move);
  };
  const hold = useSharedValue(0);
  const splitHold = useSharedValue(0);
  useEffect(() => {
    hold.set(0);
    splitHold.set(0);
  }, [step, hold, splitHold]);

  const [panel, setPanel] = useState<Panel | null>(null);
  // the dock's hand lifted, its satchel open or the rest of its hint
  // shown: the den rests, like it does under a panel
  const [docked, setDocked] = useState(false);
  const resting = panel !== null || docked;
  const bidText = (bid: Pick<Bid, "quantity" | "face" | "zhai">) =>
    `${t("liarsdice.bid", { count: bid.quantity, face: bid.face })} · ${t(bid.zhai ? "liarsdice.zhai" : "liarsdice.kaizhai")}`;

  // each round starts with my shake, once on the device (skipped once
  // I've made a call this round)
  const shook = useShaken(sessionId);
  const shake = useShake(state.round, devShake);
  const [flight, setFlight] = useState<(Flight & { round: number }) | null>(null);
  const shaking =
    !over &&
    mySeat >= 0 &&
    !iAmOut &&
    shook.ready &&
    shook.shaken < state.round &&
    state.myDice.length > 0 &&
    !state.bids.some((b) => b.seat === mySeat);
  const scattered = isScattered(state.myDice);
  // a reshake waits for the server's new dice before the cup can be shaken
  const myRerolls = state.rerolls.filter((r) => r.seat === mySeat).length;
  const [rerolled, setRerolled] = useState<{ round: number; count: number } | null>(null);
  const awaitingDice = rerolled !== null && rerolled.round === state.round && myRerolls <= rerolled.count && !stage?.error;
  const startRound = () => shook.mark(state.round);

  const scene: "reveal" | "ending" | "shake" | "split" | "call" | "table" = revealing
    ? "reveal"
    : over
      ? "ending"
      : shaking
        ? "shake"
        : state.phase === "split"
          ? "split"
          : task === "bid"
            ? "call"
            : "table";
  // room at the top of the stage for my board
  const clear = mySeat >= 0 ? BOARD_DROP - 22 : 0;
  const waiting = over ? null : state.phase === "split" ? (state.bid?.seat ?? null) : state.turn;
  const bidder = state.bid ? short(state.bid.seat) : "";
  const splitter = state.split ? state.split.by : null;

  // ── the scenes ──
  const tableLights: Record<number, Light> = Object.fromEntries(
    allSeats.map((seat) => [
      seat,
      isOut(state, seat)
        ? "dim"
        : scene === "split"
          ? seat === splitter
            ? "red"
            : seat === state.bid?.seat
              ? "lit"
              : "soft"
          : seat === state.turn
            ? "lit"
            : "soft",
    ]),
  );
  const heading =
    scene === "split" && state.bid && splitter !== null
      ? `🪓 ${state.bid.seat === mySeat ? t("liarsdice.stage.splitYou", { name: short(splitter) }) : t("liarsdice.stage.splitBy", { name: short(splitter), bidder })}`
      : state.bid
        ? t("liarsdice.stage.called", { name: bidder })
        : t("liarsdice.opening", { name: short(state.turn), rule: openRule(state, t) });
  // while I hold to split (or counter), red light streams to them
  const aim =
    scene === "table" && canSplit(state, mySeat) && state.bid ? state.bid.seat : scene === "split" && task === "answer" ? splitter : null;

  const winners = state.winners ?? (state.winner !== null ? [state.winner] : []);
  const title =
    winners.length > 1
      ? t("liarsdice.winnersTied", { names: winners.map(nameOf).join(", ") })
      : winners.length === 0
        ? t("liarsdice.noWinner")
        : winners[0] === mySeat
          ? t("liarsdice.youWin")
          : t("liarsdice.winner", { name: short(winners[0]) });

  const centre =
    scene === "reveal" && reveal ? (
      <RevealScene
        key={reveal.round}
        reveal={reveal}
        nameOf={nameOf}
        mySeat={mySeat}
        heading={t(`liarsdice.stage.${reveal.bid.seat === mySeat ? "revealYou" : "revealHead"}.${reveal.kind ?? "open"}`, {
          name: short(reveal.challenger),
          bidder: short(reveal.bid.seat),
        })}
        onCounted={() => setCountedRound(reveal.round)}
      />
    ) : scene === "ending" ? (
      <Ending
        title={title}
        reason={winners.length === 0 ? t("liarsdice.stage.leftEarly") : t(state.mode === "endless" ? "liarsdice.fewestCups" : "liarsdice.lastStanding")}
        winners={winners}
        people={people}
        cups={state.cups}
        maxCups={state.maxCups}
        mySeat={mySeat}
        afterGame={stage?.afterGame}
        paused={resting}
      />
    ) : scene === "shake" ? (
      <View style={StyleSheet.absoluteFill}>
        {/* what's been called while I shake */}
        {state.bid ? (
          <View style={[styles.shakeCall, { top: clear }]} pointerEvents="none">
            <Slate width={Math.min(width - 48, 280)} height={64}>
              <AppText style={styles.slateHead} numberOfLines={1}>
                {heading}
              </AppText>
              <Call quantity={state.bid.quantity} face={state.bid.face} zhai={state.bid.zhai} size={26} />
            </Slate>
          </View>
        ) : null}
        <ShakeScene
          key={state.round}
          shake={shake}
          faces={state.myDice}
          top={clear + (state.bid ? SHAKE_CALL_H : 0)}
          flying={flight?.round === state.round}
          scattered={scattered}
          canShake={!awaitingDice}
          tag={t("liarsdice.stage.shake.tag")}
        />
      </View>
    ) : scene === "call" ? (
      <View style={StyleSheet.absoluteFill}>
        <CallScene
          state={state}
          plan={plan}
          onFace={(face) => setPick({ ...pick, face, step })}
          onCount={(quantity) => setPick({ ...pick, face: plan.face, quantity, step })}
          bidder={bidder}
          busy={busy}
          top={clear}
        />
      </View>
    ) : (
      <View style={StyleSheet.absoluteFill}>
        <TableScene
          people={people}
          lights={tableLights}
          bid={state.bid}
          heading={heading}
          out={out}
          round={state.round}
          hold={hold}
          aim={aim}
          paused={resting}
          top={clear}
        />
      </View>
    );

  // ── the plinth ──
  const call = (choice: CallChoice) => {
    if (choice.quantity === null) return;
    const zhai = storedZhai(state, choice.face, choice.zhai);
    send(
      { type: "bid", quantity: choice.quantity, face: choice.face, zhai },
      `🎲 ${bidText({ quantity: choice.quantity, face: choice.face, zhai })}`,
    );
  };
  // the grid on the plinth: a second row (Open, Split) once there's a call;
  // lifted into the plinth's top on a screen with no home bar to spare,
  // but never up into the hint's cartouche on the crest
  // (the three opening calls of 几几几 stack 1 + 2 when a row of them would
  // be cramped between the hand and the satchel)
  const room = (() => {
    const at = dockInsets(width, { hand: true, satchel: true });
    return width - at.left - at.right;
  })();
  const stacked = !state.bid && stacksCalls(room, plan.choices.length);
  const gridRows = state.bid || stacked ? 2 : 1;
  const gridLift = Math.min(20, Math.max(0, callGridHeight(gridRows) + 6 - (PLINTH_H - 46 + insets.bottom)));
  const bottom =
    scene === "reveal" ? (
      counted ? (
        <Button
          label={t("liarsdice.stage.continue")}
          size="lg"
          style={styles.main}
          onPress={() => {
            tapHaptic();
            if (reveal) mark(reveal.round);
          }}
        />
      ) : (
        <AppText style={stageText.strong}>{t("liarsdice.stage.counting")}</AppText>
      )
    ) : scene === "ending" ? (
      (stage?.onward ?? <AppText style={stageText.strong}>{title}</AppText>)
    ) : scene === "shake" ? (
      shake.step === "closed" ? (
        <Button
          label={`🎲 ${t("liarsdice.stage.shake.shake")}`}
          size="lg"
          style={styles.main}
          disabled={awaitingDice}
          loading={awaitingDice}
          onPress={shake.shake}
        />
      ) : shake.step === "shaking" ? (
        <AppText style={[stageText.strong, styles.big]}>{t("liarsdice.stage.shake.shaking")}</AppText>
      ) : shake.step === "shaken" ? (
        <Button label={t("liarsdice.stage.shake.lift")} variant="secondary" size="lg" style={styles.main} onPress={shake.raise} />
      ) : scattered ? (
        <Button
          label={`🎲 ${t("liarsdice.stage.reshake")}`}
          size="lg"
          style={styles.main}
          disabled={busy || !canReroll(state, mySeat) || shake.step !== "open"}
          onPress={() => {
            setRerolled({ round: state.round, count: myRerolls });
            send({ type: "reroll" });
            shake.lower();
          }}
        />
      ) : (
        <Button
          label={t("liarsdice.stage.shake.start")}
          size="lg"
          style={styles.main}
          disabled={shake.step !== "open"}
          onPress={() => shake.leave((from) => setFlight({ round: state.round, from }), startRound)}
        />
      )
    ) : saying ? (
      <AppText style={[stageText.strong, styles.big]}>{saying}</AppText>
    ) : scene === "call" ? (
      <CallGrid
        plan={plan}
        canLie={state.bid !== null}
        busy={busy}
        openHold={hold}
        splitHold={splitHold}
        holdKey={step}
        lift={gridLift}
        stacked={stacked}
        onCall={call}
        onOpen={() => send({ type: "challenge" }, `🔍 ${t("liarsdice.stage.liar")}`)}
        onSplit={() => send({ type: "split", bids: state.bids.length }, `🪓 ${t("liarsdice.stage.liar")}`)}
      />
    ) : scene === "split" && task === "answer" ? (
      <View style={styles.pair}>
        <Button
          label={t("liarsdice.accept")}
          variant="secondary"
          size="lg"
          style={styles.half}
          disabled={busy}
          onPress={() => send({ type: "respond", counter: false }, t("liarsdice.accept"))}
        />
        <View style={styles.half}>
          <HoldButton
            key={`${step}|counter`}
            label={t("liarsdice.stage.holdCounter")}
            tone="bad"
            progress={hold}
            disabled={busy}
            onDone={() => send({ type: "respond", counter: true }, `🔥 ${t("liarsdice.counter")}`)}
          />
        </View>
      </View>
    ) : scene === "table" && canSplit(state, mySeat) && state.bid ? (
      <HoldButton
        key={`${step}|split`}
        // the button's own cue says to hold; the name cut to leave the cost
        label={t("liarsdice.stage.holdSplitThem", { name: shortName(nameOf(state.bid.seat), 8) })}
        tone="bad"
        progress={hold}
        disabled={busy}
        onDone={() => send({ type: "split", bids: state.bids.length }, `🪓 ${t("liarsdice.stage.liar")}`)}
      />
    ) : (
      <AppText style={stageText.strong} numberOfLines={2}>
        {iAmOut
          ? t("liarsdice.youreOut")
          : scene === "split" && state.bid
            ? t("liarsdice.waitingAnswer", { name: bidder })
            : t("liarsdice.waiting", { name: short(state.turn) })}
      </AppText>
    );

  // ── the line on the plinth's crest: the one sentence that matters now,
  // the rest behind its info stud ──
  const lastReroll = state.rerolls[state.rerolls.length - 1];
  const shakeHint =
    shake.step === "closed"
      ? t(awaitingDice ? "liarsdice.stage.shake.fresh" : "liarsdice.stage.shake.tap")
      : shake.step === "shaken"
        ? t("liarsdice.stage.shake.drag")
        : shake.step === "open"
          ? scattered
            ? t(canReroll(state, mySeat) ? "liarsdice.stage.shake.scattered" : "liarsdice.stage.shake.wait")
            : t("liarsdice.stage.shake.good")
          : null;
  // on my turn: why a call is greyed, else the rule that matters now
  const greyed = plan.choices.find((c) => c.problem && (c.problem.code === "total" || c.problem.code === "onesZhai"))?.problem;
  const calling = callingOf(state);
  const callHint = greyed
    ? greyed.code === "total"
      ? t("liarsdice.callHint.total", { total: greyed.total })
      : t("liarsdice.callHint.onesZhai")
    : calling === "nozhai"
      ? t("liarsdice.callHint.nozhai")
      : isKaizhai(state)
        ? t("liarsdice.callHint.kaizhai")
        : state.bid && calling === "jijiji"
          ? t("liarsdice.callHint.fei", { fei: thresholds(activeSeats(state).length)[2] })
          : state.bid
            ? t("liarsdice.callHint.double", { min: state.bid.quantity * 2 })
            : t("liarsdice.callHint.pick");
  const rerollLine = lastReroll
    ? `🎲 ${t("liarsdice.rerolled", { name: short(lastReroll.seat), dice: lastReroll.dice.join(" ") })}`
    : null;
  const hintOf = (): StageHint | null => {
    if (scene === "reveal" || scene === "ending") return null;
    if (scene === "shake") {
      const myCallFirst = task === "bid" && (shake.step === "closed" || shake.step === "shaken");
      if (myCallFirst) return { line: t("liarsdice.stage.shake.yourTurn"), tone: "#FFD58A", more: shakeHint ? [shakeHint] : [] };
      return shakeHint ? { line: shakeHint } : null;
    }
    if (scene === "call") {
      return {
        line: callHint,
        more: [
          ...(greyed || !state.bid ? [] : [t("liarsdice.callHint.pick")]),
          ...(state.bid ? [t("liarsdice.challengeHint")] : [openRule(state, t)]),
        ],
      };
    }
    if (scene === "split") {
      return task === "answer" ? { line: t("liarsdice.stage.answerHold"), more: [t("liarsdice.answerHint")] } : null;
    }
    // the table: someone's cup shown and shaken again (the split's cost is
    // on its own button)
    return rerollLine ? { line: rerollLine } : null;
  };
  const lipNow = hintOf();
  const hintTitle = t("liarsdice.stage.round", { round: state.round });
  // a move that didn't go through says so first, whatever the moment
  const lip: StageHint | null =
    stage?.error && scene !== "reveal"
      ? { line: stage.error, tone: "#FF8A94", title: hintTitle, more: lipNow ? [lipNow.line, ...(lipNow.more ?? [])] : [] }
      : lipNow
        ? { title: hintTitle, ...lipNow }
        : null;

  // ── my board, hanging from the den in the middle: the dice that count
  // for the call on the table (or the one I'm making) lit in gold ──
  const myDice = state.myDice;
  const countFor = scene === "call" ? { face: plan.face, zhai: !isKaizhai(state) } : state.bid;
  const tones: DieTone[] = myDice.map((d) => (countFor && myCount([d], countFor.face, countFor.zhai) > 0 ? "lit" : "plain"));
  const L = denLayout(width, insets.top, state.numPlayers);

  // ── the dock on the plinth: the house rules in my hand, the calls (and
  // in endless the vote to stop) in the satchel ──
  // a red dot on the calls for calls (and reshakes) by others not yet
  // looked at, counted per round
  const othersNow = state.bids.filter((b) => b.seat !== mySeat).length + state.rerolls.filter((r) => r.seat !== mySeat).length;
  const [looked, setLooked] = useState(() => ({ round: state.round, n: othersNow }));
  const callsFresh = looked.round === state.round ? othersNow > looked.n : othersNow > 0;
  const needed = Math.floor(state.numPlayers / 2) + 1;
  const voted = state.endVotes.includes(mySeat);
  const stopVote = state.mode === "endless" && mySeat >= 0;
  const openPanel = (key: Panel) => {
    setPanel(key);
    if (key === "calls") setLooked({ round: state.round, n: othersNow });
  };
  const tools: StageTool[] = [
    { key: "calls", emoji: "📜", label: t("liarsdice.stage.callsTool"), onPress: () => openPanel("calls"), badge: callsFresh },
    ...(stopVote
      ? [
          {
            key: "stop",
            emoji: "🛑",
            label: t("liarsdice.stage.stopTool", { votes: state.endVotes.length, needed }),
            onPress: () => openPanel("stop"),
            badge: state.endVotes.length > 0 && !voted,
          },
        ]
      : []),
  ];
  const liftedW = Math.min(330, width - 48);
  const dock: StageDock = {
    // the rules are everyone's, and stay to the end: the plinth's move
    // keeps the same place between hand and satchel in every scene
    hand: {
      label: t("liarsdice.house.label"),
      back: (w) => <HouseRulesBack width={w} />,
      face: <HouseRulesFace state={state} width={liftedW} />,
      faceSize: { width: liftedW, height: liftedW * 1.4 },
    },
    satchel: { tools, jewel: "ruby" },
    hint: lip,
    onOpen: setDocked,
  };

  // until this device's memory of which reveals it has watched is read,
  // nothing is shown: a reload in the middle of a reveal mustn't flash
  // the cups already drunk
  if (!memoryReady) return <View style={styles.wait} />;

  return (
    <GameStage
      header={
        <View style={{ width, height: L.h }} pointerEvents="box-none">
          {mySeat >= 0 ? (
            <HangingBoard
              width={width}
              top={L.h - BOARD_TUCK}
              faces={myDice}
              tones={tones}
              empty={scene === "shake"}
              drunk={iAmOut ? `🥴 ${t("liarsdice.drunk")}` : undefined}
              away={scene === "reveal" || scene === "ending"}
              flight={scene === "shake" && flight?.round === state.round ? flight : null}
              onLanded={startRound}
              label={`${t("liarsdice.stage.yourCup")}: ${[...myDice].sort((a, b) => a - b).join(" ")}`}
              paused={resting}
            />
          ) : null}
          <Den
            width={width}
            top={insets.top}
            title={
              revealing && reveal
                ? t("liarsdice.stage.round", { round: reveal.round })
                : over
                  ? t("liarsdice.stage.closing")
                  : t("liarsdice.stage.round", { round: state.round })
            }
            subtitle={
              revealing
                ? t("liarsdice.stage.theReveal")
                : over
                ? undefined
                : `${t("liarsdice.stage.dice", { count: totalDice(state) })}${state.bid ? ` · ${t(state.bid.zhai ? "liarsdice.zhai" : "liarsdice.kaizhai")}` : ""}`
            }
            tally={allSeats.map((seat) => {
              // until the reveal's count is in, the one who drinks hasn't yet
              const cups = revealing && !counted && reveal && seat === reveal.loser ? Math.max(0, state.cups[seat] - reveal.drink) : state.cups[seat];
              return { name: nameOf(seat), cups, out: state.maxCups !== null && cups >= state.maxCups };
            })}
            maxCups={state.maxCups}
            waiting={revealing ? null : waiting}
            paused={resting}
          />
        </View>
      }
      headerHeight={L.h}
      sceneKey={scene === "reveal" && reveal ? `reveal-${reveal.round}` : scene === "shake" ? `shake-${state.round}` : scene}
      centre={
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {centre}
        </View>
      }
      dock={dock}
      bottom={bottom}
      onBack={stage?.onBack}
      onRules={stage?.onRules}
      away={scene === "reveal" || scene === "ending"}
      bleed={scene === "ending"}
      look={DEN}
      overlays={
        <Popup
          look={DEN_POPUP}
          visible={panel !== null}
          title={panel === "stop" ? t("liarsdice.endTitle") : t("liarsdice.stage.callsTool")}
          onClose={() => setPanel(null)}
        >
          {panel === "stop" ? (
            <View style={styles.panel}>
              <AppText variant="body">
                {t("liarsdice.endHint", { votes: state.endVotes.length, needed })}
              </AppText>
              <Button
                label={voted ? t("liarsdice.endCancel") : t("liarsdice.endVote")}
                variant={voted ? "secondary" : "primary"}
                disabled={busy}
                onPress={() => send({ type: "end", vote: !voted })}
              />
            </View>
          ) : (
            // a reveal still playing on the stage isn't in the calls yet
            <Journal
              pages={liarsPages(revealing ? { ...state, reveal: null } : state, nameOf, mySeat, t)}
              emptyText={t("liarsdice.stage.noCalls")}
            />
          )}
        </Popup>
      }
    />
  );
}

const styles = StyleSheet.create({
  wait: { flex: 1, backgroundColor: "#1C0C0A" },
  main: { alignSelf: "stretch" },
  pair: { flexDirection: "row", gap: 10, alignSelf: "stretch", alignItems: "center" },
  half: { flex: 1 },
  big: { fontSize: 17, lineHeight: 22 },
  shakeCall: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  slateHead: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 15,
    color: "#E8D2B4",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  panel: { gap: 12 },
});
