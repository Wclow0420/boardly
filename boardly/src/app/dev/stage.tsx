// Development only: the game stage, layout B, on Seal the Manor: the sign
// hanging over the scene with the night's seals, the room as large as the
// screen allows, the tools down its side (just their emblems), and the
// main button on a plinth. A design to look at before the game uses it.
// Open with boardly-dev://dev/stage.

import { Redirect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackIcon, Emblem } from "@/components/icons";
import { AppText, BezelOverlay, Button, IconButton } from "@/components/ui";
import { Glow, HangingSign, Plinth, ToolButton } from "@/features/game/stage/parts";
import { RoomScene } from "@/games/nightwatch/RoomScene";
import { GAMES } from "@/games/registry";
import { ROOMS, ROOM_COLOR, type NightwatchState } from "@/games/nightwatch/logic";
import { STARTER, type Look } from "@/features/mascot/dress";
import { COLOURS } from "@/features/mascot/skins";
import { ThemeScope, fontFamily } from "@/theme";

const MASCOTS: Record<string, Look> = {
  me: { skin: "glossy", colour: COLOURS.orange, wear: { ...STARTER.wear, hat: "crown", hand: "lantern" } },
  a: { skin: "glossy", colour: COLOURS.blue, wear: { eyes: "googly", mouth: "grin", hat: "beanie", top: "hoodie" } },
  b: { skin: "gingerbread", colour: COLOURS.orange, wear: { eyes: "icing", mouth: "icing", hat: "bow" } },
};
const STATE = { missionRoom: 6, nextMissionRoom: 3, collapsed: [], lockedDoor: null, doors: [] } as unknown as NightwatchState;
const TOOLS = [
  { emoji: "🗺️", label: "Map" },
  { emoji: "📓", label: "Notes", badge: true },
  { emoji: "📜", label: "Record" },
  { emoji: "🎭", label: "Role" },
  { emoji: "👥", label: "Watchers" },
];

/** A room's name on a small enamel tag in its colour, and what it is. */
function RoomTag({ kind, room, detail }: { kind: string; room: number; detail?: string }) {
  const color = ROOM_COLOR[ROOMS[room]];
  return (
    <View style={styles.tag}>
      <LinearGradient colors={["#1E2438", "#10141F"]} style={StyleSheet.absoluteFill} />
      <BezelOverlay r={10} t={2.5} />
      <View style={[styles.tagDot, { backgroundColor: color }]} />
      <AppText style={styles.tagKind}>{kind}</AppText>
      <AppText style={[styles.tagRoom, { color }]}>{ROOMS[room][0].toUpperCase() + ROOMS[room].slice(1)}</AppText>
      {detail ? <AppText style={styles.tagKind}>{detail}</AppText> : null}
    </View>
  );
}

export default function StagePreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState(true);
  const skin = GAMES.nightwatch?.skin;
  if (!__DEV__) return <Redirect href="/" />;

  const plinthH = 150 + insets.bottom;
  return (
    <ThemeScope colors={skin?.colors} active={skin !== undefined}>
      <View style={styles.screen}>
        {/* the night: deep blue, warm where the lantern light falls */}
        <LinearGradient colors={["#1A2238", "#0E1220", "#0B0E16"]} style={StyleSheet.absoluteFill} />
        <Glow size={520} color="#F28B4B" style={{ top: height * 0.24, left: width * 0.5 - 260 }} />

        {/* the scene, as large as the screen allows */}
        <View style={[styles.scene, { top: insets.top + 156, bottom: plinthH + 4 }]}>
          <RoomScene
            room={ROOMS.indexOf("kitchen")}
            active={active}
            onTouch={() => setActive(false)}
            touchLabel="Use the room"
            people={[
              { key: "me", label: "You", kind: "me" },
              { key: "a", label: "Ming", kind: "other" },
              { key: "b", label: "Mei", kind: "other" },
            ]}
            mascots={MASCOTS}
            missionRoom={STATE.missionRoom}
            nextMissionRoom={STATE.nextMissionRoom}
            collapsed={[]}
            lockedDoor={null}
            roomName={(r) => ROOMS[r]}
            onExit={() => {}}
            event={null}
            secretDoors={[]}
          />
        </View>

        {/* the tools down the side: just the emblems and their names */}
        <View style={[styles.tools, { top: insets.top + 196 }]}>
          {TOOLS.map((tool) => (
            <ToolButton key={tool.label} emoji={tool.emoji} label={tool.label} badge={tool.badge} onPress={() => {}} />
          ))}
        </View>

        {/* the sign hanging over it all, and tonight's rooms */}
        <View style={styles.top} pointerEvents="box-none">
          <HangingSign
            drop={insets.top + 26}
            width={Math.min(280, width - 120)}
            title="Night 3 of 5"
            subtitle="Patrol · you're in the Kitchen"
            enamel={["#2C3A68", "#141C3A", "#0A0F24"]}
            seals={[
              { kind: "won" },
              { kind: "lost" },
              { kind: "now", label: "3" },
              { kind: "ahead", label: "4" },
              { kind: "ahead", label: "4" },
            ]}
          />
          <View style={styles.tags}>
            <RoomTag kind="Mission" room={STATE.missionRoom} detail="· 3" />
            <RoomTag kind="Next" room={STATE.nextMissionRoom ?? 3} />
          </View>
        </View>
        <IconButton
          accessibilityLabel="Back"
          onPress={() => router.back()}
          size={40}
          style={[styles.corner, { top: insets.top + 6, left: 12 }]}
        >
          <LinearGradient colors={["#3A4258", "#1A1E2C"]} style={styles.stud} />
          <BezelOverlay r={20} t={3} />
          <BackIcon size={18} />
        </IconButton>
        <IconButton
          accessibilityLabel="Rules"
          onPress={() => {}}
          size={40}
          style={[styles.corner, { top: insets.top + 6, right: 12 }]}
        >
          <LinearGradient colors={["#3A4258", "#1A1E2C"]} style={styles.stud} />
          <BezelOverlay r={20} t={3} />
          <Emblem emoji="📖" size={20} />
        </IconButton>

        {/* the plinth and the main move */}
        <View style={styles.bottom}>
          <AppText style={styles.hint} numberOfLines={2}>
            Seal the Kitchen, or keep watch at its door.
          </AppText>
          <Plinth width={width} height={plinthH}>
            <Button label="Your move · Patrol" size="lg" style={styles.main} onPress={() => setActive(true)} />
          </Plinth>
        </View>
      </View>
    </ThemeScope>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.85)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0E16" },
  scene: { position: "absolute", left: 0, right: 52, justifyContent: "center" },
  tools: { position: "absolute", right: 4, gap: 14 },
  top: { position: "absolute", left: 0, right: 0, top: 0, alignItems: "center" },
  tags: { flexDirection: "row", gap: 8, marginTop: 6 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 11,
    borderRadius: 10,
    overflow: "hidden",
  },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagKind: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14, color: "#C8C2B0" },
  tagRoom: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 15 },
  corner: { position: "absolute" },
  stud: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, borderRadius: 20 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  hint: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#F1E6D2",
    textAlign: "center",
    paddingHorizontal: 30,
    marginBottom: 2,
    ...shadow,
  },
  main: { alignSelf: "stretch" },
});
