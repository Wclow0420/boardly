import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { BackIcon } from "@/components/icons";
import {
  AppText,
  Button,
  Frame,
  IconButton,
  Ribbon,
  Screen,
  TableBackdrop,
} from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import {
  BORDERS,
  RARITY_COLORS,
  getBorder,
} from "@/features/cosmetics/borders";
import { useEquippedBorder } from "@/features/cosmetics/store";
import { TABLE, fontFamily, useTheme } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";

/** Gallery of profile borders: preview one on your avatar and wear it. */
export default function BordersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, setBorder } = useSession();
  const { colors } = useTheme();
  const equippedId = useEquippedBorder();
  const [selectedId, setSelectedId] = useState(equippedId);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const equip = async (id: string) => {
    setSaving(true);
    setFailed(false);
    try {
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
        <Ribbon
          label={t("borders.title")}
          colors={TABLE.ribbonGold}
          standalone
        />
      </View>

      {/* Preview of the selected border */}
      <Frame tone="dark" style={styles.preview}>
        <View style={styles.previewAvatar}>
          <AvatarBorder
            key={selected.id}
            name={name}
            size={84}
            borderId={selected.id}
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
          <AppText variant="label" style={{ color: TABLE.yellow.fill[0] }}>
            {selected.price > 0 ? `🪙 ${selected.price}` : t("borders.free")}
          </AppText>
        </View>
        <Button
          size="md"
          label={
            selected.id === equippedId
              ? t("borders.equipped")
              : t("borders.equip")
          }
          disabled={selected.id === equippedId}
          loading={saving}
          onPress={() => equip(selected.id)}
          style={styles.equip}
        />
        {failed ? (
          <AppText variant="caption" color="danger" align="center">
            {t("common.errorTitle")}
          </AppText>
        ) : null}
      </Frame>

      {/* All borders */}
      <Frame tone="wood" style={styles.list}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
        >
          {BORDERS.map((border) => {
            const active = border.id === selectedId;
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
                  {
                    backgroundColor: colors.well,
                    borderColor: active ? TABLE.yellow.fill[0] : colors.border,
                  },
                ]}
              >
                <View style={styles.tileAvatar}>
                  <AvatarBorder name={name} size={40} borderId={border.id} />
                </View>
                <AppText variant="tiny" numberOfLines={1} align="center">
                  {border.name}
                </AppText>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: RARITY_COLORS[border.rarity] },
                  ]}
                />
                {border.id === equippedId ? (
                  <AppText style={styles.check}>✓</AppText>
                ) : null}
              </Pressable>
            );
          })}
          {/* Empty cells so a short last row stays left-aligned */}
          {Array.from({ length: (3 - (BORDERS.length % 3)) % 3 }, (_, i) => (
            <View key={i} style={styles.filler} />
          ))}
        </ScrollView>
      </Frame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  preview: { marginTop: 12, alignItems: "center", gap: 4, paddingVertical: 10 },
  // Room for the border to draw outside the avatar
  previewAvatar: { paddingTop: 34, paddingBottom: 34 },
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
    paddingBottom: 4,
  },
  tile: {
    width: "31.3%",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
  },
  filler: { width: "31.3%" },
  tileAvatar: { paddingTop: 24, paddingBottom: 22 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  check: {
    position: "absolute",
    top: 4,
    right: 7,
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: TABLE.yellow.fill[0],
  },
});
