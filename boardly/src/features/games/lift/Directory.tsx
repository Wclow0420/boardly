// The lift's directory (the Games tab's "all floors"): the building's
// letter board, as in an old lobby. Black felt ribbed for the letters in a
// riveted brass frame (art.ts, directoryArt, baked once per size), the
// title on a crimson enamel sign over its top edge, a stud to close it.
// At the top the players control (how many are playing: the games that
// don't take that many are dimmed here, on the dial and behind the gate,
// and riding passes them by); past twenty games a field to find one by
// name. Then every floor by bank: the bank's name in gold, each floor a
// row of white letters, its number, the game's emblem, its name, "New" in red letters on a new game, how
// many play. Tap a row and the board closes and the lift rides there.
// The rows are a FlashList: only those on screen are drawn, each emblem
// one baked image.

import { FlashList } from "@shopify/flash-list";
import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem, emblemData } from "@/components/icons";
import { AppText, BezelOverlay, IconButton } from "@/components/ui";
import { TABLE, fontFamily } from "@/theme";
import { BOARD_RIM, COUNT_H, COUNT_W, countArt, directoryArt, rowEmblemArt } from "./art";
import type { Building } from "./banks";

const MIN = 2;
const MAX = 10;
/** Past this many games, a field to find one by name. */
export const SEARCH_FROM = 20;
const ROW = 42;
const ICON = 28;

type Row =
  | { kind: "bank"; key: string; name: string; range: string }
  | { kind: "floor"; key: string; index: number };

export interface DirectoryProps {
  visible: boolean;
  onClose: () => void;
  building: Building;
  /** Each floor's emblem (an emoji with an engraved emblem). */
  emblems: string[];
  names: string[];
  bankNames: string[];
  fits: boolean[];
  /** The floor the lift is at. */
  floor: number;
  count: number | null;
  onCount: (next: number | null) => void;
  /** Ride to this floor (the board closes). */
  onPick: (i: number) => void;
}

