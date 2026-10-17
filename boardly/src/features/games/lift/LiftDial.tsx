// The lift's floor dial, alive (the Games tab): the needle swings to the
// floor the cab is at as it rides, overshooting a little and settling,
// the ruby in its hub glows and flares on arrival, the call button of the
// way it's riding lights amber, a light crosses the dial's gold rim every
// few seconds and glints catch it. Floors whose game doesn't take the
// chosen number of players are darkened. The dial's face and its emblems
// are baked into the page's still art (art.ts, cabArt); each frame is one
// picture of the needle, the hub and the light. Over it, the numbers to
// tap, the page's title, the ride buttons and the players counter.

import { Canvas, Picture, Skia, TileMode, type SkImage } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { AppText } from "@/components/ui";
import { TABLE, fontFamily } from "@/theme";
import { dialRim, HUB, hubArt, NEEDLE_W, needleArt } from "./art";
import { needleAngle, type LiftLayout } from "./layout";

interface Parts {
  needle: SkImage | null;
  hub: SkImage | null;
  len: number;
  rim: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  plain: ReturnType<typeof Skia.Paint>;
  dim: ReturnType<typeof Skia.Paint>;
  star: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  colors: { sweep: Float32Array[]; ruby: Float32Array[]; amber: Float32Array[] };
}

function makeParts(L: LiftLayout): Parts {
  const len = L.R - 24;
  const dim = Skia.Paint();
  dim.setAntiAlias(true);
  dim.setColor(Skia.Color("#05070C"));
  dim.setAlphaf(0.66);
  return {
    needle: bakedSvg(`lift-needle|${len}`, NEEDLE_W, len + 18, () => needleArt(len)),
    hub: bakedSvg("lift-hub", HUB, HUB, hubArt),
    len,
    rim: Skia.Path.MakeFromSVGString(dialRim(L)),
    plain: Skia.Paint(),
    dim,
    star: Skia.Path.MakeFromSVGString("M0 -1Q0.2 -0.2 1 0Q0.2 0.2 0 1Q-0.2 0.2 -1 0Q-0.2 -0.2 0 -1Z"),
    colors: {
      sweep: ["#FFFFFF00", "#FFFFFFC0", "#FFFFFF00"].map((c) => Skia.Color(c)),
      ruby: ["#FF6A7E", "#FF6A7E00"].map((c) => Skia.Color(c)),
      amber: ["#FFE7A0", "#FFB23A", "#FFB23A00"].map((c) => Skia.Color(c)),
    },
  };
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
  /** Each floor: does its game take the chosen number of players? */
  fits: boolean[];
  /** The floor shown now. */
  floor: number;
  /** Players chosen (null: any). */
  count: number | null;
  names: string[];
  onFloor: (i: number) => void;
  onRide: (dir: 1 | -1) => void;
  onCount: (next: number | null) => void;
}

const MIN = 2;
const MAX = 10;

