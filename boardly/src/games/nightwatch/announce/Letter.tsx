// Each night opens with a letter on the stage. It arrives sealed: an
// envelope with the manor's seal in crimson wax. Tap the seal and it
// breaks — a flash, the wax flying — the envelope drops away and the
// letter unfolds on parchment: tonight's mission room with its picture,
// how many go, the next night's room, the night's event, the doors, and
// (once a game) the choice of a door to lock.

import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { useBox } from "@/components/ui";
import { fontFamily } from "@/theme";
import { heavyHaptic, tapHaptic } from "@/utils/haptics";
import { sealArt } from "../ending/sealArt";
import { GameText as AppText } from "../GameText";
import { Burst } from "../lantern/Lantern";
import { EVENT_EMOJI, doorLabel, teamSize, type NightwatchState } from "../logic";
import { RoomPicture } from "../RoomPicture";
import { envelope, parchment } from "./letterArt";

const HEAD = 46;

export function Letter({
  state,
  roomName,
  open,
  onOpen,
  lock,
  onLock,
  busy,
}: {
  state: NightwatchState;
  roomName: (room: number) => string;
  open: boolean;
  onOpen: () => void;
  lock: number[] | null;
  onLock: (lock: number[] | null) => void;
  busy: boolean;
}) {
  const [box, onLayout] = useBox();
  // until it has been measured, a guess from the window
  const window = useWindowDimensions();
  const w = box.w || window.width * 0.84;
  const h = box.h || window.height * 0.5;
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Sheet state={state} roomName={roomName} open={open} onOpen={onOpen} lock={lock} onLock={onLock} busy={busy} w={w} h={h} />
    </View>
  );
}

