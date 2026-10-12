import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText, BottomSheetModal, Button, Card, TextField } from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { usePromptSheet } from "@/hooks/usePromptSheet";
import { fontFamily, useTheme } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps, GamePlayer } from "../types";
import {
  EVENT_EMOJI,
  HALL,
  ROLE_EMOJI,
  ROOMS,
  ROOM_EMOJI,
  assassinTargets,
  canDecoy,
  canTrack,
  decoyRooms,
  doorLabel,
  lettersFor,
  missionTrack,
  notesByRound,
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

/** Blank space added under the table while the prompt sheet is up. */
const SHEET_CLEARANCE = 400;

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
};

export function NightwatchBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  onMove,
}: GameBoardProps<NightwatchState>) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  // Tagged with the step so picks clear themselves when the game moves
  // on (a rejected team brings a new leader, hence the proposal count)
  const step = `${state.phase}:${state.round}:${state.history.length}`;
  const [pick, setPick] = useState<Pick>({ step });
  const current: Pick = pick.step === step ? pick : { step };
  const [roleShown, setRoleShown] = useState(false);

  const over = finished || state.phase === "finished";
  const task = over ? null : taskFor(state, mySeat);
  const needsMe = task !== null;
  const { ref: sheetRef, onDismiss: onSheetDismiss } = usePromptSheet(needsMe, step);

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

  return (
    <View style={{ gap: spacing.lg }}>
      <NightBar state={state} names={names} />

      {state.myRole ? (
        <RoleCard
          state={state}
          mySeat={mySeat}
          shown={roleShown || over}
          onToggle={over ? undefined : () => setRoleShown((v) => !v)}
          names={names}
        />
      ) : null}

      {!over ? <Tonight state={state} names={names} /> : null}

      <HouseMap
        state={state}
        selectable={patrolling ? state.patrolRooms : []}
        selected={patrolling ? current.room : undefined}
        decoy={patrolling && current.decoy ? current.fake : undefined}
        onSelect={mapPick}
        names={names}
      />

      {over ? (
        <Card>
          <Result state={state} mySeat={mySeat} names={names} />
        </Card>
      ) : !needsMe ? (
        <Card>
          <Waiting state={state} mySeat={mySeat} names={names} />
        </Card>
      ) : null}

      {!over && state.myRoom !== null ? <WhereIAm state={state} names={names} /> : null}
      <Letters state={state} />
      <Players state={state} mySeat={mySeat} players={players} names={names} />
      <Notebook state={state} names={names} />
      <PublicRecord state={state} names={names} />

      {needsMe ? <View style={{ height: SHEET_CLEARANCE }} /> : null}

      <BottomSheetModal
        ref={sheetRef}
        onDismiss={onSheetDismiss}
        dismissable={false}
        backdrop={false}
      >
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xs,
            paddingBottom: insets.bottom + spacing.xl,
          }}
        >
          {task === "announce" ? (
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
          ) : task === "patrol" ? (
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
      </BottomSheetModal>
    </View>
  );
}

// ------------------------------------------------------------- header

function NightBar({ state, names }: { state: NightwatchState; names: Names }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const track = missionTrack(state);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        <View style={styles.grow}>
          <AppText variant="h2">
            {`🏮  ${t("nightwatch.bar.night", {
              n: Math.min(state.round + 1, state.rounds),
              total: state.rounds,
            })}`}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {t(`nightwatch.phases.${state.phase}`)}
            {state.rejections > 0
              ? ` · ${t("nightwatch.bar.rejections", { count: state.rejections })}`
              : ""}
          </AppText>
        </View>
      </View>
      <View style={styles.track}>
        {track.map((result, r) => {
          const now = r === state.round && !result && state.phase !== "finished";
          const tint = result
            ? result.success
              ? colors.successStrong
              : colors.danger
            : now
              ? colors.primary
              : colors.border;
          return (
            <View
              key={r}
              style={[
                styles.trackCell,
                {
                  borderColor: tint,
                  backgroundColor: result
                    ? result.success
                      ? colors.successSoft
                      : colors.well
                    : colors.card,
                },
              ]}
            >
              <AppText variant="label" style={{ color: tint }}>
                {result ? (result.success ? "✓" : "✕") : state.missionSizes[r]}
              </AppText>
              <AppText variant="tiny" color="textSubtle">
                {result
                  ? result.fails === null
                    ? "—"
                    : `✕${result.fails}`
                  : state.failsRequired[r] > 1
                    ? "★"
                    : " "}
              </AppText>
            </View>
          );
        })}
      </View>
      {state.phase !== "finished" ? (
        <AppText variant="tiny" color="textSubtle">
          {t("nightwatch.bar.trackHint", { room: names.roomName(state.missionRoom) })}
        </AppText>
      ) : null}
    </View>
  );
}

