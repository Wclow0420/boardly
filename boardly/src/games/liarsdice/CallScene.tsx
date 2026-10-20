// My turn. The stage: the call on the slate ("Ben called", or my opening
// with the table's thresholds), how many I hold of the face I'm on (my own
// dice on the board above light up where they count), the faces to pick
// from, and the count between − and +. The plinth: the calls themselves,
// each button showing exactly the call a tap makes ("4 × ⚃ · zhai"), all
// rising together with the count from their own least; a call that can't
// be made greyed with why. With a call on the table, Open and Split are
// held beside them (CallGrid).

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { AppText, BezelOverlay } from "@/components/ui";
import { HoldButton } from "@/games/nightwatch/lantern/HoldButton";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { Call, DiceRow, Slate, dieBox, dieImage } from "./pieces";
import {
  activeSeats,
  callingOf,
  isKaizhai,
  myCount,
  openingMin,
  thresholds,
  type BidProblem,
  type CallChoice,
  type CallPlan,
  type LiarsDiceState,
} from "./logic";

type T = ReturnType<typeof useTranslation>["t"];

/** The table's opening thresholds in a line ("1s from 3 · zhai from 4 ·
 *  kaizhai from 5"). */
export function openRule(state: LiarsDiceState, t: T): string {
  const calling = callingOf(state);
  if (calling === "jijiji") {
    const [one, zhai, fei] = thresholds(activeSeats(state).length);
    return t("liarsdice.openRule.jijiji", { one, zhai, fei });
  }
  if (calling === "nozhai") return t("liarsdice.openRule.nozhai", { min: openingMin(state, false) });
  return t("liarsdice.openRule.classic", {
    zhai: openingMin(state, true),
    kai: openingMin(state, false),
  });
}

/** Why a call is greyed, in a word or two under it. */
const whyShort = (problem: BidProblem, t: T) =>
  problem.code === "total"
    ? t("liarsdice.why.total", { total: problem.total })
    : problem.code === "onesZhai" || problem.code === "noZhai"
      ? t(`liarsdice.why.${problem.code}`)
      : t("liarsdice.why.raise");

const FACE = 38;
const FACE_GAP = 10;
/** The face row canvas reaches this far past the row on every side. */
const PAD = 10;

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

export function CallScene({
  state,
  plan,
  onFace,
  onCount,
  bidder,
  busy,
  top = 0,
}: {
  state: LiarsDiceState;
  plan: CallPlan;
  onFace: (face: number) => void;
  onCount: (count: number) => void;
  /** Who made the call on the table. */
  bidder: string;
  busy: boolean;
  /** Room left clear at the top (my board hanging there). */
  top?: number;
}) {
  const { t } = useTranslation();
  const kaizhai = isKaizhai(state);
  const { faces, face, count, base, total } = plan;
  const rowW = faces.length * (FACE + FACE_GAP) - FACE_GAP;
  const zhaiHave = myCount(state.myDice, face, true);
  const wildHave = myCount(state.myDice, face, false);

  return (
    <View style={[styles.scene, { paddingTop: top, paddingBottom: 4 }]}>
      <View style={styles.slateBox}>
        <Slate width={280} height={state.bid ? 80 : 62}>
          <AppText style={styles.heading} numberOfLines={1}>
            {state.bid ? t("liarsdice.stage.called", { name: bidder }) : t("liarsdice.yourOpening")}
          </AppText>
          {state.bid ? (
            <Call quantity={state.bid.quantity} face={state.bid.face} zhai={state.bid.zhai} size={30} />
          ) : (
            <AppText style={styles.small} numberOfLines={1}>
              {openRule(state, t)}
            </AppText>
          )}
        </Slate>
      </View>

      <View style={styles.controls}>
        <AppText style={styles.have} numberOfLines={1}>
          {kaizhai || face === 1
            ? t("liarsdice.youHave", {
                count: kaizhai ? wildHave : zhaiHave,
                face,
              })
            : t("liarsdice.youHaveBoth", { zhai: zhaiHave, wild: wildHave })}
        </AppText>

        <View style={{ width: rowW, height: FACE * 1.2 }}>
          {/* drawn with a margin all round: a die's picture runs past its
              face (its shadow and, when picked, its lift and glow) */}
          <Canvas
            style={{ position: "absolute", left: -PAD, top: -PAD, width: rowW + 2 * PAD, height: FACE * 1.2 + 2 * PAD }}
            pointerEvents="none"
          >
            {faces.map((f, i) => {
              const on = f === face;
              const img = dieImage(f, FACE, on ? "lit" : "plain");
              const box = dieBox(PAD + i * (FACE + FACE_GAP), PAD + FACE * 0.1 - (on ? 3 : 0), FACE);
              return img ? <SkImage key={f} image={img} {...box} opacity={on ? 1 : 0.7} /> : null;
            })}
          </Canvas>
          {faces.map((f, i) => (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityLabel={String(f)}
              accessibilityState={{ selected: f === face }}
              disabled={busy}
              onPress={() => {
                tapHaptic();
                onFace(f);
              }}
              style={[styles.face, { left: i * (FACE + FACE_GAP) - FACE_GAP / 2 }]}
            />
          ))}
        </View>

        <View style={styles.stepper}>
          <Stud sign="−" label="−" disabled={busy || count <= base} onPress={() => onCount(count - 1)} />
          <View style={styles.plaque}>
            <LinearGradient colors={["#FFFFFF", "#F4EEDF", "#D8CCB0"]} style={StyleSheet.absoluteFill} />
            <BezelOverlay r={10} t={3.5} />
            <AppText style={styles.number}>{count}</AppText>
          </View>
          <Stud sign="+" label="+" disabled={busy || count >= total} onPress={() => onCount(count + 1)} />
        </View>
      </View>
    </View>
  );
}