function Sheet({
  state,
  roomName,
  open,
  onOpen,
  lock,
  onLock,
  busy,
  w,
  h,
}: Parameters<typeof Letter>[0] & { w: number; h: number }) {
  const { t } = useTranslation();
  const ew = Math.min(w * 0.78, 320);
  const eh = ew * 0.62;
  const pw = Math.min(w - 28, 380);
  const ph = Math.min(h - 12, 460);
  const env = bakedSvg("manor-envelope", ew, eh, () => envelope(ew, eh));
  const paper = bakedSvg("manor-parchment", pw, ph, () => parchment(pw, ph, HEAD));
  const sealSize = ew * 0.3;
  const seal = bakedSvg("manor-seal|whole", sealSize, sealSize, () => sealArt(false));

  // sealed, the envelope breathes a little to be opened
  const breathe = useSharedValue(0);
  const opened = useSharedValue(open ? 1 : 0);
  const burst = useSharedValue(0);
  useEffect(() => {
    breathe.set(withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1));
  }, [breathe]);
  useEffect(() => {
    if (!open) return;
    burst.set(withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
    opened.set(withDelay(150, withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.1)) })));
  }, [open, burst, opened]);

  const envStyle = useAnimatedStyle(() => ({
    opacity: 1 - opened.value,
    transform: [{ translateY: opened.value * 80 }, { scale: 1 + breathe.value * 0.015 * (1 - opened.value) }],
  }));
  const sealStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - burst.value * 1.6),
    transform: [{ scale: 1 + burst.value * 0.5 }],
  }));
  const paperStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, opened.value * 1.8),
    transform: [{ translateY: (1 - opened.value) * 60 }, { scaleY: 0.08 + 0.92 * opened.value }],
  }));
  const burstGo = useDerivedValue(() => burst.value);

  const twoFails = state.failsRequired[state.round] > 1;
  const event = state.event;
  const canLock = state.doorOptions.length > 0;
  const same = (a: number[] | null, b: number[]) => !!a && a[0] === b[0] && a[1] === b[1];

  return (
    <>
      {/* the letter, unfolded */}
      <Animated.View
        style={[styles.paper, { width: pw, height: ph, left: (w - pw) / 2, transformOrigin: [pw / 2, 0, 0] }, paperStyle]}
        pointerEvents={open ? "auto" : "none"}
      >
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {paper ? <SkImage image={paper} x={0} y={0} width={pw} height={ph} /> : null}
        </Canvas>
        <AppText style={styles.head} numberOfLines={1}>
          {`${t("nightwatch.announce.title")} · ${t("nightwatch.bar.night", { n: state.round + 1, total: state.rounds })}`}
        </AppText>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyIn} showsVerticalScrollIndicator={false}>
          <View style={styles.mission}>
            <View style={styles.picture}>
              <RoomPicture room={state.missionRoom} width={92} />
            </View>
            <View style={styles.grow}>
              <AppText paper style={styles.big}>
                {t("nightwatch.announce.mission", { room: roomName(state.missionRoom), size: teamSize(state) })}
              </AppText>
              {twoFails ? <AppText style={styles.warn}>{`★ ${t("nightwatch.announce.twoFails")}`}</AppText> : null}
              {state.nextMissionRoom !== null ? (
                <AppText paper style={styles.line}>
                  {t("nightwatch.announce.next", { room: roomName(state.nextMissionRoom) })}
                </AppText>
              ) : null}
            </View>
          </View>
          <View style={styles.rule} />
          <View style={styles.event}>
            {event ? <Emblem emoji={EVENT_EMOJI[event]} size={34} /> : null}
            <View style={styles.grow}>
              <AppText style={styles.eventName}>
                {event ? t(`nightwatch.events.${event}.name`) : t("nightwatch.announce.noEvent")}
              </AppText>
              {event ? <AppText style={styles.line}>{t(`nightwatch.events.${event}.desc`)}</AppText> : null}
            </View>
          </View>
          {state.lockedDoor ? (
            <AppText paper style={styles.line}>
              {`🔒  ${t("nightwatch.announce.locked", { door: doorLabel(state.lockedDoor, roomName) })}`}
            </AppText>
          ) : null}
          {state.doors.map((door) => (
            <AppText paper key={door.join("-")} style={styles.line}>
              {`🚪  ${t("nightwatch.announce.door", { door: doorLabel(door, roomName) })}`}
            </AppText>
          ))}
          {state.collapsed.length > 0 ? (
            <AppText paper style={styles.line}>
              {`🧱  ${t("nightwatch.announce.collapsed", { rooms: state.collapsed.map(roomName).join(", ") })}`}
            </AppText>
          ) : null}
          {canLock ? (
            <>
              <View style={styles.rule} />
              <AppText style={styles.eventName}>{`🗝️  ${t("nightwatch.prompt.lockTitle")}`}</AppText>
              <AppText style={styles.small}>{t("nightwatch.prompt.lockHint")}</AppText>
              <View style={styles.chips}>
                <PaperChip label={t("nightwatch.prompt.noLock")} on={lock === null} disabled={busy} onPress={() => onLock(null)} />
                {state.doorOptions.map((door) => (
                  <PaperChip
                    key={door.join("-")}
                    label={doorLabel(door, roomName)}
                    on={same(lock, door)}
                    disabled={busy}
                    onPress={() => onLock(door)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </Animated.View>

      {/* the envelope, sealed */}
      <Animated.View
        style={[styles.envelope, { width: ew, height: eh, left: (w - ew) / 2, top: (h - eh) / 2 - 20 }, envStyle]}
        pointerEvents={open ? "none" : "auto"}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("nightwatch.letter.open")}
          onPress={() => {
            heavyHaptic();
            onOpen();
          }}
          style={StyleSheet.absoluteFill}
        >
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {env ? <SkImage image={env} x={0} y={0} width={ew} height={eh} /> : null}
          </Canvas>
          <Animated.View
            style={[styles.seal, { width: sealSize, height: sealSize, left: (ew - sealSize) / 2, top: eh * 0.58 - sealSize / 2 }, sealStyle]}
          >
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {seal ? <SkImage image={seal} x={0} y={0} width={sealSize} height={sealSize} /> : null}
            </Canvas>
          </Animated.View>
        </Pressable>
      </Animated.View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          <Burst x={w / 2} y={(h - eh) / 2 - 20 + eh * 0.58} go={burstGo} color="#FFC870" size={w * 0.45} />
        </Canvas>
      </View>
    </>
  );
}

/** A choice written on the letter: ivory, gilt-edged; crimson when picked. */
function PaperChip({ label, on, disabled, onPress }: { label: string; on: boolean; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      disabled={disabled}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={[styles.chip, on && styles.chipOn]}
    >
      <AppText paper={!on} style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const INK = "#3A2408";

const styles = StyleSheet.create({
  paper: { position: "absolute", top: 4 },
  envelope: { position: "absolute" },
  seal: { position: "absolute" },
  head: {
    position: "absolute",
    top: 22,
    left: 30,
    right: 30,
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 1.6,
    color: "#7A5212",
    textTransform: "uppercase",
  },
  body: { position: "absolute", top: HEAD + 10, left: 22, right: 22, bottom: 22 },
  bodyIn: { gap: 8, paddingBottom: 8 },
  mission: { flexDirection: "row", alignItems: "center", gap: 10 },
  picture: { width: 92, borderRadius: 8, overflow: "hidden", borderWidth: 1.5, borderColor: "#B8862E", backgroundColor: "#1A1E2C" },
  grow: { flex: 1, gap: 2 },
  big: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 21, color: INK },
  warn: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 16, color: "#9A1428" },
  line: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18, color: "#5A4020" },
  small: { fontFamily: fontFamily.medium, fontSize: 11.5, lineHeight: 15, color: "#7A6040" },
  rule: { height: 1, backgroundColor: "#B8862E", opacity: 0.5, marginVertical: 2 },
  event: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  eventName: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 19, color: INK },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1.4,
    borderColor: "#B8862E",
    backgroundColor: "#FBF4E2",
  },
  chipOn: { backgroundColor: "#9A1428", borderColor: "#5A0812" },
  chipText: { fontFamily: fontFamily.semiBold, fontSize: 12, lineHeight: 16, color: INK },
  chipTextOn: { color: "#FFF2E6" },
});
