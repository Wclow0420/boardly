// Shelter (避难所): the board. The shelter fills the top of the screen;
// under it is whatever the day asks of the player — pick a place, play a
// card, take a post for the night, or vote. What happened since they
// last looked opens as news, and the cough is a full-screen moment.

import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { IsoPicture } from "@/components/iso";
import { EdgeGlow } from "@/features/game/EdgeGlow";
import { Popup } from "@/features/game/Popup";
import { useTheme } from "@/theme";
import { heavyHaptic, moveHaptic, tapHaptic } from "@/utils/haptics";
import type { GameBoardProps } from "../types";
import { GameButton as Button, GameText as AppText } from "./GameText";
import { GameIcon } from "./icons";
import {
  FOOD,
  PLACE_COLOR,
  POSTS,
  need,
  standing,
  type Card,
  type Note,
  type Place,
  type Post,
  type ShelterState,
} from "./logic";
import { ShelterScene, type ShelterPerson } from "./ShelterScene";
import { PLACE_HEIGHT, PLACE_WIDTH, placeScene } from "./shelterScenes";

type T = (key: string, options?: Record<string, unknown>) => string;

const CARD_EMOJI: Record<Card, string> = {
  f1: "🍞",
  f2: "🍞",
  f3: "🍞",
  none: "⭕",
  mold1: "🦠",
  mold2: "🦠",
  zombie: "🧟",
  medicine: "💊",
  sabotage: "🦠",
};

const PLACE_EMOJI: Record<Place, string> = { farm: "🌾", market: "🛒", hospital: "🏥" };
const POST_EMOJI: Record<Post, string> = { store: "📦", door: "🚪", sleep: "🛏" };
const ACT_EMOJI: Record<Post, string> = { store: "✋", door: "🔓", sleep: "🛏" };

/** A card as text: its sign and what it does. */
function cardText(card: Card, t: T) {
  const food = FOOD[card];
  const amount = food > 0 ? `+${food}` : food < 0 ? `${food}` : "";
  return `${CARD_EMOJI[card]} ${t(`shelter.cards.${card}`)}${amount ? ` ${amount}` : ""}`;
}

/** Remembers on the device how many coughs this player has watched, so
 *  the moment plays once per cough, not again after a reload. */
function useCoughsSeen(sessionId: string | undefined) {
  const key = sessionId ? `boardly.shelter.coughs.${sessionId}` : null;
  const [seen, setSeen] = useState<number | null>(key ? null : 0);
  useEffect(() => {
    if (!key) return;
    let live = true;
    AsyncStorage.getItem(key)
      .then((value) => {
        if (live) setSeen(value ? Number(value) || 0 : 0);
      })
      .catch(() => live && setSeen(0));
    return () => {
      live = false;
    };
  }, [key]);
  const mark = (count: number) => {
    setSeen(count);
    if (key) AsyncStorage.setItem(key, String(count)).catch(() => {});
  };
  return { seen, mark };
}

type Seen = { searches: number; nights: number; exiles: number };

