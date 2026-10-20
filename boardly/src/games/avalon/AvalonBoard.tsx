// Double Agent on the stage (layout "stage"), after Seal the Manor: the
// agency's case-file header across the top, every moment its own scene
// filling the middle behind the red curtain, and the dock on the plinth:
// my role card in my hand at its left (tap: it flies up and turns over),
// the record and the agents in the satchel at its right, one hint line on
// its crest (the rest behind ⓘ), the main move between them.
//
//   the deal     — the role card, face down, turned over and dealt into
//                  my hand
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
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { Popup, type PopupLook } from "@/features/game/Popup";
import { useStageSize, type StageDock, type StageHint, type StageTool } from "@/features/game/stage/GameStage";
import { shortName } from "@/features/game/stage/PlayerName";
import { StageLineup, type Light, type Plate } from "@/features/game/stage/StageLineup";
import { asLook } from "@/features/mascot/dress";
import { useTheme } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps } from "../types";
import { Desk, REVEAL_FOOT, RevealTitle, revealDelay, type DeskView } from "./dossier/Desk";
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
import { AGENCY, AgencyStage, stageText } from "./stage/AgencyStage";
import { useSetPieces } from "./useSetPieces";
import { VoteButtons } from "./VoteButtons";

/** The agency's popups: a sea-green sign, emerald jewels. */
const AGENCY_POPUP: PopupLook = AGENCY.popup!;

/** The panels behind the tools in the satchel (my role card is in my
 *  hand, at the plinth's other end). */
const MENU = [
  { key: "record", emoji: "📜" },
  { key: "agents", emoji: "👥" },
] as const;
type Panel = (typeof MENU)[number]["key"];

/** What I've picked in the moment at hand. */
type Pick = { step: string; team?: number[]; stamp?: StampKind; target?: number | null };