export function Directory({
  visible,
  onClose,
  building,
  emblems,
  names,
  bankNames,
  fits,
  floor,
  count,
  onCount,
  onPick,
}: DirectoryProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const w = Math.min(width - 28, 420);
  const h = Math.round(Math.min(height * 0.78, 760));
  const board = visible ? bakedSvg("lift-directory", w, h, () => directoryArt(w, h)) : null;
  const strip = visible ? bakedSvg("lift-count", COUNT_W, COUNT_H, countArt) : null;
  const [query, setQuery] = useState("");
  const games = new Set(building.floors.map((f) => f.game.id)).size;
  const searching = games > SEARCH_FROM;

  const rows = useMemo(() => {
    const q = searching ? query.trim().toLowerCase() : "";
    const out: Row[] = [];
    building.banks.forEach((b, bi) => {
      const floors: Row[] = [];
      for (let i = b.start; i < b.start + b.size; i++) {
        const f = building.floors[i];
        if (q && !names[i]?.toLowerCase().includes(q) && !f.game.name.toLowerCase().includes(q)) continue;
        floors.push({ kind: "floor", key: `f${i}`, index: i });
      }
      if (!floors.length) return;
      const range =
        b.size <= 1
          ? t("games.lift.bankOne", { from: b.start + 1 })
          : t("games.lift.bankRange", { from: b.start + 1, to: b.start + b.size });
      out.push({ kind: "bank", key: `b${bi}`, name: bankNames[bi] ?? "", range }, ...floors);
    });
    return out;
  }, [building, names, bankNames, query, searching, t]);

  const step = (by: number) => {
    if (count === null) onCount(by > 0 ? MIN : MAX);
    else {
      const next = count + by;
      onCount(next < MIN || next > MAX ? null : next);
    }
  };
  const lit = fits.filter(Boolean).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centre}>
        <Pressable accessibilityLabel={t("rules.close")} onPress={onClose} style={styles.dim} />
        <View style={[styles.wrap, { width: w, height: h }]}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {board ? <SkImage image={board} x={0} y={0} width={w} height={h} /> : null}
          </Canvas>
          <View style={styles.body}>
            {/* how many are playing */}
            <View style={styles.countRow}>
              <View style={styles.countText}>
                <AppText style={styles.countLabel} numberOfLines={1}>
                  {t("games.lift.players")}
                </AppText>
                <AppText style={styles.countNote} numberOfLines={1}>
                  {count === null ? t("games.lift.anyCount") : t("games.lift.lit", { count: lit, total: building.floors.length })}
                </AppText>
              </View>
              <View style={styles.strip}>
                <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                  {strip ? <SkImage image={strip} x={0} y={0} width={COUNT_W} height={COUNT_H} /> : null}
                </Canvas>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("games.lift.fewer")}
                  onPress={() => step(-1)}
                  style={[styles.knob, { left: -6 }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("games.lift.anyCount")}
                  onPress={() => onCount(null)}
                  style={styles.window}
                >
                  <AppText style={[styles.count, count === null && styles.countAll]} numberOfLines={1}>
                    {count === null ? t("games.lift.all") : String(count)}
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("games.lift.more")}
                  onPress={() => step(1)}
                  style={[styles.knob, { right: -6 }]}
                />
              </View>
            </View>
            {searching ? (
              <View style={styles.search}>
                <Emblem emoji="🔍" size={16} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t("games.lift.search")}
                  placeholderTextColor="rgba(244,238,223,0.42)"
                  style={styles.searchInput}
                  autoCorrect={false}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>
            ) : null}
            <View style={styles.rule} />
            <View style={styles.list}>
              <FlashList
                data={rows}
                keyExtractor={(row) => row.key}
                getItemType={(row) => row.kind}
                extraData={`${floor}|${count}`}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                initialScrollIndex={Math.max(0, rows.findIndex((r) => r.kind === "floor" && r.index === floor) - 3)}
                renderItem={({ item }) =>
                  item.kind === "bank" ? (
                    <BankRow name={item.name} range={item.range} />
                  ) : (
                    <FloorRow
                      index={item.index}
                      emoji={emblems[item.index]}
                      name={names[item.index] ?? ""}
                      players={players(building, item.index)}
                      isNew={building.floors[item.index].isNew}
                      newLabel={t("games.lift.new")}
                      fits={fits[item.index] ?? true}
                      here={item.index === floor}
                      onPick={onPick}
                    />
                  )
                }
                ListEmptyComponent={
                  <AppText style={styles.empty}>{t("games.lift.noMatch")}</AppText>
                }
              />
            </View>
          </View>
          {/* the sign over the top edge */}
          <View style={styles.signRow} pointerEvents="none">
            <View style={styles.sign}>
              <LinearGradient colors={["#D2384A", "#9A1828", "#5A0812"]} style={StyleSheet.absoluteFill} />
              <BezelOverlay r={12} t={4} />
              <AppText style={styles.signText} numberOfLines={1}>
                {t("games.lift.directory")}
              </AppText>
            </View>
          </View>
          {/* the stud that closes it */}
          <IconButton accessibilityLabel={t("rules.close")} onPress={onClose} size={38} style={styles.close}>
            <LinearGradient colors={["#5A606A", "#24282E"]} style={styles.closeFace} />
            <BezelOverlay r={19} t={3} />
            <Emblem emoji="✕" size={14} />
          </IconButton>
        </View>
      </View>
    </Modal>
  );
}

const players = (b: Building, i: number) => {
  const g = b.floors[i].game;
  return g.minPlayers === g.maxPlayers ? `${g.minPlayers}` : `${g.minPlayers}–${g.maxPlayers}`;
};

const BankRow = memo(function BankRow({ name, range }: { name: string; range: string }) {
  return (
    <View style={styles.bankRow}>
      <AppText style={styles.bankName} numberOfLines={1}>
        {name}
      </AppText>
      <View style={styles.bankRule} />
      <AppText style={styles.bankRange} numberOfLines={1}>
        {range}
      </AppText>
    </View>
  );
});

