// Hustle, played on the stage (see "A game's flow on the stage" in the
// root CLAUDE.md; Seal the Manor is the model). The den's eave across the
// top shows whose turn it is and every player's tile; the middle is the
// moment: my two cards dealt, the table under the lamps, the felt where I
// choose my action, the player I aim it at, a claim the room may
// challenge or block, a challenge settled (once per device), someone put
// out, the card I must turn over, the cards I swap, and the ending with
// every hand face up. My own hand is always in reach: the top tool down
// the side is my two cards, small, and opens them large.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { Journal } from "@/features/game/Journal";
import { Popup, type PopupLook } from "@/features/game/Popup";
import { stageText } from "@/features/game/stage/GameStage";
import { ToolButton } from "@/features/game/stage/parts";
import { shortName } from "@/features/game/stage/PlayerName";
import type { Light, Plate, Standing } from "@/features/game/stage/StageLineup";
import { asLook } from "@/features/mascot/dress";
import { fontFamily } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import { HoldButton } from "@/games/nightwatch/lantern/HoldButton";
import type { GameBoardProps } from "../types";
import { ACTION_EMOJI, ROLE_EMOJI } from "./art";
import { RoleCard } from "./cards";
import { CardRow, type RowCard } from "./den/CardRow";
import { ClaimScene } from "./den/ClaimScene";
import { DenStage, DenTag } from "./den/DenStage";
import type { DenTile } from "./den/DenSign";
import { Ending } from "./den/Ending";
import { Felt } from "./den/Felt";
import { Showdown } from "./den/Showdown";
import { TableLineup } from "./den/TableLineup";
import {
  ACTIONS,
  FORCED_COUP_AT,
  ROLES,
  aliveCount,
  canTake,
  claimOf,
  claimWindow,
  handOf,
  respondersOf,
  specOf,
  targetsFor,
  taskFor,
  toggleKeep,
  turnCount,
  type ActionType,
  type CoupState,
  type LogEvent,
  type Role,
} from "./logic";
import { describe, hustlePages } from "./pages";
import { useSetPieces } from "./useSetPieces";

/** The den's popups: a crimson lacquer sign, a jade jewel. */
const DEN_POPUP: PopupLook = { enamel: ["#D2384A", "#8A1424", "#4A0812"], jewel: "emerald", glow: "#FFB45E" };

type Panel = "hand" | "record" | "roles";
type Staged = { at: number; event: Extract<LogEvent, { t: "challenge" } | { t: "out" }> };

/** What I've picked in the moment on the stage, tagged with its step. */
type Pick = {
  step: string;
  action?: ActionType | null;
  target?: number | null;
  card?: number | null;
  keep?: number[];
  block?: Role;
  /** I've answered the claim (shown at once, before the server). */
  answered?: "pass" | "challenge" | "block";
};

