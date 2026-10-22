// The lift's floor dial, alive (the Games tab). It shows one bank of
// floors at a time (banks.ts): the number of each floor on a drum in a
// window round the ring, the floor's emblem inside it, a star by the
// games I play most, the bank's name on the cartouche over the hub and
// its floors on the sign under the dial, a brass stud either side of the
// sign to flip to the bank before or after. Riding into another bank
// turns the dial over like an old odometer: the drums roll one after
// another to the new numbers (a ratchet of clicks), the emblems change
// over, and the needle swings back across. The needle rides with the
// cab, overshooting a little and settling; the ruby in its hub glows and
// flares on arrival; the call button of the way it's riding lights
// amber; a light crosses the gold rim every few seconds and glints catch
// it. Floors whose game doesn't take the chosen number of players are
// darkened. The dial's face is baked into the page's still art (art.ts,
// cabArt) and each bank's emblems into one image (faceArt); each frame is
// one picture over the lettering. Beside it the ride buttons and the way
// to the directory, with the players chosen.

import { Canvas, Picture, Skia, TileMode, type SkImage } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useDerivedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { AppText } from "@/components/ui";
import { TABLE, fontFamily } from "@/theme";
import { DIR_Y, DRUM_H, DRUM_W, dialRim, HUB, hubArt, NEEDLE_W, needleArt } from "./art";
import { BANK_SIZE } from "./banks";
import { DIR_R, STUD_R, needleAngle, type LiftLayout } from "./layout";

interface Parts {
  needle: SkImage | null;
  hub: SkImage | null;
  len: number;
  rim: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  plain: ReturnType<typeof Skia.Paint>;
  was: ReturnType<typeof Skia.Paint>;
  now: ReturnType<typeof Skia.Paint>;
  dim: ReturnType<typeof Skia.Paint>;
  glow: ReturnType<typeof Skia.Paint>;
  lamp: ReturnType<typeof Skia.Paint>;
  sweep: ReturnType<typeof Skia.Paint>;
  glint: ReturnType<typeof Skia.Paint>;
  drum: ReturnType<typeof Skia.Paint>[];
  star: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  colors: { sweep: Float32Array[]; ruby: Float32Array[]; amber: Float32Array[] };
}

/** The dial's paints and still pieces, made once per layout. */
function makeParts(L: LiftLayout): Parts {
  const len = L.R - 24;
  const paint = (color?: string, alpha = 1) => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    if (color) p.setColor(Skia.Color(color));
    p.setAlphaf(alpha);
    return p;
  };
  // the drums' curve: dark at the top and the foot of each window, over
  // the numbers rolling in it
  const shade = ["#3A240890", "#3A240800", "#3A240800", "#3A2408A0"].map((c) => Skia.Color(c));
  const drum = L.stops.map((s) => {
    const p = paint();
    p.setShader(
      Skia.Shader.MakeLinearGradient(
        { x: 0, y: s.num.y - DRUM_H / 2 },
        { x: 0, y: s.num.y + DRUM_H / 2 },
        shade,
        [0, 0.32, 0.66, 1],
        TileMode.Clamp,
      ),
    );
    return p;
  });
  return {
    needle: bakedSvg(`lift-needle|${len}`, NEEDLE_W, len + 18, () => needleArt(len)),
    hub: bakedSvg("lift-hub", HUB, HUB, hubArt),
    len,
    rim: Skia.Path.MakeFromSVGString(dialRim(L)),
    plain: paint(),
    was: paint(),
    now: paint(),
    dim: paint("#05070C", 0.66),
    glow: paint(),
    lamp: paint(),
    sweep: paint(),
    glint: paint("#FFFFFF"),
    drum,
    star: Skia.Path.MakeFromSVGString("M0 -1Q0.2 -0.2 1 0Q0.2 0.2 0 1Q-0.2 0.2 -1 0Q-0.2 -0.2 0 -1Z"),
    colors: {
      sweep: ["#FFFFFF00", "#FFFFFFC0", "#FFFFFF00"].map((c) => Skia.Color(c)),
      ruby: ["#FF6A7E", "#FF6A7E00"].map((c) => Skia.Color(c)),
      amber: ["#FFE7A0", "#FFB23A", "#FFB23A00"].map((c) => Skia.Color(c)),
    },
  };
}

