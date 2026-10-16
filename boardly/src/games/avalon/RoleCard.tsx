// Double Agent's role card, as a playing card (components/tabletop/cards):
// the back in the agency's sea-green with a lattice like a file's
// security print and an emerald in the Boardly meeple; the front a
// personnel file — the agent's photograph under a round arch (sea-green
// for the agents, crimson for the moles), a red TOP SECRET stamp across
// its corner, the cover name on the plaque, what the role does and what
// it knows.

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { CardBack, CardFront, FRONT, type BackStyle, type FrontStyle } from "@/components/tabletop/cards/PlayingCard";
import { fontFamily } from "@/theme";
import { ROLE_ART } from "./art";
import { ROLE_EMOJI, sideOf, type AvalonState, type Role } from "./logic";

/** Every card of the game shares this back. */
export const AGENCY_BACK: BackStyle = {
  colors: ["#2E6A68", "#16403F", "#0A2224"],
  pattern: "lattice",
  jewel: ["#C8FFD8", "#1E9A54", "#06401E"],
};

const AGENT_FRONT: FrontStyle = {
  window: ["#5ABAB0", "#1E6A66", "#0A2E2C"],
  plaque: ["#3AAE9E", "#1A6A60", "#0A3A34"],
  arch: "round",
};
const MOLE_FRONT: FrontStyle = {
  window: ["#D2445A", "#7A1020", "#2E0408"],
  plaque: ["#D2384A", "#8A1424", "#4A0812"],
  arch: "round",
};

/** The back of a role card. */
export function RoleCardBack({ width }: { width: number }) {
  return <CardBack width={width} back={AGENCY_BACK} />;
}

/** The agent's photograph in the card's window: the role's portrait, or
 *  its emblem while it has none. */
function Photo({ role, s }: { role: Role; s: number }) {
  const W = FRONT.window;
  const art = ROLE_ART[role];
  return (
    <View
      style={{
        position: "absolute",
        left: (W.x + 1) * s,
        top: (W.y + 1) * s,
        width: (W.w - 2) * s,
        height: (W.h - 2) * s,
        borderTopLeftRadius: ((W.w - 2) / 2) * s,
        borderTopRightRadius: ((W.w - 2) / 2) * s,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {art ? (
        <Image source={art} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      ) : (
        <AppText style={{ fontSize: W.h * s * 0.5, lineHeight: W.h * s * 0.66 }}>{ROLE_EMOJI[role]}</AppText>
      )}
      <LinearGradient colors={["#00000000", "#000000AA"]} style={styles.fade} />
    </View>
  );
}

/** The red rubber stamp across the photograph's corner. */
function Stamp({ s, label }: { s: number; label: string }) {
  return (
    <View
      style={[
        styles.stamp,
        {
          left: 56 * s,
          top: 14 * s,
          paddingHorizontal: 1.6 * s,
          borderWidth: 0.7 * s,
          borderRadius: 1.2 * s,
        },
      ]}
    >
      <AppText style={[styles.stampText, { fontSize: 3.3 * s, lineHeight: 4.6 * s, letterSpacing: 0.4 * s }]}>
        {label}
      </AppText>
    </View>
  );
}

/** The front of my role card. */
export function RoleCardFace({
  state,
  width,
  namesOf,
}: {
  state: AvalonState;
  width: number;
  namesOf: (seats: number[]) => string;
}) {
  const { t } = useTranslation();
  const role = state.myRole!;
  const evil = sideOf(role) === "evil";
  const known = state.known.map((k) => k.seat);
  const s = width / 100;
  const at = (box: { x: number; y: number; w: number; h: number }) => ({
    position: "absolute" as const,
    left: box.x * s,
    top: box.y * s,
    width: box.w * s,
    height: box.h * s,
  });
  const knows =
    known.length > 0
      ? t(`avalon.role.knows.${role === "percival" ? "merlin" : evil ? "allies" : "evil"}`, { names: namesOf(known) })
      : null;

  return (
    <CardFront width={width} front={evil ? MOLE_FRONT : AGENT_FRONT}>
      <Photo role={role} s={s} />
      <View style={[at(FRONT.window), styles.centre]} pointerEvents="none">
        <AppText style={[styles.side, { fontSize: 3.6 * s, color: evil ? "#FFC2CA" : "#C8FFF4" }]}>
          {t(`avalon.sides.${evil ? "evil" : "good"}`)}
        </AppText>
      </View>
      <Stamp s={s} label={t("avalon.stage.secret")} />
      <View style={[at(FRONT.plaque), styles.centre]}>
        <AppText style={[styles.name, { fontSize: 7 * s, lineHeight: 9 * s }]} numberOfLines={1}>
          {t(`avalon.roles.${role}.name`)}
        </AppText>
      </View>
      <View style={[at(FRONT.body), styles.body]}>
        <AppText style={[styles.desc, { fontSize: 3.55 * s, lineHeight: 4.8 * s }]}>
          {t(`avalon.roles.${role}.desc`)}
        </AppText>
        {knows ? (
          <AppText
            style={[styles.known, { fontSize: 3.35 * s, lineHeight: 4.5 * s, color: evil ? "#8A1424" : "#0E5A52" }]}
          >
            {knows}
          </AppText>
        ) : null}
      </View>
    </CardFront>
  );
}

/** A small face-up role card, for the end of the game: the photograph
 *  in its side's colours. */
export function MiniRoleCard({ role, width }: { role: Role; width: number }) {
  const evil = sideOf(role) === "evil";
  return (
    <CardFront width={width} front={evil ? MOLE_FRONT : AGENT_FRONT}>
      <Photo role={role} s={width / 100} />
    </CardFront>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: "center", justifyContent: "center" },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "38%" },
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
  stamp: {
    position: "absolute",
    borderColor: "#C2203A",
    backgroundColor: "rgba(255,240,236,0.12)",
    transform: [{ rotate: "14deg" }],
    opacity: 0.92,
  },
  stampText: { fontFamily: fontFamily.bold, color: "#D0283E", textTransform: "uppercase" },
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