export function CoupBoard({ state, mySeat, players, busy, finished, sessionId, onMove, stage }: GameBoardProps<CoupState>) {
  const { t } = useTranslation();
  const step = `${state.phase}:${state.turn}:${state.log.length}`;
  const [pick, setPick] = useState<Pick>({ step });
  const current: Pick = pick.step === step ? pick : { step };
  const choose = (next: Omit<Pick, "step">) => setPick({ ...current, ...next, step });

  const over = finished || state.phase === "finished";
  const task = over ? null : taskFor(state, mySeat);
  const me = state.players[mySeat];
  const [panel, setPanel] = useState<Panel | null>(null);

  const nameOf = useCallback(
    (seat: number) => (seat === mySeat ? t("game.you") : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`)),
    [players, mySeat, t],
  );
  // narrative lines name everyone by their username ("Lin works a Day
  // Job"), so the verbs agree; the stage's own labels say "You"
  const userOf = useCallback((seat: number) => players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`, [players]);
  const send = (move: Record<string, unknown>) => {
    moveHaptic();
    onMove(move);
  };

  // everyone at the table, as their mascot (a new array only when who's
  // there or how they look changes)
  const castKey = JSON.stringify(players.map((p) => [p.seat, p.username, p.mascot ?? null]));
  const people: Standing[] = useMemo(
    () =>
      [...players]
        .sort((a, b) => a.seat - b.seat)
        .filter((p) => p.seat < state.numPlayers)
        .map((p) => ({ seat: p.seat, name: p.seat === mySeat ? t("game.you") : p.username, look: asLook(p.mascot) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- castKey stands for players
    [castKey, mySeat, state.numPlayers, t],
  );
  const seats = people.map((p) => p.seat);
  // the table's cards and cash, a new object only when they change
  const tableKey = JSON.stringify(state.players);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tableKey stands for state.players
  const table = useMemo(() => state.players, [tableKey]);

  // ── the set pieces: my cards dealt, challenges settled, players out ──
  const pieces = useSetPieces(sessionId);
  const { ready, watched, mark } = pieces;
  useEffect(() => {
    if (ready && watched.shown === null) {
      // joining a game already under way: nothing from before replays
      mark({ shown: state.log.length, dealt: watched.dealt || state.log.length > 0 });
    }
  });
  const shown = watched.shown ?? state.log.length;
  const staged: Staged | null = useMemo(() => {
    if (!ready || watched.shown === null) return null;
    for (let at = shown; at < state.log.length; at++) {
      const event = state.log[at];
      if (event.t === "challenge" || (event.t === "out" && !over)) return { at, event } as Staged;
    }
    return null;
  }, [ready, watched.shown, shown, state.log, over]);
  const dealing = ready && watched.shown !== null && !watched.dealt && !over && me !== undefined && !staged;
  const goOn = () => {
    tapHaptic();
    if (staged) mark({ shown: staged.at + 1 });
  };

  // ── held moves: aiming an action, turning a card over, a challenge ──
  const hold = useSharedValue(0);
  const holdAlt = useSharedValue(0);
  const stream = useSharedValue(1);
  useEffect(() => {
    hold.set(0);
    holdAlt.set(0);
  }, [step, hold, holdAlt]);

  const action = current.action ?? null;
  const aiming = task === "action" && action !== null && specOf(action).needsTarget;
  const target = aiming ? (current.target ?? null) : null;
  const claim = claimOf(state);
  const responders = claimWindow(state) ? respondersOf(state) : [];
  const answered = current.answered ?? null;
  const answering = (task === "challengeAction" || task === "block" || task === "challengeBlock") && answered === null;
  const blockRoles = task === "block" && state.action ? specOf(state.action.type).blockers : [];
  const blockAs = current.block ?? blockRoles[0];
  const losing = state.losing ?? (state.phase === "loseInfluence" ? { seat: state.waitingOn[0] ?? -1, why: null } : null);

  // ── which moment is on the stage ──
  const scene = !ready
    ? "table"
    : staged
      ? staged.event.t === "challenge"
        ? `show-${staged.at}`
        : `out-${staged.at}`
      : dealing
        ? "deal"
        : over
          ? "ending"
          : task === "action"
            ? aiming
              ? "aim"
              : "felt"
            : claimWindow(state)
              ? `claim-${state.phase}-${turnCount(state)}`
              : task === "reveal"
                ? `lose-${state.log.length}`
                : task === "exchange"
                  ? "exchange"
                  : state.phase === "loseInfluence"
                    ? `doomed-${state.log.length}`
                    : "table";
  const kind = scene.split("-")[0];
  const paused = panel !== null;

  // ── lights on the stage ──
  const lightsOf = (fn: (seat: number) => Light) => Object.fromEntries(seats.map((s) => [s, fn(s)])) as Record<number, Light>;
  const out = (seat: number) => !state.players[seat]?.alive;

  const lineup = (props: {
    lights: Record<number, Light>;
    plates?: Record<number, Plate>;
    selectable?: number[];
    onPick?: (seat: number) => void;
    aim?: number | null;
    struck?: number | null;
    held?: boolean;
    bare?: boolean;
  }) => (
    <TableLineup
      people={people}
      table={table}
      lights={props.lights}
      plates={props.plates}
      crown={over ? state.winner : state.turn}
      selectable={props.selectable}
      onPick={props.onPick}
      hold={props.held ? stream : hold}
      aim={props.aim}
      struck={props.struck}
      bare={props.bare}
      paused={paused}
    />
  );

  const actionName = (type: ActionType) => t(`coup.actions.${type}.name`);
  const roleName = (role: Role) => t(`coup.roles.${role}.name`);
  const enabled = me ? ACTIONS.filter((a) => canTake(state, mySeat, a.type)).map((a) => a.type) : [];

  let centre: ReactNode = null;
  let hint: ReactNode = null;
  let bottom: ReactNode = null;

  const waitingLine = (
    <AppText style={stageText.strong} numberOfLines={2}>
      {state.waitingOn.length > 0
        ? `⏳  ${t("coup.prompt.waiting", { names: state.waitingOn.map(nameOf).join(", ") })}`
        : t("coup.stage.moving")}
    </AppText>
  );
  // the last few things that happened, for the hint over the plinth
  const recent = state.log.slice(-2).map((e) => describe(e, t, userOf));
  const recentLines = recent.map((line, i) => (
    <AppText key={i} style={[stageText.hint, i < recent.length - 1 && styles.faded]} numberOfLines={2}>
      {line}
    </AppText>
  ));

  if (kind === "show" && staged?.event.t === "challenge") {
    const e = staged.event;
    const loser = e.caught ? e.claimant : e.challenger;
    centre = (
      <Showdown
        title={t(e.challenger === mySeat ? "coup.show.titleMe" : "coup.show.title", { challenger: nameOf(e.challenger), claimant: nameOf(e.claimant), role: roleName(e.role) })}
        role={e.role}
        caught={e.caught}
        verdict={t(`coup.show.${e.caught ? "caught" : "proved"}${loser === mySeat ? "Me" : ""}`, {
          claimant: nameOf(e.claimant),
          loser: nameOf(loser),
          role: roleName(e.role),
        })}
        lineup={lineup({
          lights: lightsOf((s) => (s === loser ? "red" : s === e.challenger || s === e.claimant ? "lit" : "dim")),
          bare: true,
        })}
      />
    );
    bottom = <Button label={t("coup.stage.continue")} size="lg" style={styles.main} onPress={goOn} />;
  } else if (kind === "out" && staged?.event.t === "out") {
    const seat = staged.event.seat;
    centre = lineup({ lights: lightsOf((s) => (s === seat ? "red" : out(s) ? "dim" : "soft")), struck: seat });
    hint = (
      <>
        <AppText style={stageText.strong} numberOfLines={2}>
          {seat === mySeat ? t("coup.stage.youOut") : t("coup.stage.out", { name: nameOf(seat) })}
        </AppText>
        <AppText style={stageText.hint} numberOfLines={2}>
          {t("coup.stage.left", { count: aliveCount(state) })}
        </AppText>
      </>
    );
    bottom = <Button label={t("coup.stage.continue")} size="lg" style={styles.main} onPress={goOn} />;
  } else if (kind === "deal" && me) {
    const cards: RowCard[] = me.cards.flatMap((c, i) => (c.role ? [{ key: String(i), role: c.role, lost: c.revealed }] : []));
    centre = <CardRow cards={cards} dealt />;
    hint = (
      <>
        <AppText style={stageText.strong}>{t("coup.deal.title")}</AppText>
        <AppText style={stageText.hint} numberOfLines={3}>
          {t("coup.deal.hint")}
        </AppText>
      </>
    );
    bottom = (
      <Button
        label={t("coup.deal.go")}
        size="lg"
        style={styles.main}
        onPress={() => {
          tapHaptic();
          mark({ dealt: true });
        }}
      />
    );
  } else if (kind === "ending") {
    centre = <Ending state={state} mySeat={mySeat} people={people} nameOf={nameOf} afterGame={stage?.afterGame} paused={paused} />;
    bottom = stage?.onward ?? (
      <AppText style={stageText.strong}>{state.winner === mySeat ? t("game.youWin") : t("coup.result.none")}</AppText>
    );
  } else if (kind === "felt") {
    centre = (
      <Felt
        enabled={busy ? [] : enabled}
        picked={action}
        onPick={(type) => {
          hold.set(0);
          choose({ action: type, target: null });
        }}
      />
    );
    hint = (
      <AppText style={stageText.hint} numberOfLines={2}>
        {me && me.coins >= FORCED_COUP_AT ? t("coup.prompt.mustCoup") : t("coup.stage.feltHint")}
      </AppText>
    );
    bottom = action ? (
      <Button
        label={`${ACTION_EMOJI[action]} ${actionName(action)}`}
        size="lg"
        style={styles.main}
        loading={busy}
        onPress={() => send({ type: "action", action })}
      />
    ) : (
      <AppText style={stageText.strong}>{t("coup.stage.pickAction")}</AppText>
    );
  } else if (kind === "aim" && action) {
    const targets = targetsFor(state, mySeat);
    centre = lineup({
      lights: lightsOf((s) => (s === target ? "red" : s === mySeat ? "lit" : targets.includes(s) ? (target === null ? "lit" : "soft") : "dim")),
      selectable: busy ? [] : targets,
      onPick: (seat) => {
        hold.set(0);
        choose({ target: seat });
      },
      aim: target,
    });
    hint = (
      <>
        <AppText style={stageText.hint} numberOfLines={2}>
          {t(`coup.aim.${action}`)}
        </AppText>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => choose({ action: null, target: null })}>
          <AppText style={[stageText.hint, styles.link]}>{`↩  ${t("coup.aim.back")}`}</AppText>
        </Pressable>
      </>
    );
    bottom =
      target !== null ? (
        <HoldButton
          key={`${step}|${target}`}
          label={t(`coup.aim.hold.${action}`, { name: nameOf(target) })}
          tone="bad"
          progress={hold}
          disabled={busy}
          onDone={() => onMove({ type: "action", action, target })}
        />
      ) : (
        <AppText style={stageText.strong}>{t("coup.aim.pick")}</AppText>
      );
  } else if (kind === "claim" && claim && state.action) {
    const a = state.action;
    const blockPhase = state.phase === "block";
    const passed = [...state.passed, ...(answered === "pass" ? [mySeat] : [])];
    const role = claim.role;
    const headline = claim.block
      ? t("coup.claim.blocks", { role: roleName(claim.role!) })
      : role
        ? t("coup.claim.iam", { role: roleName(role) })
        : t(`coup.claim.plain.${a.type}`);
    const detail = claim.block
      ? a.actor === mySeat
        ? t("coup.claim.againstMe", { action: actionName(a.type) })
        : t("coup.claim.against", { name: nameOf(a.actor), action: actionName(a.type) })
      : `${ACTION_EMOJI[a.type]} ${actionName(a.type)} · ${t(`coup.felt.${a.type}`)}${a.target !== null ? ` · ${t("coup.claim.on", { name: nameOf(a.target) })}` : ""}`;
    const doneCount = passed.filter((s) => responders.includes(s)).length;
    centre = (
      <ClaimScene
        kicker={claim.seat === mySeat ? t("coup.claim.saysMe") : t("coup.claim.says", { name: nameOf(claim.seat) })}
        headline={headline}
        role={claim.block ? claim.role : role}
        detail={detail}
        done={doneCount}
        total={responders.length}
        progressLabel={t(blockPhase ? "coup.claim.progressBlock" : "coup.claim.progress", { done: doneCount, total: responders.length })}
        chips={
          answering && blockRoles.length > 1
            ? { roles: blockRoles, picked: blockAs, label: (r) => t("coup.claim.blockAs", { role: roleName(r) }), onPick: (r) => choose({ block: r }) }
            : undefined
        }
        hand={
          answering && me
            ? { label: t("coup.tools.hand"), roles: me.cards.flatMap((c) => (c.role && !c.revealed ? [c.role] : [])), name: roleName }
            : undefined
        }
        lineup={lineup({
          lights: lightsOf((s) =>
            s === claim.seat ? "lit" : !claim.block && s === a.target ? "red" : claim.block && s === a.actor ? "red" : out(s) ? "dim" : "soft",
          ),
          plates: Object.fromEntries(passed.map((s) => [s, "voted" as Plate])),
        })}
      />
    );
    hint = (
      <AppText style={stageText.hint} numberOfLines={2}>
        {answering
          ? t(blockPhase ? "coup.prompt.block" : "coup.prompt.challenge")
          : answered === "pass"
            ? t("coup.claim.youLet")
            : t(blockPhase ? "coup.claim.watchBlock" : "coup.claim.watch")}
      </AppText>
    );
    bottom = answering ? (
      <View style={styles.pair}>
        <View style={styles.half}>
          <Button
            label={t("coup.claim.letGo")}
            variant="secondary"
            size="lg"
            style={styles.main}
            disabled={busy}
            onPress={() => {
              choose({ answered: "pass" });
              send({ type: "pass" });
            }}
          />
        </View>
        <View style={styles.half}>
          {blockPhase ? (
            <HoldButton
              key={`${step}|${blockAs}`}
              label={t("coup.claim.holdBlock")}
              tone="plain"
              progress={holdAlt}
              disabled={busy}
              onDone={() => {
                choose({ answered: "block" });
                onMove({ type: "block", role: blockAs });
              }}
            />
          ) : (
            <HoldButton
              key={step}
              label={t("coup.claim.holdChallenge")}
              tone="bad"
              progress={holdAlt}
              disabled={busy}
              onDone={() => {
                choose({ answered: "challenge" });
                onMove({ type: "challenge" });
              }}
            />
          )}
        </View>
      </View>
    ) : (
      waitingLine
    );
  } else if (kind === "lose" && me) {
    const picked = current.card ?? null;
    const cards: RowCard[] = me.cards.flatMap((c, i) =>
      c.role
        ? [
            {
              key: String(i),
              role: c.role,
              lost: c.revealed,
              mark: i === picked ? ("doom" as const) : ("none" as const),
              tag: i === picked ? t("coup.lose.tag") : undefined,
            },
          ]
        : [],
    );
    centre = (
      <CardRow
        cards={cards}
        onPress={(key) => {
          hold.set(0);
          choose({ card: Number(key) });
        }}
      />
    );
    hint = (
      <>
        <AppText style={stageText.strong} numberOfLines={2}>
          {loseWhy(state, losing?.why ?? null, userOf, t)}
        </AppText>
        <AppText style={stageText.hint} numberOfLines={2}>
          {t("coup.lose.hint")}
        </AppText>
      </>
    );
    const role = picked !== null ? me.cards[picked]?.role : null;
    bottom =
      picked !== null && role ? (
        <HoldButton
          key={`${step}|${picked}`}
          label={t("coup.lose.hold", { role: roleName(role) })}
          tone="bad"
          progress={hold}
          disabled={busy}
          onDone={() => onMove({ type: "reveal", card: picked })}
        />
      ) : (
        <AppText style={stageText.strong}>{t("coup.prompt.reveal")}</AppText>
      );
  } else if (kind === "exchange" && state.exchange && me) {
    const need = handOf(state, mySeat).length;
    const keep = current.keep ?? [];
    const mine = handOf(state, mySeat).length;
    const cards: RowCard[] = state.exchange.map((role, i) => ({
      key: String(i),
      role,
      mark: keep.includes(i) ? "keep" : "none",
      tag: keep.includes(i) ? t("coup.swap.keep") : i >= mine ? t("coup.swap.new") : undefined,
    }));
    centre = <CardRow cards={cards} maxWidth={120} onPress={(key) => choose({ keep: toggleKeep(keep, Number(key), need) })} />;
    hint = (
      <AppText style={stageText.hint} numberOfLines={2}>
        {t("coup.prompt.exchange", { count: need })}
      </AppText>
    );
    bottom = (
      <Button
        label={`${t("coup.keep")} (${keep.length}/${need})`}
        size="lg"
        style={styles.main}
        disabled={keep.length !== need}
        loading={busy}
        onPress={() => send({ type: "exchange", keep })}
      />
    );
  } else if (kind === "doomed" && losing) {
    const a = state.action;
    const blow = losing.why === "coup" || losing.why === "assassinate";
    centre = lineup({
      lights: lightsOf((s) => (s === losing.seat ? "red" : blow && a && s === a.actor ? "lit" : out(s) ? "dim" : "soft")),
      aim: blow ? losing.seat : null,
      held: true,
    });
    hint = (
      <AppText style={stageText.hint} numberOfLines={2}>
        {loseWhy(state, losing.why, userOf, t)}
      </AppText>
    );
    bottom = (
      <AppText style={stageText.strong} numberOfLines={2}>
        {t("coup.prompt.losing", { name: userOf(losing.seat) })}
      </AppText>
    );
  } else {
    // the table: whose turn it is under the brightest lamp
    const acting = state.phase === "exchange" && state.action ? state.action.actor : state.turn;
    centre = lineup({ lights: lightsOf((s) => (out(s) ? "dim" : s === acting ? "lit" : "soft")) });
    hint = recentLines;
    bottom =
      state.phase === "exchange" ? (
        <AppText style={stageText.strong} numberOfLines={2}>
          {t("coup.stage.swapping", { name: userOf(acting) })}
        </AppText>
      ) : (
        <AppText style={stageText.strong} numberOfLines={2}>
          {t("game.turn", { name: nameOf(state.turn) })}
        </AppText>
      );
  }

  if (stage?.error && !over) {
    hint = (
      <>
        {hint}
        <AppText style={[stageText.hint, styles.error]} numberOfLines={2}>
          {stage.error}
        </AppText>
      </>
    );
  }

  // ── the header: whose turn, how many still in, everyone's tile ──
  // It never runs ahead of the stage: while a challenge or a player out
  // is still to be shown here, the cards lost and the players out since
  // (and a game won by it) are left off until that moment has played
  const cut = staged ? staged.at : state.log.length;
  const unseenLost: Record<number, number> = {};
  let unseenOut = 0;
  for (let at = cut; at < state.log.length; at++) {
    const event = state.log[at];
    if (event.t === "lose") unseenLost[event.seat] = (unseenLost[event.seat] ?? 0) + 1;
    if (event.t === "out") unseenOut++;
  }
  const goneSeat = staged?.event.t === "out" ? staged.event.seat : null;
  const overShown = over && !staged;
  // a game ended by the moment still to be shown: still the turn it
  // happened in
  let turnShown = state.turn;
  if (over && staged) {
    for (let at = cut - 1; at >= 0; at--) {
      const event = state.log[at];
      if (event.t === "action") {
        turnShown = event.actor;
        break;
      }
    }
  }
  const tiles: DenTile[] = people.map((p) => {
    const hidden = (state.players[p.seat]?.cards.filter((c) => !c.revealed).length ?? 0) + (unseenLost[p.seat] ?? 0);
    return {
      seat: p.seat,
      name: p.name,
      hidden: p.seat === goneSeat ? Math.max(1, hidden) : hidden,
      coins: state.players[p.seat]?.coins ?? 0,
    };
  });
  const title = overShown
    ? state.winner !== null
      ? state.winner === mySeat
        ? t("coup.end.youWin")
        : t("coup.den.won", { name: shortName(nameOf(state.winner)) })
      : t("coup.result.none")
    : turnShown === mySeat
      ? t("coup.den.yourTurn")
      : t("coup.den.turn", { name: shortName(nameOf(turnShown)) });
  const subtitle = t("coup.den.subtitle", {
    n: Math.max(1, turnCount(state)),
    left: aliveCount(state) + unseenOut,
    total: state.numPlayers,
  });

  const tools = (
    <>
      <HandTool label={t("coup.tools.hand")} roles={me?.cards ?? []} onPress={() => setPanel("hand")} />
      <ToolButton emoji="📜" label={t("coup.tools.record")} onPress={() => setPanel("record")} />
      <ToolButton emoji="🎭" label={t("coup.tools.roles")} onPress={() => setPanel("roles")} />
    </>
  );
  const away = kind === "show" || kind === "out" || kind === "ending" || kind === "deal";
  const sideTools = !away;

  // until this device's memory of what it has watched is read, nothing is
  // shown: a reload in the middle of a moment mustn't flash its outcome
  if (!ready) return <View style={styles.wait} />;

  return (
    <DenStage
      title={title}
      subtitle={subtitle}
      tiles={tiles}
      turn={overShown ? state.winner : turnShown}
      under={
        !over && me ? (
          <>
            <DenTag label={t("coup.tags.purse")} value={`$${me.coins}`} />
            <DenTag label={t("coup.tags.deck")} value={String(state.deckCount)} color="#C8E8D8" />
          </>
        ) : undefined
      }
      sceneKey={scene}
      centre={<View style={[StyleSheet.absoluteFill, sideTools && styles.besideTools]}>{centre}</View>}
      tools={over ? undefined : tools}
      away={away}
      bleed={kind === "ending"}
      hint={hint}
      bottom={bottom}
      onBack={stage?.onBack}
      onRules={stage?.onRules}
      paused={paused}
      overlays={
        <Popup
          look={DEN_POPUP}
          visible={panel !== null}
          title={panel ? t(`coup.tools.${panel}`) : ""}
          onClose={() => setPanel(null)}
        >
          {panel === "hand" ? (
            <HandPanel state={state} mySeat={mySeat} />
          ) : panel === "record" ? (
            <Journal pages={hustlePages(state.log.slice(0, cut), mySeat, t, userOf)} emptyText={t("coup.journal.empty")} />
          ) : panel === "roles" ? (
            <RolesPanel />
          ) : null}
        </Popup>
      }
    />
  );
}

/** Why someone is turning a card over, in a line. */
function loseWhy(
  state: CoupState,
  why: string | null,
  nameOf: (seat: number) => string,
  t: (k: string, o?: Record<string, unknown>) => string,
) {
  const seat = state.losing?.seat ?? state.waitingOn[0] ?? -1;
  const actor = state.action ? nameOf(state.action.actor) : "";
  if (why === "coup") return t("coup.lose.coup", { name: nameOf(seat), actor });
  if (why === "assassinate") return t("coup.lose.assassinate", { name: nameOf(seat), actor });
  return t("coup.lose.challenge", { name: nameOf(seat) });
}

/** The top tool: my two cards, small and fanned; tap to see them large. */
function HandTool({ label, roles, onPress }: { label: string; roles: CoupState["players"][number]["cards"]; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.handTool, pressed && styles.pressed]}
    >
      <View style={styles.fan}>
        {roles.map((card, i) =>
          card.role ? (
            <View key={i} style={[styles.fanCard, { left: i * 15, transform: [{ rotate: `${i ? 9 : -9}deg` }] }, card.revealed && styles.fanLost]}>
              <RoleCard role={card.role} width={26} />
            </View>
          ) : null,
        )}
      </View>
      <AppText style={styles.toolLabel} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** My cards, large, with what each does. */
function HandPanel({ state, mySeat }: { state: CoupState; mySeat: number }) {
  const { t } = useTranslation();
  const me = state.players[mySeat];
  if (!me) return null;
  return (
    <View style={styles.panelGap}>
      <View style={styles.handRow}>
        {me.cards.map((card, i) => (card.role ? <RoleCard key={i} role={card.role} width={138} lost={card.revealed} /> : null))}
      </View>
      <AppText variant="caption" color="textMuted" align="center">
        {t("coup.hand.secret")}
      </AppText>
    </View>
  );
}

/** Every role at a glance, and the actions anyone may take. */
function RolesPanel() {
  const { t } = useTranslation();
  return (
    <View style={styles.panelGap}>
      <View style={styles.rolesGrid}>
        {ROLES.map((role) => (
          <RoleCard key={role} role={role} width={128} />
        ))}
      </View>
      {ACTIONS.filter((a) => a.claim === null).map((a) => (
        <AppText key={a.type} variant="caption">
          {`${ACTION_EMOJI[a.type]} ${t(`coup.actions.${a.type}.name`)} — ${t(`rules.coup.effects.${a.type}`)}${
            a.blockers.length ? ` (${t("coup.cardText.blockedBy", { role: a.blockers.map((r) => t(`coup.roles.${r}.name`)).join(", ") })})` : ""
          }`}
        </AppText>
      ))}
      <AppText variant="caption" color="textMuted">{`${ROLE_EMOJI.duke} ${t("coup.prompt.forced")}`}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wait: { flex: 1, backgroundColor: "#1A0C0E" },
  main: { alignSelf: "stretch" },
  pair: { flexDirection: "row", gap: 10, alignSelf: "stretch", alignItems: "center" },
  half: { flex: 1 },
  besideTools: { right: 60 },
  faded: { opacity: 0.7 },
  link: { color: "#FFD27A", fontFamily: fontFamily.semiBold },
  error: { color: "#FF8A80" },
  handTool: { alignItems: "center", width: 62, gap: 1 },
  pressed: { opacity: 0.6, transform: [{ scale: 0.94 }] },
  fan: { width: 44, height: 40, marginBottom: 1 },
  fanCard: { position: "absolute", top: 2 },
  fanLost: { opacity: 0.4 },
  toolLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: "#F1E6D2",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  panelGap: { gap: 12 },
  handRow: { flexDirection: "row", gap: 12, justifyContent: "center" },
  rolesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
});
