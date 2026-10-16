import { useEffect, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card, TextField } from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { fontFamily, useTheme } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps, GamePlayer } from "../types";
import { ManorMap } from "./ManorMap";
import { Journal, type JournalPage, type JournalSection } from "@/features/game/Journal";
import { Popup, type PopupLook } from "@/features/game/Popup";
import { arrivalOf } from "./arrival";
import { LetterScene, RoleIntro, ROLE_CARD_W } from "./Immersion";
import { RoleCardBack, RoleCardFace } from "./RoleCardFace";
import { NightMap } from "./NightMap";
import { RoomScene, type ScenePerson } from "./RoomScene";
import { ManorStage, stageText } from "./ManorStage";
import { LastChance } from "./LastChance";
import { Ending } from "./ending/Ending";
import { HoldButton } from "./lantern/HoldButton";
import { LanternRite, RevealTitle, type RiteView, type Side } from "./lantern/LanternRite";
import { ToolButton } from "@/features/game/stage/parts";
import { asLook } from "@/features/mascot/dress";
// every text on the board draws the game's icons and colours room names
import { GameButton as Button, GameText as AppText } from "./GameText";
import { useMapNotes } from "./useMapNotes";
import { useSetPieces } from "./useSetPieces";
import {
  EVENT_EMOJI,
  HALL,
  ROOMS,
  ROOM_EMOJI,
  ROOM_NEEDS,
  assassinTargets,
  canDecoy,
  canTrack,
  decoyRooms,
  doorLabel,
  lettersFor,
  others,
  sideOf,
  taskFor,
  teamSize,
  toggleTeam,
  tonightsPatrol,
  waitingOn,
  type Note,
  type NightwatchState,
  type TimelineEntry,
} from "./logic";

/** The manor's popups: a night-blue sign, lantern-amber jewels. */
const MANOR_POPUP: PopupLook = { enamel: ["#3A4A7A", "#1E2A50", "#0E1430"], jewel: "amber", glow: "#FFB45E" };

/** The panels behind the buttons beside the room. */
const MENU = [
  { key: "map", emoji: "🗺️" },
  { key: "notebook", emoji: "📓" },
  { key: "record", emoji: "📜" },
  { key: "role", emoji: "🎭" },
  { key: "watchers", emoji: "👥" },
] as const;
type Panel = (typeof MENU)[number]["key"];

/** How much of the notebook and the public record has been shown to
 *  the player as it happened. */
type Seen = { log: number; history: number; results: number };

type T = (key: string, options?: Record<string, unknown>) => string;

type Names = {
  nameOf: (seat: number) => string;
  namesOf: (seats: number[]) => string;
  roomName: (room: number) => string;
};

/** What I've picked in the open prompt. */
type Pick = {
  step: string;
  lock?: number[] | null;
  room?: number;
  follow?: boolean;
  track?: number;
  decoy?: boolean;
  fake?: number;
  target?: number | null;
  letters?: string[];
  pray?: boolean;
  team?: number[];
  /** The lantern picked in a vote or a mission. */
  side?: Side;
};