export function ShelterBoard({
  state,
  mySeat,
  players,
  busy,
  finished,
  sessionId,
  onMove,
}: GameBoardProps<ShelterState>) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const over = finished || state.phase === "finished";

  const nameOf = (seat: number) =>
    seat === mySeat
      ? t("game.you")
      : (players.find((p) => p.seat === seat)?.username ?? `#${seat + 1}`);
  const namesOf = (seats: number[]) => (seats.length ? seats.map(nameOf).join("、") : "—");

  const [seen, setSeen] = useState<Seen>(() => ({
    searches: state.searches.length,
    nights: state.nights.length,
    exiles: state.exiles.length,
  }));
  const [record, setRecord] = useState(false);
  const [stealth, setStealth] = useState(false);
  const coughs = useCoughsSeen(sessionId);

  const send = (move: Record<string, unknown>) => {
    moveHaptic();
    onMove(move);
  };

  // --- what happened since the player last looked
  const news = [
    ...state.searches.slice(seen.searches).flatMap((entry) => searchLines(entry, state, nameOf, t)),
    ...state.nights.slice(seen.nights).flatMap((entry) => nightLines(entry, state, nameOf, namesOf, t)),
    ...state.exiles.slice(seen.exiles).flatMap((entry) => exileLines(entry, nameOf, t)),
  ];
  const readNews = () =>
    setSeen({
      searches: state.searches.length,
      nights: state.nights.length,
      exiles: state.exiles.length,
    });

  const coughing = coughs.seen !== null && state.coughs > coughs.seen && !over;
  const turnedMe = state.log.some((note) => note.kind === "turned" && note.day === state.day);
  useEffect(() => {
    if (coughing) heavyHaptic();
  }, [coughing]);

  const iAmInfected = state.myRole === "infected";
  const night = state.phase === "night";

  // --- who is shown in the shelter: never anyone's secret post
  const home =
    state.phase === "search" || state.phase === "play"
      ? standing(state).filter((s) => state.injured[s])
      : night
        ? standing(state).filter((s) => s === mySeat)
        : over
          ? state.status.map((_, s) => s)
          : standing(state);
  const people: ShelterPerson[] = home
    .sort((a, b) => (a === mySeat ? -1 : b === mySeat ? 1 : a - b))
    .map((seat) => ({
      seat,
      label: nameOf(seat),
      me: seat === mySeat,
      post: night && seat === mySeat && state.myPost ? state.myPost.post : undefined,
    }));

  const postLabels = Object.fromEntries(
    POSTS.map((post) => [
      post,
      iAmInfected ? t(`shelter.acts.${post}`) : t(`shelter.posts.${post}`),
    ])
  ) as Record<Post, string>;
  const choosing =
    night && state.canAct && !busy
      ? {
          labels: postLabels,
          onChoose: (post: Post) =>
            send({ type: "night", post, ...(stealth && post !== "sleep" ? { stealth: true } : {}) }),
        }
      : undefined;

  const showingNews = news.length > 0 && !coughing;

  return (
    <View style={{ gap: spacing.md }}>
      {/* the day, the storeroom, who you are */}
      <View style={styles.header}>
        <View style={styles.grow}>
          <AppText variant="h2">
            {`${night ? "🌙" : "☀"}  ${t("shelter.bar.day", { n: Math.min(state.day + 1, state.days), total: state.days })}`}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {`${t(`shelter.phases.${state.phase}`)}${
              state.coughs > 0
                ? `  ·  🤧 ${t("shelter.bar.coughs", { count: state.coughs, total: state.infectedTotal })}`
                : ""
            }`}
          </AppText>
        </View>
        <View style={[styles.store, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <AppText variant="h2" style={{ color: state.store < need(state) ? colors.danger : colors.successStrong }}>
            {`🍞 ${state.store}`}
          </AppText>
          <AppText variant="tiny" color="textMuted">
            {`${t("shelter.bar.need", { count: need(state) })}${state.medicine ? `  💊${state.medicine}` : ""}`}
          </AppText>
        </View>
      </View>
      {state.myRole ? (
        <AppText
          variant="label"
          style={{ color: iAmInfected ? colors.danger : colors.successStrong }}
        >
          {`${iAmInfected ? `☣  ${t("shelter.role.infected")}` : `🧍  ${t("shelter.role.survivor")}`}${
            state.myStatus && state.myStatus !== "ok" ? `  ·  ${t(`shelter.status.${state.myStatus}`)}` : ""
          }`}
        </AppText>
      ) : null}

      <ShelterScene
        food={state.store}
        night={night}
        people={people}
        choosing={choosing}
        paused={showingNews || coughing || record}
      />

      {over ? (
        <Result state={state} nameOf={nameOf} />
      ) : (
        <Task
          state={state}
          mySeat={mySeat}
          busy={busy}
          stealth={stealth}
          setStealth={setStealth}
          nameOf={nameOf}
          send={send}
        />
      )}

      <Button
        label={`📦  ${t("shelter.record.title")}`}
        variant="secondary"
        size="sm"
        onPress={() => {
          tapHaptic();
          setRecord(true);
        }}
      />

      <Popup
        visible={showingNews || record}
        title={showingNews ? t("shelter.news.title") : t("shelter.record.title")}
        onClose={() => (showingNews ? readNews() : setRecord(false))}
      >
        <View style={{ gap: spacing.sm }}>
          {(showingNews
            ? news
            : [
                ...state.searches.flatMap((e) => searchLines(e, state, nameOf, t)),
                ...state.nights.flatMap((e) => nightLines(e, state, nameOf, namesOf, t)),
                ...state.exiles.flatMap((e) => exileLines(e, nameOf, t)),
              ]
          ).map((line, i) => (
            <AppText key={i} variant={line.startsWith("—") ? "label" : "bodyMedium"}>
              {line}
            </AppText>
          ))}
          {!showingNews && state.searches.length === 0 ? (
            <AppText variant="body" color="textMuted">
              {t("common.emptyTitle")}
            </AppText>
          ) : null}
          <Button
            label={t("common.ok")}
            style={{ marginTop: spacing.md }}
            onPress={() => (showingNews ? readNews() : setRecord(false))}
          />
        </View>
      </Popup>

      <Modal visible={coughing} transparent animationType="fade" onRequestClose={() => {}}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("shelter.cough.continue")}
          style={[StyleSheet.absoluteFill, styles.cough]}
          onPress={() => {
            tapHaptic();
            coughs.mark(state.coughs);
          }}
        >
          <EdgeGlow color={turnedMe ? colors.danger : "#9CB8FF"} />
          <View style={styles.coughBody}>
            <GameIcon name={turnedMe ? "infected" : "cough"} size={96} color={turnedMe ? colors.danger : "#E9E2CF"} />
            <AppText variant="h1" align="center" style={{ color: turnedMe ? colors.danger : "#E9E2CF" }}>
              {turnedMe ? t("shelter.cough.youTitle") : t("shelter.cough.title")}
            </AppText>
            <AppText variant="bodyMedium" align="center" style={{ color: "#E9E2CF" }}>
              {turnedMe ? t("shelter.cough.youBody") : t("shelter.cough.body")}
            </AppText>
            <AppText variant="caption" align="center" style={{ color: "#AEB3C6", marginTop: 24 }}>
              {t("shelter.cough.continue")}
            </AppText>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** What the day asks of the player, under the shelter. */
function Task({
  state,
  mySeat,
  busy,
  stealth,
  setStealth,
  nameOf,
  send,
}: {
  state: ShelterState;
  mySeat: number;
  busy: boolean;
  stealth: boolean;
  setStealth: (on: boolean) => void;
  nameOf: (seat: number) => string;
  send: (move: Record<string, unknown>) => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const waiting = state.waiting.filter((s) => s !== mySeat);
  const waitLine = waiting.length ? (
    <AppText variant="caption" color="textMuted" align="center">
      {`⏳  ${t("shelter.waiting", { names: waiting.map(nameOf).join("、") })}`}
    </AppText>
  ) : null;

  if (state.myStatus && state.myStatus !== "ok") {
    return (
      <View style={{ gap: spacing.sm }}>
        <AppText variant="bodyMedium" color="textMuted" align="center">
          {state.myStatus === "fallen" ? `⚰  ${t("shelter.task.fallen")}` : `🚷  ${t("shelter.task.exiled")}`}
        </AppText>
        {waitLine}
      </View>
    );
  }
  if (!state.canAct) {
    const injured = (state.phase === "search" || state.phase === "play") && state.injured[mySeat];
    return (
      <View style={{ gap: spacing.sm }}>
        {injured ? (
          <AppText variant="bodyMedium" color="textMuted" align="center">
            {`🩹  ${t("shelter.task.injured")}`}
          </AppText>
        ) : null}
        {state.phase === "night" && state.myPost ? (
          <AppText variant="bodyMedium" color="textMuted" align="center">
            {`${(state.myRole === "infected" ? ACT_EMOJI : POST_EMOJI)[state.myPost.post]}  ${t("shelter.task.posted", {
              post: state.myRole === "infected" ? t(`shelter.acts.${state.myPost.post}`) : t(`shelter.posts.${state.myPost.post}`),
            })}`}
          </AppText>
        ) : null}
        {waitLine}
      </View>
    );
  }

  if (state.phase === "vote") {
    const others = standing(state).filter((s) => s !== mySeat);
    return (
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title">{`🗳  ${t("shelter.task.vote")}`}</AppText>
        <AppText variant="caption" color="textMuted">
          {t("shelter.task.voteHint", { count: Math.floor(standing(state).length / 2) + 1 })}
        </AppText>
        <View style={styles.chips}>
          {others.map((seat) => (
            <Button
              key={seat}
              label={nameOf(seat)}
              variant="secondary"
              size="sm"
              disabled={busy}
              onPress={() => send({ type: "vote", target: seat })}
            />
          ))}
        </View>
        <Button label={t("shelter.task.voteNobody")} variant="tertiary" disabled={busy} onPress={() => send({ type: "vote", target: -1 })} />
        {waitLine}
      </View>
    );
  }

  if (state.phase === "search") {
    return (
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title">{`☀  ${t("shelter.task.search")}`}</AppText>
        <View style={styles.places}>
          {state.places.map((place) => (
            <Pressable
              key={place}
              accessibilityRole="button"
              accessibilityLabel={t(`shelter.places.${place}`)}
              disabled={busy}
              onPress={() => send({ type: "search", place })}
              style={({ pressed }) => [
                styles.place,
                { borderColor: PLACE_COLOR[place], backgroundColor: pressed ? colors.well : colors.card },
              ]}
            >
              <IsoPicture shapes={placeScene(place)} width={PLACE_WIDTH} height={PLACE_HEIGHT} size={92} />
              <AppText variant="label" align="center">
                {`${PLACE_EMOJI[place]} ${t(`shelter.places.${place}`)}`}
              </AppText>
              <AppText variant="tiny" color="textMuted" align="center">
                {t(`shelter.placeHints.${place}`)}
              </AppText>
            </Pressable>
          ))}
        </View>
        {state.myTired ? (
          <AppText variant="caption" color="textMuted" align="center">
            {`💤  ${t("shelter.task.tired")}`}
          </AppText>
        ) : null}
        {waitLine}
      </View>
    );
  }

  if (state.phase === "play") {
    const infected = state.myRole === "infected";
    return (
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title">
          {`${state.myPlace ? PLACE_EMOJI[state.myPlace] : ""}  ${t("shelter.task.play", {
            place: state.myPlace ? t(`shelter.places.${state.myPlace}`) : "",
          })}`}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {t("shelter.task.playHint")}
        </AppText>
        <View style={styles.hand}>
          {state.myHand.map((card, index) => (
            <CardButton key={index} card={card} disabled={busy} onPress={() => send({ type: "play", card: index })} />
          ))}
          {infected ? (
            <CardButton card="sabotage" disabled={busy} onPress={() => send({ type: "play", card: "sabotage" })} />
          ) : null}
        </View>
        {waitLine}
      </View>
    );
  }

  // night: tap a post in the shelter
  const infected = state.myRole === "infected";
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="title">{`🌙  ${t(infected ? "shelter.task.nightInfected" : "shelter.task.night")}`}</AppText>
      <AppText variant="caption" color="textMuted">
        {t(infected ? "shelter.task.nightInfectedHint" : "shelter.task.nightHint")}
      </AppText>
      {infected && state.myStealth > 0 ? (
        <Button
          label={`👣  ${t(stealth ? "shelter.task.stealthOn" : "shelter.task.stealthOff")}`}
          variant={stealth ? "primary" : "secondary"}
          size="sm"
          onPress={() => {
            tapHaptic();
            setStealth(!stealth);
          }}
        />
      ) : null}
      {waitLine}
    </View>
  );
}

function CardButton({ card, disabled, onPress }: { card: Card; disabled: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const food = FOOD[card];
  const tone = card === "sabotage" ? colors.danger : food > 0 ? colors.successStrong : food < 0 || card === "zombie" ? colors.danger : colors.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`shelter.cards.${card}`)}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: tone, backgroundColor: pressed ? colors.well : colors.card },
      ]}
    >
      <AppText variant="h1" align="center" style={{ color: tone }}>
        {food > 0 ? `+${food}` : food < 0 ? `${food}` : CARD_EMOJI[card]}
      </AppText>
      <AppText variant="label" align="center">
        {cardText(card, t)}
      </AppText>
      <AppText variant="tiny" color="textMuted" align="center">
        {t(`shelter.cardHints.${card}`)}
      </AppText>
    </Pressable>
  );
}

