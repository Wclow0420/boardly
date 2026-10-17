// Liar's Dice (大话骰) on the stage (the shared GameStage, see "A game's
// flow on the stage" in CLAUDE.md). The dice den's back bar across the
// top: the round, the dice on the table, a stein per player filling with
// every cup they drink. My own dice sit on a board hung from its shelf on
// two chains (HangingBoard), in front of the curtain; the call on the
// table and the tools hang below it. Every moment is its own scene behind
// the curtain:
//   shake  — each round starts with my cup on the mat: tap to shake it,
//            drag it up to look, shake again if all five differ (散骰),
//            then Start: the cup flies off, the dice fly up to my board
//   table  — everyone on the stage, cups down at their feet, the call on
//            the slate over them; anyone but the bidder may split (劈) it,
//            holding the button while red light streams to the bidder
//   call   — my turn: my dice, the number and the face picked on the
//            stage, the call made on the plinth, or "Liar!" held there
//   split  — the splitter in red light, the bidder to accept or to hold
//            for the counter-split (反劈)
//   reveal — every cup lifted, the dice counted toward the call, the one
//            who drinks lit red (played once on each device)
//   ending — the tankard, the winner crowned, the night's tally.

import { useEffect, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { Journal, type JournalPage } from "@/features/game/Journal";
import { Popup, type PopupLook } from "@/features/game/Popup";
import { GameStage, stageText, type StageLook } from "@/features/game/stage/GameStage";
import { ToolButton } from "@/features/game/stage/parts";
import type { Light, Standing } from "@/features/game/stage/StageLineup";
import { asLook } from "@/features/mascot/dress";
import { HoldButton } from "@/games/nightwatch/lantern/HoldButton";
import { fontFamily } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps } from "../types";
import { denLayout, type DieTone } from "./art";
import { CallScene, pickZhai, type CallPick } from "./CallScene";
import { Den } from "./Den";
import { Ending } from "./Ending";
import { BOARD_DROP, BOARD_TUCK, HangingBoard, type Flight } from "./HangingBoard";
import {
  breakZhaiMin,
  canReroll,
  canSplit,
  isOut,
  isScattered,
  isValidBid,
  myCount,
  openingMin,
  suggestedBid,
  taskFor,
  totalDice,
  type Bid,
  type LiarsDiceState,
} from "./logic";
import { Call, Slate } from "./pieces";
import { RevealScene } from "./RevealScene";
import { ShakeScene, useShake, type ShakeStep } from "./ShakeScene";
import { TableScene } from "./TableScene";
import { useSeenReveals } from "./useSeenReveals";
import { useShaken } from "./useShaken";