export function NightwatchBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  sessionId,
  onMove,
  stage,
}: GameBoardProps<NightwatchState>) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  // Tagged with the step so picks clear themselves when the game moves
  // on (a rejected team brings a new leader, hence the proposal count)
  const step = `${state.phase}:${state.round}:${state.history.length}`;
  const [pick, setPick] = useState<Pick>({ step });
  const current: Pick = pick.step === step ? pick : { step };

  const over = finished || state.phase === "finished";
  const task = over ? null : taskFor(state, mySeat);
  const needsMe = task !== null;

  // One popup at a time, in this order: what just happened, a panel the
  // player opened, then the move the game is asking for.
  const [panel, setPanel] = useState<Panel | null>(null);
  const { notes, setNote } = useMapNotes(sessionId);

  // The game's set pieces come before any popup: the role card dealt at
  // the very start, and the anonymous letters when the talking begins.
  // Each plays once a game, even across a reload.
  const pieces = useSetPieces(sessionId);
  // The lanterns reveal each vote and mission once. The first time the
  // board opens it counts what's already happened, so joining late
  // doesn't replay the past.
  const { ready: piecesReady, watched: seenPieces, mark: markPieces } = pieces;
  useEffect(() => {
    if (piecesReady && (seenPieces.votes === null || seenPieces.missions === null)) {
      markPieces({
        votes: seenPieces.votes ?? state.history.length,
        missions: seenPieces.missions ?? state.results.length,
      });
    }
  });
  const roleButton = useRef<View>(null);
  const [bump] = useState(() => new Animated.Value(0));
  const dealing =
    pieces.ready &&
    !pieces.watched.dealt &&
    !over &&
    state.myRole !== null &&
    state.round === 0 &&
    state.phase === "announce" &&
    state.ready[mySeat] === false;
  const letters = lettersFor(state, state.round);

  // The Chapel's record lies on its lectern: it is read by opening the
  // book, and only then goes into the notebook.
  const [reading, setReading] = useState(false);
  const record = state.log.find(
    (note): note is Extract<Note, { kind: "chapelRecord" }> =>
      note.kind === "chapelRecord" && note.round === state.round
  );
  const book =
    !over && state.myRoom !== null && ROOMS[state.myRoom] === "chapel" && record ? record : null;
  const booksRead = pieces.watched.books;
  // Once a night's letters start arriving they are held here until the
  // player has read them all: the table moving on to the vote, or even
  // to the next night, must not take them off the screen.
  const [post, setPost] = useState<{ round: number; texts: string[] } | null>(null);
  if (
    pieces.ready &&
    !over &&
    letters.length > 0 &&
    pieces.watched.letters !== state.round &&
    post?.round !== state.round
  ) {
    setPost({ round: state.round, texts: letters });
  }
  const delivering = post !== null && !dealing;

  // Moved by the game (a patrol, a mission, a collapse), the player is
  // shown walking in, once, before anything else opens over the room.
  const arrival = over ? null : arrivalOf(state, mySeat);
  const voteToShow =
    pieces.ready && pieces.watched.votes !== null && state.history.length > pieces.watched.votes
      ? state.history[state.history.length - 1]
      : null;
  const missionToShow =
    !voteToShow && pieces.ready && pieces.watched.missions !== null && state.results.length > pieces.watched.missions
      ? state.results[state.results.length - 1]
      : null;
  const revealing = (voteToShow !== null || missionToShow !== null) && !dealing && !delivering;
  const walking =
    arrival !== null &&
    pieces.ready &&
    !dealing &&
    !delivering &&
    !revealing &&
    pieces.watched.walked !== arrival.key;
  // A prompt opens by itself, except the room's: that one waits for the
  // player to touch the thing in the room. Both are tagged with the step.
  const [putAway, setPutAway] = useState<string | null>(null);
  const [touched, setTouched] = useState<string | null>(null);
  const [seen, setSeen] = useState<Seen>(() => ({
    log: state.log.length,
    history: state.history.length,
    results: state.results.length,
  }));

  const nameOf = (seat: number) =>
    seat === mySeat
      ? t("game.you")
      : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
  const names: Names = {
    nameOf,
    namesOf: (seats) => seats.map(nameOf).join(", "),
    roomName: (room) => t(`nightwatch.rooms.${ROOMS[room]}`),
  };

  const choose = (next: Omit<Pick, "step">) => {
    tapHaptic();
    setPick({ ...current, ...next, step });
  };
  const send = (move: Record<string, unknown>) => {
    moveHaptic();
    onMove(move);
  };

  // Tapping the map picks the room (or the decoy's room, once the
  // real one is set and a decoy is wanted)
  const patrolling = task === "patrol" && !current.follow;
  const mapPick = (room: number) => {
    if (current.decoy && current.room !== undefined && room !== current.room) {
      choose({ fake: room });
    } else {
      choose({ room, fake: current.fake === room ? undefined : current.fake });
    }
  };

  // The game moves me without my walking in two cases, and each is told
  // to me: a mission I'm sent on takes me to its room, where I stay for
  // the next night (a collapse, the other, is written in my notebook).
  const walked =
    state.phase === "mission" &&
    state.team.includes(mySeat) &&
    state.myRoom === state.missionRoom;
  const lastMission = state.results.find((result) => result.round === state.round - 1);
  const stayed =
    (state.phase === "announce" || state.phase === "patrol") &&
    lastMission !== undefined &&
    lastMission.team.includes(mySeat) &&
    !lastMission.missing.includes(mySeat) &&
    state.myRoom === lastMission.room;

  // What happened since the player last looked, private notes first
  const news = manorPages(
    state,
    {
      // the Chapel's record is read from its book, not announced
      log: state.log.slice(seen.log).filter((note) => note.kind !== "chapelRecord"),
      history: state.history.slice(seen.history),
      results: state.results.slice(seen.results),
      timeline: [],
      // being sent on the mission walks me to its room: say so
      walked:
        walked && state.history.slice(seen.history).some((p) => p.approved && p.round === state.round)
          ? `🚶 ${t("nightwatch.where.onMission", { room: names.roomName(state.missionRoom) })}`
          : undefined,
    },
    names,
    t
  );
  const readNews = () =>
    setSeen({
      log: state.log.length,
      history: state.history.length,
      results: state.results.length,
    });

  // the vote and the mission are played on the stage, with the lanterns
  const onStage = task === "vote" || task === "mission" || task === "assassinate";
  const taskOpen = needsMe && !onStage && (task === "room" ? touched === step : putAway !== step);
  const showing: "news" | "panel" | "book" | "task" | null =
    !pieces.ready || dealing || delivering || walking || revealing
      ? null
      : news.length > 0
        ? "news"
        : panel
          ? "panel"
          : reading
            ? "book"
            : taskOpen
            ? "task"
            : null;
  const close = () => {
    if (showing === "news") readNews();
    else if (showing === "panel") setPanel(null);
    else if (showing === "book") setReading(false);
    else if (task === "room") setTouched(null);
    else setPutAway(step);
  };

  const room = state.myRoom;
  const patrol = tonightsPatrol(state);
  const company = [
    ...(walked && room !== null
      ? [`🚶 ${t("nightwatch.where.onMission", { room: names.roomName(room) })}`]
      : []),
    ...(stayed && room !== null
      ? [`🚶 ${t("nightwatch.where.afterMission", { room: names.roomName(room) })}`]
      : []),
    ...(!over && patrol && room === patrol.room ? patrolLines(patrol, names, t) : []),
  ];

  // Who stands in the room with me: everyone once the game is over,
  // until then the watchers I saw on tonight's patrol
  const here: ScenePerson[] = [{ key: "me", label: t("nightwatch.map.you"), kind: "me" }];
  if (over && state.positions) {
    state.positions.forEach((at, seat) => {
      if (at === room && seat !== mySeat) {
        here.push({ key: `seat-${seat}`, label: nameOf(seat), kind: "other" });
      }
    });
  } else if (patrol && room === patrol.room) {
    if (patrol.seen) {
      for (const seat of patrol.seen) {
        here.push({ key: `seat-${seat}`, label: nameOf(seat), kind: "other" });
      }
    } else if (patrol.company) {
      here.push({ key: "someone", label: "?", kind: "shadow" });
    }
  }

  // Everyone I can see stands as their own mascot; a stranger in the
  // dark ("someone") stays a shadow
  const lookOf = (seat: number) => asLook(players.find((p) => p.seat === seat)?.mascot);
  const mascots = Object.fromEntries(
    here
      .filter((person) => person.kind !== "shadow")
      .map((person) => [
        person.key,
        lookOf(person.key === "me" ? mySeat : Number(person.key.replace("seat-", ""))),
      ]),
  );

  const map = (
    <ManorMap
      state={state}
      mySeat={mySeat}
      selectable={patrolling ? state.patrolRooms : []}
      selected={patrolling ? current.room : undefined}
      decoy={patrolling && current.decoy ? current.fake : undefined}
      onSelect={mapPick}
      nameOf={names.nameOf}
      roomName={names.roomName}
    />
  );
  const nothing = (
    <AppText variant="body" color="textMuted">
      {t("common.emptyTitle")}
    </AppText>
  );

  const openPanel = (key: Panel) => {
    tapHaptic();
    setPanel(key);
  };
  const subtitle = [
    t(`nightwatch.phases.${state.phase}`),
    !over && state.myRoom !== null ? names.roomName(state.myRoom) : null,
    state.rejections > 0 ? t("nightwatch.bar.rejections", { count: state.rejections }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // ── the lanterns: the vote and the mission on the stage ──
  const hold = useSharedValue(0);
  const [cast, setCast] = useState<{ step: string; side: Side } | null>(null);
  const myCast = cast?.step === step ? cast.side : null;
  // a cast lantern stays in sight a moment, blazing, before the stage
  // turns to the others
  const [lingering, setLingering] = useState(false);
  const linger = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (linger.current) clearTimeout(linger.current);
  }, []);
  useEffect(() => {
    hold.set(0);
  }, [step, hold]);
  const evil = state.myRole !== null && sideOf(state.myRole) === "evil";
  const voting = state.phase === "vote";
  const missioning = state.phase === "mission";
  const picked: Side | null = current.side ?? (missioning && !evil ? "good" : null);
  const castIt = (side: Side) => {
    setCast({ step, side });
    setLingering(true);
    if (linger.current) clearTimeout(linger.current);
    linger.current = setTimeout(() => setLingering(false), 1600);
    onMove(voting ? { type: "vote", approve: side === "good" } : { type: "mission", card: side === "good" ? "success" : "fail" });
  };
  const allSeats = Array.from({ length: state.numPlayers }, (_, seat) => seat);
  // the last chance: everyone on the bare stage, the assassin's blow
  const [strike, setStrike] = useState<{ step: string; seat: number } | null>(null);
  const struck = strike?.step === step ? strike.seat : null;
  const lineup = !over && !revealing && state.phase === "assassinate";
  const strikeIt = (seat: number) => {
    setStrike({ step, seat });
    // the blow lands before the game moves on
    if (linger.current) clearTimeout(linger.current);
    linger.current = setTimeout(() => onMove({ type: "assassinate", target: seat }), 1300);
  };
  let rite: RiteView | null = null;
  if (revealing && voteToShow) {
    rite = {
      kind: "reveal",
      key: `vote-${state.history.length}`,
      result: voteToShow.approved ? "good" : "bad",
      seats: allSeats.map((seat) => ({ seat, name: nameOf(seat), done: true, tint: voteToShow.votes[seat] ? 1 : -1 })),
    };
  } else if (revealing && missionToShow) {
    rite = {
      kind: "reveal",
      key: `mission-${state.results.length}`,
      result: missionToShow.success ? "good" : "bad",
      seats: missionToShow.team.map((seat) => ({ seat, name: nameOf(seat), done: true, tint: 0 })),
    };
  } else if (!over && (voting || missioning)) {
    if (onStage || (myCast !== null && lingering)) {
      rite = {
        kind: "choose",
        labels: voting
          ? { good: t("nightwatch.prompt.approve"), bad: t("nightwatch.prompt.reject") }
          : { good: t("nightwatch.prompt.success"), bad: t("nightwatch.prompt.fail") },
        locked: missioning && !evil ? "bad" : null,
        picked,
        cast: myCast,
        onPick: (side) => {
          hold.set(0);
          choose({ side });
        },
      };
    } else {
      rite = {
        kind: "gather",
        seats: (voting ? allSeats : state.team).map((seat) => ({
          seat,
          name: nameOf(seat),
          done: voting ? state.voted[seat] : state.missionPlayed.includes(seat),
          tint: 0,
        })),
      };
    }
  }
  const markReveal = () => {
    tapHaptic();
    pieces.mark(voteToShow ? { votes: state.history.length } : { missions: state.results.length });
  };
  const revealText = voteToShow
    ? {
        title: t(voteToShow.approved ? "nightwatch.rite.approved" : "nightwatch.rite.rejected"),
        detail: t("nightwatch.team.team", { names: names.namesOf(voteToShow.team) }),
      }
    : missionToShow
      ? {
          title: t(missionToShow.success ? "nightwatch.rite.succeeded" : "nightwatch.rite.failed"),
          detail:
            missionToShow.fails === null
              ? t("nightwatch.rite.missing", { room: names.roomName(missionToShow.room) })
              : missionToShow.fails > 0
                ? t("nightwatch.rite.fails", { count: missionToShow.fails })
                : t("nightwatch.rite.noFails"),
        }
      : null;

  const scene =
    room !== null ? (
      <RoomScene
        room={room}
        active={task === "room"}
        onTouch={() => {
          tapHaptic();
          setTouched(step);
        }}
        touchLabel={t("nightwatch.prompt.roomTitle", { room: names.roomName(room) })}
        people={here}
        mascots={mascots}
        missionRoom={over ? null : state.missionRoom}
        nextMissionRoom={over ? null : state.nextMissionRoom}
        collapsed={state.collapsed}
        lockedDoor={state.lockedDoor}
        roomName={names.roomName}
        onExit={() => openPanel("map")}
        book={
          book
            ? {
                label: t("nightwatch.book.title"),
                unread: !booksRead.includes(state.round),
                onOpen: () => {
                  moveHaptic();
                  setReading(true);
                  if (!booksRead.includes(state.round)) {
                    pieces.mark({ books: [...booksRead, state.round] });
                  }
                },
              }
            : undefined
        }
        event={over ? null : state.event}
        secretDoors={state.doors}
        arrival={walking && arrival ? arrival : undefined}
        onArrived={() => {
          if (arrival) pieces.mark({ walked: arrival.key });
        }}
        paused={showing !== null || dealing || delivering || rite !== null || lineup}
      />
    ) : (
      map
    );

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
      <ToolButton emoji={emoji} label={t(`nightwatch.menu.${key}`)} onPress={() => setPanel(key)} />
    </Animated.View>
  ));

  const riteHint =
    rite?.kind === "reveal" && revealText ? (
      <RevealTitle title={revealText.title} detail={revealText.detail} good={rite.result === "good"} />
    ) : rite?.kind === "choose" ? (
      <AppText style={stageText.hint} numberOfLines={2}>
        {voting
          ? `${t("nightwatch.team.team", { names: names.namesOf(state.team) })} · ${t("nightwatch.team.leader", {
              name: names.nameOf(state.leader ?? -1),
            })}`
          : t(evil ? "nightwatch.prompt.missionHintEvil" : "nightwatch.rite.goodOnly")}
      </AppText>
    ) : rite?.kind === "gather" ? (
      <AppText style={stageText.strong}>
        {t(voting ? "nightwatch.rite.voted" : "nightwatch.rite.played", {
          done: rite.seats.filter((seat) => seat.done).length,
          total: rite.seats.length,
        })}
      </AppText>
    ) : null;

  const hint = rite ? (
    riteHint
  ) : lineup && task === "assassinate" ? (
    <AppText style={stageText.hint} numberOfLines={2}>
      {t("nightwatch.prompt.assassinateHint")}
    </AppText>
  ) : (
    <>
      {book && !booksRead.includes(state.round) ? (
        <AppText style={stageText.strong}>{`📖 ${t("nightwatch.book.hint")}`}</AppText>
      ) : null}
      {company.map((line, i) => (
        <AppText key={i} style={stageText.hint} numberOfLines={2}>
          {line}
        </AppText>
      ))}
      {stage?.error ? (
        <AppText style={[stageText.hint, { color: colors.danger }]} numberOfLines={2}>
          {stage.error}
        </AppText>
      ) : null}
    </>
  );

  const target = current.target ?? null;
  const myEnd = state.roles?.[mySeat];
  const bottom = lineup && task === "assassinate" ? (
    struck !== null ? (
      <AppText style={stageText.strong}>{`🗡️  ${names.nameOf(struck)}`}</AppText>
    ) : target !== null ? (
      <HoldButton
        key={`${step}|${target}`}
        label={t("nightwatch.rite.holdName", { name: names.nameOf(target) })}
        tone="bad"
        progress={hold}
        disabled={busy}
        onDone={() => strikeIt(target)}
      />
    ) : (
      <AppText style={stageText.strong}>{t("nightwatch.rite.pickProphet")}</AppText>
    )
  ) : rite?.kind === "reveal" ? (
    <Button label={t("nightwatch.rite.continue")} size="lg" style={styles.main} onPress={markReveal} />
  ) : rite?.kind === "choose" && myCast !== null ? (
    <AppText style={stageText.strong}>
      {t(voting ? (myCast === "good" ? "nightwatch.chosen.yes" : "nightwatch.chosen.no") : "nightwatch.chosen.card")}
    </AppText>
  ) : rite?.kind === "choose" && myCast === null ? (
    picked ? (
      <HoldButton
        key={`${step}|${picked}`}
        label={t(
          voting
            ? picked === "good"
              ? "nightwatch.rite.holdApprove"
              : "nightwatch.rite.holdReject"
            : picked === "good"
              ? "nightwatch.rite.holdSuccess"
              : "nightwatch.rite.holdFail",
        )}
        tone={picked}
        progress={hold}
        disabled={busy}
        onDone={() => castIt(picked)}
      />
    ) : (
      <AppText style={stageText.strong}>{t("nightwatch.rite.pick")}</AppText>
    )
  ) : over ? (
    <AppText style={stageText.strong}>
      {state.winner !== null && myEnd
        ? t(sideOf(myEnd) === state.winner ? "nightwatch.result.youWon" : "nightwatch.result.youLost")
        : t("nightwatch.waiting.finished")}
    </AppText>
  ) : task === "room" ? (
    <AppText style={stageText.strong}>{`✨  ${t("nightwatch.scene.touch")}`}</AppText>
  ) : needsMe ? (
    <Button
      label={`${t("nightwatch.scene.yourMove")} · ${t(`nightwatch.phases.${state.phase}`)}`}
      size="lg"
      style={styles.main}
      onPress={() => setPutAway(null)}
    />
  ) : (
    <Waiting state={state} mySeat={mySeat} names={names} />
  );

  const centre =
    over && !rite ? (
      <Ending
        state={state}
        mySeat={mySeat}
        nameOf={nameOf}
        afterGame={stage?.afterGame}
        paused={showing !== null}
      />
    ) : (
      <>
        {/* the room stays put under a moment, hidden and still */}
        <View style={[styles.sceneBox, rite || lineup ? styles.hidden : null]}>{scene}</View>
        {rite ? (
          <View style={[StyleSheet.absoluteFill, rite.kind !== "reveal" && styles.besideTools]}>
            <LanternRite view={rite} hold={hold} paused={showing !== null} />
          </View>
        ) : lineup ? (
          <View style={StyleSheet.absoluteFill}>
            <LastChance
              people={allSeats.map((seat) => ({
                seat,
                name: nameOf(seat),
                look: lookOf(seat),
                candidate: assassinTargets(state).includes(seat),
              }))}
              choosing={task === "assassinate"}
              picked={task === "assassinate" ? (current.target ?? null) : null}
              onPick={(target) => {
                hold.set(0);
                choose({ target });
              }}
              hold={hold}
              struck={struck}
              paused={showing !== null}
            />
          </View>
        ) : null}
      </>
    );

  return (
    <ManorStage
      state={state}
      roomName={names.roomName}
      subtitle={subtitle}
      sceneKey={
        rite ? (rite.kind === "reveal" ? `reveal-${rite.key}` : rite.kind) : lineup ? "lineup" : over ? "ending" : "room"
      }
      centre={centre}
      tools={over ? undefined : tools}
      away={rite?.kind === "reveal" || lineup || over}
      hint={hint}
      bottom={bottom}
      onBack={stage?.onBack}
      onRules={stage?.onRules}
      onMap={() => openPanel("map")}
      paused={showing !== null || dealing || delivering}
      overlays={
        <>
      {state.myRole ? (
        <RoleIntro
          visible={dealing}
          tone={sideOf(state.myRole) === "evil" ? colors.danger : colors.successStrong}
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
          <RoleCardFace
            state={state}
            mySeat={mySeat}
            width={ROLE_CARD_W}
            namesOf={names.namesOf}
            nameOf={names.nameOf}
          />
        </RoleIntro>
      ) : null}
      <LetterScene
        visible={delivering}
        letters={post?.texts ?? []}
        onDone={() => {
          if (post) pieces.mark({ letters: post.round });
          setPost(null);
        }}
      />

      <Popup
        look={MANOR_POPUP}
        visible={showing !== null}
        title={
          showing === "news"
            ? t("nightwatch.scene.news")
            : showing === "panel" && panel
              ? t(`nightwatch.menu.${panel}`)
              : showing === "book"
                ? t("nightwatch.book.title")
                : t(`nightwatch.phases.${state.phase}`)
        }
        onClose={close}
      >
        {showing === "news" ? (
          <View style={{ gap: spacing.sm }}>
            <Journal pages={news} Text={AppText} order="oldest" />
            <Button
              label={t("common.ok")}
              style={{ marginTop: spacing.md }}
              onPress={readNews}
            />
          </View>
        ) : showing === "panel" ? (
          <View style={{ gap: spacing.lg }}>
            {panel === "map" ? (
              <NightMap
                state={state}
                mySeat={mySeat}
                players={players}
                nameOf={names.nameOf}
                roomName={names.roomName}
                notes={notes}
                onNote={setNote}
              />
            ) : panel === "notebook" ? (
              state.log.length > 0 ? (
                <Notebook
                  state={{
                    ...state,
                    log: state.log.filter(
                      (note) => note.kind !== "chapelRecord" || booksRead.includes(note.round)
                    ),
                  }}
                  names={names}
                />
              ) : (
                nothing
              )
            ) : panel === "record" ? (
              <>
                {!over ? <Tonight state={state} names={names} /> : null}
                <Letters state={state} />
                <PublicRecord state={state} names={names} />
              </>
            ) : panel === "role" ? (
              state.myRole ? (
                <View style={{ alignItems: "center" }}>
                  <RoleCardFace
                    state={state}
                    mySeat={mySeat}
                    width={ROLE_CARD_W}
                    namesOf={names.namesOf}
                    nameOf={names.nameOf}
                  />
                </View>
              ) : (
                nothing
              )
            ) : (
              <Players state={state} mySeat={mySeat} players={players} names={names} />
            )}
          </View>
        ) : showing === "book" && book ? (
          <View style={{ gap: spacing.sm }}>
            {book.records.length === 0 ? (
              <AppText variant="body" color="textMuted">
                {t("nightwatch.book.empty")}
              </AppText>
            ) : (
              book.records.map((rec) => (
                <AppText key={rec.round} variant="bodyMedium">
                  {`📖 ${t("nightwatch.notes.recordNight", {
                    n: rec.round + 1,
                    what: t(`nightwatch.notes.records.${rec.result ?? "nobody"}`),
                  })}`}
                </AppText>
              ))
            )}
          </View>
        ) : showing === "task" ? (
          <View>
            {task === "announce" ? (
              <>
                <Tonight state={state} names={names} />
                <View style={{ height: spacing.md }} />
                <AnnouncePrompt
                  state={state}
                  lock={current.lock ?? null}
                  busy={busy}
                  names={names}
                  onLock={(lock) => choose({ lock })}
                  onConfirm={() =>
                    send({ type: "ready", ...(current.lock ? { lock: current.lock } : {}) })
                  }
                />
              </>
            ) : task === "patrol" ? (
              <>
                {map}
                <View style={{ height: spacing.md }} />
                <PatrolPrompt
                  state={state}
                  mySeat={mySeat}
                  pick={current}
                  busy={busy}
                  names={names}
                  players={players}
                  onPick={choose}
                  onConfirm={() =>
                    send(
                      current.follow
                        ? { type: "patrol", track: current.track }
                        : {
                            type: "patrol",
                            room: current.room,
                            ...(current.decoy && current.fake !== undefined
                              ? { fake: current.fake }
                              : {}),
                          }
                    )
                  }
                />
              </>
            ) : task === "room" ? (
              <RoomPrompt
                state={state}
                mySeat={mySeat}
                pick={current}
                busy={busy}
                names={names}
                players={players}
                onPick={choose}
                onConfirm={() => {
                  const fn = state.myFn;
                  if ((fn === "study" || fn === "kitchen") && current.target != null) {
                    send({ type: "room", target: current.target });
                  } else if (fn === "gallery") {
                    const letters = (current.letters ?? []).filter((l) => l.trim());
                    send({ type: "room", ...(letters.length ? { letters } : {}) });
                  } else if (fn === "chapel" && current.pray) {
                    send({ type: "room", pray: true });
                  } else {
                    send({ type: "room" });
                  }
                }}
              />
            ) : task === "propose" ? (
              <ProposePrompt
                state={state}
                team={current.team ?? []}
                busy={busy}
                names={names}
                players={players}
                onToggle={(seat) =>
                  choose({ team: toggleTeam(current.team ?? [], seat, teamSize(state)) })
                }
                onConfirm={() => send({ type: "propose", team: current.team })}
              />
            ) : task === "vote" ? (
              <VotePrompt
                state={state}
                busy={busy}
                names={names}
                onVote={(approve) => send({ type: "vote", approve })}
              />
            ) : task === "mission" ? (
              <MissionPrompt
                state={state}
                busy={busy}
                names={names}
                onPlay={(card) => send({ type: "mission", card })}
              />
            ) : task === "assassinate" ? (
              <>
                <AppText variant="title">{`🗡️  ${t("nightwatch.prompt.assassinate")}`}</AppText>
                <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                  {t("nightwatch.prompt.assassinateHint")}
                </AppText>
                <SeatChips
                  seats={assassinTargets(state)}
                  selected={current.target === null ? [] : current.target !== undefined ? [current.target] : []}
                  players={players}
                  names={names}
                  busy={busy}
                  onPress={(target) => choose({ target })}
                />
                <Button
                  label={t("nightwatch.prompt.name")}
                  variant="danger"
                  style={{ marginTop: spacing.md }}
                  disabled={current.target == null}
                  loading={busy}
                  onPress={() => send({ type: "assassinate", target: current.target })}
                />
              </>
            ) : null}
          </View>
        ) : null}
      </Popup>
        </>
      }
    />
  );
}

