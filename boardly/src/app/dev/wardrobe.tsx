// Development only: the changing room, as a design to look at. Your
// mascot on a lit stage, breathing; tabs for every slot; every item shown
// on you, with its price; tap to try it on, then buy what you're wearing
// and keep the look. Coins and what you own are pretend here. Open with
// boardly-dev://dev/wardrobe.

import { Redirect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

import { EmblemGlyph } from "@/components/engraved";
import { BackIcon, Emblem } from "@/components/icons";
import { AppText, Button, IconButton, Ribbon, Texture } from "@/components/ui";
import { CoinIcon } from "@/features/coins/CoinIcon";
import { CoinPill } from "@/features/coins/CoinPill";
import { CATALOG, STARTER, dress, type Look, type Slot } from "@/features/mascot/dress";
import { MascotStage } from "@/features/mascot/MascotStage";
import { BOX, type PartDef } from "@/features/mascot/rig";
import { COLOURS, SKINS } from "@/features/mascot/skins";
import { TABLE, fontFamily } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";

type Tab = "skin" | "colour" | Slot;
const TABS: { key: Tab; label: string }[] = [
  { key: "skin", label: "Sets" },
  { key: "colour", label: "Colour" },
  { key: "eyes", label: "Eyes" },
  { key: "mouth", label: "Mouth" },
  { key: "nose", label: "Nose" },
  { key: "hat", label: "Hat" },
  { key: "top", label: "Top" },
  { key: "bottom", label: "Bottom" },
  { key: "shoes", label: "Shoes" },
  { key: "hand", label: "Hand" },
  { key: "back", label: "Back" },
];

/** An item's key in what you own: "hat:crown", "skin:gingerbread". */
const keyOf = (tab: Tab, id: string) => `${tab}:${id}`;

const priceOf = (tab: Tab, id: string): number => {
  if (tab === "colour") return 0;
  if (tab === "skin") return SKINS[id]?.price ?? 0;
  return (CATALOG[tab] as Record<string, PartDef>)[id]?.price ?? 0;
};

/** The look with one item tried on. */
function withItem(look: Look, tab: Tab, id: string): Look {
  if (tab === "skin") return { ...look, skin: id };
  if (tab === "colour") return { ...look, colour: id };
  return { ...look, wear: { ...look.wear, [tab]: id } };
}

/** What a look wears that hasn't been bought. */
function unpaid(look: Look, owned: Set<string>) {
  const items: { key: string; price: number }[] = [];
  const check = (tab: Tab, id: string | undefined) => {
    if (!id) return;
    const price = priceOf(tab, id);
    if (price > 0 && !owned.has(keyOf(tab, id))) items.push({ key: keyOf(tab, id), price });
  };
  check("skin", look.skin);
  for (const [slot, id] of Object.entries(look.wear)) check(slot as Slot, id);
  return items;
}

/** The stage: a warm spotlight from above and a round wooden plinth. */
function Stage({ width, children }: { width: number; children: React.ReactNode }) {
  const height = width * 0.86;
  return (
    <View style={{ width, height, alignItems: "center", justifyContent: "flex-end" }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="light" cx="50%" cy="40%" r="55%">
            <Stop offset="0" stopColor="#FFE6A8" stopOpacity="0.55" />
            <Stop offset="0.6" stopColor="#F7C948" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#F7C948" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="plinth" cx="50%" cy="35%" r="70%">
            <Stop offset="0" stopColor="#B07A48" />
            <Stop offset="1" stopColor="#5A3A22" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={height * 0.52} rx={width * 0.48} ry={height * 0.46} fill="url(#light)" />
        <Ellipse cx={width / 2} cy={height * 0.9} rx={width * 0.36} ry={height * 0.075} fill="#2A180D" />
        <Ellipse cx={width / 2} cy={height * 0.88} rx={width * 0.36} ry={height * 0.075} fill="url(#plinth)" />
      </Svg>
      <View style={{ marginBottom: height * 0.035 }}>{children}</View>
    </View>
  );
}

function ItemCard({
  look,
  tab,
  id,
  name,
  price,
  owned,
  wearing,
  onPress,
}: {
  look: Look;
  tab: Tab;
  id: string;
  name: string;
  price: number;
  owned: boolean;
  wearing: boolean;
  onPress: () => void;
}) {
  // shown on you, so you see the thing itself, not a picture of it
  const preview = useMemo(() => dress(withItem(look, tab, id)), [look, tab, id]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, wearing && styles.cardOn, pressed && { opacity: 0.8 }]}>
      <LinearGradient colors={wearing ? TABLE.yellow.fill : TABLE.wood.fill} style={styles.cardFill}>
        <Texture radius={12} />
        <EmblemGlyph data={preview} size={62} box={BOX} />
        <AppText numberOfLines={1} style={[styles.cardName, wearing && { color: TABLE.ink }]}>
          {name}
        </AppText>
        <View style={styles.priceRow}>
          {wearing ? (
            <Emblem emoji="✓" size={14} />
          ) : owned || price === 0 ? (
            <AppText style={styles.owned}>{price === 0 ? "Free" : "Owned"}</AppText>
          ) : (
            <>
              <CoinIcon size={13} />
              <AppText style={styles.price}>{price.toLocaleString()}</AppText>
            </>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function Wardrobe() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [saved, setSaved] = useState<Look>({
    ...STARTER,
    wear: { ...STARTER.wear, top: "tee", bottom: "pants", shoes: "sneakers" },
  });
  const [look, setLook] = useState<Look>(saved);
  const [tab, setTab] = useState<Tab>("hat");
  const [coins, setCoins] = useState(12500);
  const [owned, setOwned] = useState(() => new Set<string>());
  if (!__DEV__) return <Redirect href="/" />;

  const toPay = unpaid(look, owned);
  const total = toPay.reduce((sum, item) => sum + item.price, 0);
  const changed = JSON.stringify(look) !== JSON.stringify(saved);

  const items: { id: string; name: string; price: number }[] =
    tab === "skin"
      ? Object.entries(SKINS).map(([id, s]) => ({ id, name: s.name, price: s.price }))
      : tab === "colour"
        ? []
        : Object.entries(CATALOG[tab] as Record<string, PartDef>).map(([id, p]) => ({
            id,
            name: p.name,
            price: p.price,
          }));
  // an empty slot is wearing its "none"
  const wearingId =
    tab === "skin" ? look.skin : tab === "colour" ? look.colour : (look.wear[tab as Slot] ?? "none");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TABLE.table[1] }}>
      <LinearGradient colors={TABLE.table} style={StyleSheet.absoluteFill} />
      {/* header */}
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" onPress={() => router.back()}>
          <BackIcon size={20} />
        </IconButton>
        <Ribbon label="Wardrobe" colors={TABLE.ribbonGold} standalone />
        <View style={{ flex: 1 }} />
        <CoinPill amount={coins} />
      </View>

      {/* you, on the stage */}
      <View style={{ alignItems: "center" }}>
        <Stage width={width - 32}>
          <MascotStage look={look} width={Math.min(200, width * 0.48)} />
        </Stage>
        <AppText style={styles.hint}>Tap to hop</AppText>
      </View>

      {/* the slots */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={{ flexGrow: 0, flexShrink: 0 }}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => {
              tapHaptic();
              setTab(t.key);
            }}
            style={[styles.tab, tab === t.key && styles.tabOn]}
          >
            <AppText style={[styles.tabText, tab === t.key && { color: TABLE.ink }]}>{t.label}</AppText>
          </Pressable>
        ))}
      </ScrollView>

      {/* what's in the slot, on you */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.grid}>
        {tab === "colour"
          ? Object.entries(COLOURS).map(([name, colour]) => (
              <Pressable
                key={name}
                onPress={() => {
                  tapHaptic();
                  setLook(withItem(look, "colour", colour));
                }}
                style={[styles.swatch, { backgroundColor: colour }, look.colour === colour && styles.swatchOn]}
              />
            ))
          : items.map((item) => (
              <ItemCard
                key={item.id}
                look={look}
                tab={tab}
                id={item.id}
                name={item.name}
                price={item.price}
                owned={owned.has(keyOf(tab, item.id))}
                wearing={wearingId === item.id}
                onPress={() => {
                  tapHaptic();
                  setLook(withItem(look, tab, item.id));
                }}
              />
            ))}
      </ScrollView>

      {/* keep the look: buy what you're trying on first */}
      <View style={styles.footer}>
        <Button
          label={changed ? "Reset" : "Starter"}
          variant="secondary"
          onPress={() => setLook(changed ? saved : { ...STARTER })}
          style={{ flex: 1 }}
        />
        {toPay.length > 0 ? (
          <Button
            label={`Buy ${toPay.length} · ${total.toLocaleString()}`}
            leftIcon={<CoinIcon size={16} />}
            disabled={total > coins}
            onPress={() => {
              successHaptic();
              setCoins(coins - total);
              setOwned(new Set([...owned, ...toPay.map((item) => item.key)]));
              setSaved(look);
            }}
            style={{ flex: 2 }}
          />
        ) : (
          <Button
            label={changed ? "Save look" : "Looking good"}
            disabled={!changed}
            onPress={() => {
              successHaptic();
              setSaved(look);
            }}
            style={{ flex: 2 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 4 },
  hint: { color: TABLE.creamMuted, fontSize: 11, marginTop: -4 },
  tabs: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: TABLE.wood.fill[1],
    borderWidth: 1.5,
    borderColor: TABLE.wood.border,
  },
  tabOn: { backgroundColor: TABLE.yellow.fill[0], borderColor: TABLE.yellow.border },
  tabText: { color: TABLE.cream, fontFamily: fontFamily.semiBold, fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  card: { width: "22.6%", borderRadius: 14, borderWidth: 2, borderColor: TABLE.wood.border, overflow: "hidden" },
  cardOn: { borderColor: TABLE.yellow.border },
  cardFill: { alignItems: "center", paddingTop: 6, paddingBottom: 6, gap: 2 },
  cardName: { color: TABLE.cream, fontFamily: fontFamily.semiBold, fontSize: 11 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 3, minHeight: 16 },
  price: { color: "#FBDD7E", fontFamily: fontFamily.bold, fontSize: 11 },
  owned: { color: TABLE.creamMuted, fontSize: 10 },
  swatch: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: TABLE.wood.border },
  swatchOn: { borderColor: "#FFFFFF", transform: [{ scale: 1.08 }] },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: TABLE.wood.border,
  },
});
