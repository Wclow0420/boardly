// Tonight's event in the arch: a gold medallion hung in the stone, the
// event's emblem under a glass dome (art.ts, baked once), a light
// crossing the glass now and then and the whole medallion swaying a
// hair on its bail. When the night's event changes, the old emblem rides
// up and out of the glass and the new one comes up behind it, like the
// Games tab's lift passing a floor: past the mark a touch, settling back,
// the medallion swinging as it lands, with a tick. No event: the glass
// stands empty and dim. A garnet on the bezel for each lasting effect of
// an earlier night. One picture a frame; the parts are baked images.

import { Canvas, Picture, Skia, TileMode, type SkImage } from "@shopify/react-native-skia";
import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { bakedSvg } from "@/components/badges/bake";
import { toSvg } from "@/components/engraved/emblem";
import { useIsoClock } from "@/components/iso";
import { useOnScreen } from "@/hooks/useOnScreen";
import { tickHaptic } from "@/utils/haptics";
import type { NightEvent } from "../logic";
import { eventEmblem } from "./emblem";
import { medallionBack, medallionDome, medallionLayout, medallionPips } from "./art";

/** The light crosses the glass once every this many seconds. */
const EVERY = 6.5;

/** An event's emblem baked for a glass of radius `g`. */
function emblemImage(event: NightEvent | null, g: number): SkImage | null {
  if (!event) return null;
  const found = eventEmblem(event);
  if (!found) return null;
  const size = Math.round(g * 2.05);
  return bakedSvg(`nw-event|v2|${event}`, size, size, () => toSvg(found.data, size, found.tint ?? "#FFB45E"));
}

