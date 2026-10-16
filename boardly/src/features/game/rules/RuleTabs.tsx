// The row of section tabs across the top of "How to play". They look like
// the app's Chips (an enamel pill in a gold or silver bezel), but a game
// can have eight of them and a Chip's bezel is a little SVG of a dozen
// native views: here every tab's pill and bezel is one Skia picture
// behind the row, and only the labels and invisible buttons are views.

import {
  Canvas,
  FillType,
  PaintStyle,
  Picture,
  Skia,
  StrokeCap,
  TileMode,
  type SkPicture,
} from "@shopify/react-native-skia";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from "react-native";

import { INKS, MATERIALS } from "@/components/engraved/shapes";
import { bezel } from "@/components/engraved/trim";
import { AppText, type Metal } from "@/components/ui";
import { useTheme } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

const RIM = 2.4;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function RuleTabs({
  labels,
  index,
  onPick,
  padX,
  padY,
  gap,
}: {
  labels: string[];
  index: number;
  onPick: (i: number) => void;
  padX: number;
  padY: number;
  gap: number;
}) {
  const { colors } = useTheme();
  const [boxes, setBoxes] = useState<(Box | undefined)[]>([]);
  const measure = useCallback(
    (i: number) => (event: LayoutChangeEvent) => {
      const { x, y, width: w, height: h } = event.nativeEvent.layout;
      setBoxes((was) => {
        const old = was[i];
        if (old && old.x === x && old.y === y && old.w === w && old.h === h) return was;
        const next = was.slice();
        next[i] = { x, y, w, h };
        return next;
      });
    },
    [],
  );

  const ready = boxes.length === labels.length && boxes.every(Boolean);
  const size = useMemo(() => {
    let w = 0;
    let h = 0;
    for (const b of boxes) {
      if (!b) continue;
      w = Math.max(w, b.x + b.w);
      h = Math.max(h, b.y + b.h);
    }
    return { w: w + padX, h: h + padY };
  }, [boxes, padX, padY]);

  const picture = useMemo<SkPicture | null>(() => {
    if (!ready) return null;
    const recorder = Skia.PictureRecorder();
    const c = recorder.beginRecording(Skia.XYWHRect(0, 0, size.w, size.h));
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    boxes.forEach((b, i) => {
      if (!b) return;
      const selected = i === index;
      const metal: Metal = selected ? "gold" : "silver";
      const shape = bezel(b.w, b.h, b.h / 2, RIM, b.x, b.y);
      const path = (d: string) => Skia.Path.MakeFromSVGString(d)!;
      // the enamel
      paint.setShader(null);
      paint.setStyle(PaintStyle.Fill);
      paint.setColor(Skia.Color(selected ? colors.accent : colors.card));
      c.drawPath(path(shape.outer), paint);
      // the rim, lit from the upper left
      const rim = path(shape.rim);
      rim.setFillType(FillType.EvenOdd);
      paint.setShader(
        Skia.Shader.MakeLinearGradient(
          { x: b.x, y: b.y },
          { x: b.x + b.w, y: b.y + b.h },
          MATERIALS[metal].map((m) => Skia.Color(m)),
          null,
          TileMode.Clamp,
        ),
      );
      c.drawPath(rim, paint);
      paint.setShader(null);
      paint.setStyle(PaintStyle.Stroke);
      const line = (d: string, color: string, width: number, alpha = 1) => {
        paint.setColor(Skia.Color(color));
        paint.setAlphaf(alpha);
        paint.setStrokeWidth(width);
        c.drawPath(path(d), paint);
      };
      const { ink, vein } = INKS[metal];
      line(shape.groove, vein, 0.55, 0.85);
      paint.setStrokeCap(StrokeCap.Round);
      line(shape.shine, "#FFFFFF", 0.9, 0.9);
      paint.setStrokeCap(StrokeCap.Butt);
      line(shape.outer, ink, 1.1);
      line(shape.face, ink, 0.8);
    });
    return recorder.finishRecordingAsPicture();
  }, [ready, boxes, index, size, colors.accent, colors.card]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
      <View style={[styles.row, { paddingHorizontal: padX, paddingVertical: padY, gap }]}>
        {picture ? (
          <View style={[StyleSheet.absoluteFill, { width: size.w, height: size.h }]} pointerEvents="none">
            <Canvas style={{ width: size.w, height: size.h }}>
              <Picture picture={picture} />
            </Canvas>
          </View>
        ) : null}
        {labels.map((label, i) => (
          <Pressable
            key={i}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            onLayout={measure(i)}
            onPress={() => {
              tapHaptic();
              onPick(i);
            }}
            style={({ pressed }) => [styles.tab, pressed ? styles.pressed : null]}
          >
            <AppText
              variant="label"
              style={[styles.label, { color: i === index ? colors.onAccent : colors.textMuted }]}
            >
              {label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexGrow: 0 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  tab: { paddingVertical: 8, paddingHorizontal: 15 },
  pressed: { opacity: 0.65, transform: [{ translateY: 1 }] },
  label: { fontSize: 11.5 },
});
