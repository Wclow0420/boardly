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
  isValidBid,
  myCount,
  suggestedBid,
  totalDice,
  breakZhaiMin,
  canSplit,
  isOut,
  openingMin,
  taskFor,
  type Bid,
  type LiarsDiceState,
  type Reveal,
} from "./logic";

/** Blank space added under the table while the action sheet is up. */
const SHEET_CLEARANCE = 330;

// Pip positions on a 3×3 grid (0-8), by face
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** One die drawn with pips. `glow` marks a die that counts for the bid. */
function Die({
  face,
  size = 40,
  glow = false,
  dim = false,
}: {
  face: number;
  size?: number;
  glow?: boolean;
  dim?: boolean;
}) {
  const { colors } = useTheme();
  const pip = Math.max(4, size * 0.17);
  const red = face === 1 || face === 4;
  return (
    <View
      style={[
        styles.die,
        {
          width: size,
          height: size,
          borderRadius: size * 0.2,
          padding: size * 0.14,
          backgroundColor: "#FBF7EF",
          borderColor: glow ? colors.primary : "#D9CFBF",
          borderWidth: glow ? 2.5 : 1,
          opacity: dim ? 0.35 : 1,
        },
      ]}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <View key={i} style={styles.pipCell}>
          {PIPS[face]?.includes(i) ? (
            <View
              style={{
                width: face === 1 ? pip * 1.5 : pip,
                height: face === 1 ? pip * 1.5 : pip,
                borderRadius: pip,
                backgroundColor: red ? "#D2382F" : "#2A2522",
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function LiarsDiceBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  onMove,
}: GameBoardProps<LiarsDiceState>) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const over = finished || state.phase === "finished";
  const task = over ? null : taskFor(state, mySeat);
  const myTurn = task === "bid";
  const step = `${state.round}:${state.bids.length}:${state.phase}`;
  const { ref: sheetRef, onDismiss: onSheetDismiss } = usePromptSheet(
    task !== null,
    step
  );
  const [handHidden, setHandHidden] = useState(false);

  const nameOf = (seat: number) =>
    seat === mySeat
      ? t("game.you")
      : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
  const bidText = (bid: Pick<Bid, "quantity" | "face" | "zhai">) =>
    `${t("liarsdice.bid", { count: bid.quantity, face: bid.face })}${
      bid.zhai ? ` · ${t("liarsdice.zhai")}` : ""
    }`;

  const send = (move: Record<string, unknown>) => {
    moveHaptic();
    onMove(move);
  };

  const iAmOut = mySeat >= 0 && isOut(state, mySeat);
  const split = () => send({ type: "split", bids: state.bids.length });

  return (
    <View style={{ gap: spacing.lg }}>
      {/* The call on the table */}
      <Card>
        <AppText variant="caption" color="textMuted">
          {t("liarsdice.round", { round: state.round, dice: totalDice(state) })}
        </AppText>
        {over ? (
          <Result state={state} mySeat={mySeat} nameOf={nameOf} />
        ) : state.bid ? (
          <>
            <View style={styles.bidRow}>
              <AppText variant="h1">{state.bid.quantity}</AppText>
              <AppText variant="h2">×</AppText>
              <Die face={state.bid.face} size={44} />
              {state.bid.zhai ? (
                <View style={[styles.zhaiTag, { backgroundColor: colors.danger }]}>
                  <AppText variant="label" style={{ color: "#fff" }}>
                    {t("liarsdice.zhai")}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="body" color="textMuted">
              {t("liarsdice.calledBy", { name: nameOf(state.bid.seat) })}
              {` · ${t(state.bid.zhai ? "liarsdice.onesNotWild" : "liarsdice.onesWild")}`}
            </AppText>
          </>
        ) : (
          <AppText variant="title" style={{ marginTop: 4 }}>
            {t("liarsdice.opening", {
              name: nameOf(state.turn),
              min: openingMin(state, false),
              zhaiMin: openingMin(state, true),
            })}
          </AppText>
        )}
        {state.phase === "split" && state.bid && state.split ? (
          <AppText variant="bodyMedium" style={{ marginTop: spacing.sm, color: colors.danger }}>
            {`🪓  ${t("liarsdice.splitting", {
              name: nameOf(state.split.by),
              bidder: nameOf(state.bid.seat),
            })}`}
          </AppText>
        ) : null}
        {!over && task === null ? (
          <AppText variant="caption" color="textSubtle" style={{ marginTop: spacing.sm }}>
            {`⏳  ${
              state.phase === "split" && state.bid
                ? t("liarsdice.waitingAnswer", { name: nameOf(state.bid.seat) })
                : t("liarsdice.waiting", { name: nameOf(state.turn) })
            }`}
          </AppText>
        ) : null}
        {/* Anyone can split the bid, any time — not just the player up */}
        {!myTurn && canSplit(state, mySeat) && state.bid ? (
          <Button
            label={`🪓  ${t("liarsdice.splitThem", { name: nameOf(state.bid.seat) })}`}
            variant="danger"
            style={{ marginTop: spacing.md }}
            disabled={busy}
            onPress={split}
          />
        ) : null}
      </Card>

      {/* My cup */}
      {mySeat >= 0 && !over ? (
        <Card onPress={iAmOut ? undefined : () => setHandHidden((v) => !v)}>
          <AppText variant="caption" color="textMuted">
            {iAmOut ? t("liarsdice.youreOut") : t("liarsdice.yourDice")}
          </AppText>
          {!iAmOut ? (
            handHidden ? (
              <AppText variant="title" style={{ marginTop: 6 }}>
                {`🥤  ${t("liarsdice.showDice")}`}
              </AppText>
            ) : (
              <>
                <View style={[styles.diceRow, { marginTop: spacing.sm }]}>
                  {state.myDice.map((face, i) => (
                    <Die
                      key={i}
                      face={face}
                      size={48}
                      glow={
                        state.bid !== null &&
                        myCount([face], state.bid.face, state.bid.zhai) > 0
                      }
                    />
                  ))}
                </View>
                <AppText variant="tiny" color="textSubtle" style={{ marginTop: 6 }}>
                  {state.bid
                    ? t("liarsdice.youHave", {
                        count: myCount(state.myDice, state.bid.face, state.bid.zhai),
                        face: state.bid.face,
                      })
                    : t("liarsdice.hideHint")}
                </AppText>
              </>
            )
          ) : null}
        </Card>
      ) : null}

      <Players state={state} players={players} nameOf={nameOf} />

      {state.bids.length > 0 && !over ? (
        <View>
          <AppText variant="label" style={{ marginBottom: spacing.sm }}>
            {t("liarsdice.calls")}
          </AppText>
          {state.bids
            .slice()
            .reverse()
            .map((bid, i, newestFirst) => {
              const broke = !bid.zhai && newestFirst[i + 1]?.zhai === true;
              return (
                <AppText key={i} variant="caption" color={i === 0 ? "text" : "textSubtle"}>
                  {`${nameOf(bid.seat)}: ${bidText(bid)}${
                    broke ? `  🍖 ${t("liarsdice.broke")}` : ""
                  }`}
                </AppText>
              );
            })}
        </View>
      ) : null}

      {state.reveal ? (
        <LastReveal reveal={state.reveal} nameOf={nameOf} bidText={bidText} />
      ) : null}

      {state.mode === "endless" && !over && mySeat >= 0 ? (
        <EndVote
          state={state}
          mySeat={mySeat}
          busy={busy}
          onVote={(vote) => send({ type: "end", vote })}
        />
      ) : null}

      {task !== null ? <View style={{ height: SHEET_CLEARANCE }} /> : null}

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
          {task === "bid" ? (
            <BidPicker
              key={step}
              state={state}
              busy={busy}
              bidText={bidText}
              onBid={(quantity, face, zhai) => send({ type: "bid", quantity, face, zhai })}
              onOpen={() => send({ type: "challenge" })}
              onSplit={split}
            />
          ) : task === "answer" && state.bid && state.split ? (
            <>
              <AppText variant="title">
                {`🪓  ${t("liarsdice.youWereSplit", {
                  name: nameOf(state.split.by),
                  bid: bidText(state.bid),
                })}`}
              </AppText>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                {t("liarsdice.answerHint")}
              </AppText>
              <View style={[styles.challengeRow, { marginTop: spacing.md }]}>
                <Button
                  label={t("liarsdice.accept")}
                  variant="secondary"
                  disabled={busy}
                  onPress={() => send({ type: "respond", counter: false })}
                  style={{ flex: 1 }}
                />
                <Button
                  label={`🔥  ${t("liarsdice.counter")}`}
                  variant="danger"
                  disabled={busy}
                  onPress={() => send({ type: "respond", counter: true })}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : null}
        </View>
      </BottomSheetModal>
    </View>
  );
}

function BidPicker({
  state,
  busy,
  bidText,
  onBid,
  onOpen,
  onSplit,
}: {
  state: LiarsDiceState;
  busy: boolean;
  bidText: (bid: Pick<Bid, "quantity" | "face" | "zhai">) => string;
  onBid: (quantity: number, face: number, zhai: boolean) => void;
  onOpen: () => void;
  onSplit: () => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const start = suggestedBid(state);
  const [quantity, setQuantity] = useState(start.quantity);
  const [face, setFace] = useState(start.face);
  // A zhai round stays zhai unless the player breaks the fast (开斋)
  const [zhaiPicked, setZhaiPicked] = useState(state.bid?.zhai ?? false);
  const zhai = zhaiPicked || face === 1;
  const breakMin = breakZhaiMin(state);
  const breaking = breakMin !== null && !zhai;
  const valid = isValidBid(state, quantity, face, zhai);
  const total = totalDice(state);

  return (
    <>
      <AppText variant="title">
        {state.bid
          ? `🎲  ${t("liarsdice.yourTurn", { bid: bidText(state.bid) })}`
          : `🎲  ${t("liarsdice.yourOpening")}`}
      </AppText>

      <View style={[styles.stepper, { marginTop: spacing.md }]}>
        <Button
          label="−"
          variant="secondary"
          size="sm"
          disabled={busy || quantity <= 1}
          onPress={() => {
            tapHaptic();
            setQuantity((q) => Math.max(1, q - 1));
          }}
          style={styles.stepButton}
        />
        <AppText variant="h1" style={styles.quantity}>
          {quantity}
        </AppText>
        <Button
          label="+"
          variant="secondary"
          size="sm"
          disabled={busy || quantity >= total}
          onPress={() => {
            tapHaptic();
            setQuantity((q) => Math.min(total, q + 1));
          }}
          style={styles.stepButton}
        />
        <AppText variant="h2" color="textMuted">
          ×
        </AppText>
      </View>

      <View style={[styles.faces, { marginTop: spacing.sm }]}>
        {[2, 3, 4, 5, 6, 1].map((f) => (
          <Pressable
            key={f}
            accessibilityRole="button"
            accessibilityState={{ selected: face === f }}
            disabled={busy}
            onPress={() => {
              tapHaptic();
              setFace(f);
            }}
            style={[
              styles.faceButton,
              { borderColor: face === f ? colors.primary : "transparent" },
            ]}
          >
            <Die face={f} size={38} />
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: zhai, disabled: face === 1 }}
        disabled={busy || face === 1}
        onPress={() => {
          tapHaptic();
          setZhaiPicked((v) => !v);
        }}
        style={[
          styles.zhaiToggle,
          {
            marginTop: spacing.sm,
            backgroundColor: zhai ? colors.primarySoft : colors.well,
            borderColor: zhai ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="label">
            {breaking
              ? `🍖  ${t("liarsdice.breakZhai")}`
              : `${t("liarsdice.zhai")} — ${t("liarsdice.zhaiName")}`}
          </AppText>
          <AppText variant="tiny" color="textSubtle">
            {face === 1
              ? t("liarsdice.zhaiOnes")
              : breaking
                ? t("liarsdice.breakingHint", { min: breakMin })
                : breakMin !== null
                  ? t("liarsdice.breakHint", { min: breakMin })
                  : t("liarsdice.zhaiHint")}
          </AppText>
        </View>
        <AppText variant="label" color={zhai ? "primary" : "textSubtle"}>
          {zhai ? "☑" : "☐"}
        </AppText>
      </Pressable>

      <Button
        label={t("liarsdice.call", { bid: bidText({ quantity, face, zhai }) })}
        style={{ marginTop: spacing.md }}
        disabled={!valid}
        loading={busy}
        onPress={() => onBid(quantity, face, zhai)}
      />
      {!valid ? (
        <AppText variant="tiny" color="textSubtle" align="center" style={{ marginTop: 4 }}>
          {breaking
            ? t("liarsdice.mustBreak", { min: breakMin })
            : state.bid
              ? t("liarsdice.mustRaise")
              : t("liarsdice.mustOpen", { min: openingMin(state, zhai) })}
        </AppText>
      ) : null}

      {state.bid ? (
        <View style={[styles.challengeRow, { marginTop: spacing.md }]}>
          <Button
            label={`🔍  ${t("liarsdice.open")}`}
            variant="danger"
            disabled={busy}
            onPress={onOpen}
            style={{ flex: 1 }}
          />
          <Button
            label={`🪓  ${t("liarsdice.split")}`}
            variant="danger"
            disabled={busy}
            onPress={onSplit}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}
      {state.bid ? (
        <AppText variant="tiny" color="textSubtle" align="center" style={{ marginTop: 4 }}>
          {t("liarsdice.challengeHint")}
        </AppText>
      ) : null}
    </>
  );
}

function Players({
  state,
  players,
  nameOf,
}: {
  state: LiarsDiceState;
  players: GamePlayer[];
  nameOf: (seat: number) => string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={{ gap: 8 }}>
      {players
        .slice()
        .sort((a, b) => a.seat - b.seat)
        .map((player) => {
          const seat = player.seat;
          const out = isOut(state, seat);
          const up =
            state.phase === "split"
              ? state.bid?.seat === seat
              : state.phase !== "finished" && state.turn === seat;
          return (
            <View
              key={player.userId}
              style={[
                styles.player,
                {
                  backgroundColor: colors.card,
                  borderColor: up ? colors.primary : colors.border,
                  opacity: out ? 0.55 : 1,
                },
              ]}
            >
              <AvatarBorder
                name={player.username}
                borderId={player.borderId}
                avatarUrl={player.avatarUrl}
                size={40}
                ringColor={up ? colors.primary : colors.border}
              />
              <View style={{ flex: 1 }}>
                <AppText style={{ fontFamily: fontFamily.semiBold, fontSize: 15 }}>
                  {nameOf(seat)}
                </AppText>
                <AppText variant="tiny" color="textSubtle">
                  {out
                    ? `🥴  ${t("liarsdice.drunk")}`
                    : `🎲 ×${state.diceCount[seat]}${up ? `  ·  ${t("liarsdice.thinking")}` : ""}`}
                </AppText>
              </View>
              {state.maxCups === null ? (
                <AppText variant="title">{`🍺 ×${state.cups[seat]}`}</AppText>
              ) : (
                <View style={{ alignItems: "flex-end" }}>
                  <AppText style={{ fontSize: 15 }}>
                    {Array.from({ length: state.maxCups }, (_, i) =>
                      i < state.cups[seat] ? "🍺" : "▫️"
                    ).join("")}
                  </AppText>
                  <AppText variant="tiny" color="textSubtle">
                    {`${state.cups[seat]}/${state.maxCups}`}
                  </AppText>
                </View>
              )}
            </View>
          );
        })}
    </View>
  );
}

/** Everyone's dice from the round that just ended, and who drank. */
function LastReveal({
  reveal,
  nameOf,
  bidText,
}: {
  reveal: Reveal;
  nameOf: (seat: number) => string;
  bidText: (bid: Pick<Bid, "quantity" | "face" | "zhai">) => string;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { bid } = reveal;

  return (
    <Card>
      <AppText variant="caption" color="textMuted">
        {t("liarsdice.lastRound", { round: reveal.round })}
      </AppText>
      <AppText variant="title" style={{ marginTop: 4 }}>
        {t(`liarsdice.revealBy.${reveal.kind ?? "open"}`, {
          name: nameOf(reveal.challenger),
          bid: bidText(bid),
          bidder: nameOf(bid.seat),
        })}
      </AppText>
      <AppText variant="bodyMedium" style={{ marginTop: 4, color: colors.danger }}>
        {t("liarsdice.found", { count: reveal.found, face: bid.face })}
        {"  →  "}
        {t("liarsdice.drinks", { name: nameOf(reveal.loser), count: reveal.drink })}
        {reveal.out ? `  🥴 ${t("liarsdice.drunkOut")}` : ""}
      </AppText>
      <View style={{ gap: 6, marginTop: spacing.sm }}>
        {reveal.dice.map((hand, seat) =>
          hand.length > 0 ? (
            <View key={seat} style={styles.revealRow}>
              <AppText variant="tiny" numberOfLines={1} style={styles.revealName}>
                {nameOf(seat)}
              </AppText>
              {hand
                .slice()
                .sort((a, b) => a - b)
                .map((face, i) => {
                  const counts = myCount([face], bid.face, bid.zhai) > 0;
                  return <Die key={i} face={face} size={26} glow={counts} dim={!counts} />;
                })}
            </View>
          ) : null
        )}
      </View>
    </Card>
  );
}

/** Endless games stop when more than half the table votes to. */
function EndVote({
  state,
  mySeat,
  busy,
  onVote,
}: {
  state: LiarsDiceState;
  mySeat: number;
  busy: boolean;
  onVote: (vote: boolean) => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const voted = state.endVotes.includes(mySeat);
  return (
    <Card>
      <AppText variant="label">{`🛑  ${t("liarsdice.endTitle")}`}</AppText>
      <AppText variant="tiny" color="textSubtle" style={{ marginTop: 2 }}>
        {t("liarsdice.endHint", {
          votes: state.endVotes.length,
          needed: Math.floor(state.numPlayers / 2) + 1,
        })}
      </AppText>
      <Button
        label={voted ? t("liarsdice.endCancel") : t("liarsdice.endVote")}
        variant="secondary"
        size="sm"
        style={{ marginTop: spacing.sm }}
        disabled={busy}
        onPress={() => onVote(!voted)}
      />
    </Card>
  );
}

function Result({
  state,
  mySeat,
  nameOf,
}: {
  state: LiarsDiceState;
  mySeat: number;
  nameOf: (seat: number) => string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", marginTop: 6 }}>
      <AppText style={{ fontSize: 44 }}>
        {state.winner !== null || state.winners ? "🏆" : "🚪"}
      </AppText>
      <AppText variant="h2" align="center" style={{ color: colors.primary }}>
        {state.winners && state.winners.length > 1
          ? t("liarsdice.winnersTied", { names: state.winners.map(nameOf).join(", ") })
          : state.winner === null
            ? t("liarsdice.noWinner")
            : state.winner === mySeat
              ? t("liarsdice.youWin")
              : t("liarsdice.winner", { name: nameOf(state.winner) })}
      </AppText>
      <AppText variant="caption" color="textMuted" align="center" style={{ marginTop: 4 }}>
        {t(state.mode === "endless" ? "liarsdice.fewestCups" : "liarsdice.lastStanding")}
      </AppText>
      {state.mode === "endless" ? (
        <AppText variant="caption" color="textSubtle" align="center" style={{ marginTop: 6 }}>
          {state.cups
            .map((cups, seat) => ({ cups, seat }))
            .sort((a, b) => a.cups - b.cups)
            .map(({ cups, seat }) => `${nameOf(seat)} 🍺${cups}`)
            .join("   ")}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  die: {
    flexDirection: "row",
    flexWrap: "wrap",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  pipCell: {
    width: "33.33%",
    height: "33.33%",
    alignItems: "center",
    justifyContent: "center",
  },
  bidRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  zhaiTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  diceRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepButton: { width: 52 },
  quantity: { minWidth: 48, textAlign: "center" },
  faces: { flexDirection: "row", justifyContent: "space-between" },
  faceButton: { padding: 3, borderWidth: 2.5, borderRadius: 12 },
  zhaiToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  challengeRow: { flexDirection: "row", gap: 10 },
  player: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 18,
  },
  revealRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  revealName: { width: 64 },
});