/** A dice den late at night: dark wine, amber lamplight. */
const DEN: StageLook = { sky: ["#2E1410", "#1C0C0A", "#100606"], glow: "#F2A24B", jewel: "ruby" };
const DEN_POPUP: PopupLook = { enamel: ["#B8382A", "#7A1810", "#3A0806"], jewel: "ruby", glow: "#FFC870" };

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
  const { width } = useWindowDimensions();

  const over = finished || state.phase === "finished";
  const task = over ? null : taskFor(state, mySeat);
  const step = `${state.round}:${state.bids.length}:${state.phase}`;
  const allSeats = Array.from({ length: state.numPlayers }, (_, seat) => seat);
  const out = allSeats.filter((seat) => isOut(state, seat));
  const iAmOut = mySeat >= 0 && isOut(state, mySeat);

  const nameOf = (seat: number) =>
    seat === mySeat ? t("game.you") : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
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

  // the call being made on my turn, tagged with the step it's for
  const fresh = (): CallPick & { step: string } => ({
    step,
    ...suggestedBid(state),
    zhai: state.bid?.zhai ?? false,
    liar: "open",
  });
  const [pick0, setPick] = useState(fresh);
  const pick = pick0.step === step ? pick0 : fresh();
  const choose = (change: Partial<CallPick>) => setPick({ ...pick, ...change, step });
  const zhai = pickZhai(state, pick);
  const valid = isValidBid(state, pick.quantity, pick.face, zhai);
  const breakMin = breakZhaiMin(state);

  // what I've just done shows at once, before the server answers
  const [said, setSaid] = useState<{ step: string; text: string } | null>(null);
  const saying = said?.step === step && !(stage?.error && !busy) ? said.text : null;
  const send = (move: Record<string, unknown>, text?: string) => {
    moveHaptic();
    if (text) setSaid({ step, text });
    onMove(move);
  };
  const hold = useSharedValue(0);
  useEffect(() => {
    hold.set(0);
  }, [step, hold]);

  const [panel, setPanel] = useState<Panel | null>(null);
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
  const bidder = state.bid ? nameOf(state.bid.seat) : "";
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
      ? `🪓 ${state.bid.seat === mySeat ? t("liarsdice.stage.splitYou", { name: nameOf(splitter) }) : t("liarsdice.stage.splitBy", { name: nameOf(splitter), bidder })}`
      : state.bid
        ? t("liarsdice.stage.called", { name: bidder })
        : t("liarsdice.opening", { name: nameOf(state.turn), min: openingMin(state, false), zhaiMin: openingMin(state, true) });
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
          : t("liarsdice.winner", { name: nameOf(winners[0]) });

  const centre =
    scene === "reveal" && reveal ? (
      <RevealScene
        key={reveal.round}
        reveal={reveal}
        nameOf={nameOf}
        mySeat={mySeat}
        heading={t(`liarsdice.stage.${reveal.bid.seat === mySeat ? "revealYou" : "revealHead"}.${reveal.kind ?? "open"}`, {
          name: nameOf(reveal.challenger),
          bidder: nameOf(reveal.bid.seat),
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
        paused={panel !== null}
      />
    ) : scene === "shake" ? (
      <View style={StyleSheet.absoluteFill}>
        {/* what's been called while I shake */}
        {state.bid ? (
          <View style={[styles.shakeCall, { top: clear }]} pointerEvents="none">
            <Slate width={Math.min(width - 130, 260)} height={64}>
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
      <View style={[StyleSheet.absoluteFill, styles.besideTools]}>
        <CallScene state={state} pick={pick} onPick={choose} bidder={bidder} busy={busy} top={clear} />
      </View>
    ) : (
      <View style={[StyleSheet.absoluteFill, styles.besideTools]}>
        <TableScene
          people={people}
          lights={tableLights}
          bid={state.bid}
          heading={heading}
          out={out}
          round={state.round}
          hold={hold}
          aim={aim}
          paused={panel !== null}
          top={clear}
        />
      </View>
    );

  // ── the plinth ──
  const liarLabel = pick.liar === "split" ? t("liarsdice.stage.holdSplit") : t("liarsdice.stage.holdOpen");
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
      <View style={styles.pair}>
        <Button
          label={t("liarsdice.stage.callIt", { bid: t("liarsdice.bid", { count: pick.quantity, face: pick.face }) })}
          size="lg"
          style={styles.half}
          disabled={!valid}
          loading={busy}
          onPress={() =>
            send({ type: "bid", quantity: pick.quantity, face: pick.face, zhai }, `🎲 ${bidText({ quantity: pick.quantity, face: pick.face, zhai })}`)
          }
        />
        {state.bid ? (
          <View style={styles.half}>
            <HoldButton
              key={`${step}|${pick.liar}`}
              label={liarLabel}
              tone="bad"
              progress={hold}
              disabled={busy}
              onDone={() =>
                pick.liar === "split"
                  ? send({ type: "split", bids: state.bids.length }, `🪓 ${t("liarsdice.stage.liar")}`)
                  : send({ type: "challenge" }, `🔍 ${t("liarsdice.stage.liar")}`)
              }
            />
          </View>
        ) : null}
      </View>
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
        label={t("liarsdice.stage.holdSplitThem", { name: bidder })}
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
            : t("liarsdice.waiting", { name: nameOf(state.turn) })}
      </AppText>
    );

  // ── the lines over the plinth ──
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
  const hint =
    scene === "reveal" || scene === "ending" ? null : (
      <>
        {scene === "shake" && task === "bid" && (shake.step === "closed" || shake.step === "shaken") ? (
          <AppText style={[stageText.hint, styles.turn]} numberOfLines={1}>
            {t("liarsdice.stage.shake.yourTurn")}
          </AppText>
        ) : null}
        {scene === "shake" ? (
          shakeHint ? (
            <AppText style={stageText.hint} numberOfLines={2}>
              {shakeHint}
            </AppText>
          ) : null
        ) : scene === "call" && !valid ? (
          <AppText style={stageText.hint} numberOfLines={2}>
            {breakMin !== null && !zhai
              ? t("liarsdice.mustBreak", { min: breakMin })
              : state.bid
                ? t("liarsdice.mustRaise")
                : t("liarsdice.mustOpen", { min: openingMin(state, zhai) })}
          </AppText>
        ) : scene === "call" && state.bid ? (
          <AppText style={stageText.hint} numberOfLines={2}>
            {t("liarsdice.challengeHint")}
          </AppText>
        ) : scene === "split" && task === "answer" ? (
          <AppText style={stageText.hint} numberOfLines={2}>
            {t("liarsdice.stage.answerHold")}
          </AppText>
        ) : lastReroll && scene === "table" ? (
          <AppText style={stageText.hint} numberOfLines={2}>
            {`🎲 ${t("liarsdice.rerolled", { name: nameOf(lastReroll.seat), dice: lastReroll.dice.join(" ") })}`}
          </AppText>
        ) : null}
        {stage?.error ? (
          <AppText style={[stageText.hint, styles.error]} numberOfLines={2}>
            {stage.error}
          </AppText>
        ) : null}
      </>
    );

  // ── my board, hanging from the den: the dice that count for the call
  // on the table (or the one I'm making) lit in gold ──
  const myDice = state.myDice;
  const countFor = scene === "call" ? { face: pick.face, zhai } : state.bid;
  const tones: DieTone[] = myDice.map((d) => (countFor && myCount([d], countFor.face, countFor.zhai) > 0 ? "lit" : "plain"));

  const tools =
    over || scene === "reveal" ? null : (
      <View style={[styles.tools, { top: clear > 0 ? clear + 4 : 20 }]} pointerEvents="box-none">
        <ToolButton emoji="📜" label={t("liarsdice.stage.callsTool")} onPress={() => setPanel("calls")} />
        {state.mode === "endless" && mySeat >= 0 ? (
          <ToolButton
            emoji="🛑"
            label={`${state.endVotes.length}/${Math.floor(state.numPlayers / 2) + 1}`}
            badge={state.endVotes.length > 0 && !state.endVotes.includes(mySeat)}
            onPress={() => setPanel("stop")}
          />
        ) : null}
      </View>
    );

  const L = denLayout(width, insets.top, state.numPlayers);
  const voted = state.endVotes.includes(mySeat);

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
              paused={panel !== null}
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
            paused={panel !== null}
          />
        </View>
      }
      headerHeight={L.h}
      sceneKey={scene === "reveal" && reveal ? `reveal-${reveal.round}` : scene === "shake" ? `shake-${state.round}` : scene}
      centre={
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {centre}
          {tools}
        </View>
      }
      hint={hint}
      bottom={bottom}
      onBack={stage?.onBack}
      onRules={stage?.onRules}
      away={scene === "reveal" || scene === "ending"}
      bleed={scene === "ending"}
      look={DEN}
      overlays={
        <Popup
          look={DEN_POPUP}
          visible={panel !== null && scene !== "reveal"}
          title={panel === "stop" ? t("liarsdice.endTitle") : t("liarsdice.stage.callsTool")}
          onClose={() => setPanel(null)}
        >
          {panel === "stop" ? (
            <View style={styles.panel}>
              <AppText variant="body">
                {t("liarsdice.endHint", { votes: state.endVotes.length, needed: Math.floor(state.numPlayers / 2) + 1 })}
              </AppText>
              <Button
                label={voted ? t("liarsdice.endCancel") : t("liarsdice.endVote")}
                variant={voted ? "secondary" : "primary"}
                disabled={busy}
                onPress={() => send({ type: "end", vote: !voted })}
              />
            </View>
          ) : (
            <Journal pages={liarsPages(state, nameOf, mySeat, t)} emptyText={t("liarsdice.stage.noCalls")} />
          )}
        </Popup>
      }
    />
  );
}

const styles = StyleSheet.create({
  besideTools: { right: 60 },
  main: { alignSelf: "stretch" },
  pair: { flexDirection: "row", gap: 10, alignSelf: "stretch", alignItems: "center" },
  half: { flex: 1 },
  big: { fontSize: 17, lineHeight: 22 },
  error: { color: "#FF8A94" },
  turn: { color: "#FFD58A" },
  tools: { position: "absolute", right: 4, gap: 12 },
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