function Result({ state, nameOf }: { state: ShelterState; nameOf: (seat: number) => string }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const good = state.winner === "survivors";
  return (
    <View style={[styles.result, { borderColor: good ? colors.successStrong : colors.danger, backgroundColor: colors.card, gap: spacing.sm }]}>
      <AppText variant="h2" align="center" style={{ color: state.winner ? (good ? colors.successStrong : colors.danger) : colors.text }}>
        {state.winner ? (good ? `🚚  ${t("shelter.result.survivors")}` : `☣  ${t("shelter.result.infected")}`) : t("shelter.result.none")}
      </AppText>
      {state.winReason ? (
        <AppText variant="bodyMedium" color="textMuted" align="center">
          {t(`shelter.reasons.${state.winReason}`)}
        </AppText>
      ) : null}
      {state.roles.map((role, seat) =>
        role === "infected" ? (
          <AppText key={seat} variant="bodyMedium" align="center" style={{ color: colors.danger }}>
            {`☣  ${t("shelter.result.wasInfected", { name: nameOf(seat) })}`}
          </AppText>
        ) : null
      )}
    </View>
  );
}

// ---------------------------------------------------------- news lines

function searchLines(
  entry: ShelterState["searches"][number],
  state: ShelterState,
  nameOf: (seat: number) => string,
  t: T
): string[] {
  const lines = [`— ☀ ${t("shelter.news.dayHeading", { n: entry.day + 1 })}`];
  for (const place of state.places) {
    const report = entry.places[place];
    if (!report) continue;
    lines.push(
      `${PLACE_EMOJI[place]} ${t(`shelter.places.${place}`)}：${report.players.map(nameOf).join("、")}`,
      `   ${report.cards.map((c) => cardText(c, t)).join("  ·  ")}  →  ${report.food >= 0 ? "+" : ""}${report.food} 🍞`
    );
  }
  if (entry.injured.length) {
    lines.push(`🧟 ${t("shelter.news.zombieHurt", { names: entry.injured.map(nameOf).join("、") })}`);
  }
  return lines;
}

