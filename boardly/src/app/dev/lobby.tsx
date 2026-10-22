// Development only: the floor lobby (features/lobby/floor) with sample
// tables, to look at without the server. Open with
// boardly-dev://dev/lobby?sample=<name> (the `dev` tab on the left lists
// them; &perf=1 for the frame rate and how long it took to open,
// &lang=zh for another language, &w=375&h=667 for a smaller phone). Ready, start, bots and settings work on
// the sample table here.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { MascotLook, RoomInfo, RoomPlayerInfo } from "@/api/client";
import { AppText, type GorhomBottomSheetModal } from "@/components/ui";
import { RulesSheet } from "@/features/game/RulesSheet";
import { AddBotsSheet } from "@/features/lobby/AddBots";
import { InviteFriendsSheet } from "@/features/lobby/InviteFriendsSheet";
import { useGameName } from "@/games/names";
import { FloorLobby } from "@/features/lobby/floor/FloorLobby";
import { inviteLink } from "@/utils/share";

const LOOKS: MascotLook[] = [
  { skin: "glossy", colour: "#F5922E", wear: { hand: "lantern" } },
  { skin: "glossy", colour: "#3A78D8", wear: { eyes: "googly", mouth: "grin", hat: "beanie", top: "hoodie" } },
  { skin: "gingerbread", colour: "#F5922E", wear: { eyes: "icing", mouth: "icing", hat: "bow" } },
  { skin: "glossy", colour: "#3AA65A", wear: {} },
  { skin: "glossy", colour: "#8A5AD0", wear: { hat: "beanie" } },
  { skin: "glossy", colour: "#D84A5A", wear: { top: "hoodie" } },
];

const person = (seat: number, username: string, ready: boolean, isBot = false): RoomPlayerInfo => ({
  userId: `u${seat}`,
  username,
  borderId: null,
  avatarUrl: null,
  mascot: LOOKS[seat % LOOKS.length],
  seat,
  ready,
  isBot,
});

const HUSTLE = {
  key: "coup",
  name: "Hustle",
  minPlayers: 2,
  maxPlayers: 6,
  emoji: "🏮",
  tileColor: "#FFEBD6",
  category: "strategy",
  tag: "card",
};
const DICE = {
  key: "liarsdice",
  name: "Liar's Dice",
  minPlayers: 2,
  maxPlayers: 10,
  emoji: "🎲",
  tileColor: "#FFE0E0",
  category: "party",
  tag: "party",
  options: { mode: ["knockout", "endless"], calling: ["jijiji", "classic", "nozhai"] },
};
const TTT = {
  key: "tictactoe",
  name: "Tic-Tac-Toe",
  minPlayers: 2,
  maxPlayers: 2,
  emoji: "⭕",
  tileColor: "#E3F0FF",
  category: "classic",
  tag: "classic",
};
const WATCH = {
  key: "nightwatch",
  name: "Seal the Manor",
  minPlayers: 5,
  maxPlayers: 10,
  emoji: "🏮",
  tileColor: "#F7E6D5",
  category: "faction",
  tag: "faction",
};
const MANOR = {
  key: "manor",
  name: "Midnight Manor",
  minPlayers: 4,
  maxPlayers: 8,
  emoji: "🕯️",
  tileColor: "#E9E2F7",
  category: "faction",
  tag: "faction",
};
const SHELTER = {
  key: "shelter",
  name: "Shelter",
  minPlayers: 4,
  maxPlayers: 8,
  emoji: "🔥",
  tileColor: "#DDE8F5",
  category: "party",
  tag: "party",
};
const AGENT = {
  key: "avalon",
  name: "Double Agent",
  minPlayers: 5,
  maxPlayers: 10,
  emoji: "🕵",
  tileColor: "#D8F0EC",
  category: "party",
  tag: "party",
};
/** Ten at the table, some with long names, the fifth a bot. */
const TEN = ["Christopher Wellington", "MeiMei_1999_official", "Alexandria-Rose", "Qiang", "Ming", "Bartholomew Smythe", "Ada", "Ben", "Kai", "Lan"];

