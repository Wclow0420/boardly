// The Games tab as a brass lift: one floor per game. At the top the
// floor dial (LiftDial) with its needle on the floor the cab is at, the
// ride buttons and the players counter; in the middle, through the
// folding gate, the floor itself (LiftShaft): the game's world with its
// lead standing in front; under it the floor's plaque, its name, how many
// play, a line about it, and the ways out: open a table, or read the
// rules. Swipe up or down to ride a floor at a time (a clear stop at
// each, a lurch and a ding on arrival), tap a number on the dial to ride
// straight there. Choosing how many are playing darkens the floors whose
// game doesn't take that many, and riding passes them by. The last floor
// is remembered on the device.
//
// The page opens fast: the cab is one image baked once (art.ts), the
// floor shown comes the frame after, its neighbours the frame after
// that; only the floor shown and the two beside it are ever baked or
// drawn. Everything moves on one clock, which stops when the tab isn't
// showing and with reduce motion (the floors then fade instead of ride).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Canvas, Image as SkImage } from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { bakedDrawing } from "@/components/badges/bake";
import { emblemData } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { AppText, Button } from "@/components/ui";
import type { GameCatalogEntry } from "@/data/types";
import { useGameName } from "@/games/names";
import { getGame } from "@/games/registry";
import { useOnScreen } from "@/hooks/useOnScreen";
import { TABLE, fontFamily } from "@/theme";
import { heavyHaptic, moveHaptic, tapHaptic, tickHaptic } from "@/utils/haptics";
import { cabArt, wallArt } from "./art";
import { drawSvg, floorArt, floorImage, leadImage } from "./floors";
import { liftLayout } from "./layout";
import { LiftDial } from "./LiftDial";
import { LiftShaft, type ShaftFloor } from "./LiftShaft";

