// The room the player stands in, seen flat on: a stage set like the table
// lobby's room (features/lobby/floor), so the lift, the lobby and the
// game's rooms are one world. Its still art is baked once into one image
// (flatRooms/<room>.ts); over it one picture a frame draws what lives —
// the candle flames and their glow, the moonlight through the window, the
// lightning in it, the room's working object (the study's ledger) waiting
// to be read and answering a touch, the seal of the mission room under
// your feet, the name plates. The watchers stand on the boards as their
// own mascots (MascotFigure: still canvases moved by native transforms),
// two staggered rows past five; a stranger in the dark is a shadow. The
// night's weather lies over it all (the iso kit's Fog, Darkness, Flash,
// Dust, Vignette). The four ways out: two doors in the back wall and an
// archway in each side wall, each named on a plate in its room's colour.
//
// Every room drawn flat on is one FlatRoomDef (flatRooms/types.ts: its
// plan, still art, working object and live parts), listed in
// flatRooms/index.ts. Same props as the iso RoomScene, which it falls
// back to for the rooms not yet drawn flat.

import { BlendMode, Canvas, Image as SkImg, PaintStyle, Picture, Skia, type SkImage } from "@shopify/react-native-skia";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, AppState, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { bakedSvg } from "@/components/badges/bake";
import { Burst, Darkness, Dust, Flash, Fog, Vignette, useIsoClock } from "@/components/iso";
import { AppText } from "@/components/ui";
import { PlayerName } from "@/features/game/stage/PlayerName";
import { glowArt, plateArt } from "@/features/lobby/floor/art";
import { MascotFigure } from "@/features/mascot/MascotStage";
import type { Look } from "@/features/mascot/dress";
import { BOX } from "@/features/mascot/rig";
import { fontFamily, useTheme } from "@/theme";
import { heavyHaptic, successHaptic, tapHaptic, tickHaptic } from "@/utils/haptics";
import { ROOMS, ROOM_COLOR } from "../logic";
import { doorBetween } from "../manorShapes";
import { RoomScene, type RoomSceneProps } from "../RoomScene";
import type { Payoff, Side } from "../roomScenes";
import { FLAT_ROOMS } from "./flatRooms";
import type { Box, FlatExit, FlatFlame, FlatFrame, FlatRoomDef } from "./flatRooms/types";
import { NOTEBOOK_GLINT, keepHit } from "./keepsakes";
import { exitFoot, exitPlate, flatLayout, type FlatLayout, type Spot } from "./layout";
import { flameArt, sealArt, shadowArt } from "./parts";

/** Where the feet are in the mascot's box, as a share of its height. */
const FEET = 118.4 / BOX[1];
const PLATE_H = 17;
const GLOW = 120;
const HALO = "#FFE3A8";
const PAPER = "#E9E2CF";
const COLS = 3;
const NO_DOORS: number[][] = [];
const SCREENS = 4;
/** The satchel's red dot (Dock). */
const DOT = "#D8283C";
const DOT_RIM = "#3A0408";

/** How using the room feels in the hand (as the iso room). */
function feel(haptic: Payoff["haptic"]) {
  const later = (fn: () => void, ms: number) => setTimeout(fn, ms);
  switch (haptic) {
    case "ring":
      heavyHaptic();
      [220, 440, 660].forEach((ms) => later(tickHaptic, ms));
      break;
    case "bless":
      successHaptic();
      break;
    case "thud":
      heavyHaptic();
      break;
    case "clink":
      tickHaptic();
      later(tickHaptic, 90);
      break;
    case "ripple":
      [0, 140, 280].forEach((ms) => later(tickHaptic, ms));
      break;
    default:
      tapHaptic();
  }
}

const plateW = (s: Spot) => {
  "worklet";
  return Math.round(s.size + (s.row ? 14 : 12));
};

