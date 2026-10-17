// The table's lobby as the game's own floor of the lift: you step out of
// the lift onto it. Across the top the landing sign ("3F · HUSTLE", the
// table's code on a brass room-number plate, the QR button); under it
// the game's room seen flat on, with the lift's folding gate in a door on
// the left of its back wall, the house rules on the board beside it and
// the players standing on the boards in front, each as their own mascot
// under a lamp that lights when they're ready (the host crowned; free
// spots a dashed meeple to invite someone to). A new arrival walks out of
// the lift, once per phone. One line over the plinth says what the table
// is waiting for; on the plinth the host's bot bell and Hold to start, or
// everyone else's Ready. Starting puts the lamps out.
//
// Presentational: the lobby screen hands it the room and the moves (see
// app/dev/lobby.tsx for every moment with sample tables).

import { Canvas, Image as SkImg } from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RoomInfo, RoomPlayerInfo } from "@/api/client";
import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { AppText, Button } from "@/components/ui";
import { PLINTH_H, stageText } from "@/features/game/stage/GameStage";
import { Plinth } from "@/features/game/stage/parts";
import { floorArt } from "@/features/games/lift/floors";
import { asLook } from "@/features/mascot/dress";
import { HoldButton } from "@/games/nightwatch/lantern/HoldButton";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { heavyHaptic, tapHaptic } from "@/utils/haptics";
import { knobArt } from "./art";
import { roomLayout, signLayout } from "./layout";
import { LandingSign } from "./LandingSign";
import { QrPopup } from "./QrPopup";
import { roomLook } from "./rooms";
import { RoomScene, type RoomPerson } from "./RoomScene";
import { HouseRulesPopup, RulesPlacard, rulesSummary, tableNotes } from "./RulesPlacard";
import { lobbyStatus } from "./status";
import { useArrivals } from "./useArrivals";

/** How far the room runs on under the plinth's lip. */
const UNDER = 12;
/** A room shorter than this is laid out this tall and drawn down. */
const MIN_ROOM = 540;
const BELL = 52;

export interface FloorLobbyProps {
  room: RoomInfo;
  meId: string | undefined;
  /** The game's floor in the lift (from 1), and how many floors it has. */
  floor: number;
  floors: number;
  gameName: string;
  /** The join link (the QR code holds it). */
  link: string;
  onBack: () => void;
  onRules?: () => void;
  onReady: (ready: boolean) => void;
  readyBusy?: boolean;
  onStart: () => void;
  startBusy?: boolean;
  onRemoveBot: (userId: string) => void;
  onSetOption: (name: string, choice: string) => void;
  optionsBusy?: boolean;
  /** Invite someone to a free spot (the friends sheet). */
  onInvite: () => void;
  /** The host's bot bell (the bots sheet), where the game has bots. */
  onBots?: () => void;
  onShare: () => void;
  /** The link went to the clipboard rather than a share sheet. */
  shared?: boolean;
  onPlayer: (player: RoomPlayerInfo) => void;
  /** The game is starting: the lamps go out. */
  starting?: boolean;
  /** Opens with a popup showing (dev previews). */
  initialPopup?: "qr" | "rules" | null;
  /** Called once the room is on screen (for timing the opening). */
  onShown?: () => void;
}