function nightLines(
  entry: ShelterState["nights"][number],
  state: ShelterState,
  nameOf: (seat: number) => string,
  namesOf: (seats: number[]) => string,
  t: T
): string[] {
  const lines = [`— 🌙 ${t("shelter.news.nightHeading", { n: entry.day + 1 })}`];
  if (entry.cough) lines.push(`🤧 ${t("shelter.news.cough")}`);
  lines.push(`📦 ${t("shelter.news.store", { before: entry.before, after: entry.after })}`);
  if (entry.stolen) lines.push(`✋ ${t("shelter.news.stolen", { count: entry.stolen })}`);
  if (entry.opened) lines.push(`🔓 ${t("shelter.news.opened")}`);
  if (entry.injured.length) lines.push(`🩹 ${t("shelter.news.injured", { names: namesOf(entry.injured) })}`);
  if (entry.hungry.length) lines.push(`😵 ${t("shelter.news.hungry", { names: namesOf(entry.hungry) })}`);
  if (entry.fallen.length) lines.push(`⚰ ${t("shelter.news.fallen", { names: namesOf(entry.fallen) })}`);
  // what only this player knows about that night
  for (const note of state.log.filter((n) => n.day === entry.day)) {
    const line = privateLine(note, nameOf, t);
    if (line) lines.push(line);
  }
  return lines;
}

