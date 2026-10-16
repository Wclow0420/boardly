// Seal the Manor's role card, as a playing card: the back in the
// manor's night blue with gothic tracery and a lantern-orange jewel in
// the Boardly meeple; the front with the role's emblem in a stained
// window (night blue for the watchers, crimson for the evil), its name on
// the plaque, which side it is on, what it does, and what the role knows.

import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Emblem } from "@/components/icons";
import { CardBack, CardFront, FRONT, type BackStyle, type FrontStyle } from "@/components/tabletop/cards/PlayingCard";
import { fontFamily } from "@/theme";
import { GameText as AppText } from "./GameText";
import { ROLE_EMOJI, sideOf, type NightwatchState, type Role } from "./logic";

/** Every card of the game shares this back. */
export const MANOR_BACK: BackStyle = {
  colors: ["#3A4A7A", "#1E2A50", "#0E1430"],
  pattern: "tracery",
  jewel: ["#FFE7B0", "#F28B4B", "#7A2A08"],
};

const GOOD_FRONT: FrontStyle = {
  window: ["#5A7ABE", "#22356A", "#0C1634"],
  plaque: ["#4AA06A", "#1E6A3A", "#0E3A1E"],
};
const EVIL_FRONT: FrontStyle = {
  window: ["#D2445A", "#7A1020", "#2E0408"],
  plaque: ["#D2384A", "#8A1424", "#4A0812"],
};

/** The back of a role card. */
export function RoleCardBack({ width }: { width: number }) {
  return <CardBack width={width} back={MANOR_BACK} />;
}

/** The front of my role card. */
export function RoleCardFace({
  state,
  mySeat,
  width,
  namesOf,
  nameOf,
}: {
  state: NightwatchState;
  mySeat: number;
  width: number;
  namesOf: (seats: number[]) => string;
  nameOf: (seat: number) => string;
}) {
  const { t } = useTranslation();
  const role = state.myRole!;
  const evil = sideOf(role) === "evil";
  const known = state.known.map((k) => k.seat);
  const usesOf = { tracker: 2, double: 2, keeper: 1 } as Record<string, number>;
  const s = width / 100;
  const at = (box: { x: number; y: number; w: number; h: number }) => ({
    position: "absolute" as const,
    left: box.x * s,
    top: box.y * s,
    width: box.w * s,
    height: box.h * s,
  });
  const lines: string[] = [];
  if (known.length > 0)
    lines.push(
      role === "prophet"
        ? t("nightwatch.role.knowsEvil", { names: namesOf(known) })
        : role === "apprentice"
          ? t("nightwatch.role.knowsProphet", { names: namesOf(known) })
          : t("nightwatch.role.allies", { names: namesOf(known) }),
    );
  if (evil && state.assassinSeat !== null)
    lines.push(
      state.assassinSeat === mySeat
        ? t("nightwatch.role.youAssassin")
        : t("nightwatch.role.assassin", { name: nameOf(state.assassinSeat) }),
    );
  if (usesOf[role]) lines.push(t("nightwatch.role.uses", { count: state.abilityLeft, total: usesOf[role] }));

  return (
    <CardFront width={width} front={evil ? EVIL_FRONT : GOOD_FRONT}>
      <View style={[at(FRONT.window), styles.centre]}>
        <Emblem emoji={ROLE_EMOJI[role]} size={FRONT.window.h * s * 0.7} />
        <AppText style={[styles.side, { fontSize: 3.6 * s, color: evil ? "#FFC2CA" : "#C8DCFF" }]}>
          {evil ? t("nightwatch.sides.evil") : t("nightwatch.sides.good")}
        </AppText>
      </View>
      <View style={[at(FRONT.plaque), styles.centre]}>
        <AppText style={[styles.name, { fontSize: 7 * s, lineHeight: 9 * s }]} numberOfLines={1}>
          {t(`nightwatch.roles.${role}.name`)}
        </AppText>
      </View>
      <View style={[at(FRONT.body), styles.body]}>
        <AppText style={[styles.desc, { fontSize: 3.55 * s, lineHeight: 4.8 * s }]}>
          {t(`nightwatch.roles.${role}.desc`)}
        </AppText>
        {lines.map((line, i) => (
          <AppText
            key={i}
            style={[styles.known, { fontSize: 3.35 * s, lineHeight: 4.5 * s, color: evil ? "#8A1424" : "#1E5A8A" }]}
          >
            {line}
          </AppText>
        ))}
      </View>
    </CardFront>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: "center", justifyContent: "center" },
  side: {
    position: "absolute",
    bottom: "6%",
    fontFamily: fontFamily.bold,
    letterSpacing: 2,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  name: {
    fontFamily: fontFamily.bold,
    color: "#FFF6E0",
    letterSpacing: 1,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  body: { gap: 2, alignItems: "center" },
  desc: { fontFamily: fontFamily.medium, color: "#3A2408", textAlign: "center" },
  known: { fontFamily: fontFamily.semiBold, textAlign: "center" },
});

/** A small face-up role card, for the end of the game: the role's
 *  emblem in its window, in its side's colours. */
export function MiniRoleCard({ role, width }: { role: Role; width: number }) {
  const evil = sideOf(role) === "evil";
  const s = width / 100;
  return (
    <CardFront width={width} front={evil ? EVIL_FRONT : GOOD_FRONT}>
      <View
        style={[
          styles.centre,
          {
            position: "absolute",
            left: FRONT.window.x * s,
            top: FRONT.window.y * s,
            width: FRONT.window.w * s,
            height: FRONT.window.h * s,
          },
        ]}
      >
        <Emblem emoji={ROLE_EMOJI[role]} size={FRONT.window.h * s * 0.72} />
      </View>
    </CardFront>
  );
}
