// The changing room: your mascot on a lit stage, breathing; tabs for
// every slot; every item shown on you, with its price. Tap to try things
// on, then buy what you're wearing (all at once) and keep the look. It
// slides up over the tabs from the Mascot tab.

import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackIcon, Emblem } from "@/components/icons";
import { AppText, Button, IconButton, Ribbon, Texture } from "@/components/ui";
import { CoinIcon } from "@/features/coins/CoinIcon";
import { CoinPill } from "@/features/coins/CoinPill";
import { useSession } from "@/context/SessionContext";
import {
  CATALOG,
  STARTER,
  asLook,
  type Look,
  type Slot,
} from "@/features/mascot/dress";
import { MascotThumb } from "@/features/mascot/MascotThumb";
import { MeepleReveal, useMeepleReveal } from "@/features/mascot/MeepleReveal";
import { MascotStage } from "@/features/mascot/MascotStage";
import { Stage } from "@/features/mascot/Stage";
import type { PartDef } from "@/features/mascot/rig";
import { COLOURS, SKINS } from "@/features/mascot/skins";
import { TABLE, fontFamily } from "@/theme";
import { errorHaptic, successHaptic, tapHaptic } from "@/utils/haptics";

type Tab = "skin" | "colour" | Slot;
const TABS: { key: Tab }[] = [
  { key: "skin" },
  { key: "colour" },
  { key: "eyes" },
  { key: "mouth" },
  { key: "nose" },
  { key: "hat" },
  { key: "top" },
  { key: "bottom" },
  { key: "shoes" },
  { key: "hand" },
  { key: "back" },
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
    if (price > 0 && !owned.has(keyOf(tab, id)))
      items.push({ key: keyOf(tab, id), price });
  };
  check("skin", look.skin);
  for (const [slot, id] of Object.entries(look.wear)) check(slot as Slot, id);
  return items;
}

