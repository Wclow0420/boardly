// The badge hall's crest across the top of the screen, alive like a
// border: the wings sway, soft rays of light turn slowly behind it, the
// ruby in the crown beats (lub-dub), the lamps flicker, a light sweeps
// the gilt and glints flare. The still parts (crest.ts) are baked into
// images once; each frame is one picture of those images and the few
// moving touches. It stands still off screen and with reduce motion.

import {
  Canvas,
  Picture,
  Skia,
  TileMode,
  type SkImage,
  type SkPaint,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { PixelRatio, StyleSheet, View } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { fontFamily } from "@/theme";
import { canopy, crestLayout, signArt, sweepPath, wing, type CrestLayout } from "./crest";

const WING = 210;

/** Bakes SVG markup w × h into an image (crisp at the screen's density). */
function bake(markup: string, w: number, h: number): SkImage | null {
  const scale = Math.max(2, PixelRatio.get());
  const svg = Skia.SVG.MakeFromString(markup);
  const surface = Skia.Surface.Make(Math.ceil(w * scale), Math.ceil(h * scale));
  if (!svg || !surface) return null;
  const c = surface.getCanvas();
  c.scale(scale, scale);
  c.drawSvg(svg, w, h);
  surface.flush();
  return surface.makeImageSnapshot();
}

interface Parts {
  L: CrestLayout;
  canopy: SkImage | null;
  wing: SkImage | null;
  sign: SkImage | null;
  sweep: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  rays: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  glints: [number, number, number, number][];
  star: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  plain: SkPaint;
  colors: { sweep: Float32Array[]; glow: Float32Array[]; lamp: Float32Array[]; ray: Float32Array[] };
}

function makeParts(w: number, top: number): Parts {
  const L = crestLayout(w, top);
  const sweep = Skia.Path.MakeFromSVGString(sweepPath(L));
  sweep?.setFillType(1); // even-odd: the frame, not the enamel inside
  // twelve thin rays fanning up from behind the sign
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = -Math.PI + (Math.PI * (i + 0.5)) / 12;
    const r = 150;
    const da = 0.07;
    return `M0 0L${(Math.cos(a - da) * r).toFixed(1)} ${(Math.sin(a - da) * r).toFixed(1)}L${(Math.cos(a + da) * r).toFixed(1)} ${(Math.sin(a + da) * r).toFixed(1)}Z`;
  }).join("");
  const s = 1;
  return {
    L,
    canopy: bake(canopy(L), L.w, L.h),
    wing: bake(wing(WING), WING, WING),
    sign: bake(signArt(L), L.w, L.h),
    sweep,
    rays: Skia.Path.MakeFromSVGString(rays),
    // [x, y, size, phase]: the crown's tip, the sign's corners
    glints: [
      [L.cx, L.crown.y - 44, 6, 0],
      [L.sign.x + 8, L.sign.y + 4, 5, 2.1],
      [L.sign.x + L.sign.w - 6, L.sign.y + L.sign.h - 4, 4.5, 4.2],
    ],
    star: Skia.Path.MakeFromSVGString(
      `M0 ${-s}Q${0.2 * s} ${-0.2 * s} ${s} 0Q${0.2 * s} ${0.2 * s} 0 ${s}Q${-0.2 * s} ${0.2 * s} ${-s} 0Q${-0.2 * s} ${-0.2 * s} 0 ${-s}Z`,
    ),
    plain: Skia.Paint(),
    colors: {
      sweep: ["#FFFFFF00", "#FFFFFFB8", "#FFFFFF00"].map((c) => Skia.Color(c)),
      glow: ["#FF5A6E", "#FF5A6E00"].map((c) => Skia.Color(c)),
      lamp: ["#FFF6C8", "#FFB23A", "#C0540A"].map((c) => Skia.Color(c)),
      ray: ["#FFE7B0", "#FFE7B000"].map((c) => Skia.Color(c)),
    },
  };
}

/** The crest's parts for a size, made once for the app. */
const made = new Map<string, Parts>();
const partsFor = (w: number, top: number) => {
  const key = `${w}|${top}`;
  if (!made.has(key)) made.set(key, makeParts(w, top));
  return made.get(key)!;
};