/** The bank the dial is showing, and the one it turned over from. */
export interface DialTurn {
  bank: number;
  /** The bank's first floor and how many it has. */
  start: number;
  size: number;
  /** Which way it turned (1: on up the building). */
  dir: 1 | -1;
  /** The bank's face (its emblems), and the one turned over from. */
  face: SkImage | null;
  was: SkImage | null;
  /** When it turned, on the clock (the faces change over from then). */
  at: number;
}

export interface LiftDialProps {
  L: LiftLayout;
  clock: SharedValue<number>;
  /** Where the cab is (floor index, fractional while riding). */
  pos: SharedValue<number>;
  /** Where it's riding to. */
  goal: SharedValue<number>;
  /** When it last arrived (on the clock). */
  arrived: SharedValue<number>;
  /** The bank the needle is reading: its first floor and size, and the
   *  swing back across when it turns over (0 → 1, from `swingFrom`). */
  bankStart: SharedValue<number>;
  bankSize: SharedValue<number>;
  swing: SharedValue<number>;
  swingFrom: SharedValue<number>;
  turn: DialTurn;
  /** Each floor of the building: does its game take the players chosen? */
  fits: boolean[];
  /** The floor shown now. */
  floor: number;
  /** Players chosen (null: any). */
  count: number | null;
  /** The bank's name, and the floors' names (for the numbers' labels). */
  bankName: string;
  names: string[];
  /** The banks either side, for the studs (null: none that way). */
  prevName: string | null;
  nextName: string | null;
  onFloor: (i: number) => void;
  onRide: (dir: 1 | -1) => void;
  onBank: (dir: 1 | -1) => void;
  onDirectory: () => void;
  /** Words for the sign under the dial in place of the bank's floors
   *  (practice mode: "Practice"). */
  sign?: string;
}

/** How long after the one before each drum starts to roll (ms). */
export const STAGGER = 70;

/** A number rolling into its drum's window from below (or above, riding
 *  down), each drum a beat after the last. */
const rollIn = (dir: number, delay: number) => () => {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: dir * DRUM_H }] },
    animations: {
      transform: [{ translateY: withDelay(delay, withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.8)) })) }],
    },
  };
};
const rollOut = (dir: number, delay: number) => () => {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: 0 }] },
    animations: {
      transform: [{ translateY: withDelay(delay, withTiming(-dir * DRUM_H, { duration: 260, easing: Easing.in(Easing.quad) })) }],
    },
  };
};

