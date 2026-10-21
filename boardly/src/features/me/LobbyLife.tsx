// What lives in the arcade, over its still art (art.ts), on one clock.
// The claw crane's claw swings on its cable, the bulbs on its sign and
// round the pinball's backglass chase.
// The marquee's bulbs chase round the sign and a light sweeps its gold
// moulding, glints flare on its emerald and on the dial's ruby, the
// dial's needle rests on L with the faintest tremble, the wall lamps
// flicker and dust drifts and twinkles in the spotlight.
//
// Cheap by construction: one canvas, one picture a frame, from the
// marquee's crest down to the medallion, behind me (the still room under
// it baked into its background, so it's opaque); the needle, hub and
// claw baked once, every paint made once per mounted copy and only its alpha set a frame.
// (Measured: a dozen animated native views for the dust cost more, and
// each extra canvas costs a frame's present of its own.)

import { Canvas, FillType, PaintStyle, Picture, Skia, TileMode, vec, type SkCanvas, type SkImage, type SkPaint, type SkPath, type SkPicture } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { bakedDrawing, bakedSvg } from "@/components/badges/bake";
import { rrect } from "@/components/engraved/trim";
import { HUB, NEEDLE_W, hubArt, needleArt } from "@/features/games/lift/art";
import { clawArt } from "./arcade";
import { NEEDLE_REST } from "./art";
import type { MeLayout } from "./layout";

const MOTES = 12;
const SWEEP_EVERY = 6.5;
const SWEEP_CROSS = 1.4;
const GLOW = 96;

/** The fraction of a number. */
const fr = (n: number) => {
  "worklet";
  return n - Math.floor(n);
};

const draw = (c: SkCanvas, img: SkImage | null, x: number, y: number, w: number, h: number, paint: SkPaint) => {
  "worklet";
  if (img) c.drawImageRect(img, Skia.XYWHRect(0, 0, img.width(), img.height()), Skia.XYWHRect(x, y, w, h), paint);
};

const paint = () => {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  return p;
};
const radialShader = (r: number, colors: string[], pos?: number[]) =>
  Skia.Shader.MakeRadialGradient(vec(0, 0), r, colors.map((c) => Skia.Color(c)), pos ?? null, TileMode.Clamp);
const starPath = () => Skia.Path.MakeFromSVGString("M0 -1Q0.2 -0.2 1 0Q0.2 0.2 0 1Q-0.2 0.2 -1 0Q-0.2 -0.2 0 -1Z");

/** A glint flaring now and then at (x, y). */
const glint = (c: SkCanvas, star: SkPath | null, p: SkPaint, t: number, x: number, y: number, size: number, phase: number) => {
  "worklet";
  if (!star) return;
  const k = Math.max(0, Math.sin(t * 1.2 + phase)) ** 8;
  if (k < 0.02) return;
  p.setAlphaf(k);
  c.save();
  c.translate(x, y);
  c.scale(size * (0.3 + k), size * (0.3 + k));
  c.rotate(t * 40, 0, 0);
  c.drawPath(star, p);
  c.restore();
};

