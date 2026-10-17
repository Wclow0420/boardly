// Seal the Manor's role card, as a playing card: the back in the
// manor's night blue with gothic tracery and a lantern-orange jewel in
// the Boardly meeple; the front with the role's engraved portrait
// (emblems/roles.ts) standing in a stained window (night blue for the
// watchers, crimson for the evil; cards.ts), its name on the plaque,
// which side it is on, what it does, and what the role knows.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import { EmblemGlyph } from "@/components/engraved/Engraved";
import { CardBack, CardFront, FRONT, type BackStyle } from "@/components/tabletop/cards/PlayingCard";
import { CARD_H, CARD_W } from "@/components/tabletop/cards/cardArt";
import { fontFamily } from "@/theme";
import { EMBLEM_AT, faceSvg, frontOf } from "./cards";
import { ROLE_EMBLEMS } from "./emblems/roles";
import { GameText as AppText } from "./GameText";
import { sideOf, type NightwatchState, type Role } from "./logic";

/** Every card of the game shares this back. */
export const MANOR_BACK: BackStyle = {
  colors: ["#3A4A7A", "#1E2A50", "#0E1430"],
  pattern: "tracery",
  jewel: ["#FFE7B0", "#F28B4B", "#7A2A08"],
};

/** The back of a role card. */
export function RoleCardBack({ width }: { width: number }) {
  return <CardBack width={width} back={MANOR_BACK} />;
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
    <CardFront width={width} front={frontOf(role)}>
      <Portrait role={role} s={s} />
      <View style={[at(FRONT.plaque), styles.centre]}>
        <AppText style={[styles.name, { fontSize: 7 * s, lineHeight: 9 * s }]} numberOfLines={1}>
          {t(`nightwatch.roles.${role}.name`)}
        </AppText>
      </View>
      <View style={[at(FRONT.body), styles.body]}>
        <AppText style={[styles.side, { fontSize: 3.6 * s, lineHeight: 4.8 * s, color: evil ? "#A01830" : "#1E5A8A" }]}>
          {evil ? t("nightwatch.sides.evil") : t("nightwatch.sides.good")}
        </AppText>
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
  side: { fontFamily: fontFamily.bold, letterSpacing: 2, textTransform: "uppercase" },
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

/** A small face-up role card, for the end of the game: its whole face
 *  (frame, window and portrait) baked into one picture, one per role and
 *  size, laid exactly where CardFront lays its art. */
export function MiniRoleCard({ role, width }: { role: Role; width: number }) {
  const s = width / CARD_W;
  const pad = 3;
  const w = (CARD_W + 2 * pad) * s;
  const h = (CARD_H + 2 * pad) * s;
  const face = bakedSvg(`manor-face|${role}`, w, h, () => faceSvg(role));
  return (
    <View style={{ width, height: (width * CARD_H) / CARD_W }} pointerEvents="none">
      <Canvas style={{ position: "absolute", left: -pad * s, top: -pad * s, width: w, height: h }}>
        {face ? <SkImage image={face} x={0} y={0} width={w} height={h} /> : null}
      </Canvas>
    </View>
  );
}