export function AvalonBoard({ state, mySeat, players, busy, finished, sessionId, onMove, stage }: GameBoardProps<AvalonState>) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { width: stageWidth } = useStageSize();

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
  // the card in my hand, where the dealt role card is put away; bumped
  // when it lands there, once the deal's screen has faded (a card drawn
  // while it fades isn't painted)
  const roleButton = useRef<View>(null);
  const [landed, setLanded] = useState(0);
  const landing = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (landing.current) clearTimeout(landing.current);
    },
    [],
  );

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
  // an operation's file in the header closes only once its reveal has
  // been watched here, its seal coming down as the stage moves on
  const [stamp, setStamp] = useState<{ index: number; n: number } | null>(null);
  const markReveal = () => {
    tapHaptic();
    if (voteToShow) pieces.mark({ votes: state.history.length });
    else {
      pieces.mark({ missions: results });
      setStamp({ index: results - 1, n: results });
    }
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

  // the header and the tags never run ahead of the stage: they show the
  // table as this device has seen it, so a vote or an operation still to
  // be revealed (or being revealed, or finishing while my own stamp is
  // still coming down) is left out until its reveal has been watched
  const seenVotes = Math.min(state.history.length, pieces.watched.votes ?? state.history.length);
  const seenMissions = Math.min(results, pieces.watched.missions ?? results);
  // the record, likewise, holds what has been revealed here
  const seen: AvalonState =
    seenVotes < state.history.length || seenMissions < results
      ? { ...state, history: state.history.slice(0, seenVotes), questResults: state.questResults.slice(0, seenMissions) }
      : state;
  let shown = state;
  if (seenVotes < state.history.length) {
    const vote = state.history[state.history.length - 1];
    let before = 0;
    for (let i = state.history.length - 2; i >= 0 && !state.history[i].approved; i--) before++;
    shown = {
      ...state,
      phase: "vote",
      quest: vote.quest,
      rejections: before,
      questResults: state.questResults.slice(0, seenMissions),
      winner: null,
    };
  } else if (seenMissions < results) {
    shown = {
      ...state,
      phase: "quest",
      quest: seenMissions,
      rejections: 0,
      questResults: state.questResults.slice(0, seenMissions),
      winner: null,
    };
  }

  const showing = !pieces.ready || dealing ? null : panel;
  // the dock's hand lifted, satchel open or hint opened: the scene rests
  const [docked, setDocked] = useState(false);
  const paused = showing !== null || dealing || docked;
  // a red dot on the satchel (and the record) for votes and operations
  // revealed since the record was last opened
  const recordNow = seen.history.length + seen.questResults.length;
  const [looked, setLooked] = useState(recordNow);
  const openPanel = (key: Panel) => {
    tapHaptic();
    setPanel(key);
    if (key === "record") setLooked(recordNow);
  };

  // ── the plaque's second line: the phase, and the teams turned down
  const subtitle = [
    t(`avalon.phases.${shown.phase}`),
    shown.phase !== "finished" && shown.rejections > 0
      ? t("avalon.stage.rejections", { count: shown.rejections, max: MAX_REJECTIONS })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const leader = nameOf(state.leader);
  // ── the one line on the plinth's crest: the sentence that matters now;
  // the rest of what the moment has to say behind its info stud
  const lastChance = state.rejections === MAX_REJECTIONS - 1;
  const twoFails = (state.failsRequired[state.quest] ?? 1) > 1;
  const hintOf = (): StageHint | null => {
    if (revealing) return null;
    if (council && state.phase === "team") {
      const warn = lastChance ? [t("avalon.council.lastChance")] : [];
      return task === "propose"
        ? {
            line: `👑  ${t("avalon.lip.pick", { count: teamSize(state), n: state.quest + 1 })}`,
            more: [t("avalon.lip.pickSeen"), ...warn],
          }
        : {
            // the plinth says who is picking; the crest what to watch
            line: t("avalon.lip.watch"),
            more: [`👑  ${t("avalon.council.picking", { name: leader, count: teamSize(state) })}`, ...warn],
          };
    }
    if (council) {
      // who put this team forward, and who is on it
      const proposed = `👑  ${t("avalon.vote.title", { name: leader })}`;
      const teamLine = t("avalon.lip.team", { names: names.namesOf(state.team) });
      if (iVoted) return { line: teamLine, more: [proposed] };
      return lastChance
        ? { line: t("avalon.council.lastChance"), tone: "#FF8A94", more: [t("avalon.lip.vote"), proposed, teamLine] }
        : { line: t("avalon.lip.vote"), more: [proposed, teamLine] };
    }
    if (desk?.kind === "choose") {
      const stakes = twoFails ? [t("avalon.lip.twoFails")] : [];
      return evil
        ? { line: t("avalon.lip.missionEvil"), more: [t("avalon.desk.molesHint"), ...stakes] }
        : { line: t("avalon.desk.agentsOnly"), more: stakes };
    }
    if (desk?.kind === "gather") {
      return {
        line: t("avalon.desk.played", { done: state.questPlayed.length, total: state.team.length }),
        more: twoFails ? [t("avalon.lip.twoFails")] : [],
      };
    }
    if (lineup) {
      return task === "assassinate"
        ? { line: `🎯  ${t("avalon.assassinate.pick")}`, more: [t("avalon.shot.hint"), t("avalon.assassinate.explain")] }
        : { line: t("avalon.lip.shotWatch"), more: [t("avalon.assassinate.explain")] };
    }
    return null;
  };
  const lipFound = hintOf();
  const lipNow: StageHint | null = lipFound ? { title: t(`avalon.phases.${state.phase}`), ...lipFound } : null;
  // a move that didn't go through says so first, whatever the moment
  const lip: StageHint | null =
    stage?.error && !revealing
      ? {
          line: stage.error,
          tone: colors.danger,
          title: t(`avalon.phases.${state.phase}`),
          more: lipNow ? [lipNow.line, ...(lipNow.more ?? [])] : [],
        }
      : lipNow;

  // the result of a reveal, big, in the scene: over the lamps' beams for
  // a vote, under the file for an operation
  const revealTitle =
    revealing && voteToShow ? (
      <View style={[styles.revealAt, styles.revealHigh]} pointerEvents="none">
        <RevealTitle
          title={t(voteToShow.approved ? "avalon.reveal.approved" : "avalon.reveal.rejected")}
          detail={t("avalon.council.tally", {
            yes: voteToShow.votes.filter(Boolean).length,
            no: voteToShow.votes.filter((v) => !v).length,
          })}
          good={voteToShow.approved}
        />
      </View>
    ) : revealing && missionToShow ? (
      <View style={[styles.revealAt, styles.revealLow]} pointerEvents="none">
        <RevealTitle
          title={t(missionToShow.success ? "avalon.reveal.questSuccess" : "avalon.reveal.questFail")}
          detail={
            missionToShow.fails > 0 ? t("avalon.reveal.failCards", { count: missionToShow.fails }) : t("avalon.desk.noFails")
          }
          good={missionToShow.success}
          delay={revealDelay(missionToShow.team.length)}
        />
      </View>
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
          label={t(picked === "approve" ? "avalon.lip.approveIt" : "avalon.lip.sealIt")}
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
        <AppText style={stageText.strong} numberOfLines={1}>{`🎯  ${shortName(nameOf(struck), 18)}`}</AppText>
      ) : target !== null ? (
        <HoldButton
          key={`${step}|${target}`}
          label={t("avalon.lip.nameIt", { name: shortName(nameOf(target)) })}
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

  const tools: StageTool[] = MENU.map(({ key, emoji }) => ({
    key,
    emoji,
    label: t(`avalon.menu.${key}`),
    badge: key === "record" && recordNow > looked,
    onPress: () => openPanel(key),
  }));

  // the dock on the plinth: my role card in my hand (its back showing
  // until I lift it), the tools in the satchel, the hint on the crest
  const liftedW = Math.min(300, stageWidth - 80);
  const dock: StageDock = {
    hand:
      state.myRole && !over
        ? {
            label: t("avalon.menu.role"),
            // while the card is being dealt the hand is empty: it lands there
            back: (width) =>
              dealing || landed < 0 ? <View style={{ width, height: width * 1.4 }} /> : <RoleCardBack width={width} />,
            pulse: landed,
            face: <RoleCardFace state={state} width={liftedW} namesOf={names.namesOf} />,
            faceSize: { width: liftedW, height: liftedW * 1.4 },
          }
        : undefined,
    satchel: { tools },
    hint: lip,
    onOpen: setDocked,
  };

  const ending = over && !revealing && !stamping;
  const centre = ending ? (
    <Ending state={state} mySeat={mySeat} nameOf={nameOf} afterGame={stage?.afterGame} paused={showing !== null || docked} />
  ) : desk ? (
    <View style={StyleSheet.absoluteFill}>
      <Desk view={desk} hold={hold} paused={paused} />
      {revealTitle}
    </View>
  ) : council ? (
    <View style={StyleSheet.absoluteFill}>
      <StageLineup
        people={allSeats.map((seat) => ({ seat, name: nameOf(seat), look: lookOf(seat) }))}
        lights={councilLights}
        plates={councilPlates}
        crown={revealing && voteToShow ? voteToShow.leader : state.leader}
        selectable={task === "propose" && !revealing ? (draft.length >= teamSize(state) ? draft : allSeats) : []}
        onPick={pickTeam}
        paused={paused}
      />
      {revealTitle}
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

  // until this device's memory of what it has watched is read, nothing is
  // shown: a reload in the middle of a reveal mustn't flash its result
  if (!pieces.ready) return <View style={styles.wait} />;

  return (
    <AgencyStage
      state={shown}
      subtitle={subtitle}
      sceneKey={sceneKey}
      centre={centre}
      dock={dock}
      handRef={roleButton}
      away={desk?.kind === "reveal" || lineup || ending}
      bleed={ending}
      stamp={stamp}
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
              onLand={() => {
                setLanded(-1);
                landing.current = setTimeout(() => setLanded(1), 450);
              }}
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
            {showing === "record" ? (
              <View style={{ gap: spacing.sm }}>
                <Record state={seen} names={names} />
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
  revealAt: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  revealHigh: { top: "26%" },
  revealLow: { bottom: (REVEAL_FOOT - 47) / 2 },
  wait: { flex: 1, backgroundColor: "#0D181C" },
});