export const LiftDial = memo(function LiftDial({
  L,
  clock,
  pos,
  goal,
  arrived,
  fits,
  floor,
  count,
  names,
  onFloor,
  onRide,
  onCount,
}: LiftDialProps) {
  const { t } = useTranslation();
  const P = useMemo(() => makeParts(L), [L]);
  const n = L.stops.length;
  const fitsKey = fits.map((k) => (k ? 1 : 0)).join("");

  const picture = useDerivedValue(() => {
    const time = clock.get();
    const at = pos.get();
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, L.w, L.headerH));

    // the floors that don't fit, darkened on the dial
    for (let i = 0; i < n; i++) {
      if (fitsKey[i] === "1") continue;
      const s = L.stops[i];
      c.drawCircle(s.emblem.x, s.emblem.y, 15, P.dim);
    }

    // the needle
    if (P.needle) {
      c.save();
      c.translate(L.cx, L.cy);
      c.rotate(needleAngle(at, n, L.span), 0, 0);
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
    const glow = Skia.Paint();
    glow.setShader(Skia.Shader.MakeRadialGradient({ x: L.cx, y: L.cy }, 18, P.colors.ruby, [0, 1], TileMode.Clamp));
    glow.setAlphaf(Math.min(1, 0.28 + 0.12 * Math.sin(time * 1.5) + 0.7 * flare));
    c.drawCircle(L.cx, L.cy, 18, glow);

    // the call button of the way it's riding, lit
    const dir = goal.get() - at;
    // (not while it settles back from the lurch)
    if (Math.abs(dir) > 0.08) {
      const p = L.panels.left;
      const y = dir > 0 ? p.y + 46 : p.y + 84;
      const lamp = Skia.Paint();
      lamp.setShader(Skia.Shader.MakeRadialGradient({ x: p.x + p.w / 2, y }, 14, P.colors.amber, [0, 0.45, 1], TileMode.Clamp));
      lamp.setAlphaf(0.75 + 0.25 * Math.sin(time * 9));
      c.drawCircle(p.x + p.w / 2, y, 14, lamp);
    }

    // the light crossing the rim every six seconds
    if (P.rim) {
      const k = (time % 6) / 1.4;
      if (k < 1) {
        const x = L.cx - L.R - 30 + k * (2 * L.R + 60);
        const sp = Skia.Paint();
        sp.setAntiAlias(true);
        sp.setShader(Skia.Shader.MakeLinearGradient({ x: x - 18, y: L.cy - L.R }, { x: x + 18, y: L.cy - L.R + 30 }, P.colors.sweep, null, TileMode.Clamp));
        c.drawPath(P.rim, sp);
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
        const gp = Skia.Paint();
        gp.setAntiAlias(true);
        gp.setColor(Skia.Color("#FFFFFF"));
        gp.setAlphaf(g);
        c.save();
        c.translate(gx, gy);
        c.scale(gs * (0.3 + g), gs * (0.3 + g));
        c.rotate(time * 40, 0, 0);
        c.drawPath(P.star, gp);
        c.restore();
      }
    }
    return recorder.finishRecordingAsPicture();
  }, [P, L, n, fitsKey]);

  const { left, right } = L.panels;
  const step = (by: number) => {
    if (count === null) onCount(by > 0 ? MIN : MAX);
    else {
      const next = count + by;
      onCount(next < MIN || next > MAX ? null : next);
    }
  };

  return (
    <View style={[styles.wrap, { width: L.w, height: L.headerH }]} pointerEvents="box-none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Picture picture={picture} />
      </Canvas>

      {/* the numbers round the dial, each a way to that floor */}
      {L.stops.map((s, i) => (
        <AppText
          key={`n${i}`}
          pointerEvents="none"
          style={[
            styles.num,
            { left: s.num.x - 14, top: s.num.y - 10 },
            i === floor && styles.numOn,
            !fits[i] && styles.numOff,
          ]}
        >
          {i + 1}
        </AppText>
      ))}
      {L.stops.map((s, i) => (
        <Pressable
          key={`p${i}`}
          accessibilityRole="button"
          accessibilityLabel={t("games.lift.toFloor", { n: i + 1, name: names[i] ?? "" })}
          onPress={() => onFloor(i)}
          style={[
            styles.stop,
            { left: (s.num.x + s.emblem.x) / 2 - 22, top: (s.num.y + s.emblem.y) / 2 - 22 },
          ]}
        />
      ))}

      <View pointerEvents="none" style={[styles.sign, { left: L.sign.x + 4, top: L.sign.y + 4, width: L.sign.w - 8, height: L.sign.h - 8 }]}>
        <AppText style={styles.title} numberOfLines={1}>
          {t("games.title")}
        </AppText>
      </View>

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

      {/* the players counter */}
      <AppText pointerEvents="none" style={[styles.label, { left: right.x, top: right.y + 8, width: right.w }]} numberOfLines={1}>
        {t("games.lift.players")}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("games.lift.more")}
        onPress={() => step(1)}
        style={[styles.knob, { left: right.x + right.w / 2 - 20, top: right.y + 40 - 20 }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("games.lift.anyCount")}
        onPress={() => onCount(null)}
        style={[styles.window, { left: right.x + 8, top: right.y + 56, width: right.w - 16 }]}
      >
        <AppText style={[styles.count, count === null && styles.countAll]} numberOfLines={1}>
          {count === null ? t("games.lift.all") : String(count)}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("games.lift.fewer")}
        onPress={() => step(-1)}
        style={[styles.knob, { left: right.x + right.w / 2 - 20, top: right.y + 94 - 20 }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, top: 0 },
  num: {
    position: "absolute",
    width: 28,
    height: 20,
    textAlign: "center",
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 20,
    color: "#3A2408",
  },
  numOn: { color: "#B01A2E" },
  numOff: { color: "#3A2408", opacity: 0.32 },
  stop: { position: "absolute", width: 44, height: 44, borderRadius: 22 },
  sign: { position: "absolute", alignItems: "center", justifyContent: "center" },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 2.5,
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
  window: { position: "absolute", height: 24, alignItems: "center", justifyContent: "center" },
  count: { fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 20, color: "#3A2408" },
  countAll: { fontSize: 11.5 },
});