const FloorRow = memo(function FloorRow({
  index,
  emoji,
  name,
  players,
  isNew,
  newLabel,
  fits,
  here,
  onPick,
}: {
  index: number;
  emoji: string;
  name: string;
  players: string;
  isNew: boolean;
  newLabel: string;
  fits: boolean;
  here: boolean;
  onPick: (i: number) => void;
}) {
  const found = emblemData(emoji);
  const icon = found
    ? bakedSvg(`lift-row|${emoji}`, ICON, ICON, () => rowEmblemArt(found.data, found.tint, ICON))
    : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${index + 1}. ${name}`}
      onPress={() => onPick(index)}
      style={({ pressed }) => [styles.row, here && styles.rowHere, pressed && styles.rowPressed, !fits && styles.rowOff]}
    >
      <AppText style={[styles.rowNum, here && styles.rowNumHere]}>{String(index + 1).padStart(2, "0")}</AppText>
      <Canvas style={styles.rowIcon} pointerEvents="none">
        {icon ? <SkImage image={icon} x={0} y={0} width={ICON} height={ICON} /> : null}
      </Canvas>
      <AppText style={styles.rowName} numberOfLines={1}>
        {name}
      </AppText>
      {isNew ? <AppText style={styles.rowNew}>{newLabel}</AppText> : null}
      <AppText style={styles.rowPlayers} numberOfLines={1}>
        {players}
      </AppText>
    </Pressable>
  );
});

const LETTERS = "#F4EEDF";
const GOLD = "#F0CC72";

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(8,5,3,0.78)" },
  wrap: {
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  body: { flex: 1, paddingTop: 34, paddingBottom: BOARD_RIM + 4, paddingHorizontal: BOARD_RIM + 10 },
  countRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  countText: { flex: 1 },
  countLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.4,
    color: GOLD,
    textTransform: "uppercase",
  },
  countNote: { fontFamily: fontFamily.medium, fontSize: 11.5, lineHeight: 16, color: TABLE.creamMuted },
  strip: { width: COUNT_W, height: COUNT_H },
  knob: { position: "absolute", top: -2, width: 44, height: 44, borderRadius: 22 },
  window: { position: "absolute", left: COUNT_W / 2 - 31, top: 8, width: 62, height: COUNT_H - 16, alignItems: "center", justifyContent: "center" },
  count: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 20, color: "#3A2408" },
  countAll: { fontSize: 12 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  searchInput: { flex: 1, height: 36, color: LETTERS, fontFamily: fontFamily.semiBold, fontSize: 14 },
  rule: { height: 2, marginHorizontal: -4, backgroundColor: "#9A6B1E", borderTopWidth: 1, borderTopColor: GOLD, marginBottom: 2 },
  list: { flex: 1 },
  bankRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 34, paddingTop: 8 },
  bankName: {
    fontFamily: fontFamily.bold,
    fontSize: 12.5,
    lineHeight: 17,
    letterSpacing: 1.6,
    color: GOLD,
    textTransform: "uppercase",
  },
  bankRule: { flex: 1, height: 1, backgroundColor: "rgba(240,204,114,0.35)" },
  bankRange: { fontFamily: fontFamily.semiBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.8, color: "rgba(240,204,114,0.75)" },
  row: { flexDirection: "row", alignItems: "center", height: ROW, gap: 9, paddingHorizontal: 6, borderRadius: 6 },
  rowHere: { backgroundColor: "rgba(240,204,114,0.14)" },
  rowPressed: { backgroundColor: "rgba(240,204,114,0.24)" },
  rowOff: { opacity: 0.32 },
  rowNum: {
    width: 26,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 1,
    color: LETTERS,
    fontVariant: ["tabular-nums"],
  },
  rowNumHere: { color: "#FF8A7A" },
  rowIcon: { width: ICON, height: ICON },
  rowName: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 1,
    color: LETTERS,
    textTransform: "uppercase",
  },
  rowNew: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 15, letterSpacing: 1.2, color: "#FF6A5A", textTransform: "uppercase" },
  rowPlayers: {
    minWidth: 40,
    textAlign: "right",
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.6,
    color: TABLE.yellow.fill[0],
    fontVariant: ["tabular-nums"],
  },
  empty: { marginTop: 24, textAlign: "center", fontFamily: fontFamily.medium, fontSize: 13, color: TABLE.creamMuted },
  signRow: { position: "absolute", left: 0, right: 0, top: -21, alignItems: "center" },
  sign: {
    minWidth: 180,
    maxWidth: 300,
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  signText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: 1,
    color: "#FFF2D0",
    textShadowColor: "rgba(40,0,6,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  close: { position: "absolute", right: -8, top: -12 },
  closeFace: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 19 },
});