const ItemCard = memo(function ItemCard({
  look,
  tab,
  id,
  name,
  price,
  owned,
  wearing,
  onPick,
}: {
  look: Look;
  tab: Tab;
  id: string;
  name: string;
  price: number;
  owned: boolean;
  wearing: boolean;
  onPick: (tab: Tab, id: string) => void;
}) {
  const { t } = useTranslation();
  // shown on you, so you see the thing itself, not a picture of it
  const preview = useMemo(() => withItem(look, tab, id), [look, tab, id]);
  return (
    <Pressable
      onPress={() => onPick(tab, id)}
      style={({ pressed }) => [
        styles.card,
        wearing && styles.cardOn,
        pressed && { opacity: 0.8 },
      ]}
    >
      <LinearGradient
        colors={wearing ? TABLE.yellow.fill : TABLE.wood.fill}
        style={styles.cardFill}
      >
        <Texture radius={12} />
        <MascotThumb look={preview} width={62} />
        <AppText
          numberOfLines={1}
          style={[styles.cardName, wearing && { color: TABLE.ink }]}
        >
          {name}
        </AppText>
        <View style={styles.priceRow}>
          {wearing ? (
            <Emblem emoji="✓" size={14} />
          ) : owned || price === 0 ? (
            <AppText style={styles.owned}>
              {price === 0 ? t("mascot.free") : t("mascot.owned")}
            </AppText>
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
});

export default function Wardrobe() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { user, dressMascot } = useSession();
  const saved = useMemo(() => asLook(user?.mascot), [user?.mascot]);
  const [look, setLook] = useState<Look>(saved);
  const [tab, setTab] = useState<Tab>("hat");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const coins = user?.coins ?? 0;
  const owned = useMemo(
    () => new Set(user?.ownedMascot ?? []),
    [user?.ownedMascot],
  );
  // The stage shows a change at once; the cards (each a whole dressed
  // mascot) follow a moment later, so a tap never waits on the grid.
  const cardsLook = useDeferredValue(look);
  const shownTab = useDeferredValue(tab);
  // the grid fills in on the frame after the screen first shows
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const onPick = useCallback((slot: Tab, id: string) => {
    tapHaptic();
    setLook((current) => withItem(current, slot, id));
  }, []);
  // in and out through the meeple, like the app's opening
  const reveal = useMeepleReveal(() => router.back());

  const keep = async (buy: boolean) => {
    setBusy(true);
    setNote(null);
    try {
      await dressMascot(look, buy);
      successHaptic();
    } catch {
      errorHaptic();
      setNote(t("mascot.failed"));
    } finally {
      setBusy(false);
    }
  };

  const toPay = unpaid(look, owned);
  const total = toPay.reduce((sum, item) => sum + item.price, 0);
  const changed = JSON.stringify(look) !== JSON.stringify(saved);

  const items: { id: string; name: string; price: number }[] =
    shownTab === "skin"
      ? Object.entries(SKINS).map(([id, s]) => ({
          id,
          name: s.name,
          price: s.price,
        }))
      : shownTab === "colour"
        ? []
        : Object.entries(CATALOG[shownTab] as Record<string, PartDef>).map(
            ([id, p]) => ({
              id,
              name: p.name,
              price: p.price,
            }),
          );
  // an empty slot is wearing its "none"
  const wearingId =
    shownTab === "skin"
      ? look.skin
      : shownTab === "colour"
        ? look.colour
        : (look.wear[shownTab as Slot] ?? "none");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TABLE.table[1] }}>
      <LinearGradient colors={TABLE.table} style={StyleSheet.absoluteFill} />
      {/* header */}
      <View style={styles.header}>
        <IconButton
          accessibilityLabel={t("mascot.close")}
          onPress={reveal.close}
        >
          <BackIcon size={20} />
        </IconButton>
        <Ribbon
          label={t("mascot.wardrobe")}
          colors={TABLE.ribbonGold}
          standalone
        />
        <View style={{ flex: 1 }} />
        <CoinPill amount={coins} />
      </View>

      {/* you, on the stage */}
      <View style={{ alignItems: "center" }}>
        <Stage width={width - 32}>
          <MascotStage look={look} width={Math.min(200, width * 0.48)} />
        </Stage>
        <AppText style={styles.hint}>{note ?? t("mascot.tapToHop")}</AppText>
      </View>

      {/* the slots */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={{ flexGrow: 0, flexShrink: 0 }}
      >
        {TABS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => {
              tapHaptic();
              setTab(item.key);
            }}
            style={[styles.tab, tab === item.key && styles.tabOn]}
          >
            <AppText
              style={[styles.tabText, tab === item.key && { color: TABLE.ink }]}
            >
              {t(`mascot.tabs.${item.key}`)}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      {/* what's in the slot, on you */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.grid}>
        {!ready
          ? null
          : shownTab === "colour"
            ? Object.entries(COLOURS).map(([name, colour]) => (
                <Pressable
                  key={name}
                  onPress={() => onPick("colour", colour)}
                  style={[
                    styles.swatch,
                    { backgroundColor: colour },
                    look.colour === colour && styles.swatchOn,
                  ]}
                />
              ))
            : items.map((item) => (
                <ItemCard
                  key={item.id}
                  look={cardsLook}
                  tab={shownTab}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  owned={owned.has(keyOf(shownTab, item.id))}
                  wearing={wearingId === item.id}
                  onPick={onPick}
                />
              ))}
      </ScrollView>

      {/* keep the look: buy what you're trying on first */}
      <View style={styles.footer}>
        <Button
          label={changed ? t("mascot.reset") : t("mascot.starter")}
          variant="secondary"
          onPress={() => setLook(changed ? saved : { ...STARTER })}
          style={{ flex: 1 }}
        />
        {toPay.length > 0 ? (
          <Button
            label={t("mascot.buy", {
              count: toPay.length,
              price: total.toLocaleString(),
            })}
            leftIcon={<CoinIcon size={16} />}
            disabled={total > coins || busy}
            loading={busy}
            onPress={() => keep(true)}
            style={{ flex: 2 }}
          />
        ) : (
          <Button
            label={changed ? t("mascot.save") : t("mascot.lookingGood")}
            disabled={!changed || busy}
            loading={busy}
            onPress={() => keep(false)}
            style={{ flex: 2 }}
          />
        )}
      </View>
      <MeepleReveal {...reveal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
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
  tabOn: {
    backgroundColor: TABLE.yellow.fill[0],
    borderColor: TABLE.yellow.border,
  },
  tabText: {
    color: TABLE.cream,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    width: "22.6%",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: TABLE.wood.border,
    overflow: "hidden",
  },
  cardOn: { borderColor: TABLE.yellow.border },
  cardFill: { alignItems: "center", paddingTop: 6, paddingBottom: 6, gap: 2 },
  cardName: {
    color: TABLE.cream,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 16,
  },
  price: { color: "#FBDD7E", fontFamily: fontFamily.bold, fontSize: 11 },
  owned: { color: TABLE.creamMuted, fontSize: 10 },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: TABLE.wood.border,
  },
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
