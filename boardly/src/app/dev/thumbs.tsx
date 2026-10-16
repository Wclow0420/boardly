// Development only: draws every art border's two layers offscreen as
// small still pictures and sends them to scripts/border-thumbs.mjs, which
// writes them into the app. Run the script first, then open
// boardly-dev://dev/thumbs.

import { Group, ImageFormat, drawAsImage } from "@shopify/react-native-skia";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { makeMutable } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { ART } from "@/features/cosmetics/art";
import { THUMB_PX } from "@/features/cosmetics/thumbSize";
import { useTheme } from "@/theme";

const RECEIVER = "http://localhost:8099";

export default function ThumbsPage() {
  const { colors } = useTheme();
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    if (!__DEV__) return;
    let live = true;
    const say = (line: string) => live && setLines((all) => [...all, line]);
    (async () => {
      // the clock stands where the borders look settled
      const t = makeMutable(1.3);
      const place = [
        { translateX: THUMB_PX / 2 },
        { translateY: THUMB_PX / 2 },
        // the picture is 1.9 avatars across, an avatar 100 art units
        { scale: THUMB_PX / 190 },
      ];
      for (const [id, drawing] of Object.entries(ART)) {
        for (const layer of ["back", "front"] as const) {
          const Layer = drawing[layer];
          if (!Layer) continue;
          try {
            const image = await drawAsImage(
              <Group transform={place}>
                <Layer t={t} />
              </Group>,
              { width: THUMB_PX, height: THUMB_PX },
            );
            const png = image?.encodeToBase64(ImageFormat.PNG, 100);
            if (!png) throw new Error("nothing drawn");
            await fetch(`${RECEIVER}/${id}-${layer}.png`, { method: "POST", body: png });
            say(`✓ ${id} ${layer}`);
          } catch (err) {
            say(`✕ ${id} ${layer}: ${String(err)}`);
          }
        }
      }
      await fetch(`${RECEIVER}/done`, { method: "POST" }).catch(() => {});
      say("done");
    })();
    return () => {
      live = false;
    };
  }, []);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {lines.map((line, i) => (
          <AppText key={i} variant="caption">
            {line}
          </AppText>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
