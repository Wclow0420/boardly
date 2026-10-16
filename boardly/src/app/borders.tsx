import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BackIcon, Emblem } from "@/components/icons";
import {
  AppText,
  Button,
  Frame,
  IconButton,
  SectionTitle, TitlePlaque,
  Screen,
  TableBackdrop,
} from "@/components/ui";
import { api } from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { TIERS, type BadgeTier } from "@/components/badges/types";
import { badgeText } from "@/features/badges/strings";
import { CoinIcon } from "@/features/coins/CoinIcon";
import { CoinPill } from "@/features/coins/CoinPill";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import {
  BORDERS,
  RARITY_COLORS,
  getBorder,
  type BorderRarity,
  type ProfileBorder,
} from "@/features/cosmetics/borders";
import { useEquippedBorder } from "@/features/cosmetics/store";
import { TABLE, fontFamily, useTheme } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";

type SectionKey = BorderRarity | "earned";

/** Each rarity's card: its fill, its edge, and the line of light on it. */
const RARITY_TILE: Record<
  BorderRarity,
  { fill: [string, string]; edge: string; shine: string }
> = {
  common: { fill: ["#5A3A22", "#3A2414"], edge: "#2E1C0F", shine: "#9A6B43" },
  rare: { fill: ["#2C5A8E", "#16304F"], edge: "#5FA8F0", shine: "#9CCBFF" },
  epic: { fill: ["#5E2F94", "#2C1650"], edge: "#C084FC", shine: "#E2C2FF" },
  legendary: { fill: ["#9A6A1C", "#4A2C08"], edge: "#F7C948", shine: "#FFF0B0" },
  mythic: { fill: ["#8E1430", "#2A0610"], edge: "#FF5A7A", shine: "#FFC2CF" },
};

/** Each section's ribbon. */
const SECTION_RIBBON: Record<SectionKey, [string, string]> = {
  common: TABLE.ribbonGold,
  rare: ["#3A78C2", "#25507F"],
  epic: ["#8A4ACF", "#5E2F94"],
  legendary: ["#E9B334", "#B07A12"],
  mythic: ["#D8344F", "#8E1430"],
  earned: ["#2E8A78", "#1C5E52"],
};

const byPrice = (a: ProfileBorder, b: ProfileBorder) => a.price - b.price;
const earnedOnly = (border: ProfileBorder) =>
  border.kind === "art" && border.earnedBy !== undefined;

/** The shop's sections: each rarity, cheapest first, then the borders that
 *  can only be earned. */
const SECTIONS: { key: SectionKey; borders: ProfileBorder[] }[] = [
  ...(["common", "rare", "epic", "legendary", "mythic"] as BorderRarity[]).map((rarity) => ({
    key: rarity as SectionKey,
    borders: BORDERS.filter((b) => b.rarity === rarity && !earnedOnly(b)).sort(byPrice),
  })),
  { key: "earned", borders: BORDERS.filter(earnedOnly) },
];