function privateLine(note: Note, nameOf: (seat: number) => string, t: T): string | null {
  switch (note.kind) {
    case "guarded":
      return note.saw.length
        ? `👀 ${t("shelter.notes.saw", { post: t(`shelter.posts.${note.post}`), names: note.saw.map(nameOf).join("、") })}`
        : `${POST_EMOJI[note.post]} ${t("shelter.notes.quiet", {
            post: t(`shelter.posts.${note.post}`),
            with: note.with.length ? note.with.map(nameOf).join("、") : t("shelter.notes.alone"),
          })}`;
    case "bumped":
      return `🛏 ${t("shelter.notes.bumped", { post: t(`shelter.posts.${note.post}`) })}`;
    case "caught":
      return `👀 ${t("shelter.notes.caught", { names: note.by.map(nameOf).join("、") })}`;
    case "stole":
      return `✋ ${t(note.sneaked ? "shelter.notes.stoleSneaked" : "shelter.notes.stole", { count: note.food })}`;
    case "opened":
      return `🔓 ${t(note.sneaked ? "shelter.notes.openedSneaked" : "shelter.notes.opened")}`;
    default:
      return null;
  }
}

function exileLines(entry: ShelterState["exiles"][number], nameOf: (seat: number) => string, t: T): string[] {
  const lines = [`— 🗳 ${t("shelter.news.voteHeading", { n: entry.day + 1 })}`];
  entry.votes.forEach((target, seat) => {
    if (target === null) return;
    lines.push(`   ${nameOf(seat)} → ${target === -1 ? t("shelter.news.nobody") : nameOf(target)}`);
  });
  lines.push(
    entry.exiled === null
      ? `🚷 ${t("shelter.news.noExile")}`
      : `🚷 ${t(entry.role === "infected" ? "shelter.news.exiledInfected" : "shelter.news.exiledSurvivor", { name: nameOf(entry.exiled) })}`
  );
  return lines;
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  store: { alignItems: "center", borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  places: { flexDirection: "row", gap: 8 },
  place: { flex: 1, alignItems: "center", borderWidth: 2, borderRadius: 14, padding: 6, gap: 2 },
  hand: { flexDirection: "row", gap: 10, justifyContent: "center" },
  card: { width: 104, minHeight: 132, alignItems: "center", justifyContent: "center", borderWidth: 2, borderRadius: 14, padding: 8, gap: 4 },
  result: { borderWidth: 2, borderRadius: 16, padding: 16 },
  cough: { backgroundColor: "rgba(5,6,11,0.96)", alignItems: "center", justifyContent: "center" },
  coughBody: { alignItems: "center", gap: 14, paddingHorizontal: 32, maxWidth: 420 },
});