function RoleCard({
  state,
  mySeat,
  shown,
  onToggle,
  names,
}: {
  state: NightwatchState;
  mySeat: number;
  shown: boolean;
  onToggle?: () => void;
  names: Names;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const role = state.myRole!;
  const evil = sideOf(role) === "evil";
  const known = state.known.map((k) => k.seat);
  const usesOf = { tracker: 2, double: 2, keeper: 1 } as Record<string, number>;

  return (
    <Card onPress={onToggle}>
      <AppText variant="caption" color="textMuted">
        {t("nightwatch.role.title")}
      </AppText>
      {shown ? (
        <>
          <View style={styles.roleHead}>
            <AppText style={{ fontSize: 44 }}>{ROLE_EMOJI[role]}</AppText>
            <View style={styles.grow}>
              <AppText
                variant="h2"
                style={{ color: evil ? colors.danger : colors.successStrong }}
              >
                {t(`nightwatch.roles.${role}.name`)}
              </AppText>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                {t(`nightwatch.roles.${role}.desc`)}
              </AppText>
            </View>
          </View>
          {known.length > 0 ? (
            <AppText variant="bodyMedium" style={{ marginTop: 8 }}>
              {role === "prophet"
                ? t("nightwatch.role.knowsEvil", { names: names.namesOf(known) })
                : role === "apprentice"
                  ? t("nightwatch.role.knowsProphet", { names: names.namesOf(known) })
                  : t("nightwatch.role.allies", { names: names.namesOf(known) })}
            </AppText>
          ) : null}
          {evil && state.assassinSeat !== null ? (
            <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
              {state.assassinSeat === mySeat
                ? t("nightwatch.role.youAssassin")
                : t("nightwatch.role.assassin", { name: names.nameOf(state.assassinSeat) })}
            </AppText>
          ) : null}
          {usesOf[role] ? (
            <AppText variant="caption" color="primary" style={{ marginTop: 4 }}>
              {t("nightwatch.role.uses", { count: state.abilityLeft, total: usesOf[role] })}
            </AppText>
          ) : null}
          {onToggle ? (
            <AppText variant="tiny" color="textSubtle" style={{ marginTop: 8 }}>
              {t("nightwatch.role.hide")}
            </AppText>
          ) : null}
        </>
      ) : (
        <AppText variant="title" style={{ marginTop: 4 }}>
          {t("nightwatch.role.reveal")}
        </AppText>
      )}
    </Card>
  );
}

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

// ---------------------------------------------------------------- map

function HouseMap({
  state,
  selectable,
  selected,
  decoy,
  onSelect,
  names,
}: {
  state: NightwatchState;
  selectable: number[];
  selected?: number;
  decoy?: number;
  onSelect: (room: number) => void;
  names: Names;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const over = state.phase === "finished";

  return (
    <View style={styles.map}>
      {ROOMS.map((id, room) => {
        const mine = !over && state.myRoom === room;
        const myDecoy = !over && (decoy ?? state.myFake) === room;
        const canGo = selectable.includes(room);
        const isSelected = selected === room;
        const sealed = state.collapsed.includes(room);
        const mission = !over && state.missionRoom === room;
        const next = !over && state.nextMissionRoom === room;
        const here = over && state.positions
          ? state.positions.map((r, s) => (r === room ? s : -1)).filter((s) => s >= 0)
          : [];
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={names.roomName(room)}
            accessibilityState={{ selected: isSelected, disabled: !canGo }}
            disabled={!canGo}
            onPress={() => onSelect(room)}
            style={[
              styles.room,
              {
                opacity: sealed ? 0.45 : 1,
                backgroundColor: isSelected
                  ? colors.primarySoft
                  : mine
                    ? colors.well
                    : colors.card,
                borderColor: isSelected
                  ? colors.primary
                  : mission
                    ? colors.danger
                    : mine
                      ? colors.primarySoftBorder
                      : canGo
                        ? colors.textSubtle
                        : colors.border,
                borderStyle: canGo && !isSelected && !mine ? "dashed" : "solid",
              },
            ]}
          >
            <View style={styles.roomTop}>
              <AppText style={{ fontSize: 20 }}>{sealed ? "🧱" : ROOM_EMOJI[id]}</AppText>
              {mission ? (
                <AppText variant="tiny" style={[styles.bold, { color: colors.danger }]}>
                  {`🎯 ${t("nightwatch.map.mission")}`}
                </AppText>
              ) : next ? (
                <AppText variant="tiny" color="textSubtle" style={styles.bold}>
                  {`🔜 ${t("nightwatch.map.next")}`}
                </AppText>
              ) : null}
            </View>
            <AppText variant="tiny" numberOfLines={1} style={{ marginTop: 2 }}>
              {names.roomName(room)}
            </AppText>
            <View style={styles.marks}>
              {mine ? (
                <AppText variant="tiny" color="primary" style={styles.bold}>
                  {t("nightwatch.map.you")}
                </AppText>
              ) : null}
              {myDecoy ? (
                <AppText variant="tiny" color="textMuted" style={styles.bold}>
                  {`🎭 ${t("nightwatch.map.decoy")}`}
                </AppText>
              ) : null}
              {sealed ? (
                <AppText variant="tiny" color="textSubtle">
                  {t("nightwatch.map.sealed")}
                </AppText>
              ) : null}
              {here.length > 0 ? (
                <AppText variant="tiny" color="textMuted" numberOfLines={2}>
                  {names.namesOf(here)}
                </AppText>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
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
              InputComponent={BottomSheetTextInput}
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
  const { spacing } = useTheme();
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
    <>
      <AppText variant="title">
        {t(`nightwatch.waiting.${state.phase}`, {
          name: state.phase === "assassinate" ? names.nameOf(state.assassinSeat ?? -1) : leader,
        })}
      </AppText>
      {state.phase === "vote" || state.phase === "mission" ? (
        <AppText variant="caption" style={{ marginTop: 4 }}>
          {t("nightwatch.team.team", { names: names.namesOf(state.team) })}
        </AppText>
      ) : null}
      {chosen ? (
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {chosen}
        </AppText>
      ) : null}
      {pending.length > 0 && state.phase !== "team" && state.phase !== "assassinate" ? (
        <AppText variant="caption" color="textSubtle" style={{ marginTop: spacing.sm }}>
          {`⏳  ${t("nightwatch.waiting.on", { names: names.namesOf(pending) })}`}
        </AppText>
      ) : null}
    </>
  );
}

/** Where I am after the patrol, who I saw, and what the room told me. */
function WhereIAm({ state, names }: { state: NightwatchState; names: Names }) {
  const { t } = useTranslation();
  const room = state.myRoom!;
  const patrol = tonightsPatrol(state);
  const tonight = state.log.filter((n) => n.round === state.round && n.kind !== "patrol");

  return (
    <Card>
      <AppText variant="caption" color="textMuted">
        {t("nightwatch.where.title")}
      </AppText>
      <AppText variant="title" style={{ marginTop: 2 }}>
        {`${ROOM_EMOJI[ROOMS[room]]}  ${names.roomName(room)}`}
      </AppText>
      {state.freeMove && !patrol ? (
        <AppText variant="caption" color="primary" style={{ marginTop: 4 }}>
          {`🕳️  ${t("nightwatch.where.freeMove")}`}
        </AppText>
      ) : null}
      {patrol && state.myRoom === patrol.room
        ? patrolLines(patrol, names, t).map((line, i) => (
            <AppText key={i} variant="body" color="textMuted" style={{ marginTop: 4 }}>
              {line}
            </AppText>
          ))
        : null}
      {tonight.map((note, i) => (
        <AppText key={i} variant="bodyMedium" style={{ marginTop: 4 }}>
          {noteLine(note, names, t)}
        </AppText>
      ))}
    </Card>
  );
}

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
      return `🌙 ${t("nightwatch.notes.garden", {
        counts: note.counts
          .map((count, room) => `${ROOM_EMOJI[ROOMS[room]]}${count}`)
          .join("  "),
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
  const { colors, spacing } = useTheme();
  if (state.log.length === 0) return null;

  return (
    <View>
      <AppText variant="label">{`📓  ${t("nightwatch.log.title")}`}</AppText>
      <AppText variant="tiny" color="textSubtle" style={{ marginBottom: spacing.sm }}>
        {t("nightwatch.log.hint")}
      </AppText>
      {notesByRound(state.log).map(({ round, notes }) => (
        <View key={round} style={[styles.record, { borderBottomColor: colors.divider }]}>
          <AppText variant="caption" style={styles.bold}>
            {t("nightwatch.bar.night", { n: round + 1, total: state.rounds })}
          </AppText>
          {notes.flatMap((note, i) =>
            (note.kind === "patrol"
              ? [noteLine(note, names, t), ...patrolLines(note, names, t)]
              : [noteLine(note, names, t)]
            ).map((line, j) => (
              <AppText key={`${i}-${j}`} variant="tiny" color="textMuted" style={{ marginTop: 3 }}>
                {line}
              </AppText>
            ))
          )}
        </View>
      ))}
    </View>
  );
}

/** Everything public, night by night: events, letters, votes, missions. */
function PublicRecord({ state, names }: { state: NightwatchState; names: Names }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const rounds = Array.from({ length: state.round + 1 }, (_, r) => r).reverse();
  const hasAny = state.timeline.length + state.history.length + state.results.length > 0;
  if (!hasAny) return null;

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

  return (
    <View>
      <AppText variant="label" style={{ marginBottom: spacing.sm }}>
        {`🗞️  ${t("nightwatch.record.title")}`}
      </AppText>
      {rounds.map((r) => {
        const lines: { text: string; tone?: "good" | "bad" }[] = [];
        for (const e of state.timeline.filter((x) => x.round === r)) {
          lines.push({ text: timelineLine(e) });
        }
        for (const p of state.history.filter((x) => x.round === r)) {
          const yes = p.votes.map((v, s) => (v ? s : -1)).filter((s) => s >= 0);
          const no = p.votes.map((v, s) => (v ? -1 : s)).filter((s) => s >= 0);
          lines.push({
            text: `${p.bell ? "🔔" : "👑"} ${t("nightwatch.record.proposal", {
              leader: names.nameOf(p.leader),
              team: names.namesOf(p.team),
            })} — ${t(p.approved ? "nightwatch.record.approved" : "nightwatch.record.rejected")}\n👍 ${
              yes.length ? names.namesOf(yes) : "—"
            }   👎 ${no.length ? names.namesOf(no) : "—"}`,
          });
        }
        const result = state.results.find((x) => x.round === r);
        if (result) {
          const detail =
            result.missing.length > 0
              ? t("nightwatch.record.missing", { names: names.namesOf(result.missing) })
              : t("nightwatch.record.fails", { count: result.fails ?? 0 });
          lines.push({
            text: `🎯 ${t(
              result.success ? "nightwatch.record.success" : "nightwatch.record.fail",
              { room: names.roomName(result.room) }
            )} · ${detail}`,
            tone: result.success ? "good" : "bad",
          });
        }
        if (lines.length === 0) return null;
        return (
          <View key={r} style={[styles.record, { borderBottomColor: colors.divider }]}>
            <AppText variant="caption" style={styles.bold}>
              {t("nightwatch.bar.night", { n: r + 1, total: state.rounds })}
            </AppText>
            {lines.map((line, i) => (
              <AppText
                key={i}
                variant="tiny"
                style={{
                  marginTop: 3,
                  color:
                    line.tone === "good"
                      ? colors.successStrong
                      : line.tone === "bad"
                        ? colors.danger
                        : colors.textMuted,
                }}
              >
                {line.text}
              </AppText>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function Result({
  state,
  mySeat,
  names,
}: {
  state: NightwatchState;
  mySeat: number;
  names: Names;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reason = state.winReason ?? "abandoned";
  const myRole = state.roles?.[mySeat];
  const iWon =
    state.winner !== null && myRole ? sideOf(myRole) === state.winner : null;
  const prophet = state.roles?.indexOf("prophet") ?? -1;

  return (
    <View style={{ alignItems: "center" }}>
      <AppText style={{ fontSize: 48 }}>
        {state.winner === "good" ? "🏮" : state.winner === "evil" ? "👻" : "🚪"}
      </AppText>
      <AppText
        variant="h2"
        align="center"
        style={{
          marginTop: 4,
          color:
            state.winner === "good"
              ? colors.successStrong
              : state.winner === "evil"
                ? colors.danger
                : colors.text,
        }}
      >
        {state.winner ? t(`nightwatch.result.${state.winner}`) : t("nightwatch.result.none")}
      </AppText>
      <AppText variant="body" color="textMuted" align="center" style={{ marginTop: 4 }}>
        {t(`nightwatch.reasons.${reason}`, {
          name: state.assassinTarget !== null ? names.nameOf(state.assassinTarget) : "",
          prophet: prophet >= 0 ? names.nameOf(prophet) : "",
        })}
      </AppText>
      {iWon !== null ? (
        <AppText variant="label" style={{ marginTop: 8 }}>
          {t(iWon ? "nightwatch.result.youWon" : "nightwatch.result.youLost")}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  bold: { fontFamily: fontFamily.semiBold },
  row: { flexDirection: "row", alignItems: "center" },
  track: { flexDirection: "row", gap: 6 },
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
  map: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  room: {
    width: "32%",
    flexGrow: 1,
    minHeight: 86,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 8,
  },
  roomTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marks: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
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
