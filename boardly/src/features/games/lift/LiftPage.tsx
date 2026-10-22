// The Games tab as a brass lift: one floor per game, the floors grouped
// into banks by kind (banks.ts: deduction, bluff, strategy…, seven
// floors a bank, the floors counting up
// through the building). At the top the floor dial (LiftDial) showing one
// bank, its needle on the floor the cab is at, a stud either side of the
// bank's sign to flip banks, the ride buttons and the way to the
// directory (Directory: every floor by bank, the players count, a row to
// ride there); in the middle, through the folding gate, the floor itself
// (LiftShaft): the game's world with its lead standing in front; under it
// the floor's plaque, its name, how many play, a line about it, and the
// ways out: open a table (in practice mode one filled with bots), or read
// the rules. Swipe up or down to ride a floor at a time (a clear stop at
// each, a lurch and a ding on arrival),
// tap a number on the dial to ride straight there; riding into another
// bank turns the dial over like an odometer. Choosing how many are
// playing darkens the floors whose game doesn't take that many, and
// riding passes them by. The last floor is remembered on the device.
//
// The page opens fast: the cab is one image baked once (art.ts), the
// floor shown comes the frame after, its neighbours the frame after
// that; only the floor shown and the two beside it are ever baked or
// drawn, and a bank's emblems are one image, the banks either side baked
// ahead. Everything moves on one clock, which stops when the tab isn't
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
  LayoutAnimationConfig,
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

import { bakedDrawing, bakedSvg } from "@/components/badges/bake";
import { emblemData } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { AppText, Button } from "@/components/ui";
import type { GameCatalogEntry } from "@/data/types";
import { useGameName } from "@/games/names";
import { getGame } from "@/games/registry";
import type { GameType } from "@/games/types";
import { useOnScreen } from "@/hooks/useOnScreen";
import { TABLE, fontFamily } from "@/theme";
import { heavyHaptic, moveHaptic, tapHaptic, tickHaptic } from "@/utils/haptics";
import { cabArt, faceArt, wallArt } from "./art";
import { BANK_SIZE, bankEntry, buildBanks, findFloor, floorKey, type Building } from "./banks";
import { isNewGame, typeOfGame } from "./building";
import { Directory } from "./Directory";
import { drawSvg, floorArt, floorImage, leadImage } from "./floors";
import { liftLayout } from "./layout";
import { LiftDial, STAGGER, type DialTurn } from "./LiftDial";
import { LiftShaft, type ShaftFloor } from "./LiftShaft";

/** Overrides for a game (dev previews: a sample catalogue drawn with the
 *  real games' art). */
export interface LiftMeta {
  /** The game whose floor art it borrows. */
  art?: string;
  category?: GameType;
  isNew?: boolean;
}

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
  meta?: Record<string, LiftMeta>;
  /** Where the floor is remembered on the device. */
  storageKey?: string;
  /** Called once the first floor is on screen (for timing the opening). */
  onShown?: () => void;
  /** Players chosen to begin with (dev previews). */
  initialCount?: number | null;
  /** Open with the directory showing (dev previews). */
  initialDirectory?: boolean;
  /** Practice mode (the Games tab opened with `practice=1`): the sign
   *  reads "Practice" and stepping out opens a table already filled
   *  with bots. */
  practice?: boolean;
}

