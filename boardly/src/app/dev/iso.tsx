// Development only: every room of Seal the Manor as the game draws it,
// on the Skia canvas, to look at on a real device. Open with
// boardly-dev://dev/iso.

import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { RoomScene } from "@/games/nightwatch/RoomScene";
import { ROOMS, type NightEvent } from "@/games/nightwatch/logic";
import { useTheme } from "@/theme";

const NONE: number[] = [];
const EVENTS: (NightEvent | null)[] = [null, "blackout", "fog", "storm", "collapse"];

export default function IsoPreview() {
  const { colors, spacing } = useTheme();
  const [room, setRoom] = useState(ROOMS.indexOf("kitchen"));
  const [active, setActive] = useState(true);
  const [event, setEvent] = useState<NightEvent | null>(null);
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
          ]}
          missionRoom={null}
          nextMissionRoom={null}
          collapsed={NONE}
          lockedDoor={null}
          roomName={(other) => ROOMS[other]}
          onExit={setRoom}
        />
        <Pressable onPress={() => setActive(!active)}>
          <AppText variant="caption" color="primary">
            {active ? "Object glowing — tap it" : "Make the object glow again"}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
