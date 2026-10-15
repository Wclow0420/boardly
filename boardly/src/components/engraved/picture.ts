// An emblem recorded once into a single Skia picture: however many parts
// it has, drawing it costs one call a frame, like an image. For emblems
// that appear many times or move on a canvas (avatars in a scene, a row
// of players). Draws the same as the SVG renderer (Engraved.tsx).

import {
  FillType,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  vec,
  type SkCanvas,
  type SkPicture,
} from "@shopify/react-native-skia";

import { LIGHT, shadeOf, type EmblemData } from "./emblem";
import { JEWELS } from "./shapes";

/** Applies an SVG transform list ("translate(…) scale(…) rotate(…)"). */
function transform(canvas: SkCanvas, t: string) {
  for (const [, op, args] of t.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (op === "translate") canvas.translate(n[0], n[1] ?? 0);
    else if (op === "scale") canvas.scale(n[0], n[1] ?? n[0]);
    else if (op === "rotate") {
      if (n.length === 3) {
        canvas.translate(n[1], n[2]);
        canvas.rotate(n[0], 0, 0);
        canvas.translate(-n[1], -n[2]);
      } else canvas.rotate(n[0], 0, 0);
    }
  }
}

function stroke(width: number, color: string, alpha = 1) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(alpha);
  return paint;
}

/** Records `data` (drawn in its own box) into a picture; "tint" parts
 *  take `tint`. */
export function recordEmblem(
  data: EmblemData,
  tint?: string,
  box: [number, number] = [48, 48],
): SkPicture {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, box[0], box[1]));
  for (const part of data) {
    canvas.save();
    if (part.t) transform(canvas, part.t);
    if ("dark" in part) {
      const path = Skia.Path.MakeFromSVGString(part.dark);
      if (path) {
        const paint = Skia.Paint();
        paint.setAntiAlias(true);
        paint.setColor(Skia.Color("#1A1008"));
        canvas.drawPath(path, paint);
      }
    } else if ("jewel" in part) {
      const [light, body, deep] = JEWELS[part.jewel];
      const { x, y, r } = part;
      const disc = Skia.Path.Make();
      disc.addCircle(x, y, r);
      const fill = Skia.Paint();
      fill.setAntiAlias(true);
      fill.setShader(
        Skia.Shader.MakeRadialGradient(
          vec(x - r * 0.3, y - r * 0.4),
          r * 1.5,
          [Skia.Color(light), Skia.Color(body), Skia.Color(deep)],
          [0, 0.45, 1],
          TileMode.Clamp,
        ),
      );
      canvas.drawPath(disc, fill);
      canvas.drawPath(disc, stroke(1.2, "#3A2408"));
      const glint = Skia.Paint();
      glint.setAntiAlias(true);
      glint.setColor(Skia.Color("#FFFFFF"));
      glint.setAlphaf(0.9);
      canvas.drawCircle(x - r * 0.35, y - r * 0.38, r * 0.25, glint);
    } else {
      const path = Skia.Path.MakeFromSVGString(part.d);
      if (path) {
        if (part.evenOdd) path.setFillType(FillType.EvenOdd);
        const { colors, ink, vein } = shadeOf(part.m, tint);
        const b = path.getBounds();
        const op = part.op ?? 1;
        const tones = colors.map((c) => Skia.Color(c));
        const at = colors.map((_, i) => i / (colors.length - 1));
        const fill = Skia.Paint();
        fill.setAntiAlias(true);
        fill.setShader(
          part.round
            ? Skia.Shader.MakeRadialGradient(
                vec(b.x + b.width * LIGHT.cx, b.y + b.height * LIGHT.cy),
                Math.max(b.width, b.height) * LIGHT.r,
                tones,
                at,
                TileMode.Clamp,
              )
            : Skia.Shader.MakeLinearGradient(
                vec(b.x, b.y),
                vec(b.x + b.width, b.y + b.height),
                tones,
                at,
                TileMode.Clamp,
              ),
        );
        fill.setAlphaf(op);
        canvas.drawPath(path, fill);
        const draw = (d: string | undefined, paint: ReturnType<typeof stroke>) => {
          const line = d ? Skia.Path.MakeFromSVGString(d) : null;
          if (line) canvas.drawPath(line, paint);
        };
        draw(part.vein, stroke(part.vw ?? 0.9, vein, op));
        draw(part.shine, stroke(part.sw ?? 1.1, "#FFFFFF", 0.85 * op));
        const width = part.ink ?? 1.5;
        if (width > 0) canvas.drawPath(path, stroke(width, ink, op));
      }
    }
    canvas.restore();
  }
  return recorder.finishRecordingAsPicture();
}
