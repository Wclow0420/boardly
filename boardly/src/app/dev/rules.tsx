// Development only: a game's "How to play" popup, open, with how long it
// took from the tap to its first page drawn. Open with
// boardly-dev://dev/rules?game=<key>; add &measure=1 to have it close a
// moment after opening, showing the time.

import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { AppText, Screen } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { GAMES } from "@/games/registry";
import { useTheme } from "@/theme";

export default function RulesPreview() {
  const { colors } = useTheme();
  const { game: asked, measure } = useLocalSearchParams<{ game?: string; measure?: string }>();
  const [game, setGame] = useState(asked && GAMES[asked] ? asked : "nightwatch");
  const [open, setOpen] = useState(false);
  const [ms, setMs] = useState<string>("");
  const started = useRef(0);
  const show = (key: string) => {
    setGame(key);
    setOpen(false);
    setMs("");
    requestAnimationFrame(() => {
      started.current = performance.now();
      setOpen(true);
    });
  };
  useEffect(() => {
    const id = requestAnimationFrame(() => show(game));
    return () => cancelAnimationFrame(id);
    // once, on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Screen>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {Object.keys(GAMES).map((key) => (
          <Pressable
            key={key}
            onPress={() => show(key)}
            style={{ padding: 8, borderRadius: 8, borderWidth: 1.5, borderColor: key === game ? colors.primary : colors.border }}
          >
            <AppText variant="caption">{key}</AppText>
          </Pressable>
        ))}
      </View>
      <AppText style={{ marginTop: 12 }}>{ms ? `opened in ${ms} ms` : "…"}</AppText>
      <RulesSheet
        gameKey={game}
        gameName={GAMES[game]?.name ?? game}
        visible={open}
        onClose={() => setOpen(false)}
        onShown={() => {
          if (!started.current) return;
          setMs(String(Math.round(performance.now() - started.current)));
          started.current = 0;
          // with ?measure=1 it closes again, so the time can be read
          if (measure === "1") setTimeout(() => setOpen(false), 900);
        }}
      />
    </Screen>
  );
}