export interface LiftPageProps {
  games: GameCatalogEntry[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  /** A table is being opened. */
  busy?: boolean;
  /** Open a table of this game: resolves on the way to it, rejects if
   *  it couldn't (the gate then closes again). */
  onOpenTable: (game: GameCatalogEntry) => Promise<void>;
  onRules: (game: GameCatalogEntry) => void;
  /** Where the floor is remembered on the device. */
  storageKey?: string;
  /** Called once the first floor is on screen (for timing the opening). */
  onShown?: () => void;
  /** Players chosen to begin with (dev previews). */
  initialCount?: number | null;
}

export function LiftPage({
  games,
  loading,
  error,
  onRetry,
  busy,
  onOpenTable,
  onRules,
  storageKey = "boardly.games.floor",
  onShown,
  initialCount = null,
}: LiftPageProps) {
  const { t, i18n } = useTranslation();
  const gameName = useGameName();
  const insets = useSafeAreaInsets();
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const onScreen = useOnScreen();
  const reduced = useReducedMotion();
  const clock = useIsoClock(!onScreen || reduced);
  const n = games.length;

  const L = useMemo(
    () => (height > 0 && width > 0 ? liftLayout(width, height, insets.top, n) : null),
    [width, height, insets.top, n],
  );
  const arts = useMemo(() => games.map((g) => floorArt(g.id, g.emoji, g.tileColor)), [games]);
  const keys = games.map((g) => g.id).join(",");

  // the cab and the planks round it, one image for the app
  const cab = useMemo(() => {
    if (!L) return null;
    const emblems = arts.map((a) => emblemData(a.emblem) ?? { data: [] });
    return bakedDrawing(`lift-cab|${L.top}|${keys}`, L.w, L.h, (c) => {
      drawSvg(c, wallArt(L.w, L.h), 0, 0, L.w, L.h);
      drawSvg(c, cabArt(L, emblems), 0, 0, L.w, L.h);
    });
  }, [L, arts, keys]);

  // where the cab is: a floor index, fractional while it rides
  const pos = useSharedValue(0);
  const goal = useSharedValue(0);
  const arrived = useSharedValue(-10);
  const fade = useSharedValue(1);
  const fadeFrom = useSharedValue(0);
  const gate = useSharedValue(0);
  const start = useSharedValue(0);
  const [floor, setFloor] = useState(0);
  const [count, setCount] = useState<number | null>(initialCount);
  const fits = useMemo(
    () => games.map((g) => count === null || (count >= g.minPlayers && count <= g.maxPlayers)),
    [games, count],
  );
  const fitsSV = useSharedValue<boolean[]>([]);
  const countSV = useSharedValue(0);
  const reducedSV = useSharedValue(false);
  const pitchSV = useSharedValue(1);
  useEffect(() => {
    fitsSV.set(fits);
    countSV.set(n);
    reducedSV.set(reduced);
    pitchSV.set(L?.pitch ?? 1);
  }, [fits, n, reduced, L, fitsSV, countSV, reducedSV, pitchSV]);

  // back where we left the lift last time
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(storageKey)
      .then((id) => alive && setSaved(id ?? ""))
      .catch(() => alive && setSaved(""));
    return () => {
      alive = false;
    };
  }, [storageKey]);
  const [placed, setPlaced] = useState(false);
  if (!placed && saved !== null && n > 0) {
    const i = Math.max(0, games.findIndex((g) => g.id === saved));
    setPlaced(true);
    setFloor(i);
  }
  useEffect(() => {
    if (!placed) return;
    pos.set(floor);
    goal.set(floor);
    // only on placing: from then on the ride moves it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed]);
  const id = games[floor]?.id;
  useEffect(() => {
    if (placed && id) AsyncStorage.setItem(storageKey, id).catch(() => {});
  }, [placed, id, storageKey]);

  // the floor shown follows the cab; a tick each half floor it passes
  useAnimatedReaction(
    () => Math.round(pos.get()),
    (now, prev) => {
      if (prev !== null && now !== prev) scheduleOnRN(setFloor, now);
    },
  );
  useAnimatedReaction(
    () => Math.round(pos.get() * 2),
    (now, prev) => {
      if (prev !== null && Math.abs(now - prev) === 1 && !reducedSV.get()) scheduleOnRN(tickHaptic);
    },
  );

  /** Rides to floor `to`: past it a touch, then settling back (the
   *  lurch), with a ding as it arrives. */
  const ride = useCallback(
    (to: number) => {
      "worklet";
      const target = Math.max(0, Math.min(countSV.get() - 1, to));
      const from = pos.get();
      goal.set(target);
      if (reducedSV.get()) {
        fadeFrom.set(Math.round(from));
        pos.set(target);
        fade.set(0);
        fade.set(withTiming(1, { duration: 260 }));
        scheduleOnRN(heavyHaptic);
        return;
      }
      const d = Math.abs(target - from);
      if (d < 0.02) {
        pos.set(withSpring(target, { damping: 16, stiffness: 180 }));
        return;
      }
      const sign = target > from ? 1 : -1;
      pos.set(
        withSequence(
          withTiming(
            target + sign * 0.05,
            { duration: 300 + 230 * Math.min(d, 5), easing: Easing.inOut(Easing.cubic) },
            (done) => {
              if (!done) return;
              arrived.set(clock.get());
              scheduleOnRN(heavyHaptic);
            },
          ),
          withSpring(target, { damping: 8, stiffness: 240, mass: 0.7 }),
        ),
      );
    },
    [countSV, pos, goal, reducedSV, fadeFrom, fade, arrived, clock],
  );

  /** The next floor that way whose game fits (or this one, if none). */
  const pick = useCallback(
    (base: number, dir: number) => {
      "worklet";
      const all = fitsSV.get();
      let i = base + dir;
      while (i >= 0 && i < all.length && !all[i]) i += dir;
      return i < 0 || i >= all.length ? base : i;
    },
    [fitsSV],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-24, 24])
        .onStart(() => {
          cancelAnimation(pos);
          start.set(pos.get());
        })
        .onUpdate((e) => {
          if (reducedSV.get()) return;
          const base = Math.round(start.get());
          const last = countSV.get() - 1;
          let p = start.get() + e.translationY / pitchSV.get();
          p = Math.max(base - 1, Math.min(base + 1, p));
          // it gives a little past the top and bottom floors
          if (p < 0) p *= 0.3;
          if (p > last) p = last + (p - last) * 0.3;
          pos.set(p);
        })
        .onEnd((e) => {
          const base = Math.round(start.get());
          const dy = e.translationY;
          const pitch = pitchSV.get();
          const dir = dy > pitch * 0.16 || e.velocityY > 650 ? 1 : dy < -pitch * 0.16 || e.velocityY < -650 ? -1 : 0;
          const to = dir === 0 ? base : pick(base, dir);
          if (to === base) {
            goal.set(base);
            pos.set(withSpring(base, { damping: 16, stiffness: 180 }));
          } else ride(to);
        }),
    [pos, start, reducedSV, countSV, pitchSV, pick, ride, goal],
  );

  // the gate folds open on the way out, and is shut again on coming back
  useEffect(() => {
    if (onScreen) gate.set(0);
  }, [onScreen, gate]);
  const game = games[floor];
  const stepOut = () => {
    if (!game || busy) return;
    moveHaptic();
    if (!reduced) gate.set(withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) }));
    onOpenTable(game).catch(() => gate.set(withTiming(0, { duration: 420 })));
  };

  // the floor shown first, its neighbours a frame later
  const [stage, setStage] = useState(0);
  const shown = useRef(false);
  useEffect(() => {
    if (!L || !placed || stage >= 2) return;
    const frame = requestAnimationFrame(() => setStage((s) => s + 1));
    return () => cancelAnimationFrame(frame);
  }, [L, placed, stage]);
  useEffect(() => {
    if (stage >= 1 && !shown.current) {
      shown.current = true;
      requestAnimationFrame(() => onShown?.());
    }
  }, [stage, onShown]);

  const leadSize = L ? Math.min(L.opening.w * 0.44, L.floorH * 0.56) : 0;
  const floors = useMemo(() => {
    const out: Record<number, ShaftFloor> = {};
    if (!L || stage < 1) return out;
    const near = stage >= 2 ? [floor - 1, floor, floor + 1] : [floor];
    for (const i of near) {
      const g = games[i];
      if (!g) continue;
      out[i] = {
        image: floorImage(g.id, arts[i], L.opening.w, L.floorH),
        lead: leadImage(g.id, arts[i], leadSize),
        leadAt: arts[i].leadAt,
      };
    }
    return out;
  }, [L, stage, floor, games, arts, leadSize]);
  const walls = useMemo(() => arts.map((a) => a.look.wall[1]), [arts]);
  const names = useMemo(() => games.map((g) => gameName(g.id, g.name)), [games, gameName]);

  const onFloor = useCallback(
    (i: number) => {
      tapHaptic();
      ride(i);
    },
    [ride],
  );
  const onRide = useCallback(
    (dir: 1 | -1) => {
      tapHaptic();
      ride(pick(Math.round(pos.get()), dir));
    },
    [ride, pick, pos],
  );

  const def = game ? getGame(game.id) : undefined;
  const taglineKey = def?.skin?.taglineKey ?? `games.lift.taglines.${game?.id}`;
  const tagline = game && i18n.exists(taglineKey) ? t(taglineKey) : "";
  const players = game
    ? game.minPlayers === game.maxPlayers
      ? t("games.lift.playersExact", { count: game.minPlayers })
      : t("games.lift.playersRange", { min: game.minPlayers, max: game.maxPlayers })
    : "";

  // on a small phone the buttons give up some of their padding
  const narrow = L ? L.plaque.w - 40 < 330 : false;

  return (
    <View style={styles.screen} onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setSize((was) => (was.width === Math.round(w) && was.height === Math.round(h) ? was : { width: Math.round(w), height: Math.round(h) }));
      }}>
      {L ? (
        <>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {cab ? <SkImage image={cab} x={0} y={0} width={L.w} height={L.h} /> : null}
          </Canvas>
          <LiftShaft
            L={L}
            clock={clock}
            pos={pos}
            fadeFrom={fadeFrom}
            fade={fade}
            gate={gate}
            floors={floors}
            walls={walls}
            fits={fits}
            leadSize={leadSize}
          />
          <GestureDetector gesture={pan}>
            <View
              style={[styles.abs, { left: L.opening.x, top: L.opening.y, width: L.opening.w, height: L.opening.h }]}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={game ? t("games.lift.floorOf", { n: floor + 1, name: names[floor] }) : undefined}
              accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
              onAccessibilityAction={(e) => onRide(e.nativeEvent.actionName === "increment" ? 1 : -1)}
            />
          </GestureDetector>
          <LiftDial
            L={L}
            clock={clock}
            pos={pos}
            goal={goal}
            arrived={arrived}
            fits={fits}
            floor={floor}
            count={count}
            names={names}
            onFloor={onFloor}
            onRide={onRide}
            onCount={(next) => {
              tapHaptic();
              setCount(next);
            }}
          />

          {/* the floor's plaque */}
          <View style={[styles.abs, styles.plaque, { left: L.plaque.x + 20, top: L.plaque.y + 16, width: L.plaque.w - 40, height: L.plaque.h - 30 }]}>
            {game ? (
              <Animated.View key={game.id} entering={FadeIn.duration(200)} style={styles.facts}>
                <AppText style={styles.name} numberOfLines={1}>
                  {names[floor]}
                </AppText>
                <AppText style={[styles.players, !fits[floor] && styles.unfit]} numberOfLines={1}>
                  {`👥 ${players}${!fits[floor] && count !== null ? `  ·  ${t("games.lift.notFor", { count })}` : ""}`}
                </AppText>
                <AppText style={styles.tagline} numberOfLines={2}>
                  {tagline}
                </AppText>
              </Animated.View>
            ) : (
              <View style={styles.facts}>
                <AppText style={styles.name} numberOfLines={1}>
                  {error ? t("common.errorTitle") : t("games.lift.coming")}
                </AppText>
                <AppText style={styles.tagline} numberOfLines={2}>
                  {error ? t("common.errorSubtitle") : loading ? t("games.lift.loading") : t("common.emptyTitle")}
                </AppText>
              </View>
            )}
            <View style={styles.actions}>
              {game ? (
                <>
                  <Button
                    label={t("games.lift.rules")}
                    variant="secondary"
                    size="md"
                    style={[styles.rules, narrow && styles.rulesNarrow]}
                    onPress={() => onRules(game)}
                  />
                  <Button
                    label={t("games.lift.stepOut")}
                    size="md"
                    style={[styles.grow, narrow && styles.tight]}
                    loading={busy}
                    onPress={stepOut}
                  />
                </>
              ) : error ? (
                <Button label={t("common.retry")} size="md" style={styles.grow} onPress={onRetry} />
              ) : null}
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#140A04" },
  abs: { position: "absolute" },
  plaque: { justifyContent: "space-between" },
  facts: { alignItems: "center" },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 30,
    color: "#FFF2D0",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
  players: { fontFamily: fontFamily.semiBold, fontSize: 13, lineHeight: 19, color: TABLE.yellow.fill[0] },
  unfit: { color: "#F08A7A" },
  tagline: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    lineHeight: 17,
    height: 34,
    marginTop: 2,
    color: TABLE.creamMuted,
    textAlign: "center",
  },
  actions: { flexDirection: "row", gap: 10 },
  rules: { width: 108 },
  rulesNarrow: { width: 86, paddingHorizontal: 10 },
  tight: { paddingHorizontal: 10 },
  grow: { flex: 1 },
});
