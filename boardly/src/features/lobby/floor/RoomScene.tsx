// The game's room in the floor lobby: its still art baked once into one
// image (rooms.ts), and over it, one picture a frame of what lives: the
// lift's folding gate in the door (it folds open when someone arrives),
// a piece on the table for each player, a lamp over every spot swaying
// on its cord, lit with a warm halo and a pool of light on the boards
// once that player is ready (out while they aren't, or the spot is
// free), the name plates, and a dashed meeple with a "+" on each free
// spot. The players themselves stand over it, each as their own mascot
// (MascotFigure: still canvases moved by native transforms), the host
// crowned; a new arrival walks out of the lift to their spot, once.

import { BlendMode, Canvas, Group, Image as SkImg, PaintStyle, Picture, Skia, type SkImage } from "@shopify/react-native-skia";
import { memo, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { PlayerName } from "@/features/game/stage/PlayerName";
import { drawGate, gatePaints, gatePaths } from "@/features/games/lift/gate";
import { MascotFigure } from "@/features/mascot/MascotStage";
import { topOf, type Look } from "@/features/mascot/dress";
import { BOX } from "@/features/mascot/rig";
import { fontFamily } from "@/theme";
import { moveHaptic, tapHaptic } from "@/utils/haptics";
import { beamArt, emptySpotArt, glowArt, plateArt, poolArt } from "./art";
import { LANTERN_SCALE, type RoomLayout, type Spot } from "./layout";
import type { RoomLook } from "./rooms";

export interface RoomPerson {
  id: string;
  name: string;
  look: Look;
  ready: boolean;
  host: boolean;
  bot: boolean;
  me: boolean;
}

/** Where the feet are in the mascot's box, as a share of its height. */
const FEET = 118.4 / BOX[1];
const PLATE_H = 18;
const GLOW = 120;
const PIECE = 0.62;
const WALK_MS = 1500;
const WALK_DELAY = 430;

const plateW = (s: Spot) => Math.round(s.size + (s.row ? 14 : 12));

export interface RoomSceneProps {
  R: RoomLayout;
  look: RoomLook;
  /** Bakes the room once per game, floor and size. */
  artKey: string;
  floor: number;
  floors: number;
  people: RoomPerson[];
  /** Who is walking out of the lift now (id → when they set off). */
  walking: Record<string, number>;
  onArrived: (id: string) => void;
  onPerson: (person: RoomPerson) => void;
  /** A long press on someone (the host taking a bot off). */
  onHoldPerson?: (person: RoomPerson) => void;
  onEmpty: () => void;
  clock: SharedValue<number>;
  /** The clock is stopped (lights then change at once). */
  still: boolean;
  paused: boolean;
  /** The game is starting: every lamp goes out. */
  starting: boolean;
  /** How much the room is drawn down to fit a short screen (its layout
   *  is laid out taller, the names and the board's words stay full size). */
  k?: number;
}

export const RoomScene = memo(function RoomScene({
  R,
  look,
  artKey,
  floor,
  floors,
  people,
  walking,
  onArrived,
  onPerson,
  onHoldPerson,
  onEmpty,
  clock,
  still,
  paused,
  starting,
  k = 1,
}: RoomSceneProps) {
  const { t } = useTranslation();
  const { w, h, spots, opening: O, table: T, beam } = R;
  const room = bakedSvg(`lobby-room|${artKey}|${floor}|${floors}|${spots.length}`, w, h, () => look.art(R, floor, floors));
  const lw = look.lamp.w * LANTERN_SCALE;
  const lh = look.lamp.h * LANTERN_SCALE;
  const pieceW = (look.piece?.w ?? 0) * PIECE;
  const pieceH = (look.piece?.h ?? 0) * PIECE;
  const parts = useMemo(() => {
    const rows = [0, 1].map((row) => spots.find((s) => s.row === row)).filter((s): s is Spot => s !== undefined);
    const byRow = (make: (s: Spot) => SkImage | null) => {
      const out: (SkImage | null)[] = [null, null];
      rows.forEach((s) => (out[s.row] = make(s)));
      return out;
    };
    const glowPaint = Skia.Paint();
    glowPaint.setBlendMode(BlendMode.Screen);
    const poolPaint = Skia.Paint();
    poolPaint.setBlendMode(BlendMode.Screen);
    const litPaint = Skia.Paint();
    const cord = Skia.Paint();
    cord.setAntiAlias(true);
    cord.setStyle(PaintStyle.Stroke);
    cord.setStrokeWidth(1.1);
    cord.setColor(Skia.Color("#1A0E06"));
    return {
      lit: bakedSvg(`lobby-lamp-lit|${artKey}`, lw, lh, look.lamp.lit),
      out: bakedSvg(`lobby-lamp-out|${artKey}`, lw, lh, look.lamp.out),
      glow: bakedSvg(`lobby-glow|${look.light}`, GLOW, GLOW, () => glowArt(GLOW, look.light)),
      pool: byRow((s) => bakedSvg(`lobby-pool|${look.light}`, s.size * 1.9, s.size * 0.5, () => poolArt(s.size * 1.9, s.size * 0.5, look.light))),
      plate: byRow((s) => bakedSvg("lobby-plate", plateW(s), PLATE_H, () => plateArt(plateW(s), PLATE_H))),
      empty: byRow((s) => bakedSvg("lobby-empty", s.size, s.size * 1.3, () => emptySpotArt(s.size))),
      beam: byRow((s) => {
        const bh = s.y - (s.lantern.y + lh * 0.8);
        return bakedSvg(`lobby-beam|${look.light}`, s.size * 1.5, bh, () => beamArt(lw * 0.9, s.size * 1.5, bh, look.light));
      }),
      piece: look.piece
        ? bakedSvg(`lobby-piece|${artKey}`, look.piece.w * PIECE, look.piece.h * PIECE, look.piece.art)
        : null,
      gate: gatePaints(O.h * 2),
      shut: gatePaths(O.w * 2, O.h * 2, 0),
      plain: Skia.Paint(),
      glowPaint,
      poolPaint,
      litPaint,
      cord,
    };
  }, [spots, artKey, look, lw, lh, O.w, O.h]);

  const seated = people.slice(0, spots.length);
  // each spot: 0 free, 1 someone there, 2 someone walking to it
  const fill = spots.map((_, i) => {
    const p = seated[i];
    return p ? (p.id in walking ? 2 : 1) : 0;
  });
  const fillKey = fill.join("");
  const targets: number[] = spots.map((_, i) => {
    const p = seated[i];
    return !starting && p && !(p.id in walking) && (p.ready || p.host) ? 1 : 0;
  });
  const lightKey = targets.join("");

  // each lamp eases from where it was to where it's going
  const lights = useSharedValue<{ from: number[]; to: number[]; at: number }>({ from: targets, to: targets, at: 0 });
  useEffect(() => {
    const now = clock.get();
    const was = lights.get();
    const k = Math.min(1, Math.max(0, (now - was.at) / 0.5));
    const cur = was.to.map((to, i) => (was.from[i] ?? 0) + (to - (was.from[i] ?? 0)) * k);
    const next = lightKey.split("").map(Number);
    lights.set({ from: still ? next : cur, to: next, at: now });
  }, [lightKey, still, clock, lights]);

  // the gate folds open for each arrival and shuts behind them
  const gate = useSharedValue(0);
  const tokens = Object.values(walking).join(",");
  const lastTokens = useRef("");
  useEffect(() => {
    if (!tokens || tokens === lastTokens.current) {
      lastTokens.current = tokens;
      return;
    }
    lastTokens.current = tokens;
    moveHaptic();
    gate.set(
      withSequence(
        withTiming(1, { duration: WALK_DELAY, easing: Easing.inOut(Easing.quad) }),
        withDelay(WALK_MS - 200, withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) })),
      ),
    );
  }, [tokens, gate]);

  const picture = useDerivedValue(() => {
    const time = clock.get();
    const L = lights.get();
    const k = Math.min(1, Math.max(0, (time - L.at) / 0.5));
    const ease = k * k * (3 - 2 * k);
    const rec = Skia.PictureRecorder();
    const c = rec.beginRecording(Skia.XYWHRect(0, 0, w, h));
    const P = parts;
    const draw = (img: SkImage | null, x: number, y: number, dw: number, dh: number, paint = P.plain) => {
      if (img) c.drawImageRect(img, Skia.XYWHRect(0, 0, img.width(), img.height()), Skia.XYWHRect(x, y, dw, dh), paint);
    };

    // the lift's gate in its door, drawn at twice the size and halved, so
    // its straps are as fine as the door is small
    const open = gate.get();
    c.save();
    c.translate(O.x, O.y);
    c.scale(0.5, 0.5);
    drawGate(c, open < 0.001 ? P.shut : gatePaths(O.w * 2, O.h * 2, open), P.gate, O.w * 2, O.h * 2);
    c.restore();

    // a piece on the table for everyone seated
    let n = 0;
    for (let i = 0; i < fillKey.length; i++) if (fillKey[i] !== "0") n++;
    if (P.piece && n > 0) {
      const step = Math.min(pieceW + 6, (T.w - 70) / Math.max(1, n));
      for (let i = 0; i < n; i++) {
        draw(P.piece, T.x + T.w / 2 + (i - (n - 1) / 2) * step - pieceW / 2, T.y + 11 - pieceH, pieceW, pieceH);
      }
    }

    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const lvl = (L.from[i] ?? 0) + ((L.to[i] ?? 0) - (L.from[i] ?? 0)) * ease;
      const flicker = 0.92 + 0.05 * Math.sin(time * 5.1 + i * 1.7) + 0.03 * Math.sin(time * 13 + i);
      // the beam from the lamp, and its pool on the boards
      if (lvl > 0.01) {
        const pw = s.size * 1.9;
        const ph = s.size * 0.5;
        P.poolPaint.setAlphaf(Math.min(1, lvl * flicker));
        const top = s.lantern.y + lh * 0.8;
        draw(P.beam[s.row], s.x - s.size * 0.75, top, s.size * 1.5, s.y - top, P.poolPaint);
        draw(P.pool[s.row], s.x - pw / 2, s.y - ph * 0.55, pw, ph, P.poolPaint);
      }
      if (fillKey[i] === "0") {
        draw(P.empty[s.row], s.x - s.size / 2, s.y - s.size * 1.3 * FEET, s.size, s.size * 1.3);
      } else if (fillKey[i] === "1") {
        const pw = s.size + (s.row ? 14 : 12);
        draw(P.plate[s.row], s.x - pw / 2, s.y + 1, pw, PLATE_H);
      }
    }

    // the lamps, swaying on their cords; lit ones glow
    const top = beam.y + beam.h;
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const lvl = (L.from[i] ?? 0) + ((L.to[i] ?? 0) - (L.from[i] ?? 0)) * ease;
      const cord = s.lantern.y - top;
      c.save();
      c.translate(s.lantern.x, top);
      c.rotate(Math.sin(time * 0.8 + i * 1.9) * 1.8, 0, 0);
      c.drawLine(0, 0, 0, cord + 2, P.cord);
      if (lvl > 0.01) {
        const g = GLOW * (0.85 + 0.15 * lvl);
        P.glowPaint.setAlphaf(Math.min(1, lvl * (0.9 + 0.1 * Math.sin(time * 4.3 + i))));
        draw(P.glow, -g / 2, cord + lh * 0.45 - g / 2, g, g, P.glowPaint);
      }
      draw(P.out, -lw / 2, cord, lw, lh);
      if (lvl > 0.01) {
        P.litPaint.setAlphaf(Math.min(1, lvl));
        draw(P.lit, -lw / 2, cord, lw, lh, P.litPaint);
      }
      c.restore();
    }
    return rec.finishRecordingAsPicture();
  }, [parts, fillKey, spots, w, h, lw, lh, pieceW, pieceH]);

  // the back row stands behind the front
  const order = spots
    .map((s, i) => ({ s, i, p: seated[i] }))
    .filter((e): e is { s: Spot; i: number; p: RoomPerson } => e.p !== undefined)
    .sort((a, b) => a.s.y - b.s.y);
  const doorAt = { x: (O.x + O.w / 2) * k, y: (R.floorY + 2) * k };
  const back = spots.find((s) => s.row === 0) ?? spots[0];
  // a spot where it is on the screen
  const on = (s: Spot): Spot => ({ ...s, x: s.x * k, y: s.y * k, size: s.size * k });

  return (
    <View style={{ width: w * k, height: h * k }}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Group transform={[{ scale: k }]}>
          {room ? <SkImg image={room} x={0} y={0} width={w} height={h} /> : null}
          <Picture picture={picture} />
        </Group>
      </Canvas>
      {spots.map(on).map((s, i) =>
        seated[i] ? null : (
          <Pressable
            key={`e${i}`}
            accessibilityRole="button"
            accessibilityLabel={t("lobby.inviteFriends")}
            onPress={() => {
              tapHaptic();
              onEmpty();
            }}
            style={[styles.abs, { left: s.x - s.size / 2, top: s.y - s.size * 1.3 * FEET, width: s.size, height: s.size * 1.3 }]}
          />
        ),
      )}
      {order.map(({ s, p }) => (
        <Walker
          key={p.id}
          person={p}
          spot={on(s)}
          from={doorAt}
          fromSize={(back?.size ?? s.size) * 0.82 * k}
          token={walking[p.id]}
          paused={paused}
          onArrived={onArrived}
          onPress={onPerson}
          onHold={onHoldPerson}
        />
      ))}
      {order.map(({ s, p }) =>
        p.id in walking ? null : (
          <PlayerName
            key={`n${p.id}`}
            name={p.bot && !/^🤖/u.test(p.name) ? `🤖 ${p.name}` : p.name}
            style={[
              styles.name,
              p.ready || p.host ? styles.nameLit : null,
              p.me ? styles.nameMe : null,
              { left: (s.x - plateW(s) / 2) * k + 4, top: (s.y + 1 + PLATE_H / 2) * k - 6.5, width: plateW(s) * k - 8 },
            ]}
          />
        ),
      )}
    </View>
  );
});

