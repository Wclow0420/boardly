// My turn: the call to beat on the slate (my own dice on the board above
// light up in gold where they count for the face I'm choosing), how many
// of it I hold, and the call being made: the number on an ivory plaque between
// two studs, the six faces as dice to pick from, zhai or not; with a call
// on the table, which way to call it a lie (open, or split for two). The
// call itself, and the lie, are made on the plinth.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, BezelOverlay } from "@/components/ui";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { Call, Slate, dieBox, dieImage } from "./pieces";
import { breakZhaiMin, isKaizhai, myCount, openingMin, totalDice, type LiarsDiceState } from "./logic";

export interface CallPick {
  quantity: number;
  face: number;
  /** Zhai ticked (a call of 1s is zhai whatever this says). */
  zhai: boolean;
  /** How a lie is called: open (1 cup) or split (2). */
  liar: "open" | "split";
}

/** Whether a pick is zhai, given the round. */
export const pickZhai = (state: LiarsDiceState, pick: CallPick) => !isKaizhai(state) && (pick.zhai || pick.face === 1);

const FACE = 38;

/** A round stud with a sign on it (− or +). */
function Stud({ sign, label, onPress, disabled }: { sign: string; label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.stud, disabled && styles.off, pressed && styles.pressed]}
    >
      <LinearGradient colors={["#5A3420", "#2A160A"]} style={StyleSheet.absoluteFill} />
      <BezelOverlay r={21} t={3} />
      <AppText style={styles.sign}>{sign}</AppText>
    </Pressable>
  );
}

/** A small enamel pill to choose with. */
function Pill({ label, on, onPress, tone }: { label: string; on: boolean; onPress: () => void; tone: "gold" | "red" }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={on ? (tone === "red" ? ["#FF7A86", "#B8182E", "#520612"] : ["#FFE7A0", "#E2A84A", "#9A6B1E"]) : ["#3A2418", "#1E120A"]}
        style={StyleSheet.absoluteFill}
      />
      <BezelOverlay r={13} t={2.5} metal={on ? "gold" : "silver"} />
      <AppText style={[styles.pillText, on && (tone === "red" ? styles.pillRed : styles.pillGold)]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function CallScene({
  state,
  pick,
  onPick,
  bidder,
  busy,
  top = 0,
}: {
  state: LiarsDiceState;
  pick: CallPick;
  onPick: (change: Partial<CallPick>) => void;
  /** Who made the call on the table. */
  bidder: string;
  busy: boolean;
  /** Room left clear at the top (my board hanging there). */
  top?: number;
}) {
  const { t } = useTranslation();
  const kaizhai = isKaizhai(state);
  const zhai = pickZhai(state, pick);
  const breakMin = breakZhaiMin(state);
  const total = totalDice(state);
  const faces = kaizhai ? [2, 3, 4, 5, 6] : [2, 3, 4, 5, 6, 1];
  const have = myCount(state.myDice, pick.face, zhai);
  const rowW = faces.length * (FACE + 10) - 10;

  return (
    <View style={[styles.scene, { paddingTop: top }]}>
      <Slate width={280} height={state.bid ? 80 : 62}>
        <AppText style={styles.heading} numberOfLines={1}>
          {state.bid ? t("liarsdice.stage.beat", { name: bidder }) : t("liarsdice.yourOpening")}
        </AppText>
        {state.bid ? (
          <Call quantity={state.bid.quantity} face={state.bid.face} zhai={state.bid.zhai} size={30} />
        ) : (
          <AppText style={styles.small} numberOfLines={1}>
            {t("liarsdice.stage.openMin", { min: openingMin(state, false), zhaiMin: openingMin(state, true) })}
          </AppText>
        )}
      </Slate>

      <AppText style={styles.have} numberOfLines={1}>
        {t("liarsdice.youHave", { count: have, face: pick.face })}
      </AppText>

      <View style={styles.row}>
        <Stud sign="−" label="−" disabled={busy || pick.quantity <= 1} onPress={() => onPick({ quantity: Math.max(1, pick.quantity - 1) })} />
        <View style={styles.plaque}>
          <LinearGradient colors={["#FFFFFF", "#F4EEDF", "#D8CCB0"]} style={StyleSheet.absoluteFill} />
          <BezelOverlay r={10} t={3.5} />
          <AppText style={styles.number}>{pick.quantity}</AppText>
        </View>
        <Stud sign="+" label="+" disabled={busy || pick.quantity >= total} onPress={() => onPick({ quantity: Math.min(total, pick.quantity + 1) })} />
        <AppText style={styles.times}>×</AppText>
      </View>

      <View style={{ width: rowW, height: FACE * 1.2 }}>
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {faces.map((face, i) => {
            const on = face === pick.face;
            const img = dieImage(face, FACE, on ? "lit" : "plain");
            const box = dieBox(i * (FACE + 10), FACE * 0.1 - (on ? 3 : 0), FACE);
            return img ? <SkImage key={face} image={img} {...box} opacity={on ? 1 : 0.8} /> : null;
          })}
        </Canvas>
        {faces.map((face, i) => (
          <Pressable
            key={face}
            accessibilityRole="button"
            accessibilityLabel={String(face)}
            accessibilityState={{ selected: face === pick.face }}
            disabled={busy}
            onPress={() => {
              tapHaptic();
              onPick({ face });
            }}
            style={[styles.face, { left: i * (FACE + 10) - 4 }]}
          />
        ))}
      </View>

      {kaizhai ? (
        <AppText style={styles.small} numberOfLines={2}>
          {t("liarsdice.lockedKaizhai")}
        </AppText>
      ) : (
        <Pill
          tone="red"
          on={zhai}
          onPress={() => (pick.face === 1 ? undefined : onPick({ zhai: !pick.zhai }))}
          label={
            pick.face === 1
              ? t("liarsdice.zhaiOnes")
              : breakMin !== null && !zhai
                ? t("liarsdice.breakZhai")
                : `${t("liarsdice.zhai")} — ${t("liarsdice.zhaiName")}`
          }
        />
      )}

      {state.bid ? (
        <View style={styles.liar}>
          <AppText style={styles.small}>{t("liarsdice.stage.liarAs")}</AppText>
          <Pill tone="gold" on={pick.liar === "open"} onPress={() => onPick({ liar: "open" })} label={t("liarsdice.stage.openCups")} />
          <Pill tone="red" on={pick.liar === "split"} onPress={() => onPick({ liar: "split" })} label={t("liarsdice.stage.splitCups")} />
        </View>
      ) : null}
    </View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  scene: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12 },
  heading: { fontFamily: fontFamily.semiBold, fontSize: 12.5, lineHeight: 16, color: "#E8D2B4", ...shadow },
  small: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, color: "#E8D2B4", textAlign: "center", ...shadow },
  have: { fontFamily: fontFamily.semiBold, fontSize: 12.5, lineHeight: 16, color: "#FFD58A", ...shadow },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  stud: { width: 42, height: 42, borderRadius: 21, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  sign: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 28, color: "#FFE7C8", ...shadow },
  plaque: { width: 76, height: 50, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  number: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 36, color: "#3A2408" },
  times: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28, color: "#E8D2B4", ...shadow },
  face: { position: "absolute", top: -4, width: FACE + 8, height: FACE * 1.2 + 8 },
  pill: { height: 30, borderRadius: 13, overflow: "hidden", justifyContent: "center", paddingHorizontal: 14 },
  pillText: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 16, color: "#E8D2B4" },
  pillRed: { color: "#FFF2F0" },
  pillGold: { color: "#3A2408" },
  liar: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  off: { opacity: 0.4 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
});
