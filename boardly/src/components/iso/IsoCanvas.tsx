// Drawing on a Skia canvas in the units of a picture, not of the
// screen. A scene is described once as a list of shapes (SVG path data
// with a fill and an edge, back to front — what any of the app's
// isometric builders produce) and handed to an <IsoLayer>; effects
// from ./effects sit between layers, in the same units.

import { useMemo, useState, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import {
  Canvas,
  Group,
  PaintStyle,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
} from "@shopify/react-native-skia";

import type { Shape } from "./kit";

/** One shape of a drawing: an outline, how it is filled and edged. */
export type IsoShape = Shape;

/** A group whose transform can be driven by Reanimated values. */
export { Group as IsoGroup } from "@shopify/react-native-skia";

export interface IsoCanvasProps {
  /** The picture's own size: everything inside is drawn in these units. */
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** A canvas as wide as its place on the page, scaled so its children
 *  draw in the picture's units. */
export function IsoCanvas({ width, height, style, children }: IsoCanvasProps) {
  const [scale, setScale] = useState(0);
  return (
    <View
      style={[{ width: "100%", aspectRatio: width / height }, style]}
      onLayout={(event) => setScale(event.nativeEvent.layout.width / width)}
    >
      {scale > 0 ? (
        <Canvas style={{ flex: 1 }}>
          <Group transform={[{ scale }]}>{children}</Group>
        </Canvas>
      ) : null}
    </View>
  );
}


/** Children drawn only inside an outline (SVG path data). */
export function IsoClip({ d, children }: { d: string; children: ReactNode }) {
  const clip = useMemo(() => Skia.Path.MakeFromSVGString(d), [d]);
  return clip ? <Group clip={clip}>{children}</Group> : <>{children}</>;
}

/** A shape's engraved gradient as a Skia shader (none if it has none). */
function gradientOf(shape: IsoShape) {
  const g = shape.grad;
  if (!g) return null;
  const colors = g.colors.map((c) => Skia.Color(c));
  if (g.radius !== undefined)
    return Skia.Shader.MakeRadialGradient({ x: g.from[0], y: g.from[1] }, g.radius, colors, null, TileMode.Clamp);
  if (!g.to) return null;
  return Skia.Shader.MakeLinearGradient(
    { x: g.from[0], y: g.from[1] },
    { x: g.to[0], y: g.to[1] },
    colors,
    null,
    TileMode.Clamp,
  );
}

/** Shapes drawn in order, the first at the back. They are recorded
 *  once into a single picture, so a layer of hundreds of shapes costs
 *  one draw a frame however much moves around it. */
export function IsoLayer({ shapes }: { shapes: IsoShape[] }) {
  const picture = useMemo(() => {
    const recorder = Skia.PictureRecorder();
    // far more than any picture needs; a recording is only as big as what is drawn
    const canvas = recorder.beginRecording(Skia.XYWHRect(-4096, -4096, 8192, 8192));
    for (const shape of shapes) {
      const path = Skia.Path.MakeFromSVGString(shape.d);
      if (!path) continue;
      const alpha = shape.opacity ?? 1;
      if (shape.fill) {
        const paint = Skia.Paint();
        paint.setAntiAlias(true);
        paint.setColor(Skia.Color(shape.fill));
        const shader = gradientOf(shape);
        if (shader) paint.setShader(shader);
        paint.setAlphaf(alpha);
        canvas.drawPath(path, paint);
      }
      if (shape.stroke) {
        const paint = Skia.Paint();
        paint.setAntiAlias(true);
        paint.setStyle(PaintStyle.Stroke);
        paint.setStrokeWidth(shape.strokeWidth ?? 1);
        paint.setStrokeJoin(StrokeJoin.Round);
        paint.setStrokeCap(StrokeCap.Round);
        paint.setColor(Skia.Color(shape.stroke));
        paint.setAlphaf(alpha);
        if (shape.dash) {
          paint.setPathEffect(Skia.PathEffect.MakeDash(shape.dash.split(/[ ,]+/).map(Number), 0));
        }
        canvas.drawPath(path, paint);
      }
    }
    return recorder.finishRecordingAsPicture();
  }, [shapes]);

  return <Picture picture={picture} />;
}