export const LobbyLife = memo(function LobbyLife({
  L,
  scene,
  clock,
}: {
  L: MeLayout;
  /** The lobby's still picture: the canvas's own background. */
  scene: SkPicture | null;
  clock: SharedValue<number>;
}) {
  const { marquee: Q, opening: O, beam, medallion, sconces, bulbs, chase, claw, machines, cx, dial } = L;
  // one canvas round only what moves: the marquee's crest down to the
  // medallion (behind me), across the machines either side
  const x0 = 0;
  const x1 = L.w;
  const y0 = Q.y - 28;
  const y1 = Math.max(O.y + GLOW, medallion.y - medallion.ry);
  const box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  const len = dial.R - 12;
  const P = useMemo(() => {
    const halo = paint();
    halo.setShader(radialShader(8, ["#FFE7B0D0", "#FFB23A00"]));
    const bulb = paint();
    bulb.setShader(radialShader(2.6, ["#FFFFFF", "#FFE07A", "#E2A030"], [0, 0.55, 1]));
    // the moulding the light crosses: the frame, not the enamel inside
    const rim = Skia.Path.MakeFromSVGString(`${rrect(Q.x, Q.y, Q.w, Q.h, 9)}${rrect(Q.x + 5, Q.y + 5, Q.w - 10, Q.h - 10, 4)}`);
    rim?.setFillType(FillType.EvenOdd);
    const glintP = paint();
    glintP.setColor(Skia.Color("#FFFFFF"));
    const lamp = paint();
    lamp.setShader(radialShader(GLOW / 2, ["#FFE2A0A0", "#FFB23A30", "#FFB23A00"], [0, 0.45, 1]));
    const mote = paint();
    mote.setColor(Skia.Color("#FFF0C8"));
    return {
      halo,
      bulb,
      rim,
      sweep: paint(),
      sweepColors: ["#FFFFFF00", "#FFFFFFB0", "#FFFFFF00"].map((c) => Skia.Color(c)),
      glint: glintP,
      star: starPath(),
      lamp,
      mote,
      needle: bakedSvg(`me-needle|${len}`, NEEDLE_W, len + 18, () => needleArt(len)),
      hub: bakedSvg("me-hub", HUB, HUB, hubArt),
      claw: bakedSvg(`me-claw|${claw.size}`, claw.size, claw.size, () => clawArt(claw.size)),
      cable: (() => {
        const p = paint();
        p.setStyle(PaintStyle.Stroke);
        p.setStrokeWidth(1);
        p.setColor(Skia.Color("#C8B080"));
        return p;
      })(),
      plain: Skia.Paint(),
      // the lobby behind, baked once: the canvas is opaque, so nothing
      // under it is blended again every frame
      back: scene
        ? bakedDrawing(`me-life|${L.w}x${L.h}|${L.top}`, box.w, box.h, (c) => {
            c.translate(-box.x, -box.y);
            c.drawPicture(scene);
            // every bulb softly on
            bulb.setAlphaf(0.57);
            for (const b of bulbs) c.drawCircle(b.x, b.y, 2.5, bulb);
            for (const b of chase) c.drawCircle(b.x, b.y, 1.9, bulb);
            bulb.setAlphaf(1);
          })
        : null,
      // the chase: a real marquee's chaser steps, so its four steps are
      // recorded once (the lit bulbs and the ones just gone by)
      chase: [0, 1, 2, 3].map((step) => {
        const rec = Skia.PictureRecorder();
        const c = rec.beginRecording(Skia.XYWHRect(0, 0, L.w, L.h));
        bulbs.forEach((b, i) => {
          const k = (((i - step) % 4) + 4) % 4;
          if (k !== 0 && k !== 3) return;
          const on = k === 0 ? 1 : 0.5;
          c.save();
          c.translate(b.x, b.y);
          halo.setAlphaf(on);
          c.drawCircle(0, 0, 8, halo);
          bulb.setAlphaf(Math.min(1, on + 0.25));
          c.drawCircle(0, 0, 2.5, bulb);
          c.restore();
        });
        // the claw crane's sign and the pinball's backglass chase too
        chase.forEach((b, i) => {
          const k = (((i - step) % 4) + 4) % 4;
          if (k !== 0 && k !== 3) return;
          const on = k === 0 ? 1 : 0.45;
          c.save();
          c.translate(b.x, b.y);
          c.scale(0.75, 0.75);
          halo.setAlphaf(on);
          c.drawCircle(0, 0, 8, halo);
          bulb.setAlphaf(Math.min(1, on + 0.25));
          c.drawCircle(0, 0, 2.5, bulb);
          c.restore();
        });
        return rec.finishRecordingAsPicture();
      }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the box is the layout's
  }, [Q.x, Q.y, Q.w, Q.h, len, scene, L.w, L.h, L.top, claw.size]);
  // the jewels that glint: the claw crane's crest, the pinball's star
  const gems = useMemo(() => {
    const [clawBox, , pin] = machines;
    return { cx: clawBox.x + clawBox.w / 2, cy: clawBox.y + 1.8, px: pin.x + pin.w / 2, py: pin.y + pin.h * 0.42 * 0.36 };
  }, [machines]);
  // the dust rises through the spotlight from the medallion to the lintel
  const top = beam.top + 4;
  const foot = y1;

  const picture = useDerivedValue(() => {
    const t = clock.get();
    const rec = Skia.PictureRecorder();
    const c = rec.beginRecording(Skia.XYWHRect(0, 0, box.w, box.h));
    c.translate(-box.x, -box.y);
    draw(c, P.back, box.x, box.y, box.w, box.h, P.plain);

    // the wall lamps flicker, each its own way
    for (let i = 0; i < sconces.length; i++) {
      const s = sconces[i];
      P.lamp.setAlphaf(0.8 + 0.12 * Math.sin(t * 6.3 + i * 2.1) * Math.sin(t * 2.7 + i) + 0.08 * Math.sin(t * 13 + i * 4));
      c.save();
      c.translate(s.x, s.y - 6);
      c.drawCircle(0, 0, GLOW / 2, P.lamp);
      c.restore();
    }

    // dust drifting up through the spotlight, twinkling
    for (let i = 0; i < MOTES; i++) {
      const speed = 0.03 + fr(i * 0.53) * 0.04;
      const v = 1 - fr(i * 0.618 + t * speed);
      const y = top + (foot - top) * v;
      const k = (y - beam.top) / (beam.foot - beam.top);
      const half = (beam.topW + (beam.footW - beam.topW) * k) * 0.42;
      const x = cx + (fr(i * 0.37) * 2 - 1) * half + Math.sin(t * 0.5 + i * 1.7) * 5;
      const edge = Math.sin(Math.PI * v);
      const tw = 0.2 + 0.8 * Math.max(0, Math.sin(t * 1.1 + i * 2.3));
      P.mote.setAlphaf(Math.min(1, 0.8 * edge * tw));
      c.drawCircle(x, y, 0.8 + fr(i * 0.71) * 1.1, P.mote);
    }

    // the marquee's bulbs chasing round, a step at a time
    c.drawPicture(P.chase[Math.floor(t * 9) % 4]);
    // a light crossing its gold now and then
    const p = (t % SWEEP_EVERY) / SWEEP_CROSS;
    if (P.rim && p < 1) {
      const x = Q.x - 40 + p * (Q.w + 80);
      P.sweep.setShader(Skia.Shader.MakeLinearGradient(vec(x - 22, Q.y), vec(x + 22, Q.y + Q.h), P.sweepColors, null, TileMode.Clamp));
      c.drawPath(P.rim, P.sweep);
    }

    // the needle resting on L, trembling a hair, and its hub
    const deg = NEEDLE_REST + Math.sin(t * 2.3) * 0.5 + Math.sin(t * 7.1) * 0.25;
    c.save();
    c.translate(cx, dial.y);
    c.rotate(deg, 0, 0);
    draw(c, P.needle, -NEEDLE_W / 2, -len, NEEDLE_W, len + 18, P.plain);
    c.restore();
    const hs = 19;
    draw(c, P.hub, cx - hs / 2, dial.y - hs / 2, hs, hs, P.plain);

    // the claw swinging a few degrees on its cable
    c.save();
    c.translate(claw.x, claw.y);
    c.rotate(Math.sin(t * 1.3) * 4 + Math.sin(t * 3.1) * 0.8, 0, 0);
    c.drawLine(0, 0, 0, claw.len, P.cable);
    draw(c, P.claw, -claw.size / 2, claw.len - 2, claw.size, claw.size, P.plain);
    c.restore();

    // glints: the marquee's emerald and corner, the dial's ruby, the
    // claw crane's crest and the pinball's star
    glint(c, P.star, P.glint, t, cx, Q.y - 19, 6, 0);
    glint(c, P.star, P.glint, t, Q.x + 6, Q.y + 5, 4.5, 4.1);
    glint(c, P.star, P.glint, t, cx, dial.y, 5, 2.2);
    glint(c, P.star, P.glint, t, gems.cx, gems.cy, 4.5, 1.1);
    glint(c, P.star, P.glint, t, gems.px, gems.py, 5, 3.3);
    return rec.finishRecordingAsPicture();
  }, [P, bulbs, sconces, box.x, box.y, box.w, box.h, top, foot, cx, len, dial.y, Q.x, Q.y, Q.w, Q.h, claw, gems]);

  return (
    <Canvas opaque style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h }} pointerEvents="none">
      <Picture picture={picture} />
    </Canvas>
  );
});