/** One call on the plinth: the call it makes, its kind on a tag under it
 *  (or, greyed, why it can't be made). */
function CallButton({ choice, busy, onCall }: { choice: CallChoice; busy: boolean; onCall: (choice: CallChoice) => void }) {
  const { t } = useTranslation();
  const off = choice.problem !== null || choice.quantity === null;
  const kind = t(choice.zhai ? "liarsdice.zhai" : "liarsdice.kaizhai");
  const label = choice.quantity === null ? kind : `${t("liarsdice.bid", { count: choice.quantity, face: choice.face })} · ${kind}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off || busy }}
      disabled={off || busy}
      onPress={() => {
        tapHaptic();
        onCall(choice);
      }}
      style={({ pressed }) => [styles.call, off && styles.callOff, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={off ? ["#6A5A48", "#4A3C2E", "#2E241A"] : ["#FFE7A0", "#E2A84A", "#9A6B1E"]}
        style={StyleSheet.absoluteFill}
      />
      <BezelOverlay r={14} t={3} metal={off ? "silver" : "gold"} />
      <View style={styles.callLine}>
        <AppText style={[styles.callCount, off && styles.callCountOff]}>{choice.quantity ?? "–"}</AppText>
        <AppText style={[styles.callTimes, off && styles.callCountOff]}>×</AppText>
        <DiceRow faces={[choice.face]} size={20} />
      </View>
      {off ? (
        <AppText style={styles.why} numberOfLines={1}>
          {choice.problem ? whyShort(choice.problem, t) : kind}
        </AppText>
      ) : (
        <View style={[styles.tag, choice.zhai ? styles.tagZhai : styles.tagKai]}>
          <AppText style={[styles.tagText, choice.zhai ? styles.tagZhaiText : styles.tagKaiText]} numberOfLines={1}>
            {kind}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

/** Rows of the grid on the plinth, each 48 tall with 8 between. */
export const callGridHeight = (rows: number) => rows * 48 + (rows - 1) * 8;

/** The plinth on my turn: the calls in a row, and under them (with a call
 *  on the table) Open and Split, held. */
export function CallGrid({
  plan,
  canLie,
  busy,
  openHold,
  splitHold,
  holdKey,
  onCall,
  onOpen,
  onSplit,
  lift = 0,
}: {
  plan: CallPlan;
  /** A call is on the table: Open and Split are offered. */
  canLie: boolean;
  busy: boolean;
  openHold: SharedValue<number>;
  splitHold: SharedValue<number>;
  /** Changes with each step, so a hold starts afresh. */
  holdKey: string;
  onCall: (choice: CallChoice) => void;
  onOpen: () => void;
  onSplit: () => void;
  /** How far to lift the grid into the plinth's top on a short screen. */
  lift?: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.grid, { marginTop: -lift }]}>
      <View style={styles.gridRow}>
        {plan.choices.map((choice) => (
          <CallButton key={`${choice.ones ? "ones" : choice.zhai ? "zhai" : "kai"}`} choice={choice} busy={busy} onCall={onCall} />
        ))}
      </View>
      {canLie ? (
        <View style={styles.gridRow}>
          <View style={styles.cell}>
            <HoldButton
              key={`${holdKey}|open`}
              compact
              label={t("liarsdice.stage.holdOpen")}
              tone="bad"
              progress={openHold}
              disabled={busy}
              onDone={onOpen}
            />
          </View>
          <View style={styles.cell}>
            <HoldButton
              key={`${holdKey}|split`}
              compact
              label={t("liarsdice.stage.holdSplit")}
              tone="bad"
              progress={splitHold}
              disabled={busy}
              onDone={onSplit}
            />
          </View>
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
  scene: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  slateBox: { flex: 1, justifyContent: "center", paddingBottom: 8 },
  controls: { alignItems: "center", gap: 8 },
  heading: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: "#E8D2B4",
    ...shadow,
  },
  small: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "#E8D2B4",
    textAlign: "center",
    ...shadow,
  },
  have: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: "#FFD58A",
    ...shadow,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14 },
  stud: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sign: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 28,
    color: "#FFE7C8",
    ...shadow,
  },
  plaque: {
    width: 76,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 36,
    color: "#3A2408",
  },
  face: {
    position: "absolute",
    top: -4,
    width: FACE + FACE_GAP,
    height: FACE * 1.2 + 8,
  },
  grid: { alignSelf: "stretch", gap: 8 },
  gridRow: { flexDirection: "row", gap: 8 },
  cell: { flex: 1 },
  call: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  callOff: { opacity: 0.85 },
  callLine: { flexDirection: "row", alignItems: "center", gap: 3, height: 26 },
  callCount: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 25,
    color: "#3A2408",
  },
  callTimes: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: "#5A3A10",
  },
  callCountOff: { color: "#B8A890" },
  tag: {
    paddingHorizontal: 7,
    borderRadius: 6,
    height: 15,
    justifyContent: "center",
  },
  tagZhai: { backgroundColor: "#9A1828" },
  tagKai: { backgroundColor: "#3A2408" },
  tagText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
  },
  tagZhaiText: { color: "#FFF2F0" },
  tagKaiText: { color: "#FFE7A0" },
  why: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 13,
    color: "#E8D2B4",
  },
  off: { opacity: 0.4 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
});
