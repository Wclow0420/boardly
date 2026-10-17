// Hustle's cards, as the shared playing cards (components/tabletop/cards):
// the back in the den's red lacquer with a window lattice and a jade
// jewel in the Boardly meeple's heart; each role's front its own enamel
// in the window (the Boss's lamp-gold, the Enforcer's jade, the
// Pickpocket's amber, the Fixer's violet, the Auntie's rose) with the
// role's engraved portrait (emblems.ts) standing on the window's sill,
// its name on the plaque and what it does.
// The small cards at players' feet and in the header are baked images
// (one per role, one back), drawn together on one canvas.

import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { EmblemGlyph } from "@/components/engraved/Engraved";
import { toSvgBody } from "@/components/engraved/emblem";
import { CardBack, CardFront, FRONT, type BackStyle, type FrontStyle } from "@/components/tabletop/cards/PlayingCard";
import { CARD_H, CARD_W, cardBack, cardFront } from "@/components/tabletop/cards/cardArt";
import { AppText } from "@/components/ui";
import { fontFamily } from "@/theme";
import { ROLE_EMBLEMS } from "./emblems";
import { ACTIONS, type Role } from "./logic";

export const CARD_RATIO = CARD_H / CARD_W;

/** Every Hustle card shares this back. */
export const HUSTLE_BACK: BackStyle = {
  colors: ["#C8303F", "#7A0E1E", "#3A040C"],
  pattern: "lattice",
  jewel: ["#C8FFE0", "#1E9A5A", "#08361C"],
};

export const ROLE_FRONT: Record<Role, FrontStyle> = {
  duke: { window: ["#FFD27A", "#C0801E", "#4A2A06"], plaque: ["#D2384A", "#8A1424", "#4A0812"] },
  assassin: { window: ["#7AE8B0", "#1E8A54", "#06301A"], plaque: ["#4A5468", "#262C3C", "#10141E"] },
  captain: { window: ["#FFBC88", "#C8642A", "#4A1A06"], plaque: ["#8A5A32", "#553218", "#2A160A"] },
  ambassador: { window: ["#C4A8FF", "#6040B8", "#1E0E48"], plaque: ["#5A48A0", "#2E2266", "#160E34"] },
  contessa: { window: ["#FFA8CE", "#C83C7C", "#4A0828"], plaque: ["#2E8A76", "#155446", "#082A22"] },
};

/** Where the portrait sits in a card's window, in the card's own units:
 *  its foot (y 44 of the 48 box) standing on the plaque's top edge
 *  (FRONT.plaque, y 60). */
const EMBLEM_AT = { size: 50, x: 25, y: 60 - (44 * 50) / 48 };

/** A whole card face as one SVG (frame and portrait), for the baked
 *  small cards where text would be too small to read. */
export function faceSvg(role: Role) {
  const s = EMBLEM_AT.size / 48;
  const portrait = `<g transform="translate(${EMBLEM_AT.x} ${+EMBLEM_AT.y.toFixed(2)}) scale(${+s.toFixed(4)})">${toSvgBody(ROLE_EMBLEMS[role], undefined, `r${role}`)}</g>`;
  return cardFront(ROLE_FRONT[role]).replace(/<\/svg>\s*$/, `${portrait}</svg>`);
}

export const backSvg = () => cardBack(HUSTLE_BACK);

/** Baked image keys for a small card: its back, or a role's face. */
export const miniKey = (role: Role | null) => (role ? `hustle-face2|${role}` : "hustle-back");
export const miniSvg = (role: Role | null) => (role ? faceSvg(role) : backSvg());

/** The back of a Hustle card. */
export function HustleBack({ width }: { width: number }) {
  return <CardBack width={width} back={HUSTLE_BACK} />;
}

/** A role's card, face up and readable: the portrait in its window, the
 *  name on the plaque, what it does and what it blocks. `lost`: turned
 *  over for good, struck through. */
