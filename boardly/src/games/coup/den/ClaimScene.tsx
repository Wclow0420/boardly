// A claim on the table, for everyone to see: the one making it holds up
// a face-down card under the lights, their claim written large in the
// role's colour, and how the room is answering — a bar filling as people
// let it go, a seal on each of their name plates. Whoever may challenge
// or block answers on the plinth; a block that could be either of two
// roles is chosen here first. While I answer, my own cards sit here too
// (so I needn't open them to decide), and a block I truly hold is ticked.

import { memo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { EmblemGlyph } from "@/components/engraved/Engraved";
import { Emblem } from "@/components/icons";
import { AppText, BezelOverlay } from "@/components/ui";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { ROLE_TINT } from "../art";
import { HustleBack } from "../cards";
import { ROLE_EMBLEMS } from "../emblems";
import type { Role } from "../logic";

export const ClaimScene = memo(function ClaimScene({
  kicker,
  headline,
  role,
  detail,
  done,
  total,
  progressLabel,
  chips,
  hand,
  lineup,
}: {
  /** "Ming says" */
  kicker: string;
  /** "I'm the Boss" */
  headline: string;
  /** The role claimed (its emblem and colour), if any. */
  role: Role | null;
  /** "Collect Rent · +$3" */
  detail: string;
  done: number;
  total: number;
  progressLabel: string;
  /** Roles to block as, when there's a choice. */
  chips?: { roles: Role[]; picked: Role; label: (role: Role) => string; onPick: (role: Role) => void };
  /** My cards still face down, while I'm the one answering. */
  hand?: { label: string; roles: Role[]; name: (role: Role) => string };
  lineup: ReactNode;
}) {
  const tint = role ? ROLE_TINT[role] : "#FFD27A";
  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeInDown.duration(420)} style={styles.placard}>
        <View style={styles.card}>
          <HustleBack width={58} />
          {role ? (
            <View style={[styles.badge, { borderColor: tint }]}>
              <EmblemGlyph data={ROLE_EMBLEMS[role]} size={28} />
            </View>
          ) : null}
        </View>
        <View style={styles.words}>
          <AppText style={styles.kicker} numberOfLines={1}>
            {kicker}
          </AppText>
          <AppText style={[styles.headline, { color: tint }]} numberOfLines={2}>
            {headline}
          </AppText>
          <AppText style={styles.detail} numberOfLines={2}>
            {detail}
          </AppText>
        </View>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.progress}>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${total > 0 ? (done / total) * 100 : 0}%` }]} />
          <BezelOverlay r={5} t={1.6} />
        </View>
        <AppText style={styles.progressText} numberOfLines={1}>
          {progressLabel}
        </AppText>
      </Animated.View>
      {hand && hand.roles.length ? (
        <Animated.View entering={FadeIn.delay(200).duration(360)} style={styles.hand}>
          <AppText style={styles.handLabel} numberOfLines={1}>
            {hand.label}
          </AppText>
          {hand.roles.map((r, i) => (
            <View key={i} style={[styles.handCard, { borderColor: ROLE_TINT[r] }]}>
              <EmblemGlyph data={ROLE_EMBLEMS[r]} size={18} />
              <AppText style={styles.handName} numberOfLines={1}>
                {hand.name(r)}
              </AppText>
            </View>
          ))}
        </Animated.View>
      ) : null}
      {chips ? (
        <View style={styles.chips}>
          {chips.roles.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="button"
              accessibilityState={{ selected: chips.picked === r }}
              onPress={() => {
                tapHaptic();
                chips.onPick(r);
              }}
              style={[styles.chipBox, chips.picked === r && { borderColor: ROLE_TINT[r], backgroundColor: `${ROLE_TINT[r]}33` }]}
            >
              <EmblemGlyph data={ROLE_EMBLEMS[r]} size={20} />
              <AppText style={styles.chipText} numberOfLines={1}>
                {chips.label(r)}
              </AppText>
              {hand?.roles.includes(r) ? <Emblem emoji="✓" size={14} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.lineup}>{lineup}</View>
    </View>
  );
});

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  hand: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, paddingHorizontal: 18, marginTop: 8 },
  handLabel: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 16, color: "#C8B8A8", ...shadow },
  handCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: "#1C0C0E",
  },
  handName: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 16, color: "#FFF2D8" },
  wrap: { flex: 1 },
  placard: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingTop: 10 },
  card: { transform: [{ rotate: "-7deg" }] },
  badge: {
    position: "absolute",
    right: -12,
    bottom: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: "#1C0C0E",
    alignItems: "center",
    justifyContent: "center",
  },
  words: { flex: 1, gap: 1 },
  kicker: { fontFamily: fontFamily.medium, fontSize: 12.5, lineHeight: 16, color: "#E8D8C0", ...shadow },
  headline: { fontFamily: fontFamily.bold, fontSize: 21, lineHeight: 26, letterSpacing: 0.5, ...shadow },
  detail: { fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 17, color: "#FFE7C8", ...shadow },
  progress: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, marginTop: 14 },
  bar: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: "#2A1012" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "#E8B84A" },
  progressText: { fontFamily: fontFamily.semiBold, fontSize: 11.5, lineHeight: 15, color: "#F1E6D2", ...shadow },
  chips: { flexDirection: "row", gap: 10, paddingHorizontal: 18, marginTop: 12 },
  chipBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#5A3A2A",
    backgroundColor: "rgba(20,8,8,0.6)",
  },
  chipText: { fontFamily: fontFamily.bold, fontSize: 12.5, lineHeight: 16, color: "#FFF2D8", flexShrink: 1 },
  lineup: { flex: 1, marginTop: 6 },
});
