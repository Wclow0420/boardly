import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  AppText,
  BottomSheetModal,
  Button,
} from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { usePromptSheet } from "@/hooks/usePromptSheet";
import { fontFamily, useTheme } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps } from "../types";
import {
  ACTION_ART,
  ACTION_EMOJI,
  ACTION_TINT,
  CARD_BACK,
  ROLE_ART,
  ROLE_EMOJI,
  ROLE_TINT,
} from "./art";
import { RolePortrait } from "./RolePortrait";
import {
  ACTIONS,
  canTake,
  FORCED_COUP_AT,
  handOf,
  specOf,
  targetsFor,
  taskFor,
  toggleKeep,
  type ActionType,
  type CoupState,
  type LogEvent,
  type Role,
} from "./logic";

const LOG_LINES = 8;
/** Blank space added under the table while the action sheet is up. */
const SHEET_CLEARANCE = 380;

/** "#RRGGBB" + alpha (00-ff) — tinted fills for tiles and icon wells. */
const alpha = (hex: string, a: string) => `${hex}${a}`;

export function CoupBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  onMove,
}: GameBoardProps<CoupState>) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  // An action that still needs a target, and the cards picked to keep in
  // an exchange. Tagged with the step so they clear when play moves on.
  const step = `${state.phase}:${state.turn}:${state.log.length}`;
  const [draft, setDraft] = useState<{
    step: string;
    action: ActionType | null;
    keep: number[];
  }>({ step, action: null, keep: [] });
  const current =
    draft.step === step ? draft : { step, action: null, keep: [] };
  // Your cards are face up for you; tap to cover them from onlookers
  const [handHidden, setHandHidden] = useState(false);

  const over = finished || state.phase === "finished";
  const task = over ? null : taskFor(state, mySeat);
  const me = state.players[mySeat];
  const targeting = task === "action" && current.action !== null;
  const targets = targeting ? targetsFor(state, mySeat) : [];

  // Whatever the game needs from me comes up as a sheet pinned to the
  // bottom. It can't be swiped away — it closes when I've answered.
  const needsMe = task !== null;
  const { ref: sheetRef, onDismiss: onSheetDismiss } = usePromptSheet(
    needsMe,
    step
  );

  const userOf = (seat: number) =>
    players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`;
  const nameOf = (seat: number) => (seat === mySeat ? t("game.you") : userOf(seat));

  const send = (move: Record<string, unknown>) => {
    moveHaptic();
    onMove(move);
  };

  const chooseAction = (type: ActionType) => {
    if (specOf(type).needsTarget) {
      tapHaptic();
      setDraft({ step, action: type, keep: [] });
    } else {
      send({ type: "action", action: type });
    }
  };

  /** One sentence for the action / block currently on the table. */
  const claimLine = () => {
    if (state.phase === "challengeBlock" && state.block) {
      return describe(
        { t: "block", seat: state.block.seat, role: state.block.role },
        t,
        userOf
      );
    }
    if (state.action) {
      return describe(
        {
          t: "action",
          actor: state.action.actor,
          action: state.action.type,
          target: state.action.target,
        },
        t,
        userOf
      );
    }
    return "";
  };

  const waitingNames = state.waitingOn.map(nameOf).join(", ");

  /** The question the game is asking me — shown in the bottom sheet. */
  const prompt =
    task === "action" ? (
      targeting && current.action ? (
        <>
          <AppText variant="title">
            {`🎯  ${t("coup.prompt.target", {
              action: t(`coup.actions.${current.action}.name`),
            })}`}
          </AppText>
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {targets.map((seat) => (
              <Pressable
                key={seat}
                accessibilityRole="button"
                disabled={busy}
                onPress={() =>
                  send({ type: "action", action: current.action, target: seat })
                }
                style={({ pressed }) => [
                  styles.target,
                  {
                    backgroundColor: pressed ? colors.primarySoft : colors.well,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AvatarBorder
                  name={userOf(seat)}
                  borderId={players.find((p) => p.seat === seat)?.borderId}
                  size={36}
                />
                <AppText variant="label" style={styles.grow} numberOfLines={1}>
                  {userOf(seat)}
                </AppText>
                <AppText variant="label" color="primary">
                  {t("coup.coins", { count: state.players[seat].coins })}
                </AppText>
              </Pressable>
            ))}
          </View>
          <Button
            label={t("common.cancel")}
            variant="tertiary"
            style={{ marginTop: spacing.sm }}
            onPress={() => setDraft({ step, action: null, keep: [] })}
          />
        </>
      ) : (
        <>
          <AppText variant="title">
            {`⚡  ${
              me && me.coins >= FORCED_COUP_AT
                ? t("coup.prompt.mustCoup")
                : t("coup.prompt.yourTurn")
            }`}
          </AppText>
          <View style={[styles.tiles, { marginTop: spacing.md }]}>
            {ACTIONS.map((action) => (
              <ActionTile
                key={action.type}
                type={action.type}
                claims={action.claim !== null}
                enabled={!busy && canTake(state, mySeat, action.type)}
                onPress={() => chooseAction(action.type)}
              />
            ))}
          </View>
        </>
      )
    ) : task === "challengeAction" || task === "challengeBlock" ? (
      <>
        <AppText variant="title">{claimLine()}</AppText>
        <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
          {t("coup.prompt.challenge")}
        </AppText>
        <View style={[styles.buttons, { marginTop: spacing.md }]}>
          <Button
            label={t("coup.challenge")}
            variant="danger"
            style={styles.grow}
            disabled={busy}
            onPress={() => send({ type: "challenge" })}
          />
          <Button
            label={t("coup.allow")}
            variant="secondary"
            style={styles.grow}
            disabled={busy}
            onPress={() => send({ type: "pass" })}
          />
        </View>
      </>
    ) : task === "block" && state.action ? (
      <>
        <AppText variant="title">{claimLine()}</AppText>
        <AppText variant="body" color="textMuted" style={{ marginTop: 4 }}>
          {t("coup.prompt.block")}
        </AppText>
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {specOf(state.action.type).blockers.map((role) => (
            <Button
              key={role}
              label={t("coup.blockWith", {
                role: t(`coup.roles.${role}.name`),
              })}
              disabled={busy}
              onPress={() => send({ type: "block", role })}
            />
          ))}
          <Button
            label={t("coup.allow")}
            variant="secondary"
            disabled={busy}
            onPress={() => send({ type: "pass" })}
          />
        </View>
      </>
    ) : task === "reveal" && me ? (
      <>
        <AppText variant="title">{`💔  ${t("coup.prompt.reveal")}`}</AppText>
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {handOf(state, mySeat).map((index) => {
            const role = me.cards[index].role;
            return role ? (
              <Button
                key={index}
                label={t(`coup.roles.${role}.name`)}
                variant="danger"
                disabled={busy}
                onPress={() => send({ type: "reveal", card: index })}
              />
            ) : null;
          })}
        </View>
      </>
    ) : task === "exchange" && state.exchange ? (
      <>
        <AppText variant="title">
          {`🔄  ${t("coup.prompt.exchange", {
            count: handOf(state, mySeat).length,
          })}`}
        </AppText>
        <View style={[styles.tiles, { marginTop: spacing.md }]}>
          {state.exchange.map((role, index) => {
            const picked = current.keep.includes(index);
            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityState={{ selected: picked }}
                onPress={() => {
                  tapHaptic();
                  setDraft({
                    step,
                    action: null,
                    keep: toggleKeep(
                      current.keep,
                      index,
                      handOf(state, mySeat).length
                    ),
                  });
                }}
                style={[
                  styles.tile,
                  {
                    backgroundColor: picked
                      ? alpha(ROLE_TINT[role], "33")
                      : colors.well,
                    borderColor: picked ? ROLE_TINT[role] : colors.border,
                  },
                ]}
              >
                <RolePortrait role={role} size={36} />
                <AppText variant="label" style={styles.grow} numberOfLines={1}>
                  {t(`coup.roles.${role}.name`)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <Button
          label={t("coup.keep")}
          style={{ marginTop: spacing.md }}
          disabled={current.keep.length !== handOf(state, mySeat).length}
          loading={busy}
          onPress={() => send({ type: "exchange", keep: current.keep })}
        />
      </>
    ) : null;

  return (
    <View style={{ gap: spacing.md }}>
      {/* Players */}
      <View style={{ gap: spacing.sm }}>
        {players
          .slice()
          .sort((a, b) => a.seat - b.seat)
          .map((player) => {
            const seat = player.seat;
            const info = state.players[seat];
            if (!info) return null;
            const waitedOn = !over && state.waitingOn.includes(seat);
            return (
              <View
                key={player.userId}
                style={[
                  styles.panel,
                  styles.player,
                  {
                    backgroundColor: colors.card,
                    borderColor: waitedOn
                      ? colors.primarySoftBorder
                      : colors.border,
                    opacity: info.alive ? 1 : 0.45,
                  },
                ]}
              >
                <AvatarBorder
                  name={player.username}
                  borderId={player.borderId}
                  size={44}
                  ringColor={waitedOn ? colors.primary : colors.border}
                />
                <View style={styles.grow}>
                  <AppText
                    numberOfLines={1}
                    style={{ fontFamily: fontFamily.semiBold, fontSize: 16 }}
                  >
                    {nameOf(seat)}
                    {state.winner === seat ? "  🏆" : ""}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{
                      marginTop: 2,
                      color: info.alive ? colors.primary : colors.textSubtle,
                    }}
                  >
                    {info.alive
                      ? t("coup.coins", { count: info.coins })
                      : t("coup.out")}
                  </AppText>
                </View>
                <View style={styles.cards}>
                  {info.cards.map((card, index) => (
                    <MiniCard key={index} role={card.role} revealed={card.revealed} />
                  ))}
                </View>
              </View>
            );
          })}
        <View style={styles.rule}>
          <View style={[styles.ruleLine, { backgroundColor: colors.border }]} />
          <AppText variant="caption" color="textSubtle">
            {t("coup.deck", { count: state.deckCount })}
          </AppText>
          <View style={[styles.ruleLine, { backgroundColor: colors.border }]} />
        </View>
      </View>

      {/* My hand: two cards side by side */}
      {me ? (
        <Panel onPress={over ? undefined : () => setHandHidden((v) => !v)}>
          <View style={styles.panelHeader}>
            <AppText variant="label">{`🃏  ${t("coup.hand.title")}`}</AppText>
            <AppText variant="label" color="primary">
              {t("coup.coins", { count: me.coins })}
            </AppText>
          </View>
          <View style={[styles.hand, { marginTop: spacing.sm }]}>
            {me.cards.map((card, index) => (
              <HandCard
                key={index}
                role={card.role}
                lost={card.revealed}
                faceDown={handHidden && !over && !card.revealed}
              />
            ))}
          </View>
          {!over ? (
            <AppText
              variant="tiny"
              color="textSubtle"
              align="center"
              style={{ marginTop: spacing.sm }}
            >
              {t(handHidden ? "coup.hand.show" : "coup.hand.hide")}
            </AppText>
          ) : null}
        </Panel>
      ) : null}

      {/* What's happening while it isn't on me, and the final result */}
      {over ? (
        <Panel>
          <View style={{ alignItems: "center" }}>
            <AppText style={styles.resultEmoji}>
              {state.winner !== null ? "🏆" : "🚪"}
            </AppText>
            <AppText variant="h2" align="center">
              {state.winner === null
                ? t("coup.result.none")
                : state.winner === mySeat
                  ? t("game.youWin")
                  : t("game.winner", { name: userOf(state.winner) })}
            </AppText>
          </View>
        </Panel>
      ) : !needsMe ? (
        <Panel>
          <AppText variant="title">
            {state.phase === "action"
              ? t("game.turn", { name: userOf(state.turn) })
              : state.phase === "loseInfluence"
                ? t("coup.prompt.losing", { name: waitingNames })
                : claimLine()}
          </AppText>
          <AppText variant="caption" color="textSubtle" style={{ marginTop: 4 }}>
            {`⏳  ${t("coup.prompt.waiting", { names: waitingNames })}`}
          </AppText>
        </Panel>
      ) : null}

      {/* Public log, newest first */}
      {state.log.length > 0 ? (
        <Panel>
          <AppText variant="label">{`📜  ${t("avalon.history.title")}`}</AppText>
          <View style={{ marginTop: spacing.sm }}>
            {state.log
              .slice(-LOG_LINES)
              .reverse()
              .map((event, index) => (
                <View
                  key={state.log.length - index}
                  style={[
                    styles.logLine,
                    { borderTopColor: colors.divider },
                  ]}
                >
                  <View
                    style={[
                      styles.logDot,
                      {
                        backgroundColor:
                          index === 0 ? colors.primary : colors.textSubtle,
                      },
                    ]}
                  />
                  <AppText
                    variant="caption"
                    color={index === 0 ? "text" : "textMuted"}
                    style={styles.grow}
                  >
                    {describe(event, t, userOf)}
                  </AppText>
                </View>
              ))}
          </View>
        </Panel>
      ) : null}

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
    </View>
  );
}

/** One of my two cards, drawn card-shaped: art on top, name and what
 *  it does underneath. */
function HandCard({
  role,
  lost,
  faceDown,
}: {
  role: Role | null;
  lost: boolean;
  faceDown: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (!role) return null;
  const tint = ROLE_TINT[role];
  const art = ROLE_ART[role];

  if (faceDown) {
    return (
      <View
        style={[
          styles.handCard,
          styles.handCardBack,
          { backgroundColor: colors.well, borderColor: colors.primarySoftBorder },
        ]}
      >
        {CARD_BACK ? (
          <Image source={CARD_BACK} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <AppText
            style={{ fontFamily: fontFamily.bold, fontSize: 44, color: colors.primary }}
          >
            ?
          </AppText>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.handCard,
        {
          backgroundColor: colors.well,
          borderColor: lost ? colors.border : alpha(tint, "AA"),
          opacity: lost ? 0.45 : 1,
        },
      ]}
    >
      <View style={[styles.handArt, { backgroundColor: alpha(tint, "2E") }]}>
        {art ? (
          <Image source={art} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : (
          <AppText style={styles.handEmoji}>{ROLE_EMOJI[role]}</AppText>
        )}
      </View>
      <View style={styles.handText}>
        <AppText
          variant="title"
          numberOfLines={1}
          style={{
            fontSize: 17,
            textDecorationLine: lost ? "line-through" : "none",
          }}
        >
          {t(`coup.roles.${role}.name`)}
        </AppText>
        <AppText variant="tiny" color="textMuted" style={{ marginTop: 2 }}>
          {lost ? t("coup.lost") : t(`coup.roles.${role}.desc`)}
        </AppText>
      </View>
    </View>
  );
}

/** Rounded section container. */
function Panel({
  children,
  onPress,
  highlighted = false,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const panelStyle = [
    styles.panel,
    {
      backgroundColor: colors.card,
      borderColor: highlighted ? colors.primarySoftBorder : colors.border,
    },
    style,
  ];
  if (!onPress) return <View style={panelStyle}>{children}</View>;
  return (
    <Pressable
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={panelStyle}
    >
      {children}
    </Pressable>
  );
}

/** A card in a player's row: face down, or lost and face up. */
function MiniCard({ role, revealed }: { role: Role | null; revealed: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (revealed && role) {
    return (
      <View
        style={[
          styles.miniCard,
          styles.miniCardLost,
          { backgroundColor: colors.well, borderColor: colors.border },
        ]}
      >
        <AppText style={styles.miniEmoji}>{ROLE_EMOJI[role]}</AppText>
        <AppText
          variant="tiny"
          numberOfLines={1}
          style={{ color: colors.textSubtle, textDecorationLine: "line-through" }}
        >
          {t(`coup.roles.${role}.name`)}
        </AppText>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.miniCard,
        { backgroundColor: colors.well, borderColor: colors.primarySoftBorder },
      ]}
    >
      {CARD_BACK ? (
        <Image source={CARD_BACK} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <AppText
          style={{ fontFamily: fontFamily.bold, fontSize: 18, color: colors.primary }}
        >
          ?
        </AppText>
      )}
    </View>
  );
}

function ActionTile({
  type,
  claims,
  enabled,
  onPress,
}: {
  type: ActionType;
  /** Claims a role — a bluff others can challenge. */
  claims: boolean;
  enabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tint = ACTION_TINT[type];
  const art = ACTION_ART[type];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: alpha(tint, pressed ? "40" : "1F"),
          borderColor: alpha(tint, claims ? "AA" : "55"),
          opacity: enabled ? 1 : 0.35,
        },
      ]}
    >
      {art ? (
        <Image source={art} style={styles.tileIcon} contentFit="contain" />
      ) : (
        <View style={[styles.tileIcon, { backgroundColor: alpha(tint, "33") }]}>
          <AppText style={styles.tileEmoji}>{ACTION_EMOJI[type]}</AppText>
        </View>
      )}
      <View style={styles.grow}>
        <AppText variant="label" style={{ fontSize: 14 }} numberOfLines={1}>
          {t(`coup.actions.${type}.name`)}
        </AppText>
        <AppText
          variant="tiny"
          numberOfLines={2}
          style={{ marginTop: 1, color: colors.textMuted }}
        >
          {t(`coup.actions.${type}.desc`)}
        </AppText>
      </View>
    </Pressable>
  );
}

/** A log event as one sentence. */
function describe(
  event: LogEvent,
  t: (key: string, options?: Record<string, unknown>) => string,
  userOf: (seat: number) => string
): string {
  switch (event.t) {
    case "action":
      return t(`coup.log.${event.action}`, {
        actor: userOf(event.actor),
        target: event.target !== null ? userOf(event.target) : "",
      });
    case "block":
      return t("coup.log.block", {
        name: userOf(event.seat),
        role: t(`coup.roles.${event.role}.name`),
      });
    case "blocked":
      return t("coup.log.blocked");
    case "challenge":
      return t(event.caught ? "coup.log.caught" : "coup.log.proved", {
        challenger: userOf(event.challenger),
        claimant: userOf(event.claimant),
        role: t(`coup.roles.${event.role}.name`),
      });
    case "lose":
      return t("coup.log.lose", {
        name: userOf(event.seat),
        role: t(`coup.roles.${event.role}.name`),
      });
    case "out":
      return t("coup.log.out", { name: userOf(event.seat) });
  }
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  buttons: { flexDirection: "row", gap: 12 },
  panel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  player: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  cards: { flexDirection: "row", gap: 8 },
  miniCard: {
    width: 40,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  miniCardLost: { width: 64, paddingHorizontal: 4, opacity: 0.7 },
  miniEmoji: { fontSize: 16, lineHeight: 22 },
  rule: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  ruleLine: { flex: 1, height: 1 },
  hand: { flexDirection: "row", gap: 12 },
  handCard: {
    flex: 1,
    aspectRatio: 0.72,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  handCardBack: { alignItems: "center", justifyContent: "center" },
  handArt: { flex: 1, alignItems: "center", justifyContent: "center" },
  handEmoji: { fontSize: 56, lineHeight: 70 },
  handText: { paddingHorizontal: 12, paddingVertical: 10 },
  target: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  tileEmoji: { fontSize: 18, lineHeight: 24 },
  resultEmoji: { fontSize: 44, lineHeight: 54 },
  logLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
  },
  logDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
});