const room = (code: string, players: RoomPlayerInfo[], over: Partial<RoomInfo> = {}): RoomInfo => ({
  id: `dev-${code}`,
  code,
  gameType: "coup",
  hostId: "u0",
  status: "waiting",
  players,
  game: HUSTLE,
  options: {},
  rematchCode: null,
  botsAvailable: true,
  ...over,
});

interface Sample {
  room: RoomInfo;
  me: string;
  popup?: "qr" | "rules";
  /** Someone walks in this long after opening. */
  arrive?: { after: number; player: RoomPlayerInfo };
  /** Ids already seen at the table on this phone (default: everyone;
   *  null: the table is new to this phone). */
  seen?: string[] | null;
  floor?: number;
}

const SAMPLES: Record<string, Sample> = {
  nightwatch5: {
    room: room("WATCH5", ["Justin", "Ada", "Ben", "Mei", "Kai"].map((name, i) => person(i, name, i % 3 !== 2)), { gameType: "nightwatch", game: WATCH }),
    me: "u0",
    floor: 6,
  },
  nightwatch10: {
    room: room("WATCH0", TEN.map((name, i) => person(i, name, i % 3 !== 2, i === 4)), { gameType: "nightwatch", game: WATCH }),
    me: "u0",
    floor: 6,
  },
  nightwatchRules: {
    room: room("WATCHR", TEN.slice(0, 7).map((name, i) => person(i, name, true)), { gameType: "nightwatch", game: WATCH }),
    me: "u0",
    floor: 6,
    popup: "rules",
  },
  manor4: {
    room: room("MANOR4", ["Justin", "Ada", "Ben"].map((name, i) => person(i, name, i !== 2)), { gameType: "manor", game: MANOR }),
    me: "u0",
    floor: 4,
  },
  manor8: {
    room: room("MANOR8", TEN.slice(0, 8).map((name, i) => person(i, name, i % 3 !== 2, i === 4)), { gameType: "manor", game: MANOR }),
    me: "u0",
    floor: 4,
  },
  manorRules: {
    room: room("MANORR", TEN.slice(0, 4).map((name, i) => person(i, name, true)), { gameType: "manor", game: MANOR }),
    me: "u1",
    floor: 4,
    popup: "rules",
  },
  alone: { room: room("K7QX2P", [person(0, "Justin", true)]), me: "u0" },
  walkin: { room: room("W4LK1N", [person(0, "Justin", true), person(1, "Ada", false)]), me: "u1", seen: null },
  three: {
    room: room("H3TRIO", [person(0, "Justin", true), person(1, "Ada", true), person(2, "Ben", false)]),
    me: "u0",
  },
  full: {
    room: room("FULL66", [
      person(0, "Justin", true),
      person(1, "Ada", true),
      person(2, "Ben", true),
      person(3, "Mei", true),
      person(4, "Kai", true),
      person(5, "Lan", true),
    ]),
    me: "u0",
  },
  guest: {
    room: room("GUE5T1", [person(0, "Justin", true), person(1, "Ada", true), person(2, "Ben", false), person(3, "Mei", false)]),
    me: "u2",
  },
  bot: {
    room: room("B0TS42", [person(0, "Justin", true), person(1, "Ming", true, true), person(2, "Ada", false), person(3, "Wei", true, true)]),
    me: "u0",
  },
  qr: { room: room("K7QX2P", [person(0, "Justin", true), person(1, "Ada", true), person(2, "Ben", false)]), me: "u0", popup: "qr" },
  rules: {
    room: room("RULE55", [person(0, "Justin", true), person(1, "Ada", true), person(2, "Ben", false), person(3, "Mei", true), person(4, "Kai", false)]),
    me: "u0",
    popup: "rules",
  },
  long: {
    room: room("L0NGNM", [
      person(0, "Christopher Wellington", true),
      person(1, "MeiMei_1999_official", false),
      person(2, "Alexandria-Rose", true),
      person(3, "Qiang", false),
      person(4, "Ming", true, true),
      person(5, "Bartholomew Smythe", false),
    ]),
    me: "u0",
  },
  arrive: {
    room: room("ARR1VE", [person(0, "Justin", true), person(1, "Ada", true), person(2, "Ben", false)]),
    me: "u0",
    arrive: { after: 1200, player: person(3, "Mei", false) },
  },
  dice: {
    room: room("D1CE77", [person(0, "Justin", true), person(1, "Ada", true), person(2, "Ben", false), person(3, "Mei", true)], {
      gameType: "liarsdice",
      game: DICE,
      options: { mode: "knockout", calling: "jijiji" },
    }),
    me: "u0",
    floor: 5,
  },
  diceRules: {
    room: room("D1CE78", [person(0, "Justin", true), person(1, "Ada", true), person(2, "Ben", false)], {
      gameType: "liarsdice",
      game: DICE,
      options: { mode: "endless", calling: "classic" },
    }),
    me: "u1",
    floor: 5,
    popup: "rules",
  },
  dice10: {
    room: room(
      "D1CE10",
      ["Christopher Wellington", "MeiMei_1999_official", "Alexandria-Rose", "Qiang", "Ming", "Bartholomew Smythe", "Ada", "Ben", "Kai", "Lan"].map(
        (name, i) => person(i, name, i % 3 !== 2, i === 4),
      ),
      { gameType: "liarsdice", game: DICE, options: { mode: "knockout", calling: "jijiji" } },
    ),
    me: "u0",
    floor: 5,
  },
  ttt1: {
    room: room("XO0001", [person(0, "Justin", true)], { gameType: "tictactoe", game: TTT }),
    me: "u0",
    floor: 1,
  },
  ttt2: {
    room: room("XO0002", [person(0, "Justin", true), person(1, "Alexandria-Rose", false)], { gameType: "tictactoe", game: TTT }),
    me: "u0",
    floor: 1,
  },
  tttRules: {
    room: room("XO0003", [person(0, "Justin", true), person(1, "Ada", true)], { gameType: "tictactoe", game: TTT }),
    me: "u1",
    floor: 1,
    popup: "rules",
  },
  shelter5: {
    room: room("SNOW05", ["Justin", "Ada", "Ben", "Mei", "Kai"].map((name, i) => person(i, name, i !== 2)), { gameType: "shelter", game: SHELTER }),
    me: "u0",
    floor: 7,
  },
  shelter8: {
    room: room("SNOW08", TEN.slice(0, 8).map((name, i) => person(i, name, i % 3 !== 2, i === 4)), { gameType: "shelter", game: SHELTER }),
    me: "u0",
    floor: 7,
  },
  shelterRules: {
    room: room("SNOW06", ["Justin", "Ada", "Ben", "Mei", "Kai"].map((name, i) => person(i, name, i !== 3)), { gameType: "shelter", game: SHELTER }),
    me: "u1",
    floor: 7,
    popup: "rules",
  },
  avalon5: {
    room: room("SPY005", ["Justin", "Ada", "Ben", "Mei"].map((name, i) => person(i, name, i !== 1)), { gameType: "avalon", game: AGENT }),
    me: "u0",
    floor: 2,
  },
  avalon10: {
    room: room("SPY010", TEN.map((name, i) => person(i, name, i % 3 !== 2, i === 4)), { gameType: "avalon", game: AGENT }),
    me: "u0",
    floor: 2,
  },
  avalonRules: {
    room: room("SPY007", TEN.slice(0, 7).map((name, i) => person(i, name, i % 2 === 0)), { gameType: "avalon", game: AGENT }),
    me: "u1",
    floor: 2,
    popup: "rules",
  },
};

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