/** The ways out of a room, by side, as tonight has them. */
function exitsOf(room: number, collapsed: number[], lockedDoor: number[] | null) {
  const col = room % COLS;
  const row = Math.floor(room / COLS);
  const next: Record<Side, number | null> = {
    left: col > 0 ? room - 1 : null,
    right: row > 0 ? room - COLS : null,
    frontRight: col < COLS - 1 ? room + 1 : null,
    frontLeft: row < COLS - 1 ? room + COLS : null,
  };
  return (Object.keys(next) as Side[])
    .filter((side) => next[side] !== null)
    .map((side) => {
      const other = next[side] as number;
      return {
        side,
        room: other,
        door: doorBetween(room, other, collapsed, lockedDoor),
        color: ROOM_COLOR[ROOMS[other]],
      };
    });
}

export function FlatRoom(props: RoomSceneProps) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const def = FLAT_ROOMS[ROOMS[props.room]];
  if (!def) return <RoomScene {...props} />;
  return (
    <View
      style={styles.fill}
      onLayout={(event) => {
        const w = Math.round(event.nativeEvent.layout.width);
        const h = Math.round(event.nativeEvent.layout.height);
        setBox((b) => (b && b.w === w && b.h === h ? b : { w, h }));
      }}
    >
      {box && box.w > 100 && box.h > 260 ? <FlatScene key={def.id} {...props} def={def} w={box.w} h={box.h} /> : null}
    </View>
  );
}

const sway = Easing.inOut(Easing.sin);
const glide = (value: number, duration: number) => withTiming(value, { duration, easing: sway });

