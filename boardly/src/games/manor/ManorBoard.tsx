import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText, BottomSheetModal, Button, Card } from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { usePromptSheet } from "@/hooks/usePromptSheet";
import { fontFamily, useTheme } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps, GamePlayer } from "../types";
import {
  ITEM_EMOJI,
  ROOMS,
  ROOM_EMOJI,
  SECURITY,
  availableActions,
  canHide,
  guessTargets,
  reachable,
  screamsByRoom,
  sideOf,
  suspects,
  taskFor,
  waitingOn,
  type ActionChoice,
  type Footage,
  type LogEntry,
  type ManorEvent,
  type ManorState,
} from "./logic";

/** Blank space added under the table while the action sheet is up. */
const SHEET_CLEARANCE = 380;

type Names = {
  nameOf: (seat: number) => string;
  namesOf: (seats: number[]) => string;
  roomName: (room: number) => string;
  hourName: (hour: number) => string;
};

export function ManorBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  onMove,
}: GameBoardProps<ManorState>) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  // What I've picked in the open prompt. Tagged with the step so it
  // clears itself when the game moves on.
  const step = `${state.phase}:${state.hour}`;
  const [pick, setPick] = useState<{
    step: string;
    room?: number;
    action?: ActionChoice;
    target?: number | null;
    hide?: boolean;
  }>({ step });
  const current = pick.step === step ? pick : { step };
  const [roleShown, setRoleShown] = useState(false);

  const over = finished || state.phase === "finished";
  const task = over ? null : taskFor(state, mySeat);
  const needsMe = task !== null;
  const { ref: sheetRef, onDismiss: onSheetDismiss } = usePromptSheet(
    needsMe,
    step
  );

  const nameOf = (seat: number) =>
    seat === mySeat
      ? t("game.you")
      : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
  const names: Names = {
    nameOf,
    namesOf: (seats) => seats.map(nameOf).join(", "),
    roomName: (room) => t(`manor.rooms.${ROOMS[room]}`),
    hourName: (hour) => t(`manor.hours.h${Math.min(hour, 8)}`),
  };

  const choose = (next: Omit<typeof current, "step">) => {
    tapHaptic();
    setPick({ ...current, ...next, step });
  };
  const send = (move: Record<string, unknown>) => {
    moveHaptic();
    onMove(move);
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

      <HouseMap
        state={state}
        selectable={
          task === "move"
            ? reachable(state.myRoom, state.myRole === "intruder")
            : []
        }
        selected={current.room}
        onSelect={(room) => choose({ room })}
        showOwner={roleShown || state.myRole !== "butler"}
      />

      {over ? (
        <Card>
          <Result state={state} mySeat={mySeat} names={names} players={players} />
        </Card>
      ) : !needsMe ? (
        <Card>
          <Waiting state={state} mySeat={mySeat} names={names} />
        </Card>
      ) : null}

      {state.myRoom !== null && !over ? (
        <MyRoom state={state} names={names} />
      ) : null}

      <Players state={state} mySeat={mySeat} players={players} names={names} />
      <Notebook state={state} names={names} />
      <Timeline state={state} names={names} />

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
          {task === "move" ? (
            <MovePrompt
              state={state}
              selected={current.room}
              busy={busy}
              names={names}
              onSelect={(room) => choose({ room })}
              onConfirm={() => send({ type: "move", room: current.room })}
            />
          ) : task === "act" ? (
            <ActPrompt
              state={state}
              choice={current.action}
              hide={current.hide ?? false}
              busy={busy}
              names={names}
              onChoose={(action) => choose({ action })}
              onToggleHide={() => choose({ hide: !current.hide })}
              onConfirm={() =>
                send({
                  type: "act",
                  action: current.action?.action,
                  item: current.action?.item,
                  hide: current.hide && canHide(state) ? true : undefined,
                })
              }
            />
          ) : task === "accuse" ? (
            <SeatPrompt
              title={`⚖️  ${t("manor.prompt.accuse")}`}
              hint={t("manor.prompt.accuseHint")}
              seats={suspects(state, mySeat)}
              selected={current.target}
              players={players}
              names={names}
              busy={busy}
              allowSkip
              confirmLabel={
                current.target === null
                  ? t("manor.prompt.skipVote")
                  : t("manor.prompt.vote")
              }
              onSelect={(target) => choose({ target })}
              onConfirm={() => send({ type: "accuse", target: current.target })}
            />
          ) : task === "guess" ? (
            <SeatPrompt
              title={`🌅  ${t("manor.prompt.guess")}`}
              hint={t("manor.prompt.guessHint")}
              seats={guessTargets(state)}
              selected={current.target}
              players={players}
              names={names}
              busy={busy}
              danger
              confirmLabel={t("manor.prompt.name")}
              onSelect={(target) => choose({ target })}
              onConfirm={() => send({ type: "guess", target: current.target })}
            />
          ) : null}
        </View>
      </BottomSheetModal>
    </View>
  );
}