export function RoleCard({ role, width, lost = false }: { role: Role; width: number; lost?: boolean }) {
  const { t } = useTranslation();
  const s = width / 100;
  const at = (box: { x: number; y: number; w: number; h: number }) => ({
    position: "absolute" as const,
    left: box.x * s,
    top: box.y * s,
    width: box.w * s,
    height: box.h * s,
  });
  const own = ACTIONS.filter((a) => a.claim === role);
  const blocks = ACTIONS.filter((a) => a.blockers.includes(role));
  return (
    <View style={lost ? styles.lost : null}>
      <CardFront width={width} front={ROLE_FRONT[role]}>
        <View style={{ position: "absolute", left: EMBLEM_AT.x * s, top: EMBLEM_AT.y * s }} pointerEvents="none">
          <EmblemGlyph data={ROLE_EMBLEMS[role]} size={EMBLEM_AT.size * s} />
        </View>
        <View style={[at(FRONT.plaque), styles.centre]}>
          <AppText style={[styles.name, { fontSize: 7 * s, lineHeight: 9 * s }]} numberOfLines={1}>
            {t(`coup.roles.${role}.name`)}
          </AppText>
        </View>
        {width >= 110 ? (
          <View style={[at(FRONT.body), styles.body]}>
            {own.map((a) => (
              <AppText key={a.type} style={[styles.does, { fontSize: 7 * s, lineHeight: 8.8 * s }]} numberOfLines={2}>
                {`${t(`coup.actions.${a.type}.name`)}: ${t(`coup.cardText.${a.type}`)}`}
              </AppText>
            ))}
            {blocks.length > 0 ? (
              <AppText style={[styles.blocks, { fontSize: 6.2 * s, lineHeight: 8 * s }]} numberOfLines={2}>
                {t("coup.cardText.blocks", { what: blocks.map((a) => t(`coup.actions.${a.type}.name`)).join(", ") })}
              </AppText>
            ) : null}
          </View>
        ) : null}
        {lost ? (
          <View style={[StyleSheet.absoluteFill, styles.centre]} pointerEvents="none">
            <View style={[styles.stamp, { borderWidth: 1.4 * s, paddingHorizontal: 3 * s, borderRadius: 2.5 * s }]}>
              <AppText style={[styles.stampText, { fontSize: 7 * s, lineHeight: 9.5 * s }]}>{t("coup.lost")}</AppText>
            </View>
          </View>
        ) : null}
      </CardFront>
    </View>
  );
}

/** A card face, or its back when the role is hidden. */
export function AnyCard({ role, width, lost = false }: { role: Role | null; width: number; lost?: boolean }) {
  return role ? <RoleCard role={role} width={width} lost={lost} /> : <HustleBack width={width} />;
}

/** A card that turns over: `flip` 0 (its back up) to 1 (the role's face). */
export function FlipCard({ role, width, flip, lost = false }: { role: Role; width: number; flip: SharedValue<number>; lost?: boolean }) {
  const backSide = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flip.value * 180}deg` }],
  }));
  const frontSide = useAnimatedStyle(() => ({
    opacity: flip.value >= 0.5 ? 1 : 0,
    transform: [{ perspective: 1200 }, { rotateY: `${flip.value * 180 - 180}deg` }],
  }));
  return (
    <View style={{ width, height: width * CARD_RATIO }}>
      <Animated.View style={[StyleSheet.absoluteFill, backSide]}>
        <HustleBack width={width} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, frontSide]}>
        <RoleCard role={role} width={width} lost={lost} />
      </Animated.View>
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.7)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
};

const styles = StyleSheet.create({
  centre: { alignItems: "center", justifyContent: "center" },
  lost: { opacity: 0.62 },
  name: { fontFamily: fontFamily.bold, color: "#FFF6E0", letterSpacing: 1, textTransform: "uppercase", ...shadow },
  body: { gap: 3, alignItems: "center", justifyContent: "center" },
  does: { fontFamily: fontFamily.semiBold, color: "#3A2408", textAlign: "center" },
  blocks: { fontFamily: fontFamily.medium, color: "#8A1424", textAlign: "center" },
  stamp: { borderColor: "#B8182E", backgroundColor: "rgba(255,240,236,0.85)", transform: [{ rotate: "-14deg" }] },
  stampText: { fontFamily: fontFamily.bold, color: "#B8182E", letterSpacing: 1.5, textTransform: "uppercase" },
});
