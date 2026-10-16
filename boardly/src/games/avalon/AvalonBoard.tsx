// Double Agent on the stage (layout "stage"), after Seal the Manor: the
// agency's case-file header across the top, every moment its own scene
// in the middle behind the red curtain, the tools down the side, the
// main move on the plinth.
//
//   the deal     — the role card, face down, turned over and put away
//   the team     — everyone on the stage (StageLineup); the leader's
//                  picks step into the light as they're made, shown to
//                  the table at once (a quiet "pick" move)
//   the vote     — one tap on the plinth; a seal on each name plate as
//                  people vote, turned green or red at the reveal
//   the operation— the dossier on the desk and two stamps (dossier/):
//                  held to play; then the team's envelopes going in;
//                  then the cards turned over and the verdict stamped
//   the shot     — the Hitman holds to name the Handler on the lineup
//   the ending   — the verdict, every card face up, play again

import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { Popup, type PopupLook } from "@/features/game/Popup";
import { StageLineup, type Light, type Plate } from "@/features/game/stage/StageLineup";
import { ToolButton } from "@/features/game/stage/parts";
import { asLook } from "@/features/mascot/dress";
import { useTheme } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps } from "../types";
import { Desk, RevealTitle, revealDelay, type DeskView } from "./dossier/Desk";
import type { StampKind } from "./dossier/art";
import { Ending } from "./Ending";
import { HoldButton } from "./HoldButton";
import {
  MAX_REJECTIONS,
  assassinTargets,
  pendingAction,
  sideOf,
  teamSize,
  toggleSeat,
  type AvalonState,
} from "./logic";
import { Agents, Record, type Names } from "./Panels";
import { ROLE_CARD_W, RoleIntro } from "./RoleIntro";
import { RoleCardBack, RoleCardFace } from "./RoleCard";
import { AgencyStage, stageText } from "./stage/AgencyStage";
import { useSetPieces } from "./useSetPieces";
import { VoteButtons } from "./VoteButtons";

/** The agency's popups: a sea-green sign, emerald jewels. */
const AGENCY_POPUP: PopupLook = { enamel: ["#2E7A72", "#16403F", "#0A2224"], jewel: "emerald", glow: "#FFD58A" };

/** The panels behind the buttons beside the stage. */
const MENU = [
  { key: "role", emoji: "🎭" },
  { key: "record", emoji: "📜" },
  { key: "agents", emoji: "👥" },
] as const;
type Panel = (typeof MENU)[number]["key"];

/** What I've picked in the moment at hand. */
type Pick = { step: string; team?: number[]; stamp?: StampKind; target?: number | null };