/** Gallery of profile borders: preview one on your avatar and wear it. */
export default function BordersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, setBorder, buyBorder } = useSession();
  const { colors } = useTheme();
  const equippedId = useEquippedBorder();
  const [selectedId, setSelectedId] = useState(equippedId);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const coins = user?.coins ?? 0;
  // borders earned with a badge: the player card says which badges I have
  const stats = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: async () => (await api.auth.stats()).stats,
    enabled: user !== null,
  });
  const reached = (key: string, tier: BadgeTier) =>
    stats.data?.badges.some((b) => b.key === key && b.unlocked[tier]) ?? false;
  const owns = (border: ProfileBorder) =>
    border.kind === "art" && border.earnedBy
      ? reached(border.earnedBy, border.earnedAt ?? "bronze")
      : border.price === 0 || (user?.ownedBorders ?? []).includes(border.id);

  /** Wear a border; a locked one is bought first, then worn. */
  const equip = async (id: string, locked: boolean) => {
    setSaving(true);
    setFailed(false);
    try {
      if (locked) await buyBorder(id);
      await setBorder(id);
      successHaptic();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const name = user?.username ?? "?";
  const selected = getBorder(selectedId);
  const rarityColor = RARITY_COLORS[selected.rarity];
  const selectedOwned = owns(selected);
  const shortBy = Math.max(0, selected.price - coins);
  // the badge an earned border comes with
  const earnedBy = selected.kind === "art" ? selected.earnedBy : undefined;
  const earnedAt = (selected.kind === "art" && selected.earnedAt) || "bronze";
  // what that level asks for ("Win 25 games of Shelter")
  const earnedGoal =
    stats.data?.badges.find((b) => b.key === earnedBy)?.goals[TIERS.indexOf(earnedAt)] ?? 1;
  // "Gold · Spymaster": the badge and the level of it that brings this border
  const earnedName = earnedBy
    ? `${t(`badges.tiers.${earnedAt}`)} · ${badgeText(t, earnedBy).name}`
    : "";

  return (
    <Screen
      scroll={false}
      style={styles.screen}
      backdrop={<TableBackdrop dim={0.5} />}
    >
      <View style={styles.header}>
        <IconButton
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
        >
          <BackIcon size={20} color={colors.icon} />
        </IconButton>
        <TitlePlaque label={t("borders.title")} />
        <View style={styles.grow} />
        <CoinPill amount={coins} />
      </View>

      {/* Preview of the selected border */}
      <Frame tone="dark" ornate style={styles.preview}>
        <View style={styles.previewAvatar}>
          <AvatarBorder
            key={selected.id}
            name={name}
            size={84}
            borderId={selected.id}
            avatarUrl={user?.avatarUrl}
            mascot={user?.mascot}
          />
        </View>
        <AppText variant="title" align="center">
          {selected.name}
        </AppText>
        <View style={styles.meta}>
          <View style={[styles.rarity, { borderColor: rarityColor }]}>
            <AppText style={[styles.rarityText, { color: rarityColor }]}>
              {t(`borders.rarity.${selected.rarity}`)}
            </AppText>
          </View>
          <View style={styles.price}>
            {selected.price > 0 ? <CoinIcon size={16} /> : null}
            <AppText variant="label" style={{ color: TABLE.yellow.fill[0] }}>
              {earnedBy
                ? `🏅 ${earnedName}`
                : selected.price > 0
                  ? selected.price.toLocaleString()
                  : t("borders.free")}
            </AppText>
          </View>
        </View>
        <Button
          size="md"
          label={
            selected.id === equippedId
              ? t("borders.equipped")
              : !selectedOwned && earnedBy
                ? t("borders.earnWith", { badge: earnedName })
                : !selectedOwned
                  ? t("borders.unlock", { price: selected.price.toLocaleString() })
                  : t("borders.equip")
          }
          leftIcon={
            !selectedOwned && !earnedBy && selected.id !== equippedId ? (
              <CoinIcon size={18} />
            ) : undefined
          }
          disabled={
            selected.id === equippedId ||
            (!selectedOwned && (earnedBy !== undefined || shortBy > 0))
          }
          loading={saving}
          onPress={() => equip(selected.id, !selectedOwned)}
          style={styles.equip}
        />
        {!selectedOwned && earnedBy ? (
          <AppText variant="caption" color="textMuted" align="center">
            {badgeText(t, earnedBy, earnedGoal).desc}
          </AppText>
        ) : !selectedOwned && shortBy > 0 ? (
          <AppText variant="caption" color="textMuted" align="center">
            {t("borders.notEnough", { count: shortBy, amount: shortBy.toLocaleString() })}
          </AppText>
        ) : null}
        {failed ? (
          <AppText variant="caption" color="danger" align="center">
            {t("common.errorTitle")}
          </AppText>
        ) : null}
      </Frame>

      {/* All borders, by rarity; the ones earned with a badge last */}
      <Frame tone="wood" style={styles.list}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {SECTIONS.map((section) => {
            const borders = section.borders;
            if (borders.length === 0) return null;
            return (
              <View key={section.key} style={styles.section}>
                <SectionTitle
                    label={
                      section.key === "earned"
                        ? t("borders.earnedSection")
                        : t(`borders.rarity.${section.key}`)
                    }
                    colors={SECTION_RIBBON[section.key]}
                  right={<AppText style={styles.count}>{borders.length}</AppText>}
                />
                <View style={styles.grid}>
                  {borders.map((border) => {
                    const active = border.id === selectedId;
                    const look = RARITY_TILE[border.rarity];
                    const earnedBy =
                      border.kind === "art" ? border.earnedBy : undefined;
                    return (
                      <Pressable
                        key={border.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={border.name}
                        onPress={() => {
                          tapHaptic();
                          setFailed(false);
                          setSelectedId(border.id);
                        }}
                        style={[
                          styles.tile,
                          { borderColor: active ? "#FFFFFF" : look.edge },
                          active && styles.tileOn,
                        ]}
                      >
                        <LinearGradient colors={look.fill} style={styles.tileFill}>
                          {/* a fine line of light along the top */}
                          <View style={[styles.tileShine, { backgroundColor: look.shine }]} />
                          <View style={styles.tileAvatar}>
                            <AvatarBorder
                              name={name}
                              size={40}
                              borderId={border.id}
                              avatarUrl={user?.avatarUrl}
                              mascot={user?.mascot}
                            />
                          </View>
                          <AppText
                            variant="tiny"
                            numberOfLines={1}
                            align="center"
                            style={styles.tileName}
                          >
                            {border.name}
                          </AppText>
                          <View style={styles.tilePrice}>
                            {owns(border) ? (
                              <AppText style={styles.tileOwned}>
                                {border.id === equippedId
                                  ? t("borders.equipped")
                                  : t("borders.owned")}
                              </AppText>
                            ) : earnedBy ? (
                              <Emblem emoji="🏅" size={13} />
                            ) : (
                              <>
                                <CoinIcon size={11} />
                                <AppText style={styles.tileCost}>
                                  {border.price.toLocaleString()}
                                </AppText>
                              </>
                            )}
                          </View>
                          {border.id === equippedId ? (
                            <View style={styles.check}>
                              <Emblem emoji="✓" size={14} />
                            </View>
                          ) : null}
                          {!owns(border) ? (
                            <View style={styles.lock}>
                              <Emblem emoji="🔒" size={14} />
                            </View>
                          ) : null}
                        </LinearGradient>
                      </Pressable>
                    );
                  })}
                  {/* empty cells so a short last row stays left-aligned */}
                  {Array.from({ length: (3 - (borders.length % 3)) % 3 }, (_, i) => (
                    <View key={i} style={styles.filler} />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Frame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  grow: { flex: 1 },
  price: { flexDirection: "row", alignItems: "center", gap: 4 },
  preview: { marginTop: 12, alignItems: "center", gap: 4, paddingVertical: 10 },
  // Room for the border to draw outside the avatar
  previewAvatar: { paddingTop: 40, paddingBottom: 40 },
  meta: { flexDirection: "row", alignItems: "center", gap: 10 },
  rarity: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  rarityText: { fontFamily: fontFamily.semiBold, fontSize: 11, lineHeight: 16 },
  equip: { alignSelf: "stretch", marginTop: 6 },

  list: { flex: 1, minHeight: 0, marginTop: 14, padding: 10 },
  section: { marginBottom: 14 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  count: { color: TABLE.creamMuted, fontFamily: fontFamily.semiBold, fontSize: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  tile: {
    width: "31.3%",
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
  },
  tileOn: { borderWidth: 3 },
  tileFill: { alignItems: "center", paddingHorizontal: 4, paddingBottom: 7 },
  tileShine: { position: "absolute", top: 0, left: 10, right: 10, height: 1.5, opacity: 0.7 },
  filler: { width: "31.3%" },
  tileAvatar: { paddingTop: 24, paddingBottom: 20 },
  tileName: { color: "#FFFFFF" },
  tilePrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
    minHeight: 15,
  },
  tileCost: { color: "#FBDD7E", fontFamily: fontFamily.bold, fontSize: 10, lineHeight: 14 },
  tileOwned: { color: TABLE.creamMuted, fontSize: 10, lineHeight: 14 },
  lock: { position: "absolute", top: 4, left: 5 },
  check: { position: "absolute", top: 4, right: 6 },
});
