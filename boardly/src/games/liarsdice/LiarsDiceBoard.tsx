// Liar's Dice (大话骰) on the stage (the shared GameStage, see "A game's
// flow on the stage" in CLAUDE.md). The dice den's back bar across the
// top: the round, the dice on the table, a stein per player filling with
// every cup they drink. My own dice lie in a felt tray under it. Every
// moment is its own scene behind the curtain:
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
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
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
import { denLayout } from "./art";
import { CallScene, pickZhai, type CallPick } from "./CallScene";
import { Den } from "./Den";
import { Ending } from "./Ending";
import {
  breakZhaiMin,
  canReroll,
  canSplit,
  isOut,
  isValidBid,
  myCount,
  openingMin,
  suggestedBid,
  taskFor,
  totalDice,
  type Bid,
  type LiarsDiceState,
} from "./logic";
import { DiceRow, Tray } from "./pieces";
import { RevealScene } from "./RevealScene";
import { TableScene } from "./TableScene";
import { useSeenReveals } from "./useSeenReveals";

/** A dice den late at night: dark wine, amber lamplight. */
const DEN: StageLook = { sky: ["#2E1410", "#1C0C0A", "#100606"], glow: "#F2A24B", jewel: "ruby" };
const DEN_POPUP: PopupLook = { enamel: ["#B8382A", "#7A1810", "#3A0806"], jewel: "ruby", glow: "#FFC870" };

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
}: GameBoardProps<LiarsDiceState>) {
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

  const scene: "reveal" | "ending" | "split" | "call" | "table" = revealing
    ? "reveal"
    : over
      ? "ending"
      : state.phase === "split"
        ? "split"
        : task === "bid"
          ? "call"
          : "table";
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
    ) : scene === "call" ? (
      <View style={[StyleSheet.absoluteFill, styles.besideTools]}>
        <CallScene state={state} pick={pick} onPick={choose} bidder={bidder} busy={busy} />
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
  const hint =
    scene === "reveal" || scene === "ending" ? null : (
      <>
        {scene === "call" && !valid ? (
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

  // ── under the den: my cup, and the vote to stop ──
  const myDice = state.myDice;
  const counting = state.bid ? myDice.map((d) => myCount([d], state.bid!.face, state.bid!.zhai) > 0) : [];
  const under =
    mySeat >= 0 && !over && scene !== "call" ? (
      <View style={styles.underRow}>
        {iAmOut ? (
          <Tray>
            <AppText style={styles.trayText}>{`🥴 ${t("liarsdice.drunk")}`}</AppText>
          </Tray>
        ) : (
          <Tray>
            <AppText style={styles.trayText}>{t("liarsdice.stage.yourCup")}</AppText>
            <DiceRow faces={myDice} size={22} gap={4} tones={counting.map((c) => (c ? "lit" : "plain"))} />
          </Tray>
        )}
        {canReroll(state, mySeat) ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => send({ type: "reroll" })}
            style={({ pressed }) => [styles.reroll, pressed && styles.pressed]}
          >
            <Tray>
              <AppText style={styles.trayText}>{`🎲 ${t("liarsdice.stage.reshake")}`}</AppText>
            </Tray>
          </Pressable>
        ) : null}
      </View>
    ) : undefined;

  const tools = over ? undefined : (
    <>
      <ToolButton emoji="📜" label={t("liarsdice.stage.callsTool")} onPress={() => setPanel("calls")} />
      {state.mode === "endless" && mySeat >= 0 ? (
        <ToolButton
          emoji="🛑"
          label={`${state.endVotes.length}/${Math.floor(state.numPlayers / 2) + 1}`}
          badge={state.endVotes.length > 0 && !state.endVotes.includes(mySeat)}
          onPress={() => setPanel("stop")}
        />
      ) : null}
    </>
  );

  const L = denLayout(width, insets.top, state.numPlayers);
  const voted = state.endVotes.includes(mySeat);

  return (
    <GameStage
      header={
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
      }
      headerHeight={L.h}
      under={under}
      sceneKey={scene === "reveal" && reveal ? `reveal-${reveal.round}` : scene}
      centre={centre}
      tools={tools}
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
  underRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  trayText: { fontFamily: fontFamily.semiBold, fontSize: 11, lineHeight: 14, color: "#E8F4EA" },
  reroll: {},
  pressed: { opacity: 0.7 },
  panel: { gap: 12 },
});