export function AvalonBoard({ state, mySeat, players, busy, finished, sessionId, onMove, stage }: GameBoardProps<AvalonState>) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  // Tagged with the step so picks clear themselves when the game moves
  // on (a rejected team brings a new leader, hence the proposal count)
  const step = `${state.phase}:${state.quest}:${state.history.length}`;
  const [pick, setPick] = useState<Pick>({ step });
  const current: Pick = pick.step === step ? pick : { step };
  const choose = (next: Omit<Pick, "step">) => {
    tapHaptic();
    setPick({ ...current, ...next, step });
  };

  const over = finished || state.phase === "finished";
  const task = over ? null : pendingAction(state, mySeat);
  const [panel, setPanel] = useState<Panel | null>(null);

  const nameOf = (seat: number) =>
    seat === mySeat ? t("game.you") : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
  const names: Names = { nameOf, namesOf: (seats) => seats.map(nameOf).join(", ") };
  const lookOf = (seat: number) => asLook(players.find((p) => p.seat === seat)?.mascot);
  const allSeats = Array.from({ length: state.numPlayers }, (_, seat) => seat);

  // ── the set pieces: the deal, and each vote and operation revealed
  // once on this device. The first time the board opens it counts
  // what's already happened, so joining late doesn't replay the past.
  const pieces = useSetPieces(sessionId);
  const { ready: piecesReady, watched: seenPieces, mark: markPieces } = pieces;
  useEffect(() => {
    if (piecesReady && (seenPieces.votes === null || seenPieces.missions === null)) {
      markPieces({
        votes: seenPieces.votes ?? state.history.length,
        missions: seenPieces.missions ?? state.questResults.length,
      });
    }
  });
  const dealing =
    pieces.ready &&
    !pieces.watched.dealt &&
    !over &&
    state.myRole !== null &&
    state.quest === 0 &&
    state.history.length === 0 &&
    state.questResults.length === 0;
  const roleButton = useRef<View>(null);
  const [bump] = useState(() => new Animated.Value(0));

  // ── the operation: my stamp, held, then brought down
  const hold = useSharedValue(0);
  useEffect(() => {
    hold.set(0);
  }, [step, hold]);
  const [cast, setCast] = useState<{ n: number; side: StampKind } | null>(null);
  // a played card stays in sight a moment, the stamp coming down and the
  // mark settling, before the stage turns to the others
  const [lingering, setLingering] = useState(false);
  const linger = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (linger.current) clearTimeout(linger.current);
    },
    [],
  );
  const results = state.questResults.length;
  const myCast =
    cast && ((state.phase === "quest" && cast.n === results) || (lingering && cast.n === results - 1)) ? cast.side : null;
  const castIt = (side: StampKind) => {
    setCast({ n: results, side });
    setLingering(true);
    if (linger.current) clearTimeout(linger.current);
    linger.current = setTimeout(() => setLingering(false), 2600);
    onMove({ type: "quest", card: side === "approve" ? "success" : "fail" });
  };
  const stamping = myCast !== null && lingering;

  const voteToShow =
    pieces.ready && pieces.watched.votes !== null && state.history.length > pieces.watched.votes
      ? state.history[state.history.length - 1]
      : null;
  const missionToShow =
    !voteToShow && !stamping && pieces.ready && pieces.watched.missions !== null && results > pieces.watched.missions
      ? state.questResults[results - 1]
      : null;
  const revealing = (voteToShow !== null || missionToShow !== null) && !dealing;
  const markReveal = () => {
    tapHaptic();
    pieces.mark(voteToShow ? { votes: state.history.length } : { missions: results });
  };

  // ── the team and the vote: everyone on the stage
  const council = (revealing && voteToShow !== null) || (!over && !revealing && !stamping && (state.phase === "team" || state.phase === "vote"));
  const draft = task === "propose" ? (current.team ?? state.team) : state.team;
  const councilTeam = revealing && voteToShow ? voteToShow.team : draft;
  const councilLights: Record<number, Light> = Object.fromEntries(
    allSeats.map((seat) => [
      seat,
      revealing && voteToShow ? (voteToShow.votes[seat] ? "green" : "red") : councilTeam.includes(seat) ? "lit" : "soft",
    ]),
  );
  // my vote shows the moment I cast it, before the server has answered;
  // one that failed to send is taken back, so it can be cast again
  const [castVote0, setCastVote] = useState<{ step: string; approve: boolean } | null>(null);
  const castVote = castVote0?.step === step && !(stage?.error && !busy && !state.voted[mySeat]) ? castVote0 : null;
  const iVoted = state.phase === "vote" && (state.voted[mySeat] || castVote !== null);
  const councilPlates: Record<number, Plate> =
    revealing && voteToShow
      ? Object.fromEntries(allSeats.map((seat) => [seat, voteToShow.votes[seat] ? "yes" : "no"]))
      : state.phase === "vote"
        ? Object.fromEntries(
            allSeats.filter((seat) => state.voted[seat] || (seat === mySeat && iVoted)).map((seat) => [seat, "voted"]),
          )
        : {};
  // the leader's picks light up at once; the table is told the latest of
  // them a moment later, in the background
  const pickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (pickTimer.current) clearTimeout(pickTimer.current);
    },
    [],
  );
  const pickTeam = (seat: number) => {
    const next = toggleSeat(draft, seat, teamSize(state));
    choose({ team: next });
    if (pickTimer.current) clearTimeout(pickTimer.current);
    pickTimer.current = setTimeout(() => onMove({ type: "pick", team: next }, { quiet: true }), 160);
  };

  // ── the Hitman's shot: everyone on the bare stage
  const [strike, setStrike] = useState<{ step: string; seat: number } | null>(null);
  const struck = strike?.step === step ? strike.seat : null;
  const lineup = !over && !revealing && !stamping && state.phase === "assassinate";
  const target = current.target ?? null;
  const aimed = task === "assassinate" ? target : null;
  const candidates = assassinTargets(state);
  const evilSeats = state.evilSeats ?? [];
  const lineupLights: Record<number, Light> = Object.fromEntries(
    allSeats.map((seat) => [
      seat,
      seat === (struck ?? aimed)
        ? "red"
        : evilSeats.includes(seat)
          ? "dim"
          : struck !== null || aimed !== null
            ? "soft"
            : "lit",
    ]),
  );
  const strikeIt = (seat: number) => {
    setStrike({ step, seat });
    // the shot lands before the game moves on
    if (linger.current) clearTimeout(linger.current);
    linger.current = setTimeout(() => onMove({ type: "assassinate", target: seat }), 1300);
  };

  // ── the desk
  const evil = state.myRole !== null && sideOf(state.myRole) === "evil";
  const picked: StampKind | null = current.stamp ?? (task === "quest" && !evil ? "approve" : null);
  let desk: DeskView | null = null;
  if (revealing && missionToShow) {
    desk = {
      kind: "reveal",
      key: `op-${results}`,
      success: missionToShow.success,
      fails: missionToShow.fails,
      total: missionToShow.team.length,
      mark: t("avalon.desk.accomplished"),
    };
  } else if (stamping || (!over && !council && task === "quest")) {
    desk = {
      kind: "choose",
      labels: { approve: t("avalon.desk.approve"), seal: t("avalon.desk.seal") },
      marks: { approve: t("avalon.desk.approved"), seal: "" },
      locked: evil ? null : "seal",
      picked: stamping ? myCast : picked,
      cast: myCast,
      onPick: (kind) => {
        hold.set(0);
        choose({ stamp: kind });
      },
    };
  } else if (!over && !council && state.phase === "quest") {
    desk = {
      kind: "gather",
      band: t("avalon.desk.band"),
      seats: state.team.map((seat) => ({ seat, name: nameOf(seat), done: state.questPlayed.includes(seat) })),
    };
  }

  // the header and the tags never run ahead of the stage: while a vote
  // or an operation is still being revealed they show the table as it
  // stood before it
  let shown = state;
  if (revealing && missionToShow) {
    shown = { ...state, phase: "quest", quest: results - 1, questResults: state.questResults.slice(0, -1), winner: null };
  } else if (revealing && voteToShow) {
    let before = 0;
    for (let i = state.history.length - 2; i >= 0 && !state.history[i].approved; i--) before++;
    shown = { ...state, phase: "vote", quest: voteToShow.quest, rejections: before, winner: null };
  }

  const showing = !pieces.ready || dealing ? null : panel;
  const paused = showing !== null || dealing;
  const openPanel = (key: Panel) => {
    tapHaptic();
    setPanel(key);
  };

  // ── the lines over the plinth
  const subtitle = [
    t(`avalon.phases.${shown.phase}`),
    shown.phase !== "finished" && shown.rejections > 0
      ? t("avalon.stage.rejections", { count: shown.rejections, max: MAX_REJECTIONS })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const leader = nameOf(state.leader);
  const voteTitle = voteToShow
    ? {
        title: t(voteToShow.approved ? "avalon.reveal.approved" : "avalon.reveal.rejected"),
        detail: t("avalon.council.tally", {
          yes: voteToShow.votes.filter(Boolean).length,
          no: voteToShow.votes.filter((v) => !v).length,
        }),
      }
    : null;
  const hint =
    council && revealing && voteTitle && voteToShow ? (
      <RevealTitle title={voteTitle.title} detail={voteTitle.detail} good={voteToShow.approved} />
    ) : council && state.phase === "team" ? (
      <AppText style={stageText.hint} numberOfLines={3}>
        {task === "propose"
          ? `👑  ${t("avalon.council.pickHint", { count: teamSize(state), n: state.quest + 1 })}`
          : `👑  ${t("avalon.council.picking", { name: leader, count: teamSize(state) })}`}
      </AppText>
    ) : council ? (
      <AppText style={stageText.hint} numberOfLines={3}>
        {t("avalon.council.voteHint", { name: leader, names: names.namesOf(state.team) })}
        {state.rejections === MAX_REJECTIONS - 1 ? `\n${t("avalon.council.lastChance")}` : ""}
      </AppText>
    ) : desk?.kind === "reveal" && missionToShow ? (
      <RevealTitle
        title={t(missionToShow.success ? "avalon.reveal.questSuccess" : "avalon.reveal.questFail")}
        detail={
          missionToShow.fails > 0 ? t("avalon.reveal.failCards", { count: missionToShow.fails }) : t("avalon.desk.noFails")
        }
        good={missionToShow.success}
        delay={revealDelay(missionToShow.team.length)}
      />
    ) : desk?.kind === "choose" ? (
      <AppText style={stageText.hint} numberOfLines={2}>
        {t(evil ? "avalon.desk.molesHint" : "avalon.desk.agentsOnly")}
      </AppText>
    ) : desk?.kind === "gather" ? (
      <AppText style={stageText.strong}>
        {t("avalon.desk.played", { done: state.questPlayed.length, total: state.team.length })}
      </AppText>
    ) : lineup ? (
      <AppText style={stageText.hint} numberOfLines={3}>
        {task === "assassinate" ? t("avalon.shot.hint") : t("avalon.assassinate.explain")}
      </AppText>
    ) : stage?.error ? (
      <AppText style={[stageText.hint, { color: colors.danger }]} numberOfLines={2}>
        {stage.error}
      </AppText>
    ) : null;

  // ── the move on the plinth
  const myEnd = state.roles?.[mySeat];
  const bottom =
    revealing && (council || desk?.kind === "reveal") ? (
      <Button label={t("avalon.stage.continue")} size="lg" style={styles.main} onPress={markReveal} />
    ) : council && task === "propose" ? (
      <Button
        label={t("avalon.team.propose", { picked: draft.length, count: teamSize(state) })}
        size="lg"
        style={styles.main}
        disabled={draft.length !== teamSize(state)}
        loading={busy}
        onPress={() => {
          if (pickTimer.current) clearTimeout(pickTimer.current);
          moveHaptic();
          onMove({ type: "propose", team: draft });
        }}
      />
    ) : council && task === "vote" && castVote ? (
      <AppText style={stageText.strong}>{t(castVote.approve ? "avalon.vote.youApproved" : "avalon.vote.youRejected")}</AppText>
    ) : council && task === "vote" ? (
      <VoteButtons
        approve={t("avalon.vote.approve")}
        reject={t("avalon.vote.reject")}
        disabled={busy}
        onVote={(approve) => {
          setCastVote({ step, approve });
          onMove({ type: "vote", approve });
        }}
      />
    ) : council && state.phase === "vote" ? (
      <AppText style={stageText.strong} numberOfLines={2}>
        {`${state.myVote !== null ? `${t(state.myVote ? "avalon.vote.youApproved" : "avalon.vote.youRejected")} · ` : ""}${t(
          "avalon.vote.waiting",
          { done: state.voted.filter(Boolean).length, total: state.numPlayers },
        )}`}
      </AppText>
    ) : council ? (
      <AppText style={stageText.strong} numberOfLines={2}>
        {t("avalon.team.waiting", { name: leader, count: teamSize(state) })}
      </AppText>
    ) : desk?.kind === "choose" && myCast !== null ? (
      <AppText style={stageText.strong}>{t("avalon.desk.cast")}</AppText>
    ) : desk?.kind === "choose" ? (
      picked ? (
        <HoldButton
          key={`${step}|${picked}`}
          label={t(picked === "approve" ? "avalon.desk.holdApprove" : "avalon.desk.holdSeal")}
          tone={picked === "approve" ? "good" : "bad"}
          progress={hold}
          disabled={busy}
          onDone={() => castIt(picked)}
        />
      ) : (
        <AppText style={stageText.strong}>{t("avalon.desk.pick")}</AppText>
      )
    ) : desk?.kind === "gather" ? (
      <AppText style={stageText.strong} numberOfLines={2}>
        {state.team.includes(mySeat) ? t("avalon.desk.cast") : t("avalon.quest.title", { quest: state.quest + 1 })}
      </AppText>
    ) : lineup && task === "assassinate" ? (
      struck !== null ? (
        <AppText style={stageText.strong}>{`🎯  ${nameOf(struck)}`}</AppText>
      ) : target !== null ? (
        <HoldButton
          key={`${step}|${target}`}
          label={t("avalon.shot.hold", { name: nameOf(target) })}
          tone="bad"
          progress={hold}
          disabled={busy}
          onDone={() => strikeIt(target)}
        />
      ) : (
        <AppText style={stageText.strong}>{t("avalon.shot.pick")}</AppText>
      )
    ) : lineup ? (
      <AppText style={stageText.strong} numberOfLines={2}>
        {t("avalon.assassinate.waiting", { name: nameOf(state.assassinSeat ?? -1) })}
      </AppText>
    ) : over && stage?.onward ? (
      stage.onward
    ) : over ? (
      <AppText style={stageText.strong}>
        {state.winner !== null && myEnd
          ? t(sideOf(myEnd) === state.winner ? "avalon.result.youWon" : "avalon.result.youLost")
          : t("avalon.result.none")}
      </AppText>
    ) : null;

  const tools = MENU.map(({ key, emoji }) => (
    <Animated.View
      key={key}
      ref={key === "role" ? roleButton : undefined}
      collapsable={false}
      style={
        key === "role"
          ? { transform: [{ scale: bump.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }] }
          : undefined
      }
    >
      <ToolButton emoji={emoji} label={t(`avalon.menu.${key}`)} onPress={() => openPanel(key)} />
    </Animated.View>
  ));

  const ending = over && !revealing && !stamping;
  const centre = ending ? (
    <Ending state={state} mySeat={mySeat} nameOf={nameOf} afterGame={stage?.afterGame} paused={showing !== null} />
  ) : desk ? (
    <View style={[StyleSheet.absoluteFill, desk.kind !== "reveal" && styles.besideTools]}>
      <Desk view={desk} hold={hold} paused={paused} />
    </View>
  ) : council ? (
    <View style={[StyleSheet.absoluteFill, styles.besideTools]}>
      <StageLineup
        people={allSeats.map((seat) => ({ seat, name: nameOf(seat), look: lookOf(seat) }))}
        lights={councilLights}
        plates={councilPlates}
        crown={revealing && voteToShow ? voteToShow.leader : state.leader}
        selectable={task === "propose" && !revealing ? (draft.length >= teamSize(state) ? draft : allSeats) : []}
        onPick={pickTeam}
        paused={paused}
      />
    </View>
  ) : lineup ? (
    <View style={StyleSheet.absoluteFill}>
      <StageLineup
        people={allSeats.map((seat) => ({ seat, name: nameOf(seat), look: lookOf(seat) }))}
        lights={lineupLights}
        selectable={task === "assassinate" && struck === null ? candidates : []}
        onPick={(seat) => {
          hold.set(0);
          choose({ target: seat });
        }}
        hold={hold}
        aim={aimed}
        struck={struck}
        paused={paused}
      />
    </View>
  ) : null;

  const sceneKey = desk
    ? desk.kind === "reveal"
      ? `reveal-${desk.key}`
      : desk.kind
    : council
      ? "council"
      : lineup
        ? "lineup"
        : ending
          ? "ending"
          : "empty";

  return (
    <AgencyStage
      state={shown}
      subtitle={subtitle}
      sceneKey={sceneKey}
      centre={centre}
      tools={ending ? undefined : tools}
      away={desk?.kind === "reveal" || lineup || ending}
      bleed={ending}
      hint={hint}
      bottom={bottom}
      onBack={stage?.onBack}
      onRules={stage?.onRules}
      paused={paused}
      overlays={
        <>
          {state.myRole ? (
            <RoleIntro
              visible={dealing}
              tone={evil ? "#F0605D" : "#5EE0A8"}
              target={roleButton}
              onLand={() =>
                Animated.sequence([
                  Animated.timing(bump, { toValue: 1, duration: 120, useNativeDriver: true }),
                  Animated.spring(bump, { toValue: 0, friction: 4, useNativeDriver: true }),
                ]).start()
              }
              onDone={() => pieces.mark({ dealt: true })}
              back={<RoleCardBack width={ROLE_CARD_W} />}
            >
              <RoleCardFace state={state} width={ROLE_CARD_W} namesOf={names.namesOf} />
            </RoleIntro>
          ) : null}
          <Popup
            look={AGENCY_POPUP}
            visible={showing !== null}
            title={showing ? t(`avalon.menu.${showing}`) : ""}
            onClose={() => setPanel(null)}
          >
            {showing === "role" ? (
              state.myRole ? (
                <View style={{ alignItems: "center" }}>
                  <RoleCardFace state={state} width={ROLE_CARD_W} namesOf={names.namesOf} />
                </View>
              ) : (
                <AppText variant="body" color="textMuted">
                  {t("common.emptyTitle")}
                </AppText>
              )
            ) : showing === "record" ? (
              <View style={{ gap: spacing.sm }}>
                <Record state={state} names={names} />
              </View>
            ) : showing === "agents" ? (
              <Agents state={state} mySeat={mySeat} players={players} names={names} />
            ) : null}
          </Popup>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  main: { alignSelf: "stretch" },
  besideTools: { right: 60 },
});
