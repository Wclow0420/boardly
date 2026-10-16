// What Double Agent's tools open beside the stage (in the shared Popup):
// the record — every operation as a Journal page, its teams and votes,
// how it went, and what only this player knows — and the agents at the
// table with what this player knows of each.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { Journal, type JournalPage, type JournalSection } from "@/features/game/Journal";
import { fontFamily, useTheme } from "@/theme";
import type { GamePlayer } from "../types";
import { sideOf, type AvalonState } from "./logic";

type T = (key: string, options?: Record<string, unknown>) => string;

export interface Names {
  nameOf: (seat: number) => string;
  namesOf: (seats: number[]) => string;
}

/** What happened, as Journal pages: one per operation, holding its teams
 *  and votes, how it went, and (on the first) what only this player
 *  knows. */
export function avalonPages(state: AvalonState, names: Names, t: T): JournalPage[] {
  const evil = state.myRole !== null && sideOf(state.myRole) === "evil";
  const ops = new Set<number>([...state.history.map((p) => p.quest), ...state.questResults.map((_, q) => q)]);
  if (state.myRole) ops.add(0);
  const knows =
    state.myRole && state.known.length > 0
      ? t(`avalon.role.knows.${state.myRole === "percival" ? "merlin" : evil ? "allies" : "evil"}`, {
          names: names.namesOf(state.known.map((k) => k.seat)),
        })
      : null;
  return [...ops]
    .sort((a, b) => a - b)
    .map((q) => {
      const result = state.questResults[q];
      const sections: JournalSection[] = [
        {
          key: "teams",
          title: `🗳️  ${t("avalon.journal.teams")}`,
          entries: state.history
            .filter((p) => p.quest === q)
            .map((p) => {
              const yes = p.votes.map((v, seat) => (v ? seat : -1)).filter((seat) => seat >= 0);
              const no = p.votes.map((v, seat) => (v ? -1 : seat)).filter((seat) => seat >= 0);
              return {
                text: `👑 ${t("avalon.journal.proposal", {
                  leader: names.nameOf(p.leader),
                  team: names.namesOf(p.team),
                })} — ${t(p.approved ? "avalon.journal.approved" : "avalon.journal.rejected")}`,
                detail: [`👍 ${yes.length ? names.namesOf(yes) : "—"}`, `👎 ${no.length ? names.namesOf(no) : "—"}`],
              };
            }),
        },
        {
          key: "op",
          title: `💼  ${t("avalon.journal.operation")}`,
          entries: result
            ? [
                {
                  text: `${result.success ? "✅" : "❌"} ${t(result.success ? "avalon.journal.succeeded" : "avalon.journal.failed")}`,
                  detail: [
                    t("avalon.journal.team", { names: names.namesOf(result.team) }),
                    result.fails > 0 ? t("avalon.reveal.failCards", { count: result.fails }) : t("avalon.desk.noFails"),
                  ],
                  tone: result.success !== evil ? ("good" as const) : ("bad" as const),
                },
              ]
            : [],
        },
        {
          key: "mine",
          title: `🔒  ${t("avalon.journal.private")}`,
          private: true,
          entries:
            q === 0 && state.myRole
              ? [
                  {
                    text: `🎭 ${t(`avalon.roles.${state.myRole}.name`)} · ${t(`avalon.sides.${evil ? "evil" : "good"}`)}`,
                    detail: knows ? [knows] : undefined,
                  },
                ]
              : [],
        },
      ];
      return {
        key: `op-${q}`,
        title: t("avalon.journal.op", { n: q + 1 }),
        subtitle: result
          ? `${result.success ? "✅" : "❌"} ${t(result.success ? "avalon.journal.succeeded" : "avalon.journal.failed")}`
          : undefined,
        sections,
      };
    });
}

/** Everything public, newest operation first. */
export function Record({ state, names }: { state: AvalonState; names: Names }) {
  const { t } = useTranslation();
  return <Journal pages={avalonPages(state, names, t)} emptyText={t("common.emptyTitle")} />;
}

/** Everyone at the table, with what I know of them. */
export function Agents({
  state,
  mySeat,
  players,
  names,
}: {
  state: AvalonState;
  mySeat: number;
  players: GamePlayer[];
  names: Names;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const knownAs = new Map(state.known.map((k) => [k.seat, k.as]));
  return (
    <View style={styles.list}>
      {players
        .slice()
        .sort((a, b) => a.seat - b.seat)
        .map((player) => {
          const seat = player.seat;
          const role = state.roles?.[seat];
          const evilNow = state.evilSeats?.includes(seat) ?? false;
          const as = seat !== mySeat ? knownAs.get(seat) : undefined;
          const tag = role
            ? t(`avalon.roles.${role}.name`)
            : evilNow || as === "evil"
              ? t("avalon.known.evil")
              : as === "merlin"
                ? t("avalon.known.merlin")
                : null;
          const evil = role ? sideOf(role) === "evil" : evilNow || as === "evil";
          const done =
            state.phase === "vote"
              ? state.voted[seat]
              : state.phase === "quest"
                ? state.questPlayed.includes(seat)
                : false;
          const marks = [
            state.leader === seat && state.phase !== "finished" && state.phase !== "assassinate" ? "👑" : "",
            (state.phase === "vote" || state.phase === "quest") && state.team.includes(seat) ? "💼" : "",
            state.assassinSeat === seat ? "🎯" : "",
          ].join("");
          return (
            <View key={player.userId} style={[styles.row, { backgroundColor: colors.well }]}>
              <AvatarBorder name={player.username} avatarUrl={player.avatarUrl} mascot={player.mascot} size={34} />
              <View style={styles.grow}>
                <AppText variant="label" numberOfLines={1}>
                  {`${names.nameOf(seat)}${marks ? `  ${marks}` : ""}`}
                </AppText>
                {tag ? (
                  <AppText
                    variant="tiny"
                    style={{ color: evil ? colors.danger : as === "merlin" ? colors.primary : colors.successStrong }}
                  >
                    {tag}
                  </AppText>
                ) : null}
              </View>
              {done ? <AppText style={[styles.done, { color: colors.successStrong }]}>✓</AppText> : null}
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14 },
  grow: { flex: 1 },
  done: { fontFamily: fontFamily.bold, fontSize: 16 },
});
