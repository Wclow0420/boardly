// Development only: every room of Seal the Manor as the game draws it,
// on the Skia canvas, to look at on a real device. Open with
// boardly-dev://dev/iso.

import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import type { Arrival, Entry } from "@/games/nightwatch/arrival";
import { ManorMap } from "@/games/nightwatch/ManorMap";
import { RoomScene } from "@/games/nightwatch/RoomScene";
import { ROOMS, type NightEvent, type NightwatchState } from "@/games/nightwatch/logic";
import { STARTER, type Look } from "@/features/mascot/dress";
import { COLOURS } from "@/features/mascot/skins";
import { useTheme } from "@/theme";

const NONE: number[] = [];
const NONE_DOORS: number[][] = [];

/** A game three nights in, for the map: you went from the Hall to the
 *  Study, on to the Chapel's mission, then the Dining Room and Garden. */
const patrol = (round: number, room: number) => ({
  round,
  kind: "patrol" as const,
  room,
  seen: [],
  company: false,
  fake: null,
  tracked: null,
  blocked: null,
});
const SAMPLE = {
  phase: "patrol",
  round: 2,
  rounds: 5,
  missionRoom: 6,
  nextMissionRoom: 3,
  results: [{ round: 0, room: 2, team: [0, 1], missing: [], fails: 0, success: true }],
  collapsed: [],
  lockedDoor: null,
  doors: [[0, 4]],
  myRoom: 8,
  myFake: null,
  log: [patrol(0, 1), patrol(1, 5), patrol(2, 8)],
  positions: null,
} as unknown as NightwatchState;
/** Four mascots dressed differently, to stand in the room. */
const MASCOTS: Record<string, Look> = {
  me: { skin: "glossy", colour: COLOURS.orange, wear: { ...STARTER.wear, hat: "crown", hand: "lantern" } },
  a: { skin: "glossy", colour: COLOURS.blue, wear: { eyes: "googly", mouth: "grin", hat: "beanie", top: "hoodie" } },
  b: { skin: "gingerbread", colour: COLOURS.orange, wear: { eyes: "icing", mouth: "icing", hat: "bow" } },
  c: { skin: "panda", colour: COLOURS.white, wear: { eyes: "sleepy", mouth: "cat" } },
};
const EVENTS: (NightEvent | null)[] = [null, "blackout", "fog", "storm", "collapse", "insomnia", "echo"];

export default function IsoPreview() {
  const { colors, spacing } = useTheme();
  const [room, setRoom] = useState(ROOMS.indexOf("kitchen"));
  const [active, setActive] = useState(true);
  const [event, setEvent] = useState<NightEvent | null>(null);
  const [mission, setMission] = useState(false);
  const [door, setDoor] = useState(false);
  const [arrival, setArrival] = useState<Arrival | undefined>(undefined);
  const [walks, setWalks] = useState(0);
  const [avatars, setAvatars] = useState(true);
  // a room next door, across the corner, or far away, to walk in from
  const walkIn = (how: Entry) => {
    const from =
      how === "step"
        ? room % 3 > 0
          ? room - 1
          : room + 1
        : how === "secret"
          ? room === 4
            ? 0
            : 4
          : how === "far"
            ? 8 - room
            : room;
    setWalks(walks + 1);
    setArrival({ key: `walk-${walks}`, from, how });
  };
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <AppText variant="h2">Rooms on Skia</AppText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {ROOMS.map((id, index) => (
            <Pressable
              key={id}
              onPress={() => setRoom(index)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: index === room ? colors.primary : colors.border,
              }}
            >
              <AppText variant="caption">{id}</AppText>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {EVENTS.map((name) => (
            <Pressable
              key={name ?? "none"}
              onPress={() => setEvent(name)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: name === event ? colors.info : colors.border,
              }}
            >
              <AppText variant="caption">{name ?? "no event"}</AppText>
            </Pressable>
          ))}
        </View>
        <RoomScene
          event={event}
          room={room}
          active={active}
          onTouch={() => setActive(false)}
          touchLabel="Use the room"
          people={[
            { key: "me", label: "You", kind: "me" },
            { key: "a", label: "Ming", kind: "other" },
            { key: "b", label: "Mei", kind: "other" },
            { key: "c", label: "Bao", kind: "other" },
          ]}
          mascots={avatars ? MASCOTS : undefined}
          missionRoom={mission ? room : null}
          secretDoors={door ? [[room, room === 4 ? 0 : 4]] : NONE_DOORS}
          arrival={arrival}
          onArrived={() => setArrival(undefined)}
          nextMissionRoom={null}
          collapsed={NONE}
          lockedDoor={null}
          roomName={(other) => ROOMS[other]}
          onExit={setRoom}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {(["step", "secret", "far", "stay"] as Entry[]).map((how) => (
            <Pressable
              key={how}
              onPress={() => walkIn(how)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: colors.border,
              }}
            >
              <AppText variant="caption">{`walk in: ${how}`}</AppText>
            </Pressable>
          ))}
        </View>
        <AppText variant="h2">Map</AppText>
        <ManorMap
          state={SAMPLE}
          mySeat={0}
          selectable={[]}
          onSelect={() => {}}
          nameOf={(seat) => (seat === 0 ? "You" : `#${seat}`)}
          roomName={(other) => ROOMS[other]}
        />
        <Pressable onPress={() => setAvatars(!avatars)}>
          <AppText variant="caption" color="primary">
            {avatars ? "Avatars: on" : "Avatars: off (pawns)"}
          </AppText>
        </Pressable>
        <Pressable onPress={() => setMission(!mission)}>
          <AppText variant="caption" color="primary">
            {mission ? "Mission room: on" : "Mission room: off"}
          </AppText>
        </Pressable>
        <Pressable onPress={() => setDoor(!door)}>
          <AppText variant="caption" color="primary">
            {door ? "Secret door: on" : "Secret door: off"}
          </AppText>
        </Pressable>
        <Pressable onPress={() => setActive(!active)}>
          <AppText variant="caption" color="primary">
            {active ? "Object glowing — tap it" : "Make the object glow again"}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