export function FloorLobby({
  room,
  meId,
  floor,
  floors,
  gameName,
  link,
  onBack,
  onRules,
  onReady,
  readyBusy,
  onStart,
  startBusy,
  onRemoveBot,
  onSetOption,
  optionsBusy,
  onInvite,
  onBots,
  onShare,
  shared,
  onPlayer,
  starting = false,
  initialPopup = null,
  onShown,
}: FloorLobbyProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });
  const [popup, setPopup] = useState<"qr" | "rules" | null>(initialPopup);
  const onScreen = useOnScreen();
  const reduced = useReducedMotion();
  const still = !onScreen || reduced || popup !== null;
  const clock = useIsoClock(still);

  const min = room.game?.minPlayers ?? 2;
  const max = room.game?.maxPlayers ?? 2;
  const plinthH = PLINTH_H + insets.bottom;
  const S = useMemo(() => (w > 0 ? signLayout(w, insets.top) : null), [w, insets.top]);
  const roomH = S ? h - S.h - plinthH + UNDER : 0;
  const k = Math.min(1, roomH / MIN_ROOM);
  const R = useMemo(
    () => (S && roomH > 0 ? roomLayout(w / k, roomH / k, max, 70 / k) : null),
    [S, w, roomH, k, max],
  );
  const landing = floorArt(room.gameType, room.game?.emoji, room.game?.tileColor).look;
  const look = roomLook(room.gameType, landing);

  const players = useMemo(() => [...room.players].sort((a, b) => a.seat - b.seat), [room.players]);
  const peopleKey = JSON.stringify(players.map((p) => [p.userId, p.username, p.ready, p.isBot, p.mascot]));
  const people: RoomPerson[] = useMemo(
    () =>
      players.map((p) => ({
        id: p.userId,
        name: p.username,
        look: asLook(p.mascot),
        ready: p.ready,
        host: p.userId === room.hostId,
        bot: p.isBot === true,
        me: p.userId === meId,
      })),
    // peopleKey stands for players: the server resends them every update
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [peopleKey, room.hostId, meId],
  );
  const ids = useMemo(() => people.map((p) => p.id), [people]);
  const { ready: arrivalsRead, walking, arrived } = useArrivals(room.code, ids, meId);

  const me = people.find((p) => p.me);
  const isHost = meId !== undefined && meId === room.hostId;
  const waiting = room.status === "waiting";
  const everyoneReady = people.every((p) => p.ready || p.host);
  const canStart = waiting && people.length >= min && everyoneReady;
  const status = starting ? { text: t("lobby.floor.starting"), ready: true } : lobbyStatus(people, min, t);
  const notes = tableNotes(room, Math.max(people.length, min), t);
  const summary = rulesSummary(room, notes, t);

  // the latest handlers, so the room needn't redraw when they change
  const handlers = useRef({ onPlayer, onRemoveBot, players, isHost, waiting });
  useEffect(() => {
    handlers.current = { onPlayer, onRemoveBot, players, isHost, waiting };
  });
  const onPerson = useCallback((p: RoomPerson) => {
    const { players: all, onPlayer: show } = handlers.current;
    if (p.bot) return;
    const player = all.find((x) => x.userId === p.id);
    if (player) {
      tapHaptic();
      show(player);
    }
  }, []);
  const onHoldPerson = useCallback((p: RoomPerson) => {
    const { isHost: host, waiting: open, onRemoveBot: remove } = handlers.current;
    if (!host || !open || !p.bot) return;
    heavyHaptic();
    remove(p.id);
  }, []);

  // the lamps going out as the game starts: the room dims
  const dark = useSharedValue(0);
  useEffect(() => {
    dark.set(withTiming(starting ? 0.72 : 0, { duration: 650 }));
  }, [starting, dark]);
  const dim = useAnimatedStyle(() => ({ opacity: dark.get() }));

  // a held start that didn't take is ready to hold again
  const progress = useSharedValue(0);
  const [holdKey, setHoldKey] = useState(0);
  const wasBusy = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !startBusy && !starting) {
      progress.set(0);
      setHoldKey((k) => k + 1);
    }
    wasBusy.current = !!startBusy;
  }, [startBusy, starting, progress]);

  const shown = useRef(false);
  useEffect(() => {
    if (R && arrivalsRead && !shown.current) {
      shown.current = true;
      requestAnimationFrame(() => onShown?.());
    }
  }, [R, arrivalsRead, onShown]);

  const bell = bakedSvg("lobby-bell", BELL, BELL, () => knobArt(BELL));
  const title = t("lobby.floor.sign", { floor, game: gameName });

  return (
    <View
      style={styles.screen}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((was) => (was.w === Math.round(width) && was.h === Math.round(height) ? was : { w: Math.round(width), h: Math.round(height) }));
      }}
    >
      {S && R ? (
        <>
          <View style={[styles.abs, { top: S.h, left: 0 }]}>
            {arrivalsRead ? (
              <RoomScene
                R={R}
                look={look}
                artKey={room.gameType}
                floor={floor}
                floors={floors}
                people={people}
                walking={walking}
                onArrived={arrived}
                onPerson={onPerson}
                onHoldPerson={isHost ? onHoldPerson : undefined}
                onEmpty={onInvite}
                clock={clock}
                still={still}
                paused={still}
                starting={starting}
                k={k}
              />
            ) : null}
            <RulesPlacard R={R} k={k} look={look} summary={summary} count={people.length} max={max} onPress={() => setPopup("rules")} />
            <View style={[styles.abs, styles.status, { top: roomH - UNDER - 34, width: w }]} pointerEvents="none">
              <AppText style={status.ready ? stageText.strong : stageText.hint} numberOfLines={1}>
                {status.text}
              </AppText>
            </View>
          </View>
          <View style={[styles.abs, { top: 0, left: 0 }]}>
            <LandingSign
              L={S}
              clock={clock}
              title={title}
              code={room.code}
              onBack={onBack}
              onRules={onRules}
              onQr={() => setPopup("qr")}
            />
          </View>
          <View style={[styles.abs, { bottom: 0, left: 0 }]}>
            <Plinth width={w} height={plinthH}>
              {isHost ? (
                <View style={styles.row}>
                  {onBots ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("lobby.bots.title")}
                      onPress={() => {
                        tapHaptic();
                        onBots();
                      }}
                      style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
                    >
                      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                        {bell ? <SkImg image={bell} x={0} y={0} width={BELL} height={BELL} /> : null}
                      </Canvas>
                      <Emblem emoji="🤖" size={24} />
                      <AppText style={styles.bellLabel} numberOfLines={1}>
                        {t("lobby.floor.bots")}
                      </AppText>
                    </Pressable>
                  ) : null}
                  <View style={styles.grow}>
                    <HoldButton
                      key={holdKey}
                      label={t("lobby.startGame")}
                      tone="plain"
                      progress={progress}
                      disabled={!canStart || startBusy || starting}
                      onDone={onStart}
                    />
                  </View>
                </View>
              ) : me ? (
                <Button
                  label={me.ready ? t("lobby.unready") : t("lobby.imReady")}
                  size="lg"
                  variant={me.ready ? "secondary" : "primary"}
                  style={styles.stretch}
                  disabled={!waiting || starting}
                  loading={readyBusy}
                  onPress={() => onReady(!me.ready)}
                />
              ) : null}
            </Plinth>
          </View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.dark, dim]} pointerEvents="none" />
          <QrPopup
            visible={popup === "qr"}
            onClose={() => setPopup(null)}
            link={link}
            code={room.code}
            look={look}
            shared={shared}
            onShare={onShare}
          />
          <HouseRulesPopup
            visible={popup === "rules"}
            onClose={() => setPopup(null)}
            room={room}
            look={look}
            isHost={isHost}
            busy={optionsBusy}
            onSetOption={onSetOption}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#140A04", overflow: "hidden" },
  abs: { position: "absolute" },
  status: { alignItems: "center", paddingHorizontal: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, alignSelf: "stretch" },
  grow: { flex: 1 },
  stretch: { alignSelf: "stretch" },
  bell: { width: BELL, height: BELL, alignItems: "center", justifyContent: "center", marginTop: -6 },
  bellLabel: {
    position: "absolute",
    bottom: -15,
    width: 70,
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: "#E8C88A",
    textTransform: "uppercase",
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  dark: { backgroundColor: "#000" },
});
