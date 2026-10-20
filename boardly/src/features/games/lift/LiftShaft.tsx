// Through the lift's gate (the Games tab): the floors stacked in the
// shaft, each its landing baked into one image (floors.ts) with a steel
// girder between, sliding past as the cab rides; the floor's lead
// standing in front, breathing and swaying a little (its portrait baked
// once, moved by transforms); the folding brass gate over it all (gate.ts),
// which folds open when you step out. Floors whose game doesn't take the
// chosen number of players are darkened. One picture a frame. With reduce
// motion the floors don't slide: the new one fades in over the old.

import { Canvas, Picture, Skia, TileMode, type SkImage } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { slabArt } from "./art";
import { drawGate, gatePaints, gatePaths } from "./gate";
import { PEEK, SLAB, type LiftLayout } from "./layout";

export interface ShaftFloor {
  image: SkImage | null;
  lead: SkImage | null;
  /** Where the lead stands, as a fraction of the width. */
  leadAt: number;
}

export interface LiftShaftProps {
  L: LiftLayout;
  clock: SharedValue<number>;
  pos: SharedValue<number>;
  /** Reduce motion: the floor faded in from (index), and how far (0–1). */
  fadeFrom: SharedValue<number>;
  fade: SharedValue<number>;
  gate: SharedValue<number>;
  /** The floors baked so far, by index (the one shown and its
   *  neighbours). */
  floors: Record<number, ShaftFloor>;
  /** Each floor's wall colour, for one not baked yet. */
  walls: string[];
  fits: boolean[];
  /** The lead's size. */
  leadSize: number;
}

export const LiftShaft = memo(function LiftShaft({
  L,
  clock,
  pos,
  fadeFrom,
  fade,
  gate,
  floors,
  walls,
  fits,
  leadSize,
}: LiftShaftProps) {
  const { w, h } = L.opening;
  const fh = L.floorH;
  const pitch = L.pitch;
  const n = walls.length;
  const fitsKey = fits.map((k) => (k ? 1 : 0)).join("");

  const P = useMemo(() => {
    const paint = Skia.Paint();
    const dim = Skia.Paint();
    dim.setColor(Skia.Color("#04060A"));
    dim.setAlphaf(0.62);
    const fadePaint = Skia.Paint();
    const shaft = Skia.Paint();
    shaft.setColor(Skia.Color("#0C0805"));
    const shadow = Skia.Paint();
    shadow.setShader(
      Skia.Shader.MakeLinearGradient({ x: 0, y: 0 }, { x: 0, y: 14 }, ["#000000A0", "#00000000"].map((c) => Skia.Color(c)), null, TileMode.Clamp),
    );
    return {
      paint,
      shaft,
      dim,
      fadePaint,
      shadow,
      wallPaints: walls.map((c) => {
        const p = Skia.Paint();
        p.setColor(Skia.Color(c));
        return p;
      }),
      slab: bakedSvg(`lift-slab|${SLAB}`, w, SLAB, () => slabArt(w, SLAB)),
      gate: gatePaints(h),
      shut: gatePaths(w, h, 0),
    };
  }, [walls, w, h]);

  const picture = useDerivedValue(() => {
    const time = clock.get();
    const at = pos.get();
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, w, h));
    // the shaft's dark beyond the top and bottom floors
    c.drawRect(Skia.XYWHRect(0, 0, w, h), P.shaft);
    const from = Math.max(0, Math.floor(at) - 1);
    const to = Math.min(n - 1, Math.ceil(at) + 1);
    const k = fade.get();
    const old = fadeFrom.get();

    const drawFloor = (i: number, y: number, alpha: number) => {
      const f = floors[i];
      const paint = alpha < 1 ? P.fadePaint : P.paint;
      if (alpha < 1) paint.setAlphaf(alpha);
      if (f?.image) {
        c.drawImageRect(f.image, Skia.XYWHRect(0, 0, f.image.width(), f.image.height()), Skia.XYWHRect(0, y, w, fh), paint);
      } else if (P.wallPaints[i]) {
        c.drawRect(Skia.XYWHRect(0, y, w, fh), P.wallPaints[i]);
      }
      // the lead, breathing from the feet and swaying a little
      if (f?.lead) {
        const s = leadSize;
        c.save();
        c.translate(w * f.leadAt, y + fh + s * 0.08);
        c.rotate(Math.sin(time * 0.7 + i * 1.3) * 0.9, 0, 0);
        c.scale(1, 1 + 0.014 * Math.sin(time * 1.7 + i));
        c.drawImageRect(f.lead, Skia.XYWHRect(0, 0, f.lead.width(), f.lead.height()), Skia.XYWHRect(-s / 2, -s, s, s), paint);
        c.restore();
      }
      if (fitsKey[i] === "0") c.drawRect(Skia.XYWHRect(0, y, w, fh), P.dim);
    };

    for (let i = from; i <= to; i++) {
      // floor i's top: the floor at `at` sits a girder and a sliver down
      const y = PEEK + SLAB + (at - i) * pitch;
      if (y > h || y + fh < 0) continue;
      if (k < 1 && i === Math.round(at) && old !== i) {
        // reduce motion: the old floor's picture under the new, fading
        drawFloor(old, y, 1);
        drawFloor(i, y, k);
      } else drawFloor(i, y, 1);
      if (P.slab) {
        const src = Skia.XYWHRect(0, 0, P.slab.width(), P.slab.height());
        c.drawImageRect(P.slab, src, Skia.XYWHRect(0, y - SLAB, w, SLAB), P.paint);
        if (i === 0) c.drawImageRect(P.slab, src, Skia.XYWHRect(0, y + fh, w, SLAB), P.paint);
      }
    }

    // the lintel's shadow over the top, then the gate
    c.drawRect(Skia.XYWHRect(0, 0, w, 14), P.shadow);
    const open = gate.get();
    drawGate(c, open < 0.001 ? P.shut : gatePaths(w, h, open), P.gate, w, h);
    return recorder.finishRecordingAsPicture();
  }, [P, floors, fitsKey, w, h, fh, pitch, n, leadSize]);

  return (
    <View style={[styles.wrap, { left: L.opening.x, top: L.opening.y, width: w, height: h }]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: "absolute", overflow: "hidden" },
});