export default function LobbyPreview() {
  const { sample: asked, perf, lang, w, h } = useLocalSearchParams<{ sample?: string; perf?: string; lang?: string; w?: string; h?: string }>();
  const { i18n } = useTranslation();
  useEffect(() => {
    if (lang) i18n.changeLanguage(lang);
  }, [lang, i18n]);
  const [sample, setSample] = useState(asked && SAMPLES[asked] ? asked : "three");
  // a new link opened over this page picks its sample
  const [lastAsked, setLastAsked] = useState(asked);
  if (asked !== lastAsked) {
    setLastAsked(asked);
    if (asked && SAMPLES[asked]) setSample(asked);
  }
  const [picking, setPicking] = useState(false);
  const fps = useFps(perf === "1");
  const [opened, setOpened] = useState(() => performance.now());
  const [openMs, setOpenMs] = useState<number | null>(null);
  // every sample a fresh table: who has already been seen is set first
  const [seeded, setSeeded] = useState<string | null>(null);
  useEffect(() => {
    const s = SAMPLES[sample];
    const key = `boardly.lobby.arrived.${s.room.code}`;
    const seen = s.seen === undefined ? s.room.players.map((p) => p.userId) : s.seen;
    (seen ? AsyncStorage.setItem(key, JSON.stringify(seen)) : AsyncStorage.removeItem(key))
      .catch(() => {})
      .finally(() => {
        setOpened(performance.now());
        setOpenMs(null);
        setSeeded(sample);
      });
  }, [sample]);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <View style={styles.screen}>
      {/* &w=375&h=667: the page as a smaller phone lays it out */}
      <View style={w ? { width: Number(w), height: h ? Number(h) : "100%" } : styles.screen}>
        {seeded === sample ? <Table key={sample} sample={SAMPLES[sample]} onShown={() => setOpenMs(Math.round(performance.now() - opened))} /> : null}
      </View>
      <Pressable onPress={() => setPicking(true)} style={styles.devTab}>
        <AppText variant="tiny">{perf === "1" ? `dev\n${fps}\n${openMs ?? "…"}ms` : "dev"}</AppText>
      </Pressable>
      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.devDim} onPress={() => setPicking(false)}>
          <View style={styles.devSheet}>
            {Object.keys(SAMPLES).map((key) => (
              <Pressable
                key={key}
                onPress={() => {
                  setSample(key);
                  setPicking(false);
                }}
                style={[styles.devChip, key === sample && styles.devChipOn]}
              >
                <AppText variant="caption">{key}</AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** A sample table, played locally: ready, start, bots, settings. */
function Table({ sample, onShown }: { sample: Sample; onShown: () => void }) {
  const router = useRouter();
  const gameName = useGameName();
  const [r, setRoom] = useState(sample.room);
  const [starting, setStarting] = useState(false);
  const [rules, setRules] = useState(false);
  const invite = useRef<GorhomBottomSheetModal>(null);
  const bots = useRef<GorhomBottomSheetModal>(null);
  useEffect(() => {
    if (!sample.arrive) return;
    const { after, player } = sample.arrive;
    const t = setTimeout(() => setRoom((was) => ({ ...was, players: [...was.players, player] })), after);
    return () => clearTimeout(t);
  }, [sample]);
  const link = useMemo(() => inviteLink(r.code), [r.code]);
  return (
    <>
      <FloorLobby
        room={r}
        meId={sample.me}
        floor={sample.floor ?? 3}
        floors={7}
        gameName={gameName(r.gameType, r.game?.name)}
        link={link}
        initialPopup={sample.popup ?? null}
        onShown={onShown}
        onBack={() => router.back()}
        onRules={() => setRules(true)}
        onReady={(ready) =>
          setRoom((was) => ({ ...was, players: was.players.map((p) => (p.userId === sample.me ? { ...p, ready } : p)) }))
        }
        onStart={() => {
          setStarting(true);
          setTimeout(() => setStarting(false), 4000);
        }}
        starting={starting}
        onRemovePlayer={(id) => setRoom((was) => ({ ...was, players: was.players.filter((p) => p.userId !== id) }))}
        onSetOption={(name, choice) => setRoom((was) => ({ ...was, options: { ...was.options, [name]: choice } }))}
        onInvite={() => invite.current?.present()}
        onBots={() => bots.current?.present()}
        onShare={() => {}}
        onPlayer={() => {}}
      />
      <InviteFriendsSheet ref={invite} onShareLink={() => {}} />
      <AddBotsSheet ref={bots} room={r} minPlayers={r.game?.minPlayers ?? 2} maxPlayers={r.game?.maxPlayers ?? 2} />
      <RulesSheet gameKey={r.gameType} gameName={r.game?.name ?? ""} visible={rules} onClose={() => setRules(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#140A04" },
  devTab: {
    position: "absolute",
    left: 0,
    top: "56%",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#F9A23B",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  devDim: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  devSheet: { flexDirection: "row", flexWrap: "wrap", gap: 8, borderRadius: 16, padding: 16, backgroundColor: "#4A301D" },
  devChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#27170C" },
  devChipOn: { borderColor: "#F9A23B" },
});