export const LiftDial = memo(function LiftDial({
  L,
  clock,
  pos,
  goal,
  arrived,
  bankStart,
  bankSize,
  swing,
  swingFrom,
  turn,
  fits,
  floor,
  count,
  bankName,
  names,
  prevName,
  nextName,
  onFloor,
  onRide,
  onBank,
  onDirectory,
  sign,
}: LiftDialProps) {
  const { t } = useTranslation();
  const P = useMemo(() => makeParts(L), [L]);
  const { start, size } = turn;
  // the floors on this bank that don't fit, by slot
  const dimKey = Array.from({ length: BANK_SIZE }, (_, s) => (s < size && !fits[start + s] ? 1 : 0)).join("");
  const faceX = L.cx - L.R;
  const faceY = L.cy - L.R;

  const picture = useDerivedValue(() => {
    const time = clock.get();
    const at = pos.get();
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, L.w, L.headerH));

    // the bank's emblems, the last bank's fading out as it turns over
    const k = Math.min(1, Math.max(0, (time - turn.at - 0.12) / 0.6));
    const box = Skia.XYWHRect(faceX, faceY, 2 * L.R, L.R);
    if (turn.was && k < 1) {
      P.was.setAlphaf(1 - k);
      c.drawImageRect(turn.was, Skia.XYWHRect(0, 0, turn.was.width(), turn.was.height()), box, P.was);
    }
    if (turn.face) {
      P.now.setAlphaf(k);
      c.drawImageRect(turn.face, Skia.XYWHRect(0, 0, turn.face.width(), turn.face.height()), box, P.now);
    }
    // the floors that don't fit, darkened on the dial
    for (let i = 0; i < BANK_SIZE; i++) {
      if (dimKey[i] !== "1") continue;
      const s = L.stops[i];
      c.drawCircle(s.emblem.x, s.emblem.y, L.emblem * 0.62, P.dim);
    }
    // the drums' curve over their numbers
    for (let i = 0; i < BANK_SIZE; i++) {
      const s = L.stops[i];
      c.drawRect(Skia.XYWHRect(s.num.x - DRUM_W / 2, s.num.y - DRUM_H / 2, DRUM_W, DRUM_H), P.drum[i]);
    }

    // the needle reads the floor within the bank; turning over, it swings
    // back across from where it was
    const last = Math.max(0, bankSize.get() - 1);
    const local = Math.min(last + 0.35, Math.max(-0.35, at - bankStart.get()));
    const sw = swing.get();
    const reading = sw < 1 ? swingFrom.get() + (local - swingFrom.get()) * sw : local;
    if (P.needle) {
      c.save();
      c.translate(L.cx, L.cy);
      c.rotate(needleAngle(reading, BANK_SIZE, L.span), 0, 0);
      c.drawImageRect(
        P.needle,
        Skia.XYWHRect(0, 0, P.needle.width(), P.needle.height()),
        Skia.XYWHRect(-NEEDLE_W / 2, -P.len, NEEDLE_W, P.len + 18),
        P.plain,
      );
      c.restore();
    }
    if (P.hub) {
      c.drawImageRect(P.hub, Skia.XYWHRect(0, 0, P.hub.width(), P.hub.height()), Skia.XYWHRect(L.cx - HUB / 2, L.cy - HUB / 2, HUB, HUB), P.plain);
    }

    // the ruby glows softly, and flares as the cab arrives
    const since = time - arrived.get();
    const flare = since >= 0 && since < 2 ? Math.exp(-since * 2.4) : 0;
    P.glow.setShader(Skia.Shader.MakeRadialGradient({ x: L.cx, y: L.cy }, 18, P.colors.ruby, [0, 1], TileMode.Clamp));
    P.glow.setAlphaf(Math.min(1, 0.28 + 0.12 * Math.sin(time * 1.5) + 0.7 * flare));
    c.drawCircle(L.cx, L.cy, 18, P.glow);

    // the call button of the way it's riding, lit
    const dir = goal.get() - at;
    // (not while it settles back from the lurch)
    if (Math.abs(dir) > 0.08) {
      const p = L.panels.left;
      const y = dir > 0 ? p.y + 46 : p.y + 84;
      P.lamp.setShader(Skia.Shader.MakeRadialGradient({ x: p.x + p.w / 2, y }, 14, P.colors.amber, [0, 0.45, 1], TileMode.Clamp));
      P.lamp.setAlphaf(0.75 + 0.25 * Math.sin(time * 9));
      c.drawCircle(p.x + p.w / 2, y, 14, P.lamp);
    }

    // the light crossing the rim every six seconds
    if (P.rim) {
      const q = (time % 6) / 1.4;
      if (q < 1) {
        const x = L.cx - L.R - 30 + q * (2 * L.R + 60);
        P.sweep.setShader(Skia.Shader.MakeLinearGradient({ x: x - 18, y: L.cy - L.R }, { x: x + 18, y: L.cy - L.R + 30 }, P.colors.sweep, null, TileMode.Clamp));
        c.drawPath(P.rim, P.sweep);
      }
    }

    // glints on the rim's upper left and on the hub
    if (P.star) {
      const glints: [number, number, number, number][] = [
        [L.cx - L.R * 0.62, L.cy - L.R * 0.78, 6, 0],
        [L.cx + L.R * 0.2, L.cy - L.R * 0.98, 4.5, 2.3],
        [L.cx - 4, L.cy - 5, 4, 4.4],
      ];
      for (const [gx, gy, gs, ph] of glints) {
        const g = Math.max(0, Math.sin(time * 1.1 + ph)) ** 8;
        if (g < 0.02) continue;
        P.glint.setAlphaf(g);
        c.save();
        c.translate(gx, gy);
        c.scale(gs * (0.3 + g), gs * (0.3 + g));
        c.rotate(time * 40, 0, 0);
        c.drawPath(P.star, P.glint);
        c.restore();
      }
    }
    return recorder.finishRecordingAsPicture();
  }, [P, L, dimKey, turn, faceX, faceY]);

  const { left, right } = L.panels;
  const range = sign
    ? sign
    : size <= 1
      ? t("games.lift.bankOne", { from: start + 1 })
      : t("games.lift.bankRange", { from: start + 1, to: start + size });

  return (
    <View style={[styles.wrap, { width: L.w, height: L.headerH }]} pointerEvents="box-none">
      {/* the numbers on their drums: blank past the bank's last floor */}
      {L.stops.map((s, i) => {
        const n = i < size ? start + i : -1;
        return (
          <View
            key={`d${i}`}
            pointerEvents="none"
            style={[styles.drum, { left: s.num.x - DRUM_W / 2, top: s.num.y - DRUM_H / 2 }]}
          >
            <Animated.View
              key={`${turn.bank}`}
              entering={rollIn(turn.dir, 60 + (turn.dir > 0 ? i : BANK_SIZE - 1 - i) * STAGGER)}
              exiting={rollOut(turn.dir, (turn.dir > 0 ? i : BANK_SIZE - 1 - i) * STAGGER)}
              style={styles.drumFace}
            >
              <AppText style={[styles.num, n === floor && styles.numOn, n >= 0 && !fits[n] && styles.numOff]}>
                {n >= 0 ? String(n + 1) : "–"}
              </AppText>
            </Animated.View>
          </View>
        );
      })}

      {/* the bank's name over the hub */}
      <View
        pointerEvents="none"
        style={[styles.centre, { left: L.centre.x + 4, top: L.centre.y, width: L.centre.w - 8, height: L.centre.h }]}
      >
        <Animated.View key={`c${turn.bank}`} entering={FadeIn.duration(260).delay(120)} exiting={FadeOut.duration(120)}>
          <AppText style={styles.bankName} numberOfLines={1}>
            {bankName}
          </AppText>
        </Animated.View>
      </View>

      {/* the picture over the lettering: emblems, needle, hub, the light */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          <Picture picture={picture} />
        </Canvas>
      </View>

      {L.stops.map((s, i) =>
        i < size ? (
          <Pressable
            key={`p${i}`}
            accessibilityRole="button"
            accessibilityLabel={t("games.lift.toFloor", { n: start + i + 1, name: names[start + i] ?? "" })}
            onPress={() => onFloor(start + i)}
            style={[styles.stop, { left: (s.num.x + s.emblem.x) / 2 - 22, top: (s.num.y + s.emblem.y) / 2 - 22 }]}
          />
        ) : null,
      )}

      {/* the bank's floors on the sign, the studs either side */}
      <View pointerEvents="none" style={[styles.sign, { left: L.sign.x + 4, top: L.sign.y + 4, width: L.sign.w - 8, height: L.sign.h - 8 }]}>
        <Animated.View key={sign ? "s-sign" : `s${turn.bank}`} entering={FadeIn.duration(220)}>
          <AppText style={styles.title} numberOfLines={1}>
            {range}
          </AppText>
        </Animated.View>
      </View>
      {([-1, 1] as const).map((dir) => {
        const at = dir < 0 ? L.studs.left : L.studs.right;
        const name = dir < 0 ? prevName : nextName;
        return (
          <Pressable
            key={`b${dir}`}
            accessibilityRole="button"
            accessibilityLabel={name ? t(dir < 0 ? "games.lift.prevBank" : "games.lift.nextBank", { name }) : undefined}
            accessibilityState={{ disabled: !name }}
            disabled={!name}
            onPress={() => onBank(dir)}
            style={[styles.knob, { left: at.x - 22, top: at.y - 22, width: 44, height: 44, borderRadius: 22 }]}
          >
            {!name ? <View style={[styles.studOff, { left: 22 - STUD_R, top: 22 - STUD_R }]} /> : null}
          </Pressable>
        );
      })}

      {/* the call buttons: ride up or down a floor */}
      <AppText pointerEvents="none" style={[styles.label, { left: left.x, top: left.y + 8, width: left.w }]} numberOfLines={1}>
        {t("games.lift.ride")}
      </AppText>
      {([1, -1] as const).map((dir) => (
        <Pressable
          key={dir}
          accessibilityRole="button"
          accessibilityLabel={t(dir > 0 ? "games.lift.up" : "games.lift.down")}
          onPress={() => onRide(dir)}
          style={[styles.knob, { left: left.x + left.w / 2 - 20, top: left.y + (dir > 0 ? 46 : 84) - 20 }]}
        />
      ))}

      {/* the way to the directory, the players chosen under it */}
      <AppText pointerEvents="none" style={[styles.label, { left: right.x, top: right.y + 8, width: right.w }]} numberOfLines={1}>
        {t("games.lift.floors")}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("games.lift.allFloors")}
        onPress={onDirectory}
        style={[styles.knob, { left: right.x + right.w / 2 - 22, top: right.y + DIR_Y - 22, width: 44, height: 44, borderRadius: DIR_R + 5 }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={count === null ? t("games.lift.anyCount") : t("games.lift.playersExact", { count })}
        onPress={onDirectory}
        style={[styles.window, { left: right.x + 8, top: right.y + 76, width: right.w - 16 }]}
      >
        <AppText style={[styles.count, count === null && styles.countAll]} numberOfLines={1}>
          {count === null ? t("games.lift.all") : `👥${count}`}
        </AppText>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, top: 0 },
  drum: { position: "absolute", width: DRUM_W, height: DRUM_H, overflow: "hidden" },
  drumFace: { width: DRUM_W, height: DRUM_H, alignItems: "center", justifyContent: "center" },
  num: {
    width: DRUM_W,
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 12.5,
    lineHeight: DRUM_H,
    color: "#3A2408",
  },
  numOn: { color: "#B01A2E" },
  numOff: { opacity: 0.32 },
  centre: { position: "absolute", alignItems: "center", justifyContent: "center" },
  bankName: {
    fontFamily: fontFamily.bold,
    fontSize: 9.5,
    lineHeight: 13,
    letterSpacing: 0.6,
    color: "#3A2408",
    textTransform: "uppercase",
  },
  stop: { position: "absolute", width: 44, height: 44, borderRadius: 22 },
  sign: { position: "absolute", alignItems: "center", justifyContent: "center" },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 13.5,
    lineHeight: 19,
    letterSpacing: 1.6,
    color: "#FFF2D0",
    textTransform: "uppercase",
    textShadowColor: "rgba(40,0,6,0.85)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 1.5,
  },
  label: {
    position: "absolute",
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: TABLE.creamMuted,
    textTransform: "uppercase",
  },
  knob: { position: "absolute", width: 40, height: 40, borderRadius: 20 },
  studOff: {
    position: "absolute",
    width: STUD_R * 2,
    height: STUD_R * 2,
    borderRadius: STUD_R,
    backgroundColor: "rgba(10,6,2,0.55)",
  },
  window: { position: "absolute", height: 24, alignItems: "center", justifyContent: "center" },
  count: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20, color: "#3A2408" },
  countAll: { fontSize: 11.5 },
});