// ------------------------------------------------------------- header

function NightBar({ state, names }: { state: ManorState; names: Names }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dawn = state.hour >= state.hours;

  return (
    <View style={styles.nightBar}>
      <View style={styles.grow}>
        <AppText variant="h2">
          {`${dawn ? "🌅" : "🌙"}  ${names.hourName(state.hour)}`}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {dawn
            ? t("manor.clock.dawn")
            : t("manor.clock.hour", { hour: state.hour + 1, total: state.hours })}
          {` · ${t(`manor.phases.${state.phase}`)}`}
        </AppText>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <AppText variant="tiny" color="textSubtle">
          {t("manor.clock.owner")}
        </AppText>
        <AppText style={{ fontSize: 20, color: colors.danger }}>
          {Array.from({ length: state.ownerMaxHp }, (_, i) =>
            i < state.ownerHp ? "❤️" : "🖤"
          ).join(" ")}
        </AppText>
      </View>
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
  state: ManorState;
  mySeat: number;
  shown: boolean;
  onToggle?: () => void;
  names: Names;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const role = state.myRole!;
  const evil = sideOf(role) === "evil";
  const allies = (state.intruders ?? []).filter((s) => s !== mySeat);

  return (
    <Card onPress={onToggle}>
      <AppText variant="caption" color="textMuted">
        {t("manor.role.title")}
      </AppText>
      {shown ? (
        <>
          <View style={styles.roleHead}>
            <AppText style={{ fontSize: 44 }}>
              {role === "butler"
                ? "🤵"
                : role === "guard"
                  ? "🔦"
                  : role === "intruder"
                    ? "🗡️"
                    : "🧳"}
            </AppText>
            <View style={styles.grow}>
              <AppText
                variant="h2"
                style={{ color: evil ? colors.danger : colors.successStrong }}
              >
                {t(`manor.roles.${role}.name`)}
              </AppText>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                {t(`manor.roles.${role}.desc`)}
              </AppText>
            </View>
          </View>
          {evil && allies.length > 0 ? (
            <AppText variant="bodyMedium" style={{ marginTop: 8 }}>
              {t("manor.role.allies", { names: names.namesOf(allies) })}
            </AppText>
          ) : null}
          {evil && state.ringleader !== null ? (
            <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
              {t("manor.role.ringleader", { name: names.nameOf(state.ringleader) })}
            </AppText>
          ) : null}
          {state.ownerSeenAt !== null ? (
            <AppText variant="bodyMedium" style={{ marginTop: 8 }}>
              {t("manor.role.ownerAt", { room: names.roomName(state.ownerSeenAt) })}
            </AppText>
          ) : null}
          {onToggle ? (
            <AppText variant="tiny" color="textSubtle" style={{ marginTop: 8 }}>
              {t("manor.role.hide")}
            </AppText>
          ) : null}
        </>
      ) : (
        <AppText variant="title" style={{ marginTop: 4 }}>
          {t("manor.role.reveal")}
        </AppText>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- map

function HouseMap({
  state,
  selectable,
  selected,
  onSelect,
  showOwner,
}: {
  state: ManorState;
  selectable: number[];
  selected?: number;
  onSelect: (room: number) => void;
  /** The Butler's marker stays hidden while their role card is. */
  showOwner: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const screams = screamsByRoom(state.events);
  const ownerAt = state.ownerRoom ?? (showOwner ? state.ownerSeenAt : null);

  return (
    <View style={styles.map}>
      {ROOMS.map((id, room) => {
        const mine = state.myRoom === room;
        const canGo = selectable.includes(room);
        const isSelected = selected === room;
        const camera = state.cameras[room];
        const ownerMark =
          (mine && state.ownerHere) || ownerAt === room ? "👴" : null;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: !canGo }}
            disabled={!canGo}
            onPress={() => onSelect(room)}
            style={[
              styles.room,
              {
                backgroundColor: isSelected
                  ? colors.primarySoft
                  : mine
                    ? colors.well
                    : colors.card,
                borderColor: isSelected
                  ? colors.primary
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
              <AppText style={{ fontSize: 20 }}>{ROOM_EMOJI[id]}</AppText>
              {camera !== null ? (
                <AppText
                  variant="tiny"
                  style={{
                    fontFamily: fontFamily.semiBold,
                    color: camera ? colors.successStrong : colors.danger,
                  }}
                >
                  {camera ? "📷 ON" : "📷 ✕"}
                </AppText>
              ) : null}
            </View>
            <AppText variant="tiny" numberOfLines={1} style={{ marginTop: 2 }}>
              {t(`manor.rooms.${id}`)}
            </AppText>
            <View style={styles.marks}>
              {mine ? (
                <AppText variant="tiny" color="primary" style={styles.bold}>
                  {t("manor.map.you")}
                </AppText>
              ) : null}
              {ownerMark ? <AppText variant="tiny">{ownerMark}</AppText> : null}
              {mine
                ? state.roomItems.map((item) => (
                    <AppText key={item} variant="tiny">
                      {ITEM_EMOJI[item]}
                    </AppText>
                  ))
                : null}
              {screams[room] ? (
                <AppText variant="tiny" color="danger" style={styles.bold}>
                  {"❗".repeat(screams[room])}
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

function MovePrompt({
  state,
  selected,
  busy,
  names,
  onSelect,
  onConfirm,
}: {
  state: ManorState;
  selected?: number;
  busy: boolean;
  names: Names;
  onSelect: (room: number) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const here = state.myRoom;
  const anywhere = state.myRole === "intruder";

  return (
    <>
      <AppText variant="title">
        {`🚶  ${t("manor.prompt.move", { time: names.hourName(state.hour) })}`}
      </AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {t(anywhere ? "manor.prompt.moveHintIntruder" : "manor.prompt.moveHint")}
        {here === SECURITY ? ` ${t("manor.prompt.leaveSecurity")}` : ""}
      </AppText>
      <View style={[styles.chips, { marginTop: spacing.md }]}>
        {reachable(here, anywhere).map((room) => (
          <Chip
            key={room}
            label={`${ROOM_EMOJI[ROOMS[room]]}  ${
              room === here
                ? t("manor.prompt.stay", { room: names.roomName(room) })
                : names.roomName(room)
            }`}
            selected={selected === room}
            disabled={busy}
            onPress={() => onSelect(room)}
          />
        ))}
      </View>
      <Button
        label={t("manor.prompt.go")}
        style={{ marginTop: spacing.md }}
        disabled={selected === undefined}
        loading={busy}
        onPress={onConfirm}
      />
    </>
  );
}

function ActPrompt({
  state,
  choice,
  hide,
  busy,
  names,
  onChoose,
  onToggleHide,
  onConfirm,
}: {
  state: ManorState;
  choice?: ActionChoice;
  hide: boolean;
  busy: boolean;
  names: Names;
  onChoose: (choice: ActionChoice) => void;
  onToggleHide: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const options = availableActions(state);
  const ready = choice !== undefined;

  return (
    <>
      <AppText variant="title">
        {`🕯️  ${t("manor.prompt.act", { room: names.roomName(state.myRoom ?? 0) })}`}
      </AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {state.othersHere > 0
          ? t("manor.room.others", { count: state.othersHere })
          : t("manor.room.alone")}
        {state.ownerHere ? `  ·  👴 ${t("manor.room.ownerShort")}` : ""}
      </AppText>
      <View style={{ gap: 8, marginTop: spacing.md }}>
        {options.map((option) => {
          const key = `${option.action}:${option.item ?? ""}`;
          const isSelected =
            choice?.action === option.action && choice?.item === option.item;
          const danger = option.action === "attack" || option.action === "break";
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              disabled={busy}
              onPress={() => onChoose(option)}
              style={[
                styles.action,
                {
                  backgroundColor: isSelected ? colors.primarySoft : colors.well,
                  borderColor: isSelected
                    ? danger
                      ? colors.danger
                      : colors.primary
                    : colors.border,
                },
              ]}
            >
              <AppText variant="label" style={danger ? { color: colors.danger } : null}>
                {t(`manor.actions.${option.action}.name`, {
                  item: option.item ? t(`manor.items.${option.item}`) : "",
                })}
              </AppText>
              <AppText variant="tiny" color="textSubtle" style={{ marginTop: 2 }}>
                {t(`manor.actions.${option.action}.desc`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {canHide(state) ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hide }}
          disabled={busy}
          onPress={onToggleHide}
          style={[
            styles.action,
            styles.toggle,
            {
              marginTop: spacing.md,
              backgroundColor: hide ? colors.primarySoft : colors.well,
              borderColor: hide ? colors.primary : colors.border,
            },
          ]}
        >
          <View style={styles.grow}>
            <AppText variant="label">{`🫥  ${t("manor.prompt.hide")}`}</AppText>
            <AppText variant="tiny" color="textSubtle" style={{ marginTop: 2 }}>
              {t("manor.prompt.hideHint")}
            </AppText>
          </View>
          <AppText variant="label" color={hide ? "primary" : "textSubtle"}>
            {hide ? "☑" : "☐"}
          </AppText>
        </Pressable>
      ) : null}
      <Button
        label={t("manor.prompt.confirm")}
        variant={choice?.action === "attack" ? "danger" : "primary"}
        style={{ marginTop: spacing.md }}
        disabled={!ready}
        loading={busy}
        onPress={onConfirm}
      />
    </>
  );
}

function SeatPrompt({
  title,
  hint,
  seats,
  selected,
  players,
  names,
  busy,
  allowSkip,
  danger,
  confirmLabel,
  onSelect,
  onConfirm,
}: {
  title: string;
  hint: string;
  seats: number[];
  selected?: number | null;
  players: GamePlayer[];
  names: Names;
  busy: boolean;
  allowSkip?: boolean;
  danger?: boolean;
  confirmLabel: string;
  onSelect: (seat: number | null) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <>
      <AppText variant="title">{title}</AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        {hint}
      </AppText>
      <View style={[styles.chips, { marginTop: spacing.md }]}>
        {seats.map((seat) => {
          const player = players.find((p) => p.seat === seat);
          const isSelected = selected === seat;
          return (
            <Pressable
              key={seat}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              disabled={busy}
              onPress={() => onSelect(seat)}
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
            </Pressable>
          );
        })}
        {allowSkip ? (
          <Chip
            label={`🤷  ${t("manor.prompt.skip")}`}
            selected={selected === null}
            disabled={busy}
            onPress={() => onSelect(null)}
          />
        ) : null}
      </View>
      <Button
        label={confirmLabel}
        variant={danger ? "danger" : "primary"}
        style={{ marginTop: spacing.md }}
        disabled={selected === undefined}
        loading={busy}
        onPress={onConfirm}
      />
    </>
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

// -------------------------------------------------------------- cards

function Waiting({
  state,
  mySeat,
  names,
}: {
  state: ManorState;
  mySeat: number;
  names: Names;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const pending = waitingOn(state).filter((s) => s !== mySeat);
  const mine = state.myOrder;
  const locked = mySeat >= 0 && state.locked.includes(mySeat);

  let chosen: string | null = null;
  if (mine?.room !== undefined) {
    chosen = t("manor.chosen.move", { room: names.roomName(mine.room) });
  } else if (mine?.action) {
    chosen = t("manor.chosen.act", {
      action: t(`manor.actions.${mine.action}.name`, {
        item: mine.item ? t(`manor.items.${mine.item}`) : "",
      }),
    });
    if (mine.hide) chosen += ` · 🫥 ${t("manor.chosen.hidden")}`;
  } else if (mine && "target" in mine) {
    chosen =
      mine.target === null || mine.target === undefined
        ? t("manor.chosen.skip")
        : t("manor.chosen.vote", { name: names.nameOf(mine.target) });
  }

  return (
    <>
      <AppText variant="title">
        {state.phase === "guess"
          ? t("manor.waiting.guess", { name: names.nameOf(state.ringleader ?? -1) })
          : state.phase === "gathering"
            ? t("manor.waiting.gathering")
            : t(`manor.waiting.${state.phase}`)}
      </AppText>
      {locked ? (
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {`🔒  ${t("manor.waiting.locked")}`}
        </AppText>
      ) : null}
      {chosen ? (
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {chosen}
        </AppText>
      ) : null}
      {pending.length > 0 ? (
        <AppText variant="caption" color="textSubtle" style={{ marginTop: spacing.sm }}>
          {`⏳  ${t("manor.waiting.on", { names: names.namesOf(pending) })}`}
        </AppText>
      ) : null}
    </>
  );
}

function MyRoom({ state, names }: { state: ManorState; names: Names }) {
  const { t } = useTranslation();
  const room = state.myRoom!;

  return (
    <Card>
      <AppText variant="caption" color="textMuted">
        {t("manor.room.title")}
      </AppText>
      <AppText variant="title" style={{ marginTop: 2 }}>
        {`${ROOM_EMOJI[ROOMS[room]]}  ${names.roomName(room)}`}
      </AppText>
      <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
        {state.othersHere > 0
          ? t("manor.room.others", { count: state.othersHere })
          : t("manor.room.alone")}
      </AppText>
      {state.ownerHere ? (
        <AppText variant="bodyMedium" style={{ marginTop: 4 }}>
          {`👴  ${t("manor.room.owner")}`}
        </AppText>
      ) : null}
      {state.roomItems.length > 0 ? (
        <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
          {t("manor.room.items", {
            items: state.roomItems
              .map((item) => `${ITEM_EMOJI[item]} ${t(`manor.items.${item}`)}`)
              .join(", "),
          })}
        </AppText>
      ) : null}
      <AppText variant="caption" color="textSubtle" style={{ marginTop: 6 }}>
        {state.myItem
          ? t("manor.room.carrying", {
              item: `${ITEM_EMOJI[state.myItem]} ${t(`manor.items.${state.myItem}`)}`,
            })
          : t("manor.room.emptyHanded")}
      </AppText>
      {state.followingMe ? (
        <AppText variant="caption" color="primary" style={{ marginTop: 4 }}>
          {`👣  ${t("manor.room.following")}`}
        </AppText>
      ) : null}
    </Card>
  );
}

function Players({
  state,
  mySeat,
  players,
  names,
}: {
  state: ManorState;
  mySeat: number;
  players: GamePlayer[];
  names: Names;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View>
      <AppText variant="label" style={{ marginBottom: spacing.sm }}>
        {t("manor.players.title")}
      </AppText>
      <View style={styles.chips}>
        {players
          .slice()
          .sort((a, b) => a.seat - b.seat)
          .map((player) => {
            const seat = player.seat;
            const role = state.roles?.[seat];
            const ally =
              !role && seat !== mySeat && (state.intruders ?? []).includes(seat);
            const locked = state.locked.includes(seat);
            const tag = role
              ? t(`manor.roles.${role}.name`)
              : ally
                ? t("manor.players.ally")
                : null;
            return (
              <View
                key={player.userId}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <AvatarBorder
                  name={player.username}
                  borderId={player.borderId}
                  avatarUrl={player.avatarUrl}
                  size={32}
                />
                <View style={styles.grow}>
                  <AppText variant="label" numberOfLines={1}>
                    {names.nameOf(seat)}
                    {locked ? "  🔒" : ""}
                  </AppText>
                  {tag ? (
                    <AppText
                      variant="tiny"
                      style={{
                        color:
                          role === "intruder" || ally
                            ? colors.danger
                            : colors.successStrong,
                      }}
                    >
                      {tag}
                    </AppText>
                  ) : null}
                </View>
                {state.ready[seat] ? (
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

/** My private notes, newest first: where I was, who with, what I saw. */
function Notebook({ state, names }: { state: ManorState; names: Names }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  if (state.log.length === 0) return null;

  return (
    <View>
      <AppText variant="label">{`📓  ${t("manor.log.title")}`}</AppText>
      <AppText variant="tiny" color="textSubtle" style={{ marginBottom: spacing.sm }}>
        {t("manor.log.hint")}
      </AppText>
      {state.log
        .slice()
        .reverse()
        .map((entry) => (
          <View
            key={entry.hour}
            style={[styles.record, { borderBottomColor: colors.divider }]}
          >
            <AppText variant="caption" style={styles.bold}>
              {`${names.hourName(entry.hour)} · ${names.roomName(entry.room)}`}
            </AppText>
            {logLines(entry, names, t).map((line, i) => (
              <AppText key={i} variant="tiny" color="textMuted" style={{ marginTop: 3 }}>
                {line}
              </AppText>
            ))}
            {entry.footage ? (
              <FootageList footage={entry.footage} names={names} />
            ) : null}
          </View>
        ))}
    </View>
  );
}

function logLines(
  entry: LogEntry,
  names: Names,
  t: (key: string, options?: Record<string, unknown>) => string
): string[] {
  const lines = [
    entry.others > 0
      ? t("manor.room.others", { count: entry.others })
      : t("manor.room.alone"),
  ];
  if (entry.owner) lines.push(`👴 ${t("manor.room.owner")}`);
  const action = entry.action.action;
  if (action) {
    lines.push(
      t("manor.log.did", {
        action: t(`manor.actions.${action}.name`, {
          item: entry.action.item ? t(`manor.items.${entry.action.item}`) : "",
        }),
      })
    );
  }
  if (entry.action.hide) lines.push(`🫥 ${t("manor.chosen.hidden")}`);
  if (entry.took === null) lines.push(t("manor.log.tookNone"));
  if (entry.attack) lines.push(`⚠️ ${t(`manor.log.attack.${entry.attack}`)}`);
  const search = entry.search;
  if (search && "found" in search) {
    lines.push(t(search.found ? "manor.log.feltSomething" : "manor.log.feltNothing"));
  } else if (search) {
    lines.push(
      search.item
        ? t("manor.log.searchFound", {
            name: names.nameOf(search.target),
            item: t(`manor.items.${search.item}`),
          })
        : t("manor.log.searchNothing", { name: names.nameOf(search.target) })
    );
  }
  if (entry.seen) {
    lines.push(
      entry.seen.length === 0
        ? `🔦 ${t("manor.log.seenNobody")}`
        : `🔦 ${entry.seen
            .map((o) =>
              t("manor.log.seenAction", {
                name: names.nameOf(o.seat),
                action: t(`manor.actions.${o.action}.name`, {
                  item: o.item ? t(`manor.items.${o.item}`) : "",
                }),
              })
            )
            .join(" · ")}`
    );
  }
  return lines;
}

function FootageList({ footage, names }: { footage: Footage[]; names: Names }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.footage, { borderColor: colors.primarySoftBorder }]}>
      <AppText variant="tiny" color="primary" style={styles.bold}>
        {`📼  ${t("manor.log.footage")}`}
      </AppText>
      {footage.length === 0 ? (
        <AppText variant="tiny" color="textMuted" style={{ marginTop: 3 }}>
          {t("manor.log.noFootage")}
        </AppText>
      ) : (
        footage.map((clip) => {
          const parts = [
            clip.seats.length > 0
              ? t("manor.footage.seen", { names: names.namesOf(clip.seats) })
              : t("manor.footage.empty"),
          ];
          if (clip.entered.length > 0)
            parts.push(t("manor.footage.entered", { names: names.namesOf(clip.entered) }));
          if (clip.left.length > 0)
            parts.push(t("manor.footage.left", { names: names.namesOf(clip.left) }));
          if (clip.ownerEntered) parts.push(t("manor.footage.ownerEntered"));
          else if (clip.ownerLeft) parts.push(t("manor.footage.ownerLeft"));
          else if (clip.owner) parts.push(t("manor.footage.owner"));
          return (
            <AppText key={clip.room} variant="tiny" style={{ marginTop: 3 }}>
              {`${ROOM_EMOJI[ROOMS[clip.room]]} ${names.roomName(clip.room)}: ${parts.join(" · ")}`}
            </AppText>
          );
        })
      )}
    </View>
  );
}

/** Public record: screams, cameras going on/off, and meetings. */
function Timeline({ state, names }: { state: ManorState; names: Names }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  if (state.events.length === 0) return null;

  const line = (e: ManorEvent) => {
    const time = names.hourName(e.hour);
    if (e.kind === "scream")
      return `❗ ${time} · ${t("manor.events.scream", { room: names.roomName(e.room) })}`;
    if (e.kind !== "gathering")
      return `📷 ${time} · ${t(`manor.events.${e.kind}`, { room: names.roomName(e.room) })}`;
    const voters = e.votes
      .map((target, seat) =>
        target === null ? null : `${names.nameOf(seat)} → ${names.nameOf(target)}`
      )
      .filter(Boolean)
      .join(", ");
    return `⚖️ ${time} · ${
      e.locked !== null
        ? t("manor.events.locked", { name: names.nameOf(e.locked) })
        : t("manor.events.nobody")
    }${voters ? `\n${voters}` : ""}`;
  };

  return (
    <View>
      <AppText variant="label" style={{ marginBottom: spacing.sm }}>
        {`🗞️  ${t("manor.events.title")}`}
      </AppText>
      {state.events
        .map((e, i) => ({ e, i }))
        .reverse()
        .map(({ e, i }) => (
          <View key={i} style={[styles.record, { borderBottomColor: colors.divider }]}>
            <AppText variant="caption">{line(e)}</AppText>
          </View>
        ))}
    </View>
  );
}

function Result({
  state,
  mySeat,
  names,
  players,
}: {
  state: ManorState;
  mySeat: number;
  names: Names;
  players: GamePlayer[];
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reason = state.winReason ?? "abandoned";
  const myRole = state.roles?.[mySeat];
  const iWon =
    state.winner !== null && myRole ? sideOf(myRole) === state.winner : null;
  const butler = state.roles?.indexOf("butler") ?? -1;

  return (
    <View style={{ alignItems: "center" }}>
      <AppText style={{ fontSize: 48 }}>
        {state.winner === "good" ? "🌅" : state.winner === "evil" ? "🗡️" : "🚪"}
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
        {state.winner ? t(`manor.result.${state.winner}`) : t("manor.result.none")}
      </AppText>
      <AppText variant="body" color="textMuted" align="center" style={{ marginTop: 4 }}>
        {t(`manor.reasons.${reason}`, {
          name: state.guessTarget !== null ? names.nameOf(state.guessTarget) : "",
          butler: butler >= 0 ? names.nameOf(butler) : "",
        })}
      </AppText>
      {state.ownerRoom !== null && players.length > 0 ? (
        <AppText variant="caption" color="textSubtle" align="center" style={{ marginTop: 4 }}>
          {t("manor.result.ownerWas", { room: names.roomName(state.ownerRoom) })}
        </AppText>
      ) : null}
      {iWon !== null ? (
        <AppText variant="label" style={{ marginTop: 8 }}>
          {t(iWon ? "manor.result.youWon" : "manor.result.youLost")}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  bold: { fontFamily: fontFamily.semiBold },
  nightBar: { flexDirection: "row", alignItems: "center", gap: 12 },
  roleHead: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8 },
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
  toggle: { flexDirection: "row", alignItems: "center", gap: 10 },
  record: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  footage: {
    marginTop: 6,
    borderLeftWidth: 2,
    paddingLeft: 8,
    paddingVertical: 2,
  },
});
