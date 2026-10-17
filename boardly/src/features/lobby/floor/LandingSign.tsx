// The floor lobby's header: the landing sign you step out to from the
// lift, drawn like the lift's own (its walnut and brass sunburst, the
// chevron frieze, the crimson sign in a gold moulding with stepped fins)
// reading the floor and the game ("3F · HUSTLE"); a back stud on the
// left, the rules on the right; under it the table's code on a brass
// room-number plate (tap to copy it) and the QR button. The still art is
// baked once (art.ts); each frame is one picture of a light crossing the
// sign's gold and the glints on the studs and the plate's screws.

import { Canvas, FillType, Image as SkImg, Picture, Skia, TileMode } from "@shopify/react-native-skia";
import * as Clipboard from "expo-clipboard";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { BackIcon, Emblem } from "@/components/icons";
import { AppText } from "@/components/ui";
import { fontFamily } from "@/theme";
import { successHaptic, tapHaptic } from "@/utils/haptics";
import { signArt, signRim } from "./art";
import type { SignLayout } from "./layout";

export interface LandingSignProps {
  L: SignLayout;
  clock: SharedValue<number>;
  /** The sign's words ("3F · Hustle"). */
  title: string;
  code: string;
  onBack: () => void;
  onRules?: () => void;
  onQr: () => void;
}

export const LandingSign = memo(function LandingSign({ L, clock, title, code, onBack, onRules, onQr }: LandingSignProps) {
  const { t } = useTranslation();
  const image = bakedSvg(`lobby-sign|${L.top}`, L.w, L.h, () => signArt(L));
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const copy = () => {
    successHaptic();
    Clipboard.setStringAsync(code).catch(() => {});
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  const P = useMemo(() => {
    const star = Skia.Path.MakeFromSVGString("M0 -1Q0.2 -0.2 1 0Q0.2 0.2 0 1Q-0.2 0.2 -1 0Q-0.2 -0.2 0 -1Z");
    const rim = Skia.Path.MakeFromSVGString(signRim(L));
    if (rim) rim.setFillType(FillType.EvenOdd);
    const sweep = Skia.Paint();
    sweep.setAntiAlias(true);
    const glint = Skia.Paint();
    glint.setAntiAlias(true);
    glint.setColor(Skia.Color("#FFFFFF"));
    return {
      star,
      rim,
      sweep,
      glint,
      colors: ["#FFFFFF00", "#FFFFFFC8", "#FFFFFF00"].map((c) => Skia.Color(c)),
    };
  }, [L]);
  const { sign, studs, plate, qr } = L;
  const glints: [number, number, number, number][] = useMemo(
    () => [
      [studs.left.x - 9, studs.left.y - 10, 5, 0],
      [studs.right.x - 9, studs.right.y - 10, 5, 2.1],
      [plate.x + 10, plate.y + plate.h / 2 - 3, 4, 3.6],
      [sign.x + 10, sign.y + 3, 5.5, 5.1],
    ],
    [studs, plate, sign],
  );

  const picture = useDerivedValue(() => {
    const time = clock.get();
    const rec = Skia.PictureRecorder();
    const c = rec.beginRecording(Skia.XYWHRect(0, 0, L.w, L.h));
    // a light crossing the sign's gold every seven seconds
    const k = (time % 7) / 1.6;
    if (k < 1 && P.rim) {
      const x = sign.x - 40 + k * (sign.w + 80);
      P.sweep.setShader(
        Skia.Shader.MakeLinearGradient({ x: x - 22, y: sign.y }, { x: x + 22, y: sign.y + sign.h }, P.colors, null, TileMode.Clamp),
      );
      c.drawPath(P.rim, P.sweep);
    }
    if (P.star) {
      for (const [gx, gy, gs, ph] of glints) {
        const g = Math.max(0, Math.sin(time * 0.9 + ph)) ** 10;
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
    return rec.finishRecordingAsPicture();
  }, [P, L, glints]);

  const stud = (side: "left" | "right") => ({
    left: studs[side].x - studs.r,
    top: studs[side].y - studs.r,
    width: studs.r * 2,
    height: studs.r * 2,
  });

  return (
    <View style={{ width: L.w, height: L.h }}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {image ? <SkImg image={image} x={0} y={0} width={L.w} height={L.h} /> : null}
        <Picture picture={picture} />
      </Canvas>
      <View style={[styles.abs, styles.centre, { left: sign.x + 6, top: sign.y + 4, width: sign.w - 12, height: sign.h - 8 }]} pointerEvents="none">
        <AppText style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        hitSlop={6}
        onPress={() => {
          tapHaptic();
          onBack();
        }}
        style={({ pressed }) => [styles.abs, styles.centre, stud("left"), pressed && styles.pressed]}
      >
        <BackIcon size={17} color="#F6E9D2" />
      </Pressable>
      {onRules ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("rules.title")}
          hitSlop={6}
          onPress={() => {
            tapHaptic();
            onRules();
          }}
          style={({ pressed }) => [styles.abs, styles.centre, stud("right"), pressed && styles.pressed]}
        >
          <Emblem emoji="📖" size={20} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t("lobby.tableCode")} ${code}`}
        accessibilityHint={t("lobby.floor.copyHint")}
        onPress={copy}
        style={({ pressed }) => [styles.abs, styles.centre, { left: plate.x, top: plate.y, width: plate.w, height: plate.h }, pressed && styles.pressed]}
      >
        <AppText style={[styles.label, copied && styles.labelCopied]} numberOfLines={1}>
          {copied ? t("lobby.floor.copied") : t("lobby.tableCode")}
        </AppText>
        <AppText style={styles.code} numberOfLines={1}>
          {code}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("lobby.floor.qrTitle")}
        hitSlop={4}
        onPress={() => {
          tapHaptic();
          onQr();
        }}
        style={({ pressed }) => [styles.abs, { left: qr.x, top: qr.y, width: qr.s, height: qr.s }, pressed && styles.pressed]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  abs: { position: "absolute" },
  centre: { alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 2.2,
    color: "#FFF2D0",
    textTransform: "uppercase",
    textShadowColor: "rgba(40,0,6,0.85)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 1.5,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 8.5,
    lineHeight: 11,
    letterSpacing: 1.4,
    color: "#7A5212",
    textTransform: "uppercase",
  },
  labelCopied: { color: "#1E7A44" },
  code: {
    fontFamily: fontFamily.bold,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: 4,
    color: "#3A2408",
    textShadowColor: "rgba(255,246,208,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
});