// ------------------------------------------------------------- header

/** The announcement: tonight's mission, the next one, and the event. */
function Tonight({ state, names }: { state: NightwatchState; names: Names }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const event = state.event;
  const twoFails = state.failsRequired[state.round] > 1;

  return (
    <Card>
      <AppText variant="caption" color="textMuted">
        {t("nightwatch.announce.title")}
      </AppText>
      <AppText variant="title" style={{ marginTop: 2 }}>
        {`🎯  ${t("nightwatch.announce.mission", {
          room: names.roomName(state.missionRoom),
          size: teamSize(state),
        })}`}
      </AppText>
      {twoFails ? (
        <AppText variant="caption" color="primary" style={{ marginTop: 2 }}>
          {`★ ${t("nightwatch.announce.twoFails")}`}
        </AppText>
      ) : null}
      {state.nextMissionRoom !== null ? (
        <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
          {`🔜  ${t("nightwatch.announce.next", { room: names.roomName(state.nextMissionRoom) })}`}
        </AppText>
      ) : null}
      <View style={[styles.event, { borderColor: colors.primarySoftBorder }]}>
        {event ? (
          <>
            <AppText variant="label">
              {`${EVENT_EMOJI[event]}  ${t(`nightwatch.events.${event}.name`)}`}
            </AppText>
            <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
              {t(`nightwatch.events.${event}.desc`)}
            </AppText>
          </>
        ) : (
          <AppText variant="caption" color="textMuted">
            {t("nightwatch.announce.noEvent")}
          </AppText>
        )}
      </View>
      {state.lockedDoor ? (
        <AppText variant="bodyMedium" style={{ marginTop: 6 }}>
          {`🔒  ${t("nightwatch.announce.locked", {
            door: doorLabel(state.lockedDoor, names.roomName),
          })}`}
        </AppText>
      ) : null}
      {state.doors.map((door) => (
        <AppText key={door.join("-")} variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {`🚪  ${t("nightwatch.announce.door", { door: doorLabel(door, names.roomName) })}`}
        </AppText>
      ))}
      {state.collapsed.length > 0 ? (
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {`🧱  ${t("nightwatch.announce.collapsed", {
            rooms: state.collapsed.map(names.roomName).join(", "),
          })}`}
        </AppText>
      ) : null}
    </Card>
  );
}

