// Development only: the Games tab's lift with a sample catalogue, to
// look at without the server. Open with boardly-dev://dev/lift
// (&count=5 to start with the players counter set, &perf=1 for the frame
// rate and how long it took to open, &w=375&h=700 for a smaller phone,
// &lang=zh for another language). Stepping out folds the gate open and,
// here, shuts it again.

import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { AppText } from "@/components/ui";
import type { GameCatalogEntry } from "@/data/types";
import { RulesSheet } from "@/features/game/RulesSheet";
import { LiftPage } from "@/features/games/lift/LiftPage";

const SAMPLE: GameCatalogEntry[] = [
  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    emoji: "⭕",
    tileColor: "#E3F0FF",
    category: "classic",
    tagKey: "classic",
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: "avalon",
    name: "Double Agent",
    emoji: "🕵️",
    tileColor: "#EDE4FF",
    category: "faction",
    tagKey: "faction",
    minPlayers: 5,
    maxPlayers: 10,
  },
  {
    id: "coup",
    name: "Hustle",
    emoji: "🏮",
    tileColor: "#FFEBD6",
    category: "strategy",
    tagKey: "card",
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: "manor",
    name: "Midnight Manor",
    emoji: "🕯️",
    tileColor: "#E9E2F7",
    category: "faction",
    tagKey: "faction",
    minPlayers: 4,
    maxPlayers: 8,
  },
  {
    id: "liarsdice",
    name: "Liar's Dice",
    emoji: "🎲",
    tileColor: "#FFE0E0",
    category: "party",
    tagKey: "party",
    minPlayers: 2,
    maxPlayers: 10,
  },
  {
    id: "nightwatch",
    name: "Seal the Manor",
    emoji: "🏮",
    tileColor: "#F7E6D5",
    category: "faction",
    tagKey: "faction",
    minPlayers: 5,
    maxPlayers: 10,
  },
  {
    id: "shelter",
    name: "Shelter",
    emoji: "🔥",
    tileColor: "#E3ECF5",
    category: "faction",
    tagKey: "faction",
    minPlayers: 4,
    maxPlayers: 8,
  },
];

/** Frames drawn in the last second, counted on the UI thread. */
function useFps(on: boolean) {
  const [fps, setFps] = useState(0);
  const frames = useSharedValue(0);
  const since = useSharedValue(0);
  useFrameCallback((frame) => {
    if (!on) return;
    frames.set(frames.get() + 1);
    if (frame.timestamp - since.get() >= 1000) {
      scheduleOnRN(setFps, frames.get());
      frames.set(0);
      since.set(frame.timestamp);
    }
  });
  return fps;
}

export default function LiftPreview() {
  const { perf, count, w, h, lang } = useLocalSearchParams<{
    lang?: string;
    perf?: string;
    count?: string;
    w?: string;
    h?: string;
  }>();
  const fps = useFps(perf === "1");
  const { i18n } = useTranslation();
  // &lang=zh: the page in another language (for this session only)
  useEffect(() => {
    if (lang) i18n.changeLanguage(lang);
  }, [lang, i18n]);
  const [opened] = useState(() => performance.now());
  const [openMs, setOpenMs] = useState<number | null>(null);
  const [rules, setRules] = useState<GameCatalogEntry | null>(null);
  const shut = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <View style={styles.screen}>
      {/* &w=375&h=600: the page as a smaller phone lays it out */}
      <View
        style={
          w
            ? { width: Number(w), height: h ? Number(h) : "100%" }
            : styles.screen
        }
      >
        <LiftPage
          games={SAMPLE}
          storageKey="boardly.dev.lift.floor"
          initialCount={count ? Number(count) : null}
          onShown={() => setOpenMs(Math.round(performance.now() - opened))}
          onOpenTable={() =>
            new Promise((_, reject) => {
              if (shut.current) clearTimeout(shut.current);
              shut.current = setTimeout(() => reject(new Error("dev")), 1400);
            })
          }
          onRules={setRules}
        />
      </View>
      {perf === "1" ? (
        <View style={styles.perf} pointerEvents="none">
          <AppText variant="tiny">{`${fps} fps\nopen ${openMs ?? "…"} ms`}</AppText>
        </View>
      ) : null}
      {rules ? (
        <RulesSheet
          gameKey={rules.id}
          gameName={rules.name}
          visible
          onClose={() => setRules(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  perf: {
    position: "absolute",
    left: 0,
    top: "46%",
    padding: 6,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
});
