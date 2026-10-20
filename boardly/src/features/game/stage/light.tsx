// Light that moves across a stage, shared by the games' moments: motes
// streaming into a point (power being poured in), and a ring of light
// bursting out. Each is drawn inside a parent <Canvas>; the motes are one
// picture a frame.

import { BlendMode, Circle, Picture, RadialGradient, Skia, vec, type SkPaint } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

type SV = SharedValue<number>;

/** The same pseudo-random number for the same seed, 0..1. */
const rnd = (i: number) => {
  "worklet";
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Motes of light streaming from a band along the bottom (`from`) up into
 *  a point (`to`), more of them the more `flow` there is: the power
 *  being poured into a lantern. One picture a frame. */
export function Motes({
  clock,
  flow,
  from,
  to,
  color,
  count = 36,
}: {
  clock: SV;
  flow: SV;
  from: { x0: number; x1: number; y: number };
  to: { x: number; y: number };
  color: string;
  count?: number;
}) {
  const paint = useMemo<SkPaint>(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(color));
    p.setBlendMode(BlendMode.Plus);
    p.setAntiAlias(true);
    return p;
  }, [color]);
  const core = useMemo<SkPaint>(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color("#FFFFFF"));
    p.setAntiAlias(true);
    return p;
  }, []);
  const picture = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(-2000, -2000, 4000, 4000));
    const f = flow.value;
    if (f > 0.01) {
      const t = clock.value;
      for (let i = 0; i < count; i++) {
        // the first ones always flow; more join as the power rises
        if (rnd(i + 7) > f * 1.15) continue;
        const life = 0.9 + rnd(i) * 0.7;
        const p = (((t / life + rnd(i + 3)) % 1) + 1) % 1;
        const e = p * p;
        const sx = from.x0 + (from.x1 - from.x0) * rnd(i + 11);
        const bend = (rnd(i + 5) - 0.5) * 160;
        const mx = (sx + to.x) / 2 + bend;
        const my = (from.y + to.y) / 2;
        const u = 1 - e;
        const px = u * u * sx + 2 * u * e * mx + e * e * to.x;
        const py = u * u * from.y + 2 * u * e * my + e * e * to.y;
        const a = Math.sin(Math.PI * p) * (0.5 + 0.5 * f);
        const r = (1.4 + rnd(i + 9) * 2.2) * (1 - 0.5 * e);
        paint.setAlphaf(a * 0.55);
        c.drawCircle(px, py, r * 2.6, paint);
        core.setAlphaf(a);
        c.drawCircle(px, py, r * 0.8, core);
      }
    }
    return recorder.finishRecordingAsPicture();
  });
  return <Picture picture={picture} />;
}

/** A burst of light at a point: a ring flying out and fading, as `go`
 *  runs 0..1. */
export function Burst({
  x,
  y,
  go,
  color,
  size = 160,
}: {
  x: number;
  y: number;
  go: SV;
  color: string;
  size?: number;
}) {
  const r = useDerivedValue(() => 10 + size * go.value);
  const opacity = useDerivedValue(() =>
    go.value > 0 && go.value < 1 ? Math.pow(1 - go.value, 1.5) : 0,
  );
  return (
    <Circle cx={x} cy={y} r={r} opacity={opacity} blendMode="screen">
      <RadialGradient
        c={vec(x, y)}
        r={r}
        colors={[`${color}00`, `${color}00`, `${color}EE`, `${color}00`]}
        positions={[0, 0.55, 0.85, 1]}
      />
    </Circle>
  );
}

