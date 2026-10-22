// Development only: the Me page (the lobby) with a sample player, to
// look at without the server. Open with boardly-dev://dev/me
// (&perf=1 for the frame rate and how long it took to open, &w=375&h=729
// for a smaller phone, &lang=zh for another language, &key=1 to be at a
// table, &mail=3 for mail waiting, &long=1 for a long name and lines,
// &popup=1 to open on the mailbox with an invite and a request in it,
// &still=1 without the lobby's life, to measure what it costs, &border=
// to wear another border than the phoenix).

import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { AppText } from "@/components/ui";
import { STARTER, type Look } from "@/features/mascot/dress";
import { MailboxPopup } from "@/features/me/MailboxPopup";
import type { Mail } from "@/features/me/mailbox";
import { MePage } from "@/features/me/MePage";

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

/** A mailbox with a bit of everything (&popup=1). */
const MAIL: Mail = {
  invites: [
    {
      from: { id: "u1", username: "Mia", avatarUrl: null, borderId: "phoenix" },
      code: "ABC123",
      game: { key: "coup", name: "Hustle" } as never,
      at: Date.now(),
    },
    {
      from: { id: "u2", username: "Bartholomew_the_Bold", avatarUrl: null, borderId: "none" },
      code: "XYZ789",
      game: { key: "nightwatch", name: "Seal the Manor" } as never,
      at: Date.now(),
    },
  ],
  requests: [{ id: "u3", name: "Ken", relation: "incoming", requestId: "r1" }],
  unread: 3,
};

const LOOK: Look = { ...STARTER, wear: { ...STARTER.wear, hat: "crown" } };

export default function MePreview() {
  const { perf, w, h, lang, key, mail, long, popup, still, border } = useLocalSearchParams<{
    perf?: string;
    w?: string;
    h?: string;
    lang?: string;
    key?: string;
    mail?: string;
    long?: string;
    popup?: string;
    still?: string;
    border?: string;
  }>();
  const fps = useFps(perf === "1");
  const { t, i18n } = useTranslation();
  useEffect(() => {
    if (lang) i18n.changeLanguage(lang);
  }, [lang, i18n]);
  const [opened] = useState(() => performance.now());
  const [openMs, setOpenMs] = useState<number | null>(null);
  const [mailOpen, setMailOpen] = useState(popup === "1");
  if (!__DEV__) return <Redirect href="/" />;
  const isLong = long === "1";
  const lines = [
    t("me.news.manorMap"),
    t("me.marquee.playing", { name: isLong ? "Bartholomew the Bold" : "Mia", game: t("gameNames.coup") }),
    t("me.marquee.online_other", { count: 4 }),
    t("me.marquee.newGame", { floor: 5, game: t("gameNames.nightwatch") }),
    t("me.marquee.ofTheDay", { game: t("gameNames.shelter") }),
  ];
  return (
    <View style={styles.screen}>
      <View style={w ? { width: Number(w), height: h ? Number(h) : "100%" } : styles.screen}>
        <MePage
          name={isLong ? "Maximilian_Wolfgang99" : "mascotdev"}
          title={t("me.record", { wins: 20, count: 24 })}
          borderId={border ?? "phoenix"}
          look={LOOK}
          coins={17559}
          marquee={lines}
          unread={mail ? Number(mail) : 0}
          table={key === "1" ? t("me.backTo", { floor: 3, game: t(isLong ? "gameNames.nightwatch" : "gameNames.coup") }) : null}
          onTable={() => {}}
          onProfile={() => {}}
          onMascot={() => {}}
          onMailbox={() => setMailOpen(true)}
          onCode={() => {}}
          onPractice={() => {}}
          onWardrobe={() => {}}
          onPlay={() => {}}
          onShown={() => setOpenMs(Math.round(performance.now() - opened))}
          paused={mailOpen}
          lifeless={still === "1"}
        />
      </View>
      <MailboxPopup visible={mailOpen} mail={MAIL} onClose={() => setMailOpen(false)} />
      {perf === "1" ? (
        <View style={styles.perf} pointerEvents="none">
          <AppText variant="tiny">{`${fps} fps\nopen ${openMs ?? "…"} ms`}</AppText>
        </View>
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
