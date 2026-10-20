// Double Agent's role card, as a playing card (components/tabletop/cards):
// the back in the agency's sea-green with a lattice like a file's
// security print and an emerald in the Boardly meeple; the front a
// personnel file — the role's engraved portrait (emblems.ts) under a
// round arch in its own shade (teal and steel for the agents, crimson for
// the moles; cards.ts), a red TOP SECRET stamp across its corner, the
// cover name on the brass plaque, its side, what it does and what it
// knows.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import { EmblemGlyph } from "@/components/engraved/Engraved";
import { CardBack, CardFront, FRONT, type BackStyle } from "@/components/tabletop/cards/PlayingCard";
import { CARD_H, CARD_W } from "@/components/tabletop/cards/cardArt";
import { AppText } from "@/components/ui";
import { fontFamily } from "@/theme";
import { EMBLEM_AT, ROLE_FRONT, faceSvg } from "./cards";
import { ROLE_EMBLEMS } from "./emblems";
import { sideOf, type AvalonState, type Role } from "./logic";

/** Every card of the game shares this back. */
export const AGENCY_BACK: BackStyle = {
  colors: ["#2E6A68", "#16403F", "#0A2224"],
  pattern: "lattice",
  jewel: ["#C8FFD8", "#1E9A54", "#06401E"],
};

/** The back of a role card. */
export function RoleCardBack({ width }: { width: number }) {
  return <CardBack width={width} back={AGENCY_BACK} />;
}

/** The role's portrait standing on the window's sill. */
function Portrait({ role, s }: { role: Role; s: number }) {
  return (
    <View
      style={{ position: "absolute", left: EMBLEM_AT.x * s, top: EMBLEM_AT.y * s }}
      pointerEvents="none"
    >
      <EmblemGlyph data={ROLE_EMBLEMS[role]} size={EMBLEM_AT.size * s} />
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
    <CardFront width={width} front={ROLE_FRONT[role]}>
      <Portrait role={role} s={s} />
      <Stamp s={s} label={t("avalon.stage.secret")} />
      <View style={[at(FRONT.plaque), styles.centre]}>
        <AppText style={[styles.name, { fontSize: 7 * s, lineHeight: 9 * s }]} numberOfLines={1}>
          {t(`avalon.roles.${role}.name`)}
        </AppText>
      </View>
      <View style={[at(FRONT.body), styles.body]}>
        <AppText style={[styles.side, { fontSize: 3.6 * s, lineHeight: 4.8 * s, color: evil ? "#A01830" : "#0E6A5E" }]}>
          {t(`avalon.sides.${evil ? "evil" : "good"}`)}
        </AppText>
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

/** A small face-up role card, for the end of the game: its whole face
 *  baked into one picture (one per role and size). */
export function MiniRoleCard({ role, width }: { role: Role; width: number }) {
  const h = Math.round((width * CARD_H) / CARD_W);
  const face = bakedSvg(`agency-face|${role}`, width, h, () => faceSvg(role));
  return (
    <View style={{ width, height: h }} pointerEvents="none">
      <Canvas style={{ width, height: h }}>
        {face ? <SkImage image={face} x={0} y={0} width={width} height={h} /> : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: "center", justifyContent: "center" },
  side: { fontFamily: fontFamily.bold, letterSpacing: 2, textTransform: "uppercase" },
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