// ------------------------------------------------------------ prompts

function AnnouncePrompt({
  state,
  lock,
  busy,
  names,
  onLock,
  onConfirm,
}: {
  state: NightwatchState;
  lock: number[] | null;
  busy: boolean;
  names: Names;
  onLock: (lock: number[] | null) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const canLock = state.doorOptions.length > 0;
  const same = (a: number[] | null, b: number[]) => !!a && a[0] === b[0] && a[1] === b[1];

  return (
    <>
      <AppText variant="title">
        {`🏮  ${t("nightwatch.bar.night", { n: state.round + 1, total: state.rounds })}`}
      </AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {t("nightwatch.prompt.readyHint")}
      </AppText>
      {canLock ? (
        <>
          <AppText variant="label" style={{ marginTop: spacing.md }}>
            {`🗝️  ${t("nightwatch.prompt.lockTitle")}`}
          </AppText>
          <AppText variant="tiny" color="textSubtle" style={{ marginTop: 2 }}>
            {t("nightwatch.prompt.lockHint")}
          </AppText>
          <View style={[styles.chips, { marginTop: spacing.sm }]}>
            <Chip
              label={t("nightwatch.prompt.noLock")}
              selected={lock === null}
              disabled={busy}
              onPress={() => onLock(null)}
            />
            {state.doorOptions.map((door) => (
              <Chip
                key={door.join("-")}
                label={doorLabel(door, names.roomName)}
                selected={same(lock, door)}
                disabled={busy}
                onPress={() => onLock(door)}
              />
            ))}
          </View>
        </>
      ) : null}
      <Button
        label={t("nightwatch.prompt.ready")}
        style={{ marginTop: spacing.md }}
        loading={busy}
        onPress={onConfirm}
      />
    </>
  );
}

function PatrolPrompt({
  state,
  mySeat,
  pick,
  busy,
  names,
  players,
  onPick,
  onConfirm,
}: {
  state: NightwatchState;
  mySeat: number;
  pick: Pick;
  busy: boolean;
  names: Names;
  players: GamePlayer[];
  onPick: (next: Omit<Pick, "step">) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const here = state.myRoom;
  const hint =
    state.event === "storm"
      ? "nightwatch.prompt.patrolStorm"
      : state.freeMove
        ? "nightwatch.prompt.patrolFree"
        : state.event === "insomnia"
          ? "nightwatch.prompt.patrolInsomnia"
          : "nightwatch.prompt.patrolHint";
  const ready = pick.follow
    ? pick.track !== undefined
    : pick.room !== undefined && (!pick.decoy || pick.fake !== undefined);

  return (
    <>
      <AppText variant="title">{`🚶  ${t("nightwatch.prompt.patrol")}`}</AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {t(hint)}
      </AppText>

      {canTrack(state) ? (
        <Toggle
          label={`👣  ${t("nightwatch.prompt.follow")}`}
          hint={t("nightwatch.prompt.followHint", { count: state.abilityLeft })}
          on={!!pick.follow}
          disabled={busy}
          onPress={() => onPick({ follow: !pick.follow })}
        />
      ) : null}

      {pick.follow ? (
        <SeatChips
          seats={others(state, mySeat)}
          selected={pick.track !== undefined ? [pick.track] : []}
          players={players}
          names={names}
          busy={busy}
          onPress={(track) => onPick({ track })}
        />
      ) : (
        <View style={[styles.chips, { marginTop: spacing.md }]}>
          {state.patrolRooms.map((room) => (
            <Chip
              key={room}
              label={`${ROOM_EMOJI[ROOMS[room]]}  ${
                room === here
                  ? t("nightwatch.prompt.stay", { room: names.roomName(room) })
                  : names.roomName(room)
              }`}
              selected={pick.room === room}
              disabled={busy}
              onPress={() =>
                onPick({ room, fake: pick.fake === room ? undefined : pick.fake })
              }
            />
          ))}
        </View>
      )}

      {canDecoy(state) ? (
        <>
          <Toggle
            label={`🎭  ${t("nightwatch.prompt.decoy")}`}
            hint={t("nightwatch.prompt.decoyHint", { count: state.abilityLeft })}
            on={!!pick.decoy}
            disabled={busy}
            onPress={() => onPick({ decoy: !pick.decoy })}
          />
          {pick.decoy ? (
            <>
              <AppText variant="label" style={{ marginTop: spacing.sm }}>
                {t("nightwatch.prompt.decoyRoom")}
              </AppText>
              <View style={[styles.chips, { marginTop: spacing.sm }]}>
                {decoyRooms(state, pick.room).map((room) => (
                  <Chip
                    key={room}
                    label={`${ROOM_EMOJI[ROOMS[room]]}  ${names.roomName(room)}`}
                    selected={pick.fake === room}
                    disabled={busy}
                    onPress={() => onPick({ fake: room })}
                  />
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}

      <Button
        label={t("nightwatch.prompt.go")}
        style={{ marginTop: spacing.md }}
        disabled={!ready}
        loading={busy}
        onPress={onConfirm}
      />
    </>
  );
}

function RoomPrompt({
  state,
  mySeat,
  pick,
  busy,
  names,
  players,
  onPick,
  onConfirm,
}: {
  state: NightwatchState;
  mySeat: number;
  pick: Pick;
  busy: boolean;
  names: Names;
  players: GamePlayer[];
  onPick: (next: Omit<Pick, "step">) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const room = state.myRoom ?? HALL;
  const fn = state.myFn;
  const letters = pick.letters ?? [];

  return (
    <>
      <AppText variant="title">
        {`${ROOM_EMOJI[ROOMS[room]]}  ${t("nightwatch.prompt.roomTitle", {
          room: names.roomName(room),
        })}`}
      </AppText>
      {ROOM_NEEDS[ROOMS[room]] ? (
        <AppText variant="label" color="primary" style={{ marginTop: 4 }}>
          {t(`nightwatch.needs.${ROOM_NEEDS[ROOMS[room]] === 1 ? "one" : "two"}`)}
        </AppText>
      ) : null}
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {fn ? t(`nightwatch.fns.${fn}`) : t("nightwatch.prompt.noFn")}
      </AppText>

      {fn === "study" || fn === "kitchen" ? (
        <>
          <AppText variant="label" style={{ marginTop: spacing.md }}>
            {t(`nightwatch.prompt.${fn}`)}
          </AppText>
          <SeatChips
            seats={fn === "study" ? state.studyOptions : others(state, mySeat)}
            selected={pick.target != null ? [pick.target] : []}
            players={players}
            names={names}
            busy={busy}
            onPress={(target) => onPick({ target: pick.target === target ? null : target })}
          />
        </>
      ) : fn === "gallery" ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <AppText variant="tiny" color="textSubtle">
            {t("nightwatch.prompt.letterHint")}
          </AppText>
          {Array.from({ length: state.letterLimit }, (_, i) => (
            <TextField
              key={i}
              value={letters[i] ?? ""}
              onChangeText={(text) => {
                const next = [...letters];
                next[i] = text;
                onPick({ letters: next });
              }}
              placeholder={t("nightwatch.prompt.letterPlaceholder")}
              maxLength={120}
              editable={!busy}
            />
          ))}
        </View>
      ) : fn === "chapel" ? (
        <Toggle
          label={`🙏  ${t("nightwatch.prompt.pray")}`}
          hint={t("nightwatch.prompt.prayHint")}
          on={!!pick.pray}
          disabled={busy}
          onPress={() => onPick({ pray: !pick.pray })}
        />
      ) : null}

      <Button
        label={t("nightwatch.prompt.done")}
        style={{ marginTop: spacing.md }}
        loading={busy}
        onPress={onConfirm}
      />
    </>
  );
}

function ProposePrompt({
  state,
  team,
  busy,
  names,
  players,
  onToggle,
  onConfirm,
}: {
  state: NightwatchState;
  team: number[];
  busy: boolean;
  names: Names;
  players: GamePlayer[];
  onToggle: (seat: number) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const size = teamSize(state);

  return (
    <>
      <AppText variant="title">
        {`👑  ${t("nightwatch.prompt.propose", { size })}`}
      </AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {t("nightwatch.prompt.proposeHint", {
          room: names.roomName(state.missionRoom),
          steps: state.event === "fog" ? 1 : 2,
        })}
      </AppText>
      <SeatChips
        seats={Array.from({ length: state.numPlayers }, (_, s) => s)}
        selected={team}
        players={players}
        names={names}
        busy={busy}
        onPress={onToggle}
      />
      <Button
        label={`${t("nightwatch.prompt.send")} (${team.length}/${size})`}
        style={{ marginTop: spacing.md }}
        disabled={team.length !== size}
        loading={busy}
        onPress={onConfirm}
      />
    </>
  );
}

function VotePrompt({
  state,
  busy,
  names,
  onVote,
}: {
  state: NightwatchState;
  busy: boolean;
  names: Names;
  onVote: (approve: boolean) => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <>
      <AppText variant="title">{`🗳️  ${t("nightwatch.prompt.vote")}`}</AppText>
      <AppText variant="body" style={{ marginTop: 4 }}>
        {t("nightwatch.team.team", { names: names.namesOf(state.team) })}
      </AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
        {t("nightwatch.team.leader", { name: names.nameOf(state.leader ?? -1) })}
      </AppText>
      <View style={[styles.row, { gap: spacing.sm, marginTop: spacing.md }]}>
        <Button
          label={`👍  ${t("nightwatch.prompt.approve")}`}
          style={styles.grow}
          loading={busy}
          onPress={() => onVote(true)}
        />
        <Button
          label={`👎  ${t("nightwatch.prompt.reject")}`}
          variant="danger"
          style={styles.grow}
          disabled={busy}
          onPress={() => onVote(false)}
        />
      </View>
    </>
  );
}

function MissionPrompt({
  state,
  busy,
  names,
  onPlay,
}: {
  state: NightwatchState;
  busy: boolean;
  names: Names;
  onPlay: (card: "success" | "fail") => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const evil = state.myRole !== null && sideOf(state.myRole) === "evil";

  return (
    <>
      <AppText variant="title">
        {`🎯  ${t("nightwatch.prompt.mission", { room: names.roomName(state.missionRoom) })}`}
      </AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {t(evil ? "nightwatch.prompt.missionHintEvil" : "nightwatch.prompt.missionHint")}
      </AppText>
      <View style={[styles.row, { gap: spacing.sm, marginTop: spacing.md }]}>
        <Button
          label={`🏮  ${t("nightwatch.prompt.success")}`}
          style={styles.grow}
          loading={busy}
          onPress={() => onPlay("success")}
        />
        {evil ? (
          <Button
            label={`👻  ${t("nightwatch.prompt.fail")}`}
            variant="danger"
            style={styles.grow}
            disabled={busy}
            onPress={() => onPlay("fail")}
          />
        ) : null}
      </View>
    </>
  );
}

function SeatChips({
  seats,
  selected,
  players,
  names,
  busy,
  onPress,
}: {
  seats: number[];
  selected: number[];
  players: GamePlayer[];
  names: Names;
  busy: boolean;
  onPress: (seat: number) => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.chips, { marginTop: spacing.md }]}>
      {seats.map((seat) => {
        const player = players.find((p) => p.seat === seat);
        const isSelected = selected.includes(seat);
        return (
          <Pressable
            key={seat}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            disabled={busy}
            onPress={() => onPress(seat)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primarySoft : colors.well,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <AvatarBorder
              name={player?.username ?? "?"}
              borderId={player?.borderId}
              avatarUrl={player?.avatarUrl}
              size={28}
            />
            <AppText variant="label" numberOfLines={1} style={styles.grow}>
              {names.nameOf(seat)}
            </AppText>
            {isSelected ? (
              <AppText variant="label" color="primary">
                ✓
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primarySoft : colors.well,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <AppText variant="label" numberOfLines={1} style={styles.grow}>
        {label}
      </AppText>
      {selected ? (
        <AppText variant="label" color="primary">
          ✓
        </AppText>
      ) : null}
    </Pressable>
  );
}

function Toggle({
  label,
  hint,
  on,
  disabled,
  onPress,
}: {
  label: string;
  hint: string;
  on: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.action,
        styles.row,
        {
          gap: 10,
          marginTop: spacing.md,
          backgroundColor: on ? colors.primarySoft : colors.well,
          borderColor: on ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.grow}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="tiny" color="textSubtle" style={{ marginTop: 2 }}>
          {hint}
        </AppText>
      </View>
      <AppText variant="label" color={on ? "primary" : "textSubtle"}>
        {on ? "☑" : "☐"}
      </AppText>
    </Pressable>
  );
}

// -------------------------------------------------------------- cards

function Waiting({
  state,
  mySeat,
  names,
}: {
  state: NightwatchState;
  mySeat: number;
  names: Names;
}) {
  const { t } = useTranslation();
  const pending = waitingOn(state).filter((s) => s !== mySeat);
  const mine = state.myOrder;

  let chosen: string | null = null;
  if (state.phase === "announce" && mine) {
    chosen = mine.lock
      ? t("nightwatch.chosen.lock", { door: doorLabel(mine.lock, names.roomName) })
      : t("nightwatch.chosen.ready");
  } else if (state.phase === "patrol" && mine) {
    chosen =
      mine.track !== undefined
        ? t("nightwatch.chosen.track", { name: names.nameOf(mine.track) })
        : t("nightwatch.chosen.room", { room: names.roomName(mine.room ?? HALL) });
    if (mine.fake !== undefined) {
      chosen += ` · 🎭 ${t("nightwatch.chosen.decoy", { room: names.roomName(mine.fake) })}`;
    }
  } else if (state.phase === "room" && mine) {
    chosen = t("nightwatch.chosen.done");
  } else if (state.phase === "vote" && state.myVote !== null) {
    chosen = t(state.myVote ? "nightwatch.chosen.yes" : "nightwatch.chosen.no");
  } else if (state.phase === "mission" && state.myCard) {
    chosen = t("nightwatch.chosen.card");
  }

  const leader = state.leader !== null ? names.nameOf(state.leader) : "";
  return (
    <View style={{ gap: 2 }}>
      <AppText style={stageText.strong} numberOfLines={2}>
        {t(`nightwatch.waiting.${state.phase}`, {
          name: state.phase === "assassinate" ? names.nameOf(state.assassinSeat ?? -1) : leader,
        })}
      </AppText>
      {chosen ? (
        <AppText style={stageText.hint} numberOfLines={1}>
          {chosen}
        </AppText>
      ) : null}
      {pending.length > 0 && state.phase !== "team" && state.phase !== "assassinate" ? (
        <AppText style={[stageText.hint, { opacity: 0.75 }]} numberOfLines={1}>
          {`⏳  ${t("nightwatch.waiting.on", { names: names.namesOf(pending) })}`}
        </AppText>
      ) : null}
    </View>
  );
}

/** Where I am after the patrol, who I saw, and what the room told me. */
function Letters({ state }: { state: NightwatchState }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const discussing = ["team", "vote", "mission"].includes(state.phase);
  const letters = lettersFor(state, state.round);
  if (!discussing || letters.length === 0) return null;

  return (
    <Card>
      <AppText variant="caption" color="textMuted">
        {`🖼️  ${t("nightwatch.letters.title")}`}
      </AppText>
      {letters.map((text, i) => (
        <View key={i} style={[styles.letter, { borderColor: colors.primarySoftBorder }]}>
          <AppText variant="bodyMedium">{`“${text}”`}</AppText>
        </View>
      ))}
    </Card>
  );
}

function Players({
  state,
  mySeat,
  players,
  names,
}: {
  state: NightwatchState;
  mySeat: number;
  players: GamePlayer[];
  names: Names;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const knownAs = new Map(state.known.map((k) => [k.seat, k.as]));
  const simultaneous = ["announce", "patrol", "room"].includes(state.phase);

  return (
    <View>
      <AppText variant="label" style={{ marginBottom: spacing.sm }}>
        {t("nightwatch.players.title")}
      </AppText>
      <View style={styles.chips}>
        {players
          .slice()
          .sort((a, b) => a.seat - b.seat)
          .map((player) => {
            const seat = player.seat;
            const role = state.roles?.[seat];
            const evilNow = state.evilSeats?.includes(seat);
            const as = seat !== mySeat ? knownAs.get(seat) : undefined;
            const tag = role
              ? t(`nightwatch.roles.${role}.name`)
              : evilNow || as === "evil"
                ? t("nightwatch.players.evil")
                : as === "prophet"
                  ? t("nightwatch.players.maybeProphet")
                  : null;
            const evil = role ? sideOf(role) === "evil" : evilNow || as === "evil";
            const done = simultaneous
              ? state.ready[seat]
              : state.phase === "vote"
                ? state.voted[seat]
                : state.phase === "mission"
                  ? state.missionPlayed.includes(seat)
                  : false;
            const marks = [
              state.leader === seat && state.phase !== "finished" ? "👑" : "",
              state.team.includes(seat) ? "🎯" : "",
              state.assassinSeat === seat && state.evilSeats ? "🗡️" : "",
            ].join("");
            return (
              <View
                key={player.userId}
                style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <AvatarBorder
                  name={player.username}
                  borderId={player.borderId}
                  avatarUrl={player.avatarUrl}
                  size={32}
                />
                <View style={styles.grow}>
                  <AppText variant="label" numberOfLines={1}>
                    {`${names.nameOf(seat)}${marks ? `  ${marks}` : ""}`}
                  </AppText>
                  {tag ? (
                    <AppText
                      variant="tiny"
                      style={{
                        color: evil
                          ? colors.danger
                          : as === "prophet"
                            ? colors.primary
                            : colors.successStrong,
                      }}
                    >
                      {tag}
                    </AppText>
                  ) : null}
                </View>
                {done ? (
                  <AppText variant="label" style={{ color: colors.successStrong }}>
                    ✓
                  </AppText>
                ) : null}
              </View>
            );
          })}
      </View>
    </View>
  );
}

// ------------------------------------------------------------ records

function patrolLines(
  note: Extract<Note, { kind: "patrol" }>,
  names: Names,
  t: T
): string[] {
  const lines: string[] = [];
  if (note.tracked !== null) {
    lines.push(`👣 ${t("nightwatch.where.tracked", { name: names.nameOf(note.tracked) })}`);
  }
  if (note.seen === null) {
    lines.push(`🌑 ${t(note.company ? "nightwatch.where.someone" : "nightwatch.where.alone")}`);
  } else {
    lines.push(
      note.seen.length > 0
        ? `👀 ${t("nightwatch.where.seen", { names: names.namesOf(note.seen) })}`
        : `👀 ${t("nightwatch.where.alone")}`
    );
  }
  if (note.fake !== null) {
    lines.push(`🎭 ${t("nightwatch.where.decoy", { room: names.roomName(note.fake) })}`);
  }
  if (note.blocked) lines.push(`🚫 ${t(`nightwatch.where.blocked.${note.blocked}`)}`);
  return lines;
}

function noteLine(note: Note, names: Names, t: T): string {
  switch (note.kind) {
    case "patrol":
      return `${ROOM_EMOJI[ROOMS[note.room]]} ${names.roomName(note.room)}`;
    case "bell":
      return `🔔 ${t("nightwatch.notes.bell")}`;
    case "cellar":
      return `🕳️ ${t("nightwatch.notes.cellar")}`;
    case "dining":
      return `🍷 ${
        note.seat === null
          ? t("nightwatch.notes.diningDark", { side: t(`nightwatch.sides.${note.camp}`) })
          : t("nightwatch.notes.dining", {
              name: names.nameOf(note.seat),
              side: t(`nightwatch.sides.${note.camp}`),
            })
      }`;
    case "garden":
      // by name, laid out like the map: three rooms to a row
      return `🌙 ${t("nightwatch.notes.garden", {
        counts: [0, 3, 6]
          .map(
            (row) =>
              `\n${note.counts
                .slice(row, row + 3)
                .map((count, i) => `${names.roomName(row + i)} ${count}`)
                .join(" · ")}`
          )
          .join(""),
      })}`;
    case "study":
      return `📜 ${t("nightwatch.notes.study", {
        name: names.nameOf(note.seat),
        card: t(`nightwatch.prompt.${note.card}`),
      })}`;
    case "kitchen":
      return `🍲 ${t("nightwatch.notes.kitchen", {
        name: names.nameOf(note.seat),
        room: names.roomName(note.room),
      })}`;
    case "letter":
      return `🖼️ ${t("nightwatch.notes.letter", {
        text: note.texts.map((x) => `“${x}”`).join(" "),
      })}`;
    case "pray":
      return `🙏 ${t("nightwatch.notes.pray")}`;
    case "prayer":
      return `⛪ ${t(`nightwatch.notes.prayer.${note.result}`)}`;
    case "collapse":
      return `🧱 ${t("nightwatch.notes.collapse", { room: names.roomName(note.room) })}`;
    case "chapelRecord":
      return `📖 ${t("nightwatch.notes.chapelRecord")}\n${note.records
        .map((rec) =>
          t("nightwatch.notes.recordNight", {
            n: rec.round + 1,
            what: t(`nightwatch.notes.records.${rec.result ?? "nobody"}`),
          })
        )
        .join("\n")}`;
  }
}

/** My private notes, newest night first. */
function Notebook({ state, names }: { state: NightwatchState; names: Names }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  if (state.log.length === 0) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="tiny" color="textSubtle">
        {t("nightwatch.log.hint")}
      </AppText>
      <Journal
        // the whole notebook is private: no need to box each night's notes
        pages={manorPages(state, { log: state.log, history: [], results: [], timeline: [] }, names, t).map(
          (page) => ({
            ...page,
            sections: page.sections.map((section) => ({ ...section, title: undefined, private: false })),
          })
        )}
        Text={AppText}
      />
    </View>
  );
}

/** Everything public, night by night: events, letters, votes, missions. */
function PublicRecord({ state, names }: { state: NightwatchState; names: Names }) {
  const { t } = useTranslation();
  return (
    <Journal
      pages={manorPages(
        state,
        { log: [], history: state.history, results: state.results, timeline: state.timeline },
        names,
        t
      )}
      Text={AppText}
    />
  );
}

/** What happened, as Journal pages: one per night, holding its news (the
 *  event, doors, letters), the teams and votes, the mission, and what
 *  only this player knows. Pass only some records (the news) to get
 *  only those nights. */
function manorPages(
  state: NightwatchState,
  parts: {
    log: Note[];
    history: NightwatchState["history"];
    results: NightwatchState["results"];
    timeline: TimelineEntry[];
    walked?: string;
  },
  names: Names,
  t: T
): JournalPage[] {
  const evil = state.myRole !== null && sideOf(state.myRole) === "evil";
  const rounds = [
    ...new Set([...parts.log, ...parts.history, ...parts.results, ...parts.timeline].map((e) => e.round)),
  ].sort((a, b) => a - b);

  const timelineLine = (e: TimelineEntry) => {
    switch (e.kind) {
      case "night":
        return `${EVENT_EMOJI[e.event]} ${t(`nightwatch.events.${e.event}.name`)}`;
      case "collapse":
        return `🧱 ${t("nightwatch.record.collapse", { room: names.roomName(e.room) })}`;
      case "door":
        return `🚪 ${t("nightwatch.record.door", { door: doorLabel(e.rooms, names.roomName) })}`;
      case "lock":
        return `🔒 ${t("nightwatch.record.lock", { door: doorLabel(e.rooms, names.roomName) })}`;
      case "letters":
        return `🖼️ ${e.texts.map((x) => `“${x}”`).join("  ")}`;
    }
  };

  return rounds.map((r) => {
    const result = parts.results.find((x) => x.round === r);
    const sections: JournalSection[] = [
      {
        key: "news",
        title: `🗞️  ${t("nightwatch.journal.news")}`,
        entries: parts.timeline.filter((e) => e.round === r).map((e) => ({ text: timelineLine(e) })),
      },
      {
        key: "teams",
        title: `🗳️  ${t("nightwatch.journal.teams")}`,
        entries: parts.history
          .filter((p) => p.round === r)
          .map((p) => {
            const yes = p.votes.map((v, seat) => (v ? seat : -1)).filter((seat) => seat >= 0);
            const no = p.votes.map((v, seat) => (v ? -1 : seat)).filter((seat) => seat >= 0);
            return {
              text: `${p.bell ? "🔔" : "👑"} ${t("nightwatch.record.proposal", {
                leader: names.nameOf(p.leader),
                team: names.namesOf(p.team),
              })} — ${t(p.approved ? "nightwatch.record.approved" : "nightwatch.record.rejected")}`,
              detail: [
                `👍 ${yes.length ? names.namesOf(yes) : "—"}`,
                `👎 ${no.length ? names.namesOf(no) : "—"}`,
              ],
            };
          }),
      },
      {
        key: "mission",
        title: `🎯  ${t("nightwatch.journal.mission")}`,
        entries: result
          ? [
              {
                text: `${result.success ? "✅" : "❌"} ${t(
                  result.success ? "nightwatch.record.success" : "nightwatch.record.fail",
                  { room: names.roomName(result.room) }
                )}`,
                detail: [
                  result.missing.length > 0
                    ? t("nightwatch.record.missing", { names: names.namesOf(result.missing) })
                    : t("nightwatch.record.fails", { count: result.fails ?? 0 }),
                ],
                tone: result.success !== evil ? ("good" as const) : ("bad" as const),
              },
            ]
          : [],
      },
      {
        key: "mine",
        title: `🔒  ${t("nightwatch.journal.private")}`,
        private: true,
        entries: [
          ...parts.log
            .filter((note) => note.round === r)
            .map((note) => ({
              text: noteLine(note, names, t),
              detail: note.kind === "patrol" ? patrolLines(note, names, t) : undefined,
            })),
          ...(parts.walked && r === state.round ? [{ text: parts.walked }] : []),
        ],
      },
    ];
    return {
      key: `night-${r}`,
      title: t("nightwatch.map.nightN", { n: r + 1 }),
      subtitle: result ? `🎯 ${names.roomName(result.room)}` : undefined,
      sections,
    };
  });
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  sceneBox: { flex: 1, marginRight: 60, justifyContent: "center" },
  hidden: { opacity: 0 },
  besideTools: { right: 60 },
  main: { alignSelf: "stretch" },
  bold: { fontFamily: fontFamily.semiBold },
  row: { flexDirection: "row", alignItems: "center" },
  track: { flexDirection: "row", gap: 6 },
  targets: { flexDirection: "row", gap: 8 },
  target: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  trackCell: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 6,
  },
  roleHead: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8 },
  event: {
    marginTop: 8,
    borderLeftWidth: 2,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  action: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  letter: {
    marginTop: 8,
    borderLeftWidth: 2,
    paddingLeft: 10,
    paddingVertical: 2,
  },
  record: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