/** Someone standing on their spot; a new arrival walks out of the lift
 *  door to it first (smaller at the door, further back), waddling. */
const Walker = memo(function Walker({
  person,
  spot,
  from,
  fromSize,
  token,
  paused,
  onArrived,
  onPress,
  onHold,
}: {
  person: RoomPerson;
  spot: Spot;
  from: { x: number; y: number };
  fromSize: number;
  token: number | undefined;
  paused: boolean;
  onArrived: (id: string) => void;
  onPress: (person: RoomPerson) => void;
  onHold?: (person: RoomPerson) => void;
}) {
  const { x, y, size } = spot;
  const height = size * 1.3;
  const walk = useSharedValue(token === undefined ? 1 : 0);
  const lit = person.ready || person.host;
  const shade = useSharedValue(lit ? 1 : 0.78);
  useEffect(() => {
    shade.set(withTiming(lit ? 1 : 0.78, { duration: 380 }));
  }, [lit, shade]);
  const id = person.id;
  useEffect(() => {
    if (token === undefined) return;
    walk.set(0);
    walk.set(
      withDelay(
        WALK_DELAY,
        withTiming(1, { duration: WALK_MS, easing: Easing.linear }, (done) => {
          if (done) scheduleOnRN(onArrived, id);
        }),
      ),
    );
    return () => cancelAnimation(walk);
  }, [token, walk, onArrived, id]);
  const s0 = fromSize / size;
  const style = useAnimatedStyle(() => {
    const p = walk.get();
    // out of the door first, then across to the spot
    const py = 1 - (1 - p) * (1 - p);
    const px = p < 0.15 ? 0 : (p - 0.15) / 0.85;
    const ex = px * px * (3 - 2 * px);
    const steps = p < 1 ? Math.sin(p * Math.PI * 9) * (1 - p * 0.6) : 0;
    const cx = from.x + (x - from.x) * ex;
    const cy = from.y + (y - from.y) * py;
    return {
      opacity: p <= 0 ? 0 : shade.get() * Math.min(1, p * 8),
      transform: [
        { translateX: cx - size / 2 },
        { translateY: cy - height * FEET - Math.abs(steps) * 4 },
        { scale: s0 + (1 - s0) * py },
        { rotate: `${steps * 6}deg` },
      ],
    };
  });
  const crown = Math.max(15, size * 0.3);
  const top = (topOf(person.look) / BOX[1]) * height;
  return (
    <Animated.View style={[styles.walker, { width: size, height, transformOrigin: [size / 2, height * FEET, 0] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={person.name}
        accessibilityState={{ selected: lit }}
        onPress={() => onPress(person)}
        onLongPress={onHold ? () => onHold(person) : undefined}
        delayLongPress={450}
        hitSlop={4}
        style={StyleSheet.absoluteFill}
      >
        <MascotFigure look={person.look} width={size} seed={person.id} paused={paused} />
      </Pressable>
      {person.host ? (
        <View style={[styles.crown, { top: top - crown * 0.78 }]} pointerEvents="none">
          <Emblem emoji="👑" size={crown} />
        </View>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  abs: { position: "absolute" },
  walker: { position: "absolute", left: 0, top: 0 },
  crown: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  name: {
    position: "absolute",
    height: 13,
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 13,
    color: "#C8C2B0",
  },
  nameLit: { color: "#FFF2D8", fontFamily: fontFamily.bold },
  nameMe: { color: "#F7C948", fontFamily: fontFamily.bold },
});