export function LiftPage({
  games: catalogue,
  loading,
  error,
  onRetry,
  busy,
  onOpenTable,
  onRules,
  meta,
  storageKey = "boardly.games.floor",
  onShown,
  initialCount = null,
  initialDirectory = false,
  practice = false,
}: LiftPageProps) {
  const { t, i18n } = useTranslation();
  const gameName = useGameName();
  const insets = useSafeAreaInsets();
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const onScreen = useOnScreen();
  const reduced = useReducedMotion();
  const clock = useIsoClock(!onScreen || reduced);

  // the building: the floors by bank (memoized by what's in it)
  const building = useMemo(
    () =>
      buildBanks(catalogue, {
        typeOf: (g) => meta?.[g.id]?.category ?? typeOfGame(g),
        isNew: (g) => meta?.[g.id]?.isNew ?? isNewGame(g),
      }),
    [catalogue, meta],
  );
  const games = useMemo(() => building.floors.map((f) => f.game), [building]);
  const n = games.length;
  const artKey = useCallback((g: GameCatalogEntry) => meta?.[g.id]?.art ?? g.id, [meta]);

  const L = useMemo(
    () => (height > 0 && width > 0 ? liftLayout(width, height, insets.top) : null),
    [width, height, insets.top],
  );
  const arts = useMemo(() => games.map((g) => floorArt(artKey(g), g.emoji, g.tileColor)), [games, artKey]);

  // the cab and the planks round it, one image for the app
  const cab = useMemo(() => {
    if (!L) return null;
    return bakedDrawing(`lift-cab|${L.top}|${L.R}`, L.w, L.h, (c) => {
      drawSvg(c, wallArt(L.w, L.h), 0, 0, L.w, L.h);
      drawSvg(c, cabArt(L), 0, 0, L.w, L.h);
    });
  }, [L]);

  /** A bank's emblems round the dial, baked once. */
  const faceOf = useCallback(
    (bank: number) => {
      const b = building.banks[bank];
      if (!L || !b) return null;
      const marks = Array.from({ length: BANK_SIZE }, (_, s) => {
        if (s >= b.size) return null;
        const i = b.start + s;
        const e = emblemData(arts[i].emblem);
        return e ? { data: e.data, tint: e.tint } : null;
      });
      const key = Array.from({ length: b.size }, (_, s) => arts[b.start + s].emblem).join(",");
      return bakedSvg(`lift-face|${L.R}|${key}`, 2 * L.R, L.R, () => faceArt(L, marks));
    },
    [L, building, arts],
  );

  // where the cab is: a floor index, fractional while it rides
  const pos = useSharedValue(0);
  const goal = useSharedValue(0);
  const arrived = useSharedValue(-10);
  const fade = useSharedValue(1);
  const fadeFrom = useSharedValue(0);
  const gate = useSharedValue(0);
  const start = useSharedValue(0);
  // the bank the dial shows, and the needle's swing back across it
  const dialBank = useSharedValue(0);
  const bankStart = useSharedValue(0);
  const bankSize = useSharedValue(1);
  const swing = useSharedValue(1);
  const swingFrom = useSharedValue(0);
  const [floor, setFloor] = useState(0);
  const [count, setCount] = useState<number | null>(initialCount);
  const [directory, setDirectory] = useState(initialDirectory);
  const fits = useMemo(
    () => games.map((g) => count === null || (count >= g.minPlayers && count <= g.maxPlayers)),
    [games, count],
  );
  const fitsSV = useSharedValue<boolean[]>([]);
  const countSV = useSharedValue(0);
  const reducedSV = useSharedValue(false);
  const pitchSV = useSharedValue(1);
  const floorBank = useSharedValue<number[]>([]);
  const starts = useSharedValue<number[]>([]);
  const sizes = useSharedValue<number[]>([]);
  useEffect(() => {
    fitsSV.set(fits);
    countSV.set(n);
    reducedSV.set(reduced);
    pitchSV.set(L?.pitch ?? 1);
    floorBank.set(building.floors.map((f) => f.bank));
    starts.set(building.banks.map((b) => b.start));
    sizes.set(building.banks.map((b) => b.size));
  }, [fits, n, reduced, L, building, fitsSV, countSV, reducedSV, pitchSV, floorBank, starts, sizes]);

  /** The dial on bank `bank` at once (placing the lift). */
  const turnAt = useCallback(
    (bank: number): DialTurn => {
      const b = building.banks[bank] ?? { start: 0, size: 0 };
      return { bank, start: b.start, size: b.size, dir: 1, face: faceOf(bank), was: null, at: -100 };
    },
    [building, faceOf],
  );
  const [turn, setTurn] = useState<DialTurn>({ bank: 0, start: 0, size: 0, dir: 1, face: null, was: null, at: -100 });
  // the face waits on the layout: bake it once there is one
  if (L && !turn.face && building.banks[turn.bank] && turn.size > 0) setTurn(turnAt(turn.bank));

  /** Turned over to bank `bank` (on the way to a floor in it): the drums
   *  roll to its numbers with a ratchet of clicks, its emblems come in. */
  const onTurn = useCallback(
    (bank: number, dir: 1 | -1) => {
      const b = building.banks[bank];
      if (!b) return;
      setTurn((was) => ({
        bank,
        start: b.start,
        size: b.size,
        dir,
        face: faceOf(bank),
        was: was.face,
        at: reduced ? -100 : clock.get(),
      }));
      moveHaptic();
      if (!reduced) for (let i = 0; i < BANK_SIZE; i += 2) setTimeout(tickHaptic, 260 + i * STAGGER);
    },
    [building, faceOf, reduced, clock],
  );

  // the banks either side baked ahead, so turning over bakes nothing
  useEffect(() => {
    if (!L) return;
    const soon = setTimeout(() => {
      faceOf(turn.bank - 1);
      faceOf(turn.bank + 1);
    }, 500);
    return () => clearTimeout(soon);
  }, [L, turn.bank, faceOf]);

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
  const [placed, setPlaced] = useState<Building | null>(null);
  if (placed !== building && saved !== null && n > 0) {
    // placing the lift, or the building changed under it (the catalogue
    // came in): the same floor, found again
    const i = placed ? findFloor(building, floorKey(placed, floor)) : findFloor(building, saved);
    setPlaced(building);
    setFloor(i);
    setTurn(turnAt(building.floors[i].bank));
  }
  useEffect(() => {
    if (!placed) return;
    const b = placed.banks[placed.floors[floor]?.bank ?? 0];
    pos.set(floor);
    goal.set(floor);
    dialBank.set(placed.floors[floor]?.bank ?? 0);
    bankStart.set(b?.start ?? 0);
    bankSize.set(b?.size ?? 1);
    swing.set(1);
    // only on placing: from then on the ride moves it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed]);
  const key = placed ? floorKey(placed, floor) : "";
  useEffect(() => {
    if (key) AsyncStorage.setItem(storageKey, key).catch(() => {});
  }, [key, storageKey]);

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
   *  lurch), with a ding as it arrives. Into another bank, the dial turns
   *  over first and the needle swings back across. */
  const ride = useCallback(
    (to: number) => {
      "worklet";
      const target = Math.max(0, Math.min(countSV.get() - 1, to));
      const from = pos.get();
      goal.set(target);
      const bank = floorBank.get()[target] ?? 0;
      if (bank !== dialBank.get()) {
        const dir = bank > dialBank.get() ? 1 : -1;
        const last = Math.max(0, bankSize.get() - 1);
        swingFrom.set(Math.min(last + 0.35, Math.max(-0.35, from - bankStart.get())));
        dialBank.set(bank);
        bankStart.set(starts.get()[bank] ?? 0);
        bankSize.set(sizes.get()[bank] ?? 1);
        if (reducedSV.get()) swing.set(1);
        else {
          swing.set(0);
          swing.set(withTiming(1, { duration: 640, easing: Easing.out(Easing.back(1.4)) }));
        }
        scheduleOnRN(onTurn, bank, dir);
      }
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
    [countSV, pos, goal, floorBank, dialBank, bankSize, swingFrom, bankStart, starts, sizes, reducedSV, swing, onTurn, fadeFrom, fade, arrived, clock],
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

  // every time the page comes into view the lift arrives: the needle
  // sweeps up from the bank's first floor to this one while the cab rises
  // the last bit, then the lurch and the ding (short; reduce motion: none)
  // (from the floor the page knows, not pos.get(): a value set on the UI
  // thread a moment ago may not have reached this thread yet)
  const placedNow = placed !== null;
  useEffect(() => {
    if (!onScreen || !placed || reduced) return;
    const at = floor;
    // from its rest (lying a little below the first stop), so even the
    // bank's first floor gets a sweep you can see
    swingFrom.set(-0.7);
    swing.set(0);
    swing.set(withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }));
    pos.set(at + 0.35);
    pos.set(
      withSequence(
        withTiming(at - 0.04, { duration: 620, easing: Easing.out(Easing.cubic) }, (done) => {
          if (!done) return;
          arrived.set(clock.get());
          scheduleOnRN(heavyHaptic);
        }),
        withSpring(at, { damping: 8, stiffness: 240, mass: 0.7 }),
      ),
    );
    // only on arriving: the ride moves it from then on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScreen, placedNow]);
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
        image: floorImage(artKey(g), arts[i], L.opening.w, L.floorH),
        lead: leadImage(artKey(g), arts[i], leadSize),
        leadAt: arts[i].leadAt,
      };
    }
    return out;
  }, [L, stage, floor, games, arts, leadSize, artKey]);
  const walls = useMemo(() => arts.map((a) => a.look.wall[1]), [arts]);
  const names = useMemo(() => games.map((g) => gameName(g.id, g.name)), [games, gameName]);
  const bankNames = useMemo(
    () => building.banks.map((b) => `${t(`games.lift.banks.${b.kind}`)}${b.part > 0 ? ` ${b.part + 1}` : ""}`),
    [building, t],
  );
  const emblems = useMemo(() => arts.map((a) => a.emblem), [arts]);

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
  /** Straight to the bank before or after (its first floor that fits). */
  const onBank = useCallback(
    (dir: 1 | -1) => {
      const to = bankEntry(building, fits, turn.bank + dir, dir);
      if (to < 0) return;
      tapHaptic();
      ride(to);
    },
    [building, fits, turn.bank, ride],
  );
  const onPick = useCallback(
    (i: number) => {
      setDirectory(false);
      tapHaptic();
      ride(i);
    },
    [ride],
  );
  const onCount = useCallback((next: number | null) => {
    tapHaptic();
    setCount(next);
  }, []);
  const openDirectory = useCallback(() => {
    tapHaptic();
    setDirectory(true);
  }, []);

  const art = game ? artKey(game) : undefined;
  const def = art ? getGame(art) : undefined;
  const taglineKey = def?.skin?.taglineKey ?? `games.lift.taglines.${art}`;
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
          <LayoutAnimationConfig skipEntering>
            <LiftDial
              L={L}
              clock={clock}
              pos={pos}
              goal={goal}
              arrived={arrived}
              bankStart={bankStart}
              bankSize={bankSize}
              swing={swing}
              swingFrom={swingFrom}
              turn={turn}
              fits={fits}
              floor={floor}
              count={count}
              bankName={bankNames[turn.bank] ?? ""}
              names={names}
              prevName={bankNames[turn.bank - 1] ?? null}
              nextName={bankNames[turn.bank + 1] ?? null}
              onFloor={onFloor}
              onRide={onRide}
              onBank={onBank}
              onDirectory={openDirectory}
              sign={practice ? t("games.lift.practice") : undefined}
            />
          </LayoutAnimationConfig>
          <Directory
            visible={directory}
            onClose={() => setDirectory(false)}
            building={building}
            emblems={emblems}
            names={names}
            bankNames={bankNames}
            fits={fits}
            floor={floor}
            count={count}
            onCount={onCount}
            onPick={onPick}
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
                  {building.floors[floor]?.isNew ? <AppText style={styles.isNew}>{`  ·  ${t("games.lift.new")}`}</AppText> : null}
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
                    label={t(practice ? "games.lift.practiceStepOut" : "games.lift.stepOut")}
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
  isNew: { color: "#FF8A7A", letterSpacing: 1, textTransform: "uppercase" },
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
