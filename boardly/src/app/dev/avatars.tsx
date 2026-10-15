// Development only: the avatar figures under load. Many at once, all
// moving, drawn either as recorded Skia pictures (one draw each) or as
// SVG, with the frame rate shown. Open with boardly-dev://dev/avatars.

import { Canvas, Group, Picture } from "@shopify/react-native-skia";
import { Redirect } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { EmblemGlyph } from "@/components/engraved";
import { recordEmblem } from "@/components/engraved/picture";
import { AppText } from "@/components/ui";
import { EMBLEMS, FIGURE_BOX } from "@/features/avatar/figure";
import { useTheme } from "@/theme";

const LOOKS = Object.values(EMBLEMS);
const COLS = 6;

/** The frame rate, counted on the UI thread and reported each second. */
function useFps(clock: SharedValue<number>) {
  const [fps, setFps] = useState(0);
  const frames = useSharedValue(0);
  const since = useSharedValue(0);
  useFrameCallback((frame) => {
    clock.set(frame.timeSinceFirstFrame / 1000);
    frames.set(frames.get() + 1);
    if (frame.timestamp - since.get() >= 1000) {
      scheduleOnRN(setFps, frames.get());
      frames.set(0);
      since.set(frame.timestamp);
    }
  });
  return fps;
}

function Bobbing({
  clock,
  i,
  x,
  y,
  scale,
  children,
}: {
  clock: SharedValue<number>;
  i: number;
  x: number;
  y: number;
  scale: number;
  children: React.ReactNode;
}) {
  const transform = useDerivedValue(() => [
    { translateX: x },
    { translateY: y - Math.abs(Math.sin(clock.value * 3 + i)) * 4 },
    { scale },
  ]);
  return <Group transform={transform}>{children}</Group>;
}

function SvgBobbing({
  clock,
  i,
  size,
}: {
  clock: SharedValue<number>;
  i: number;
  size: number;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.abs(Math.sin(clock.value * 3 + i)) * 4 }],
  }));
  return (
    <Animated.View style={style}>
      <EmblemGlyph data={LOOKS[i % LOOKS.length]} size={size} box={FIGURE_BOX} />
    </Animated.View>
  );
}

export default function AvatarsPreview() {
  const { colors, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<"skia" | "svg">("skia");
  const [count, setCount] = useState(30);
  const clock = useSharedValue(0);
  const fps = useFps(clock);
  const pictures = useMemo(() => LOOKS.map((look) => recordEmblem(look, undefined, FIGURE_BOX)), []);
  if (!__DEV__) return <Redirect href="/" />;

  const cell = (width - 32) / COLS;
  const scale = cell / FIGURE_BOX[0];
  const rows = Math.ceil(count / COLS);
  const cellH = FIGURE_BOX[1] * scale;

  const button = (label: string, on: boolean, press: () => void) => (
    <Pressable
      key={label}
      onPress={press}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: on ? "#E2B04A" : "#5A3A22",
      }}
    >
      <AppText style={{ color: "#FFFFFF" }}>{label}</AppText>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md, gap: 8 }}>
        <AppText variant="title" style={{ color: "#FFFFFF" }}>
          {`${fps} fps · ${count} figures · ${mode === "skia" ? "Skia pictures" : "SVG"}`}
        </AppText>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {button("Skia", mode === "skia", () => setMode("skia"))}
          {button("SVG", mode === "svg", () => setMode("svg"))}
          {[12, 30, 60].map((n) => button(`${n}`, count === n, () => setCount(n)))}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {mode === "skia" ? (
          <Canvas style={{ width: width - 32, height: rows * cellH + 8 }}>
            {Array.from({ length: count }, (_, i) => (
              <Bobbing
                key={i}
                clock={clock}
                i={i}
                x={(i % COLS) * cell}
                y={Math.floor(i / COLS) * cellH + 6}
                scale={scale}
              >
                <Picture picture={pictures[i % pictures.length]} />
              </Bobbing>
            ))}
          </Canvas>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {Array.from({ length: count }, (_, i) => (
              <SvgBobbing key={i} clock={clock} i={i} size={cell} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