function FlatScene({
  def,
  room,
  active,
  onTouch,
  touchLabel,
  people,
  missionRoom,
  nextMissionRoom,
  collapsed,
  lockedDoor,
  roomName,
  onExit,
  event = null,
  paused = false,
  secretDoors = NO_DOORS,
  arrival,
  onArrived,
  mascots,
  book,
  map: mapTool,
  notebook: noteTool,
  w,
  h,
}: RoomSceneProps & { def: FlatRoomDef; w: number; h: number }) {
  const { colors } = useTheme();
  // the server sends new copies of these arrays with every update
  const walls = JSON.stringify([collapsed, lockedDoor]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `walls` stands for both
  const exits = useMemo(() => exitsOf(room, collapsed, lockedDoor), [room, walls]);
  const drawn: FlatExit[] = useMemo(() => exits.map(({ side, door, color }) => ({ side, door, color })), [exits]);
  const standing = people.slice(0, 10);
  const L = useMemo(() => flatLayout(w, h, standing.length), [w, h, standing.length]);
  const P = useMemo(() => def.plan(L, drawn), [def, L, drawn]);
  const doorsKey = drawn.map((e) => `${e.side}:${e.door}`).join(",");
  const art = bakedSvg(`flat-${def.id}|${doorsKey}`, w, h, () => def.art(L, P, drawn));
  const motion = useMemo(() => def.motion(P), [def, P]);

  // who stands where: you in the middle of the front row, the others
  // filling the front, then the row behind
  const places = useMemo(() => {
    const front = L.spots.map((s, i) => ({ s, i })).filter((e) => e.s.row === 1);
    const mid = front[Math.floor((front.length - 1) / 2)]?.i ?? 0;
    return [mid, ...L.spots.map((_, i) => i).filter((i) => i !== mid)];
  }, [L]);
  const meIndex = standing.findIndex((p) => p.kind === "me");
  const order = standing.map((_, i) => i);
  if (meIndex > 0) order.unshift(...order.splice(meIndex, 1));
  const placed = order.map((pi, k) => ({ person: standing[pi], spot: L.spots[places[k]] })).filter((e) => e.spot);
  const me = placed.find((e) => e.person.kind === "me");
  // the board hands an arrival only while you're walking in
  const walking = arrival !== undefined;
  const shadowKey = placed.map((e) => (e.person.kind === "shadow" ? 1 : 0)).join("");
  const spotKey = placed.map((e) => `${e.spot.x},${e.spot.y},${e.spot.size}`).join("|");

  const [still, setStill] = useState(false);
  const [away, setAway] = useState(AppState.currentState !== "active");
  const resting = paused || away;
  const clock = useIsoClock(resting || still);
  const flash = useSharedValue(0);
  const burst = useSharedValue(1);
  const echo = useSharedValue(1);
  const act = useSharedValue(0);
  const beckon = useSharedValue(0);
  const touched = useSharedValue(1);
  const enter = useSharedValue(1);
  // the map and the notebook lift a little when tapped
  const mapLift = useSharedValue(0);
  const noteLift = useSharedValue(0);

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      ?.then((on) => {
        if (live && on) setStill(true);
      })
      .catch(() => {});
    const watch = AppState.addEventListener("change", (status) => setAway(status !== "active"));
    return () => {
      live = false;
      watch.remove();
    };
  }, []);

  // walking into the room: it comes up out of the dark
  useEffect(() => {
    if (still) return;
    enter.set(0);
    enter.set(withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [room, still, enter]);

  // a storm: lightning in the window now and then, felt as well as seen
  useEffect(() => {
    if (event !== "storm" || resting || still) return;
    let timer: ReturnType<typeof setTimeout>;
    const strike = () => {
      timer = setTimeout(
        () => {
          flash.set(
            withSequence(
              withTiming(1, { duration: 60 }),
              withTiming(0.25, { duration: 90 }),
              withTiming(0.85, { duration: 50 }),
              withTiming(0, { duration: 650 }),
            ),
          );
          heavyHaptic();
          strike();
        },
        2500 + Math.random() * 5000,
      );
    };
    strike();
    return () => clearTimeout(timer);
  }, [event, resting, still, flash]);

  // an echoing night: the room rings faintly now and then
  useEffect(() => {
    if (event !== "echo" || resting || still) return;
    const ring = setInterval(() => {
      echo.set(0);
      echo.set(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }));
    }, 5200);
    return () => clearInterval(ring);
  }, [event, resting, still, echo]);

  // while the object can be used it glows, and stirs
  useEffect(() => {
    if (!active || still || resting) return;
    beckon.set(0);
    beckon.set(withRepeat(withSequence(glide(0.1, 1300), glide(0, 1300)), -1));
    return () => {
      cancelAnimation(beckon);
      beckon.set(0);
    };
  }, [active, still, resting, beckon]);

  const press = () => {
    if (active) feel(def.payoff.haptic);
    if (!still) {
      // the object answers: it lifts, or swings (ringing on and dying
      // away), and a burst of its light
      act.set(
        motion.kind === "swing" && motion.ring
          ? withSequence(glide(1, 380), glide(-0.75, 620), glide(0.5, 560), glide(-0.28, 500), glide(0.1, 440), glide(0, 380))
          : withSequence(glide(1, 280), glide(1, 520), glide(0, 420)),
      );
      touched.set(0);
      touched.set(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }));
      if (active) {
        burst.set(0);
        burst.set(withTiming(1, { duration: 900, easing: Easing.linear }));
      }
    }
    if (active) onTouch();
  };

  const sealed = missionRoom === room;
  // a secret door glows in the corner that leads to its room
  const passages = secretDoors
    .filter((door) => door.includes(room))
    .map((door) => {
      const other = door[0] === room ? door[1] : door[0];
      const right = other % COLS > room % COLS;
      return L.at(right ? L.bx1 - 8 : L.bx0 + 8, L.floorY, 26);
    });
  const passageKey = passages.map((p) => p.join(",")).join("|");

  const prop = P.prop;
  const spot = P.touch ?? { x: prop.x + prop.w / 2, y: prop.y + prop.h / 2, rx: prop.w * 0.66, ry: prop.h * 0.78 };
  const burstAt = def.payoff.at ? def.payoff.at(P) : [spot.x, spot.y];
  const bookOn = book && P.book ? P.book : null;
  const unread = bookOn !== null && !!book?.unread;
  const mapOn: Box | null = mapTool && P.map && def.mapArt ? P.map : null;
  const noteOn: Box | null = noteTool && P.notebook && def.notebookArt ? P.notebook : null;
  const noteDot = noteOn !== null && !!noteTool?.unseen;
  const parts = useMemo(() => {
    const rows = [0, 1].map((row) => L.spots.find((s) => s.row === row)).filter((s): s is Spot => s !== undefined);
    const byRow = (make: (s: Spot) => SkImage | null) => {
      const out: (SkImage | null)[] = [null, null];
      rows.forEach((s) => (out[s.row] = make(s)));
      return out;
    };
    const screen = () => {
      const p = Skia.Paint();
      p.setBlendMode(BlendMode.Screen);
      return p;
    };
    const ring = Skia.Paint();
    ring.setAntiAlias(true);
    ring.setStyle(PaintStyle.Stroke);
    ring.setStrokeWidth(1.3);
    ring.setColor(Skia.Color(HALO));
    const own = def.images ? def.images(L, P) : {};
    const img: Record<string, SkImage | null> = {};
    for (const name of Object.keys(own)) {
      const o = own[name];
      img[name] = bakedSvg(`flat-${def.id}-${name}|${o.key ?? `${doorsKey}|${w}x${h}`}`, o.w, o.h, o.art);
    }
    const fill = Skia.Paint();
    fill.setAntiAlias(true);
    const stroke = Skia.Paint();
    stroke.setAntiAlias(true);
    stroke.setStyle(PaintStyle.Stroke);
    const dot = Skia.Paint();
    dot.setAntiAlias(true);
    dot.setColor(Skia.Color(DOT));
    const dotRim = Skia.Paint();
    dotRim.setAntiAlias(true);
    dotRim.setStyle(PaintStyle.Stroke);
    dotRim.setStrokeWidth(1.5);
    dotRim.setColor(Skia.Color(DOT_RIM));
    const keyed = `${doorsKey}|${w}x${h}`;
    const { mapArt, notebookArt } = def;
    return {
      prop: bakedSvg(`flat-${def.id}-prop`, prop.w, prop.h, () => def.propArt(P)),
      map: P.map && mapArt ? bakedSvg(`flat-${def.id}-map|${keyed}`, P.map.w, P.map.h, () => mapArt(P)) : null,
      note: P.notebook && notebookArt ? bakedSvg(`flat-${def.id}-note|${keyed}`, P.notebook.w, P.notebook.h, () => notebookArt(P)) : null,
      dot,
      dotRim,
      glintPaint: screen(),
      img,
      screens: Array.from({ length: SCREENS }, screen),
      fill,
      stroke,
      flame: bakedSvg("flat-flame", 8, 16, () => flameArt(8, 16)),
      glow: bakedSvg(`lobby-glow|${def.light}`, GLOW, GLOW, () => glowArt(GLOW, def.light)),
      halo: bakedSvg(`lobby-glow|${HALO}`, GLOW, GLOW, () => glowArt(GLOW, HALO)),
      cool: bakedSvg("lobby-glow|#9CB8FF", GLOW, GLOW, () => glowArt(GLOW, "#9CB8FF")),
      seal: bakedSvg(`flat-seal|${colors.danger}`, 160, 160, () => sealArt(160, colors.danger)),
      plate: byRow((s) => bakedSvg("lobby-plate", plateW(s), PLATE_H, () => plateArt(plateW(s), PLATE_H))),
      shadow: byRow((s) => bakedSvg("flat-shadow", s.size, s.size * 1.3, () => shadowArt(s.size))),
      plain: Skia.Paint(),
      lit: Skia.Paint(),
      glowPaint: screen(),
      flamePaint: screen(),
      haloPaint: screen(),
      sealPaint: screen(),
      bookPaint: screen(),
      ring,
    };
  }, [def, L, P, prop.w, prop.h, doorsKey, w, h, colors.danger]);
  const under = def.under;
  const onProp = def.onProp;

  const picture = useDerivedValue(() => {
    const time = clock.get();
    const rec = Skia.PictureRecorder();
    const c = rec.beginRecording(Skia.XYWHRect(0, 0, w, h));
    const X = parts;
    const draw = (img: SkImage | null, x: number, y: number, dw: number, dh: number, paint = X.plain) => {
      if (img) c.drawImageRect(img, Skia.XYWHRect(0, 0, img.width(), img.height()), Skia.XYWHRect(x, y, dw, dh), paint);
    };

    const v = act.get() + beckon.get();
    const fx: FlatFrame = {
      c,
      time,
      draw,
      img: X.img,
      screen: X.screens,
      fill: X.fill,
      stroke: X.stroke,
      flash: flash.get(),
      move: v,
      touched: touched.get(),
      active,
    };
    // what lives in this room of its own (moonlight, lightning in a window, a rope)
    if (under) under(fx, P);

    // the map and the notebook: still, lifting a little when tapped, a
    // faint glint on each now and then; the notebook's red dot
    const keep = (img: SkImage | null, b: Box | null, lift: number, gx: number, gy: number, phase: number, dot: boolean) => {
      if (!img || !b) return;
      const ax = b.x + b.w / 2;
      const ay = b.y + b.h;
      c.save();
      if (lift > 0.001) {
        c.translate(ax, ay - 2.5 * lift);
        c.scale(1 + 0.05 * lift, 1 + 0.05 * lift);
        c.translate(-ax, -ay);
      }
      draw(img, b.x, b.y, b.w, b.h);
      const p = (time + phase) % 7.5;
      if (p < 0.8) {
        X.glintPaint.setAlphaf(0.5 * Math.sin((p / 0.8) * Math.PI));
        draw(X.halo, b.x + b.w * gx - 7, b.y + b.h * gy - 7, 14, 14, X.glintPaint);
      }
      if (dot) {
        c.drawCircle(b.x + b.w - 2, b.y + 3, 4.2, X.dot);
        c.drawCircle(b.x + b.w - 2, b.y + 3, 4.2, X.dotRim);
      }
      c.restore();
    };
    keep(X.map, mapOn, mapLift.get(), 0.2, 0.22, 0, false);
    keep(X.note, noteOn, noteLift.get(), NOTEBOOK_GLINT[0], NOTEBOOK_GLINT[1], 3.6, noteDot);

    // a secret door's cold glow in its corner
    for (let i = 0; i < passages.length; i++) {
      const [px, py] = passages[i];
      X.glowPaint.setAlphaf(0.5 + 0.2 * Math.sin(time * 1.3 + i));
      draw(X.cool, px - 40, py - 40, 80, 80, X.glowPaint);
    }

    // the seal of the mission under your feet, turning slowly
    if (sealed && me) {
      const s = me.spot;
      const r = s.size * 1.15;
      X.sealPaint.setAlphaf(0.85 + 0.15 * Math.sin(time * 1.8));
      c.save();
      c.translate(s.x, s.y - 2);
      c.scale(1, 0.3);
      c.rotate(time * 14, 0, 0);
      draw(X.seal, -r, -r, r * 2, r * 2, X.sealPaint);
      c.restore();
    }

    // the candles: a warm halo each, flames licking
    const candles = (flames: FlatFlame[], from: number) => {
      for (let j = 0; j < flames.length; j++) {
        const fm = flames[j];
        const i = j + from;
        const flick = 0.9 + 0.06 * Math.sin(time * 5.3 + i * 1.9) + 0.04 * Math.sin(time * 13.1 + i * 2.3);
        const g = 54 * fm.s * (0.92 + 0.08 * flick);
        X.glowPaint.setAlphaf(0.5 * flick);
        draw(X.glow, fm.x - g / 2, fm.y + 5 - g / 2, g, g, X.glowPaint);
        const fw = 5.6 * fm.s;
        const fh = 11.5 * fm.s * (0.9 + 0.12 * Math.sin(time * 7.7 + i * 3.1));
        c.save();
        c.translate(fm.x, fm.y + 11 * fm.s);
        c.skew(0.12 * Math.sin(time * 2.9 + i), 0);
        X.flamePaint.setAlphaf(1);
        draw(X.flame, -fw / 2, -fh, fw, fh, X.flamePaint);
        c.restore();
      }
    };
    candles(P.flames, 0);

    // a book to read: a soft glow round it until it has been
    if (unread && bookOn) {
      const beat = 0.5 + 0.5 * Math.sin((time * Math.PI * 2) / 2.4);
      const r = bookOn.r * 2.2;
      X.bookPaint.setAlphaf(0.25 + 0.4 * beat);
      draw(X.halo, bookOn.x - r, bookOn.y - r, r * 2, r * 2, X.bookPaint);
    }

    // the working object: glowing while it waits, answering a touch
    if (active) {
      const beat = 0.5 + 0.5 * Math.sin((time * Math.PI * 2) / 1.8);
      const r = spot.rx * 1.44;
      X.haloPaint.setAlphaf(0.3 + 0.45 * beat);
      draw(X.halo, spot.x - r, spot.y - r * 0.8, r * 2, r * 1.6, X.haloPaint);
      X.ring.setAlphaf(0.35 + 0.55 * beat);
      c.drawOval(Skia.XYWHRect(spot.x - spot.rx, spot.y - spot.ry, spot.rx * 2, spot.ry * 2), X.ring);
    }
    c.save();
    if (motion.kind === "swing") {
      c.translate(motion.x, motion.y);
      c.rotate(motion.degrees * v, 0, 0);
      c.translate(-motion.x, -motion.y);
    } else {
      const fx0 = prop.x + prop.w / 2;
      const fy0 = prop.y + prop.h;
      c.translate(fx0, fy0 - motion.lift * v);
      c.scale(1 + motion.scale * v, 1 + motion.scale * v);
      c.translate(-fx0, -fy0);
    }
    draw(X.prop, prop.x, prop.y, prop.w, prop.h);
    if (P.propFlames) candles(P.propFlames, P.flames.length);
    if (onProp) onProp(fx, P);
    c.restore();

    // shadows in the dark, and every name plate
    for (let i = 0; i < placed.length; i++) {
      const { person, spot: s } = placed[i];
      if (shadowKey[i] === "1")
        draw(X.shadow[s.row], s.x - s.size / 2, s.y - s.size * 1.3 * FEET, s.size, s.size * 1.3);
      if (person.kind === "me" && walking) continue;
      const pw = plateW(s);
      draw(X.plate[s.row], s.x - pw / 2, s.y + 1, pw, PLATE_H);
    }
    return rec.finishRecordingAsPicture();
  }, [parts, P, motion, w, h, active, unread, sealed, passageKey, spotKey, shadowKey, walking, mapOn, noteOn, noteDot]);

  // the payoff's glow and the night's weather, over the room
  const lantern = me ? { x: me.spot.x, y: me.spot.y - me.spot.size * 0.7 } : { x: w / 2, y: h * 0.75 };
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.get(),
    transform: [{ translateY: (1 - enter.get()) * -6 }],
  }));

  const exitLabel = (e: (typeof exits)[number]): { text: string; color: string } => {
    const name = roomName(e.room);
    const text =
      e.door !== "open"
        ? `✕ ${name}`
        : e.room === missionRoom
          ? `■ ${name}`
          : e.room === nextMissionRoom
            ? `□ ${name}`
            : name;
    const color =
      e.door !== "open"
        ? "#8A93B5"
        : e.room === missionRoom
          ? colors.danger
          : e.room === nextMissionRoom
            ? colors.info
            : e.color;
    return {
      text: e.side === "frontLeft" ? `‹ ${text}` : e.side === "frontRight" ? `${text} ›` : text,
      color,
    };
  };
  const reach = Math.max(spot.rx * 1.14, 44);
  // the map or the notebook tapped: it lifts, and opens what the satchel does
  const openKeep = (lift: typeof mapLift, open: () => void) => {
    if (!still) lift.set(withSequence(withTiming(1, { duration: 110 }), glide(0, 280)));
    open();
  };

  return (
    <Animated.View style={[{ width: w, height: h }, enterStyle]}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {art ? <SkImg image={art} x={0} y={0} width={w} height={h} /> : null}
        <Picture picture={picture} />
        <Burst
          spec={{ ...def.payoff.burst, x: burstAt[0], y: burstAt[1] }}
          progress={burst}
        />
        {event === "insomnia" ? <Vignette width={w} height={h} color="#7C5CFF" clock={clock} /> : null}
        {event === "echo" ? (
          <Burst
            spec={{
              kind: "ripples",
              x: w / 2,
              y: (L.floorY + h) / 2,
              size: w * 0.3,
              color: "#B9A8FF",
              duration: 2600,
              strength: 0.45,
            }}
            progress={echo}
          />
        ) : null}
        {event === "fog" ? <Fog x={0} y={L.floorY - 70} width={w} height={h - L.floorY + 70} clock={clock} /> : null}
        {event === "collapse" ? <Dust x={0} y={0} width={w} height={h} clock={clock} /> : null}
      </Canvas>

      {/* the watchers, the back row behind the front */}
      {[...placed]
        .filter((e) => e.person.kind !== "shadow" && mascots?.[e.person.key])
        .sort((a, b) => a.spot.y - b.spot.y)
        .map(({ person, spot }) => (
          <Figure
            key={person.key}
            look={mascots?.[person.key] as Look}
            seed={person.key === "me" ? "me" : person.key}
            spot={spot}
            from={person.kind === "me" && arrival ? entryOf(L, room, arrival.from, arrival.how) : null}
            token={person.kind === "me" ? arrival?.key : undefined}
            paused={resting || still}
            still={still}
            onArrived={person.kind === "me" ? onArrived : undefined}
          />
        ))}

      {/* the dark and the flash lie over the watchers too */}
      {event === "blackout" || event === "storm" ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {event === "storm" ? <Flash width={w} height={h} flash={flash} /> : null}
          {event === "blackout" ? (
            <Darkness x={lantern.x} y={lantern.y} radius={w * 0.3} width={w} height={h} clock={clock} />
          ) : null}
        </Canvas>
      ) : null}

      {placed.map(({ person, spot: s }) =>
        person.kind === "me" && walking ? null : (
          <PlayerName
            key={`n${person.key}`}
            name={person.label}
            style={[
              styles.name,
              {
                color: person.kind === "me" ? colors.primary : person.kind === "shadow" ? "#8A93B5" : PAPER,
              },
              {
                left: s.x - plateW(s) / 2 + 4,
                top: s.y + 1 + PLATE_H / 2 - 6.5,
                width: plateW(s) - 8,
              },
            ]}
          />
        ),
      )}

      {exits.map((e) => {
        const p = exitPlate(L, e.side);
        const label = exitLabel(e);
        return (
          <View
            key={`p${e.side}`}
            pointerEvents="none"
            style={[
              styles.plate,
              {
                left: p.x - p.w / 2 + 3,
                top: p.y - p.h / 2,
                width: p.w - 6,
                height: p.h,
              },
            ]}
          >
            <AppText numberOfLines={1} style={[styles.plateText, { color: label.color }]}>
              {label.text}
            </AppText>
          </View>
        );
      })}

      {exits.flatMap((e) =>
        exitBoxes(L, e.side).map((box, i) => (
          <Pressable
            key={`x${e.side}${i}`}
            accessible={i === 0}
            accessibilityRole="button"
            accessibilityLabel={roomName(e.room)}
            onPress={() => onExit(e.room)}
            style={[styles.abs, box]}
          />
        )),
      )}
      <Pressable
        accessible={active}
        accessibilityRole="button"
        accessibilityLabel={active ? touchLabel : undefined}
        onPress={press}
        style={[
          styles.abs,
          styles.round,
          {
            left: spot.x - reach,
            top: spot.y - reach * 0.8,
            width: reach * 2,
            height: reach * 1.6,
          },
        ]}
      />
      {book && bookOn ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={book.label}
          onPress={book.onOpen}
          style={[
            styles.abs,
            styles.round,
            { left: bookOn.x - bookOn.r - 8, top: bookOn.y - bookOn.r - 8, width: bookOn.r * 2 + 16, height: bookOn.r * 2 + 16 },
          ]}
        />
      ) : null}
      {/* over the working object's: a tap on them never uses the room */}
      {mapTool && mapOn ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mapTool.label}
          onPress={() => openKeep(mapLift, mapTool.onOpen)}
          style={[styles.abs, keepHit(mapOn, P.mapTap)]}
        />
      ) : null}
      {noteTool && noteOn ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={noteTool.label}
          onPress={() => openKeep(noteLift, noteTool.onOpen)}
          style={[styles.abs, keepHit(noteOn, P.noteTap)]}
        />
      ) : null}
    </Animated.View>
  );
}