export function HallCrest({
  width,
  top,
  clock,
  title,
}: {
  width: number;
  /** Where the content starts (below the status bar). */
  top: number;
  clock: SharedValue<number>;
  title: string;
}) {
  const P = useMemo(() => partsFor(width, top), [width, top]);
  const { L } = P;

  const picture = useDerivedValue(() => {
    const t = clock.value;
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, L.w, L.h));

    if (P.canopy) c.drawImageRect(P.canopy, Skia.XYWHRect(0, 0, P.canopy.width(), P.canopy.height()), Skia.XYWHRect(0, 0, L.w, L.h), P.plain);

    // the rays, turning slowly and breathing
    if (P.rays) {
      const rp = Skia.Paint();
      rp.setAntiAlias(true);
      rp.setShader(
        Skia.Shader.MakeRadialGradient({ x: 0, y: 0 }, 150, P.colors.ray, [0, 1], TileMode.Clamp),
      );
      rp.setAlphaf(0.22 + 0.08 * Math.sin(t * 0.9));
      c.save();
      c.translate(L.cx, L.cy);
      c.rotate(Math.sin(t * 0.25) * 6, 0, 0);
      c.drawPath(P.rays, rp);
      c.restore();
    }

    // the wings, swaying a little from their roots, out of step
    if (P.wing) {
      const src = Skia.XYWHRect(0, 0, P.wing.width(), P.wing.height());
      const dst = Skia.XYWHRect(-WING / 2, -WING / 2, WING, WING);
      for (const side of [1, -1]) {
        c.save();
        c.translate(L.cx + side * L.root.x, L.root.y);
        c.scale(side, 1);
        c.rotate((Math.sin(t * 1.1 + (side > 0 ? 0 : 1.3)) * 2.2), 0, 0);
        c.drawImageRect(P.wing, src, dst, P.plain);
        c.restore();
      }
    }

    if (P.sign) c.drawImageRect(P.sign, Skia.XYWHRect(0, 0, P.sign.width(), P.sign.height()), Skia.XYWHRect(0, 0, L.w, L.h), P.plain);

    // the ruby beats: lub-dub, then rest
    const beat = t % 1.6;
    const pulse = Math.max(0, Math.sin(Math.min(1, beat / 0.25) * Math.PI)) + 0.7 * Math.max(0, Math.sin(Math.min(1, Math.max(0, beat - 0.3) / 0.25) * Math.PI));
    const glow = Skia.Paint();
    glow.setShader(
      Skia.Shader.MakeRadialGradient({ x: L.ruby.x, y: L.ruby.y }, 16, P.colors.glow, [0, 1], TileMode.Clamp),
    );
    glow.setAlphaf(0.25 + 0.55 * pulse);
    c.drawCircle(L.ruby.x, L.ruby.y, 16, glow);

    // the lamps flicker, each its own way
    L.lamps.forEach((lamp, i) => {
      const flick = 0.75 + 0.25 * Math.sin(t * 7 + i * 1.9) * Math.sin(t * 3.1 + i);
      const halo = Skia.Paint();
      halo.setShader(
        Skia.Shader.MakeRadialGradient({ x: lamp.x, y: lamp.y }, 10, [P.colors.lamp[1], Skia.Color("#FFB23A00")], [0, 1], TileMode.Clamp),
      );
      halo.setAlphaf(0.5 * flick);
      c.drawCircle(lamp.x, lamp.y, 10, halo);
      const bulb = Skia.Paint();
      bulb.setAntiAlias(true);
      bulb.setShader(
        Skia.Shader.MakeRadialGradient({ x: lamp.x - 1, y: lamp.y - 1.2 }, 4.4, P.colors.lamp, [0, 0.5, 1], TileMode.Clamp),
      );
      bulb.setAlphaf(flick);
      c.drawCircle(lamp.x, lamp.y, 3.8, bulb);
    });

    // the light crossing the gilt every five seconds
    if (P.sweep) {
      const p = (t % 5) / 1.2;
      if (p < 1) {
        const x = L.sign.x - 30 + p * (L.sign.w + 60);
        const sp = Skia.Paint();
        sp.setAntiAlias(true);
        sp.setShader(
          Skia.Shader.MakeLinearGradient({ x: x - 14, y: L.sign.y }, { x: x + 14, y: L.sign.y + 12 }, P.colors.sweep, null, TileMode.Clamp),
        );
        c.drawPath(P.sweep, sp);
      }
    }

    // glints flaring now and then
    if (P.star) {
      for (const [gx, gy, gs, ph] of P.glints) {
        const k = Math.max(0, Math.sin(t * 1.2 + ph)) ** 8;
        if (k < 0.02) continue;
        const gp = Skia.Paint();
        gp.setAntiAlias(true);
        gp.setColor(Skia.Color("#FFFFFF"));
        gp.setAlphaf(k);
        c.save();
        c.translate(gx, gy);
        c.scale(gs * (0.3 + k), gs * (0.3 + k));
        c.rotate(t * 40, 0, 0);
        c.drawPath(P.star, gp);
        c.restore();
      }
    }
    return recorder.finishRecordingAsPicture();
  });

  return (
    <View style={{ width: L.w, height: L.h }} pointerEvents="box-none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Picture picture={picture} />
      </Canvas>
      <View
        pointerEvents="none"
        style={[styles.title, { left: L.sign.x + 6, top: L.sign.y + 5, width: L.sign.w - 12, height: L.sign.h - 10 }]}
      >
        <AppText style={styles.titleText} numberOfLines={1}>
          {title}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { position: "absolute", alignItems: "center", justifyContent: "center" },
  titleText: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 2.5,
    color: "#FFF2D0",
    textTransform: "uppercase",
    textShadowColor: "rgba(40,0,6,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
});
