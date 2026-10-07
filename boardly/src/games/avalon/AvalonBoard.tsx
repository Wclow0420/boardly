import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  AppText,
  BottomSheetModal,
  Button,
  Card,
} from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { usePromptSheet } from "@/hooks/usePromptSheet";
import { fontFamily, useTheme } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps } from "../types";
import { AvalonReveal } from "./AvalonReveal";
import { HoldButton } from "./HoldButton";
import { RolePortrait } from "./RolePortrait";
import {
  MAX_REJECTIONS,
  assassinTargets,
  newReveals,
  pendingAction,
  seenOf,
  sideOf,
  teamSize,
  toggleSeat,
  type AvalonState,
  type Reveal,
  type Role,
} from "./logic";

/** Blank space added under the table while the action sheet is up. */
const SHEET_CLEARANCE = 340;

export function AvalonBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  onMove,
}: GameBoardProps<AvalonState>) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  // Seats picked while building a team / choosing the assassin's target.
  // Tagged with the step it belongs to, so it clears itself when the
  // game moves on.
  const step = `${state.phase}:${state.quest}:${state.leader}:${state.rejections}`;
  const [selection, setSelection] = useState<{ step: string; seats: number[] }>(
    { step, seats: [] }
  );
  const selected = selection.step === step ? selection.seats : [];
  // Your role stays face down until you tap it — players often share a room
  const [roleShown, setRoleShown] = useState(false);

  // Announce finished votes, finished quests and the end of the game.
  // Starts from the state the screen opened with, so reloading mid-game
  // doesn't replay old results.
  const [seen, setSeen] = useState(() => seenOf(state));
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const now = seenOf(state);
  if (
    now.votes !== seen.votes ||
    now.quests !== seen.quests ||
    now.ended !== seen.ended
  ) {
    setSeen(now);
    setReveals([...reveals, ...newReveals(seen, state)]);
  }

  const over = finished || state.phase === "finished";
  const action = over ? null : pendingAction(state, mySeat);
  const size = teamSize(state);
  const targets = action === "assassinate" ? assassinTargets(state) : [];

  const nameOf = (seat: number) =>
    seat === mySeat
      ? t("game.you")
      : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
  const namesOf = (seats: number[]) => seats.map(nameOf).join(", ");

  const onSelect = (seat: number) => {
    tapHaptic();
    setSelection({
      step,
      seats:
        action === "assassinate"
          ? selected.includes(seat)
            ? []
            : [seat]
          : toggleSeat(selected, seat, size),
    });
  };

  const send = (move: Record<string, unknown>) => {
    moveHaptic();
    onMove(move);
  };

  // Whatever the game needs from me comes up as a sheet pinned to the
  // bottom. It can't be swiped away — it closes when I've answered.
  const needsMe = action !== null;
  const { ref: sheetRef, onDismiss: onSheetDismiss } = usePromptSheet(
    needsMe,
    step
  );

  /** Tappable player chips, for picking a team or the Hitman's target. */
  const picker = (seats: number[]) => (
    <View style={[styles.chips, { marginTop: spacing.md }]}>
      {seats.map((seat) => {
        const isSelected = selected.includes(seat);
        const player = players.find((p) => p.seat === seat);
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
              size={28}
            />
            <AppText variant="label" numberOfLines={1} style={styles.grow}>
              {nameOf(seat)}
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

  /** The question the game is asking me — shown in the bottom sheet. */
  const prompt =
    action === "propose" ? (
      <>
        <AppText variant="title">
          {`👑  ${t("avalon.team.pick", { count: size, quest: state.quest + 1 })}`}
        </AppText>
        {picker(players.map((p) => p.seat).sort((a, b) => a - b))}
        <Button
          label={t("avalon.team.propose", { picked: selected.length, count: size })}
          style={{ marginTop: spacing.md }}
          disabled={selected.length !== size}
          loading={busy}
          onPress={() => send({ type: "propose", team: selected })}
        />
      </>
    ) : action === "vote" ? (
      <>
        <AppText variant="title">
          {`🗳️  ${t("avalon.vote.title", { name: nameOf(state.leader) })}`}
        </AppText>
        <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
          {namesOf(state.team)}
        </AppText>
        <View style={[styles.buttons, { marginTop: spacing.md }]}>
          <Button
            label={t("avalon.vote.reject")}
            variant="danger"
            style={styles.grow}
            disabled={busy}
            onPress={() => send({ type: "vote", approve: false })}
          />
          <Button
            label={t("avalon.vote.approve")}
            style={styles.grow}
            disabled={busy}
            onPress={() => send({ type: "vote", approve: true })}
          />
        </View>
      </>
    ) : action === "quest" ? (
      <>
        <AppText variant="title">
          {`🎬  ${t("avalon.quest.title", { quest: state.quest + 1 })}`}
        </AppText>
        <View style={[styles.buttons, { marginTop: spacing.md }]}>
          <HoldButton
            label={t("avalon.quest.fail")}
            variant="danger"
            style={styles.grow}
            accessibilityHint={t("avalon.quest.hold")}
            disabled={busy || !state.myRole || sideOf(state.myRole) === "good"}
            onComplete={() => send({ type: "quest", card: "fail" })}
          />
          <HoldButton
            label={t("avalon.quest.success")}
            style={styles.grow}
            accessibilityHint={t("avalon.quest.hold")}
            disabled={busy}
            onComplete={() => send({ type: "quest", card: "success" })}
          />
        </View>
        <AppText variant="caption" color="textSubtle" style={{ marginTop: spacing.sm }}>
          {`${t("avalon.quest.hold")} ${t("avalon.quest.secret")}`}
        </AppText>
      </>
    ) : action === "assassinate" ? (
      <>
        <AppText variant="title">{`🎯  ${t("avalon.assassinate.pick")}`}</AppText>
        <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
          {t("avalon.assassinate.explain")}
        </AppText>
        {picker(targets)}
        <Button
          label={t("avalon.assassinate.confirm")}
          variant="danger"
          style={{ marginTop: spacing.md }}
          disabled={selected.length !== 1}
          loading={busy}
          onPress={() => send({ type: "assassinate", target: selected[0] })}
        />
      </>
    ) : null;

  return (
    <View style={{ gap: spacing.lg }}>
      <QuestTrack state={state} />

      {state.myRole ? (
        <RoleCard
          state={state}
          shown={roleShown || over}
          onToggle={over ? undefined : () => setRoleShown((v) => !v)}
          namesOf={namesOf}
        />
      ) : null}

      {/* What's happening while it isn't on me, and the final result */}
      {over ? (
        <Card>
          <Result state={state} mySeat={mySeat} nameOf={nameOf} />
        </Card>
      ) : !needsMe ? (
        <Card>
          {state.phase === "team" ? (
            <AppText variant="title">
              {t("avalon.team.waiting", { name: nameOf(state.leader), count: size })}
            </AppText>
          ) : state.phase === "vote" ? (
            <>
              <AppText variant="title">
                {t("avalon.vote.title", { name: nameOf(state.leader) })}
              </AppText>
              <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
                {namesOf(state.team)}
              </AppText>
              <AppText variant="caption" color="textSubtle" style={{ marginTop: spacing.sm }}>
                {state.myVote !== null
                  ? `${t(
                      state.myVote
                        ? "avalon.vote.youApproved"
                        : "avalon.vote.youRejected"
                    )} · `
                  : ""}
                {`⏳  ${t("avalon.vote.waiting", {
                  done: state.voted.filter(Boolean).length,
                  total: state.numPlayers,
                })}`}
              </AppText>
            </>
          ) : state.phase === "quest" ? (
            <>
              <AppText variant="title">
                {t("avalon.quest.title", { quest: state.quest + 1 })}
              </AppText>
              <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
                {namesOf(state.team)}
              </AppText>
              <AppText variant="caption" color="textSubtle" style={{ marginTop: spacing.sm }}>
                {`⏳  ${t("avalon.quest.waiting", {
                  done: state.questPlayed.length,
                  total: state.team.length,
                })}`}
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="title">
                {t("avalon.assassinate.waiting", {
                  name: nameOf(state.assassinSeat ?? -1),
                })}
              </AppText>
              <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
                {t("avalon.assassinate.explain")}
              </AppText>
            </>
          )}
        </Card>
      ) : null}

      {/* Players */}
      <View style={{ gap: spacing.sm }}>
        {players
          .slice()
          .sort((a, b) => a.seat - b.seat)
          .map((player) => {
            const seat = player.seat;
            const role = state.roles?.[seat];
            const known = state.known.find((k) => k.seat === seat);
            const revealedEvil = state.evilSeats?.includes(seat) ?? false;
            const leading =
              !over && state.phase !== "assassinate" && state.leader === seat;
            const onTeam =
              state.phase === "vote" || state.phase === "quest"
                ? state.team.includes(seat)
                : false;
            const acted =
              state.phase === "vote"
                ? state.voted[seat]
                : state.phase === "quest"
                  ? state.questPlayed.includes(seat)
                  : false;

            const note = role
              ? { text: t(`avalon.roles.${role}.name`), evil: sideOf(role) === "evil" }
              : revealedEvil
                ? { text: t("avalon.sides.evil"), evil: true }
                : known && roleShown
                  ? {
                      text: t(`avalon.known.${known.as}`),
                      evil: known.as === "evil",
                    }
                  : null;

            return (
              <View
                key={player.userId}
                style={[
                  styles.player,
                  {
                    backgroundColor: colors.card,
                    borderColor: leading
                      ? colors.primarySoftBorder
                      : onTeam
                        ? colors.info
                        : colors.border,
                  },
                ]}
              >
                {role ? (
                  <RolePortrait role={role} size={40} />
                ) : (
                  <AvatarBorder
                    name={player.username}
                    borderId={player.borderId}
                    size={40}
                    crown={leading}
                    ringColor={leading ? colors.primary : colors.border}
                  />
                )}
                <View style={styles.grow}>
                  <AppText
                    numberOfLines={1}
                    style={{ fontFamily: fontFamily.semiBold, fontSize: 15 }}
                  >
                    {nameOf(seat)}
                    {state.assassinTarget === seat ? "  🎯" : ""}
                  </AppText>
                  {note ? (
                    <AppText
                      variant="tiny"
                      style={{
                        marginTop: 2,
                        color: note.evil ? colors.danger : colors.successStrong,
                      }}
                    >
                      {note.text}
                    </AppText>
                  ) : null}
                </View>
                {onTeam ? <Tag label={t("avalon.tags.team")} tone="info" /> : null}
                {acted ? <Tag label="✓" tone="success" /> : null}
              </View>
            );
          })}
      </View>

      <History state={state} nameOf={nameOf} namesOf={namesOf} />

      {/* Room to scroll the table clear of the open sheet */}
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
          {prompt}
        </View>
      </BottomSheetModal>

      {reveals[0] ? (
        <AvalonReveal
          key={reveals[0].id}
          reveal={reveals[0]}
          nameOf={nameOf}
          namesOf={namesOf}
          onDone={() => setReveals((queue) => queue.slice(1))}
        />
      ) : null}
    </View>
  );
}

function Tag({ label, tone }: { label: string; tone: "info" | "success" }) {
  const { colors, radius } = useTheme();
  const tint =
    tone === "info"
      ? { bg: colors.infoSoft, fg: colors.info }
      : { bg: colors.successSoft, fg: colors.successStrong };
  return (
    <View
      style={{
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: radius.sm,
        backgroundColor: tint.bg,
      }}
    >
      <AppText variant="tiny" style={{ fontFamily: fontFamily.semiBold, color: tint.fg }}>
        {label}
      </AppText>
    </View>
  );
}

/** Five quest markers (team size, result) plus the rejected-teams count. */
function QuestTrack({ state }: { state: AvalonState }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const running = state.phase !== "finished";

  return (
    <View>
      <View style={styles.track}>
        {state.questSizes.map((questSize, index) => {
          const result = state.questResults[index];
          const current = running && index === state.quest && !result;
          return (
            <View key={index} style={styles.quest}>
              <View
                style={[
                  styles.questDot,
                  {
                    backgroundColor: result
                      ? result.success
                        ? colors.success
                        : colors.danger
                      : colors.well,
                    borderColor: current ? colors.primary : "transparent",
                  },
                ]}
              >
                <AppText
                  style={{
                    fontFamily: fontFamily.bold,
                    fontSize: 17,
                    color: result ? colors.primaryContrast : colors.text,
                  }}
                >
                  {result ? (result.success ? "✓" : "✕") : questSize}
                </AppText>
              </View>
              <AppText variant="tiny" color="textSubtle" align="center">
                {state.failsRequired[index] > 1
                  ? t("avalon.track.twoFails")
                  : t("avalon.track.quest", { quest: index + 1 })}
              </AppText>
            </View>
          );
        })}
      </View>
      <AppText
        variant="caption"
        align="center"
        style={{
          marginTop: 10,
          color:
            state.rejections >= MAX_REJECTIONS - 2
              ? colors.danger
              : colors.textSubtle,
        }}
      >
        {t("avalon.track.rejections", {
          count: state.rejections,
          max: MAX_REJECTIONS,
        })}
      </AppText>
    </View>
  );
}

function RoleCard({
  state,
  shown,
  onToggle,
  namesOf,
}: {
  state: AvalonState;
  shown: boolean;
  onToggle?: () => void;
  namesOf: (seats: number[]) => string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const role = state.myRole as Role;
  const evil = sideOf(role) === "evil";
  const knownSeats = state.known.map((k) => k.seat);

  return (
    <Card onPress={onToggle}>
      <AppText variant="caption" color="textMuted">
        {t("avalon.role.title")}
      </AppText>
      {shown ? (
        <>
          <View style={styles.roleHead}>
            <RolePortrait role={role} size={72} />
            <View style={styles.grow}>
              <AppText
                variant="h2"
                style={{ color: evil ? colors.danger : colors.successStrong }}
              >
                {t(`avalon.roles.${role}.name`)}
              </AppText>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                {t(`avalon.roles.${role}.desc`)}
              </AppText>
            </View>
          </View>
          {knownSeats.length > 0 ? (
            <AppText variant="bodyMedium" style={{ marginTop: 8 }}>
              {t(`avalon.role.knows.${role === "percival" ? "merlin" : evil ? "allies" : "evil"}`, {
                names: namesOf(knownSeats),
              })}
            </AppText>
          ) : null}
          {onToggle ? (
            <AppText variant="tiny" color="textSubtle" style={{ marginTop: 8 }}>
              {t("avalon.role.hide")}
            </AppText>
          ) : null}
        </>
      ) : (
        <AppText variant="title" style={{ marginTop: 4 }}>
          {t("avalon.role.reveal")}
        </AppText>
      )}
    </Card>
  );
}

function Result({
  state,
  mySeat,
  nameOf,
}: {
  state: AvalonState;
  mySeat: number;
  nameOf: (seat: number) => string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  // A table that ended early (someone left) has no winner
  const reason = state.winReason ?? "abandoned";
  const myRole = state.roles?.[mySeat];
  const iWon =
    state.winner !== null && myRole ? sideOf(myRole) === state.winner : null;

  return (
    <View style={{ alignItems: "center" }}>
      <AppText style={styles.resultEmoji}>
        {state.winner === "good" ? "🕵️" : state.winner === "evil" ? "🐀" : "🚪"}
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
        {state.winner
          ? t(`avalon.result.${state.winner}`)
          : t("avalon.result.none")}
      </AppText>
      <AppText variant="body" color="textMuted" align="center" style={{ marginTop: 4 }}>
        {t(`avalon.reasons.${reason}`, {
          name:
            state.assassinTarget !== null ? nameOf(state.assassinTarget) : "",
        })}
      </AppText>
      {iWon !== null ? (
        <AppText variant="label" style={{ marginTop: 8 }}>
          {t(iWon ? "avalon.result.youWon" : "avalon.result.youLost")}
        </AppText>
      ) : null}
    </View>
  );
}

/** Public record: every proposed team with how each player voted, and
 *  each quest's outcome. */
function History({
  state,
  nameOf,
  namesOf,
}: {
  state: AvalonState;
  nameOf: (seat: number) => string;
  namesOf: (seats: number[]) => string;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  if (state.history.length === 0) return null;

  return (
    <View>
      <AppText variant="label" style={{ marginBottom: spacing.sm }}>
        {t("avalon.history.title")}
      </AppText>
      {state.history
        .map((record, index) => ({ record, index }))
        .reverse()
        .map(({ record, index }) => {
          // The quest result belongs to the approved proposal of that quest
          const result = record.approved
            ? state.questResults[record.quest]
            : undefined;
          const approvers = record.votes
            .map((approve, seat) => (approve ? seat : -1))
            .filter((seat) => seat >= 0);
          const rejecters = record.votes
            .map((approve, seat) => (approve ? -1 : seat))
            .filter((seat) => seat >= 0);

          return (
            <View
              key={index}
              style={[styles.record, { borderBottomColor: colors.divider }]}
            >
              <AppText variant="caption">
                {t("avalon.history.proposal", {
                  quest: record.quest + 1,
                  leader: nameOf(record.leader),
                  team: namesOf(record.team),
                })}
              </AppText>
              <AppText
                variant="tiny"
                style={{
                  marginTop: 3,
                  color: record.approved ? colors.successStrong : colors.danger,
                }}
              >
                {t(
                  record.approved
                    ? "avalon.history.approved"
                    : "avalon.history.rejected",
                  { yes: approvers.length, no: rejecters.length }
                )}
                {result
                  ? ` · ${t(
                      result.success
                        ? "avalon.history.succeeded"
                        : "avalon.history.failed",
                      { count: result.fails }
                    )}`
                  : ""}
              </AppText>
              <AppText variant="tiny" color="textSubtle" style={{ marginTop: 3 }}>
                {`👍 ${approvers.length > 0 ? namesOf(approvers) : "—"}   👎 ${
                  rejecters.length > 0 ? namesOf(rejecters) : "—"
                }`}
              </AppText>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  buttons: { flexDirection: "row", gap: 12 },
  track: { flexDirection: "row", justifyContent: "space-between" },
  quest: { alignItems: "center", gap: 6, flex: 1 },
  questDot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  player: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 18,
  },
  roleHead: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8 },
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
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  resultEmoji: { fontSize: 40, lineHeight: 48 },
  record: { paddingVertical: 8, borderBottomWidth: 1 },
});