/** Where a way out can be tapped: its doorway and its plate. */
function exitBoxes(L: FlatLayout, side: Side) {
  const p = exitPlate(L, side);
  const plate = {
    left: p.x - p.w / 2,
    top: p.y - p.h / 2 - 4,
    width: p.w,
    height: p.h + 8,
  };
  if (side === "left" || side === "right") {
    const D = L.doors[side];
    return [plate, { left: D.x - 6, top: D.y, width: D.w + 12, height: D.h }];
  }
  const A = L.arches[side];
  const wx = A.wall === "left" ? L.bx0 : L.bx1;
  const r = (A.z1 - A.z0) / 2;
  const [x0, top] = L.at(wx, A.spring - r - 6, A.z1);
  const [x1] = L.at(wx, 0, A.z0);
  return [
    plate,
    {
      left: Math.min(x0, x1) - 4,
      top,
      width: Math.abs(x1 - x0) + 8,
      height: L.floorY + 14 - top,
    },
  ];
}

/** Where you come in from, for a move made `how` from room `from`: the
 *  doorway facing it, the corner of a secret door; null when you appear
 *  where you stand (you were already here, or came from afar). */
function entryOf(L: FlatLayout, room: number, from: number, how: string): [number, number] | null {
  const dc = (from % COLS) - (room % COLS);
  const dr = Math.floor(from / COLS) - Math.floor(room / COLS);
  const straight = (dc === 0) !== (dr === 0);
  if (how === "secret") return L.at(dc > 0 ? L.bx1 - 8 : L.bx0 + 8, L.floorY, 26);
  if ((how === "step" || how === "collapse") && straight) {
    const side: Side = dc < 0 ? "left" : dc > 0 ? "frontRight" : dr < 0 ? "right" : "frontLeft";
    return exitFoot(L, side);
  }
  return null;
}