export const EventMedallion = memo(function EventMedallion({
  event,
  lasting,
  R,
  x,
  y,
  label,
  onPress,
  paused = false,
  delay = 0,
}: {
  event: NightEvent | null;
  /** How many lasting effects of earlier nights (a pip each, up to 3). */
  lasting: number;
  /** The bezel's outer radius. */
  R: number;
  /** Where the bezel's centre sits, in the header. */
  x: number;
  y: number;
  label: string;
  onPress: () => void;
  paused?: boolean;
  /** How long a change of event waits before it rides in (ms). */
  delay?: number;
}) {
  const M = medallionLayout(R);
  const reduced = useReducedMotion();
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen || reduced);

  // the two floors on the strip: what was showing and what's coming
  const [strip, setStrip] = useState<{ from: NightEvent | null; to: NightEvent | null; n: number }>(() => ({
    from: event,
    to: event,
    n: 0,
  }));
  if (strip.to !== event) setStrip({ from: strip.to, to: event, n: strip.n + 1 });
  const pos = useSharedValue(1);
  const swing = useSharedValue(0);
  // the emblems on the strip, handed to the frame with the ride that
  // carries them (so neither shows a frame early)
  const g0 = M.g;
  const shelf = useSharedValue(
    (() => {
      const img = emblemImage(event, g0);
      return { from: img, to: img, fromEmpty: event === null, toEmpty: event === null };
    })(),
  );
  useEffect(() => {
    if (!strip.n) return;
    shelf.set({
      from: emblemImage(strip.from, g0),
      to: emblemImage(strip.to, g0),
      fromEmpty: strip.from === null,
      toEmpty: strip.to === null,
    });
    pos.set(0);
    if (reduced) {
      pos.set(withDelay(delay, withTiming(1, { duration: 260 }, (done) => done && scheduleOnRN(tickHaptic))));
      return;
    }
    const ride = 560;
    pos.set(
      withDelay(
        delay,
        withSequence(
          withTiming(1.07, { duration: ride, easing: Easing.inOut(Easing.cubic) }, (done) => {
            if (done) scheduleOnRN(tickHaptic);
          }),
          withSpring(1, { damping: 8, stiffness: 240, mass: 0.7 }),
        ),
      ),
    );
    swing.set(
      withDelay(
        delay + ride - 40,
        withSequence(withTiming(0.07, { duration: 120 }), withSpring(0, { damping: 3.5, stiffness: 80 })),
      ),
    );
  }, [strip.n, strip.from, strip.to, g0, reduced, delay, pos, swing, shelf]);

  const back = bakedSvg(`nw-medal|${R}`, M.w, M.h, () => medallionBack(M));
  const dome = bakedSvg(`nw-dome|${R}`, M.w, M.h, () => medallionDome(M));
  const pips = lasting > 0 ? bakedSvg(`nw-pips|${R}|${Math.min(3, lasting)}`, M.w, M.h, () => medallionPips(M, lasting)) : null;

  // this copy's paints and the glass's shape, made once
  const P = useMemo(() => {
    const glass = Skia.Path.Make();
    glass.addCircle(M.cx, M.cy, M.g - 0.5);
    const fade = Skia.Paint();
    const dim = Skia.Paint();
    dim.setColor(Skia.Color("#03050C"));
    return {
      glass,
      paint: Skia.Paint(),
      fade,
      dim,
      sweep: [Skia.Color("#FFFFFF00"), Skia.Color("#FFFFFF8C"), Skia.Color("#FFFFFF00")],
    };
  }, [M.cx, M.cy, M.g]);

  const { w, h, cx, cy, g, pivot } = M;
  const picture = useDerivedValue(() => {
    const t = clock.value;
    const at = pos.value;
    const { from, to, fromEmpty, toEmpty } = shelf.value;
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, w, h));
    c.save();
    c.rotate(((swing.value + (reduced ? 0 : 0.012 * Math.sin(t * 0.8))) * 180) / Math.PI, pivot.x, pivot.y);
    const whole = (img: SkImage | null, paint = P.paint) => {
      if (img) c.drawImageRect(img, Skia.XYWHRect(0, 0, img.width(), img.height()), Skia.XYWHRect(0, 0, w, h), paint);
    };
    whole(back);
    const s = g * 2.05;
    const put = (img: SkImage | null, dy: number, alpha: number) => {
      if (!img || alpha <= 0) return;
      let paint = P.paint;
      if (alpha < 1) {
        P.fade.setAlphaf(alpha);
        paint = P.fade;
      }
      c.drawImageRect(img, Skia.XYWHRect(0, 0, img.width(), img.height()), Skia.XYWHRect(cx - s / 2, cy - s / 2 + dy, s, s), paint);
    };
    const moving = at < 0.999 || at > 1.001;
    const k = Math.min(1, Math.max(0, at));
    if (moving) {
      c.save();
      c.clipPath(P.glass, 1, true);
    }
    if (!moving) {
      // settled: only what's in the glass now (the old floor has gone)
      put(to, reduced ? 0 : (1 - at) * (2 * g + 8), 1);
    } else if (reduced) {
      put(from, 0, 1 - k);
      put(to, 0, k);
    } else {
      const pitch = 2 * g + 8;
      put(from, -at * pitch, 1);
      put(to, (1 - at) * pitch, 1);
    }
    // no event: the glass stands dim
    const dimness = moving ? (fromEmpty ? 1 - k : 0) + (toEmpty ? k : 0) : toEmpty ? 1 : 0;
    if (dimness > 0.001) {
      P.dim.setAlphaf(0.45 * dimness);
      c.drawPath(P.glass, P.dim);
    }
    if (moving) c.restore();
    whole(dome);
    // now and then a light crosses the glass
    const p = (t % EVERY) / 1.3;
    if (!reduced && p < 1) {
      const sx = cx - g - 14 + p * (2 * g + 28);
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      paint.setShader(
        Skia.Shader.MakeLinearGradient(Skia.Point(sx - 9, cy - 4), Skia.Point(sx + 9, cy + 4), P.sweep, null, TileMode.Clamp),
      );
      c.drawPath(P.glass, paint);
    }
    whole(pips);
    c.restore();
    return recorder.finishRecordingAsPicture();
  }, [P, back, dome, pips, reduced, w, h, cx, cy, g, pivot.x, pivot.y]);

  return (
    <View style={[styles.wrap, { left: x - cx, top: y - cy, width: w, height: h }]} pointerEvents="box-none">
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas style={StyleSheet.absoluteFill}>
          <Picture picture={picture} />
        </Canvas>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={8}
        style={{ position: "absolute", left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: R }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: "absolute" },
});