/** Someone standing on their spot, alive; you walk in from the doorway
 *  you came through first (smaller at the door, further back), waddling,
 *  a tick at every step. */
const Figure = memo(function Figure({
  look,
  seed,
  spot,
  from,
  token,
  paused,
  still,
  onArrived,
}: {
  look: Look;
  seed: string;
  spot: Spot;
  from: [number, number] | null;
  token: string | undefined;
  paused: boolean;
  still: boolean;
  onArrived?: () => void;
}) {
  const { x, y, size } = spot;
  const height = size * 1.3;
  const walk = useSharedValue(1);
  const arrived = useRef(onArrived);
  useEffect(() => {
    arrived.current = onArrived;
  });
  const done = () => arrived.current?.();
  useEffect(() => {
    if (token === undefined) return;
    if (still) {
      arrived.current?.();
      return;
    }
    const steps = [180, 420, 660, 900, 1140].map((ms) => setTimeout(tickHaptic, ms));
    walk.set(0);
    walk.set(
      withTiming(1, { duration: from ? 1300 : 600, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) scheduleOnRN(done);
      }),
    );
    return () => {
      steps.forEach(clearTimeout);
      cancelAnimation(walk);
      walk.set(1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one walk per token
  }, [token]);
  const fx = from ? from[0] : x;
  const fy = from ? from[1] : y;
  const s0 = from ? Math.max(0.45, Math.min(1, (fy - (y - height)) / height) * 0.6) : 1;
  const style = useAnimatedStyle(() => {
    const p = walk.get();
    const e = p * p * (3 - 2 * p);
    const steps = p < 1 && from ? Math.sin(p * Math.PI * 8) * (1 - p * 0.5) : 0;
    return {
      opacity: from ? Math.min(1, p * 6) : p,
      transform: [
        { translateX: fx + (x - fx) * e - size / 2 },
        { translateY: fy + (y - fy) * e - height * FEET - Math.abs(steps) * 3 },
        { scale: s0 + (1 - s0) * e },
        { rotate: `${steps * 6}deg` },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.figure, { width: size, height, transformOrigin: [size / 2, height * FEET, 0] }, style]}
    >
      <MascotFigure look={look} width={size} seed={seed} paused={paused} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: "stretch", overflow: "hidden" },
  abs: { position: "absolute" },
  round: { borderRadius: 999 },
  figure: { position: "absolute", left: 0, top: 0 },
  name: {
    position: "absolute",
    height: 13,
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 13,
  },
  plate: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  plateText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
});
