import { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
} from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import { fontFamily, useTheme } from "@/theme";
import { ROOMS, ROOM_COLOR } from "./logic";
import { SCENE_HEIGHT, SCENE_WIDTH, type Shape } from "./manorShapes";
import {
  SPOTS,
  buildScene,
  pawnShapes,
  pawnTop,
  sealShapes,
  type Motion,
  type SceneExit,
} from "./roomScenes";

const GLOW = "#FFE3A8";
const HALO = "#0B0E16";
const PAPER = "#E9E2CF";
const SHADE = "#3A4263";

/** Someone standing in the room, as this player knows it. `shadow` is
 *  company whose face can't be made out. */
export interface ScenePerson {
  key: string;
  label: string;
  kind: "me" | "other" | "shadow";
}

export interface RoomSceneProps {
  /** Index of the room the player stands in. */
  room: number;
  /** The room's object is waiting to be touched. */
  active: boolean;
  onTouch: () => void;
  /** What touching the object does, for screen readers. */
  touchLabel: string;
  /** Who is here, the player first. */
  people: ScenePerson[];
  missionRoom: number | null;
  nextMissionRoom: number | null;
  collapsed: number[];
  lockedDoor: number[] | null;
  roomName: (room: number) => string;
  /** A door was tapped. */
  onExit: (room: number) => void;
  /** The room's book can be opened; it glows until it has been. */
  book?: { label: string; unread: boolean; onOpen: () => void };
}

const VIEW_BOX = `0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`;
const ease = Easing.inOut(Easing.sin);

/** Names are cut to fit over a pawn. */
const short = (name: string) => (name.length > 7 ? `${name.slice(0, 6)}…` : name);

function Shapes({ shapes }: { shapes: Shape[] }) {
  return (
    <>
      {shapes.map((shape, index) => (
        <Path
          key={index}
          d={shape.d}
          fill={shape.fill ?? "none"}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={shape.dash}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={shape.opacity}
        />
      ))}
    </>
  );
}

function Layer({ shapes }: { shapes: Shape[] }) {
  return (
    <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
      <Shapes shapes={shapes} />
    </Svg>
  );
}

/** Text with a dark halo, legible over any part of the room. */
function Label({
  x,
  y,
  text,
  fill,
  size = 6.5,
}: {
  x: number;
  y: number;
  text: string;
  fill: string;
  size?: number;
}) {
  const common = {
    x,
    y,
    fontSize: size,
    fontFamily: fontFamily.semiBold,
    textAnchor: "middle" as const,
  };
  return (
    <G>
      <SvgText {...common} fill={HALO} stroke={HALO} strokeWidth={2.4} strokeLinejoin="round">
        {text}
      </SvgText>
      <SvgText {...common} fill={fill}>
        {text}
      </SvgText>
    </G>
  );
}

/** The object's answer to a touch: a bell swings out and settles, a
 *  ledger is lifted and put back, a hatch slides open and shut. */
function answer(value: Animated.Value, motion: Motion): Animated.CompositeAnimation {
  const to = (toValue: number, duration: number) =>
    Animated.timing(value, { toValue, duration, easing: ease, useNativeDriver: true });
  return motion.kind === "swing"
    ? Animated.sequence([
        to(1, 180),
        to(-0.75, 300),
        to(0.5, 280),
        to(-0.28, 260),
        to(0.12, 240),
        to(0, 220),
      ])
    : Animated.sequence([to(1, 280), Animated.delay(520), to(0, 420)]);
}

/** A slow, endless there-and-back between two values. */
function breathe(value: Animated.Value, from: number, to: number, duration: number) {
  const step = (toValue: number) =>
    Animated.timing(value, { toValue, duration, easing: ease, useNativeDriver: true });
  return Animated.loop(Animated.sequence([step(to), step(from)]));
}

/** The room the player is standing in, filling the page: its doors to
 *  the rooms next door, the watchers they can see, and the thing that
 *  works the room (the bell, the ledger, the cauldron...), which glows
 *  while it can be used and moves when it is touched. */
export function RoomScene({
  room,
  active,
  onTouch,
  touchLabel,
  people,
  missionRoom,
  nextMissionRoom,
  collapsed,
  lockedDoor,
  roomName,
  onExit,
  book,
}: RoomSceneProps) {
  const { colors } = useTheme();
  const scene = useMemo(
    () => buildScene(room, { accent: colors.primary, collapsed, lockedDoor }),
    [room, colors.primary, collapsed, lockedDoor]
  );
  const { touch, motion } = scene;

  // drawing units to points, for the moves that are lengths
  const [scale, setScale] = useState(1);
  const [still, setStill] = useState(false);
  const [pulse] = useState(() => new Animated.Value(0));
  const [flicker] = useState(() => new Animated.Value(1));
  const [drift] = useState(() => new Animated.Value(1));
  const [act] = useState(() => new Animated.Value(0));
  const [beckon] = useState(() => new Animated.Value(0));
  const [ripple] = useState(() => new Animated.Value(1));
  const [enter] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      ?.then((on) => {
        if (live && on) setStill(true);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // candlelight, and the slower drift of steam and fireflies
  useEffect(() => {
    if (still) return;
    const loops = [breathe(flicker, 1, 0.5, 620), breathe(drift, 1, 0.3, 1700)];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [still, flicker, drift]);

  // while the object can be used it glows, and stirs a little
  useEffect(() => {
    if (!active) return;
    const loops = [breathe(pulse, 0, 1, 900)];
    if (!still) loops.push(breathe(beckon, motion.kind === "swing" ? -0.1 : 0, 0.1, 1300));
    loops.forEach((loop) => loop.start());
    return () => {
      loops.forEach((loop) => loop.stop());
      beckon.setValue(0);
    };
  }, [active, still, motion.kind, pulse, beckon]);

  // walking into a room: it comes up out of the dark
  useEffect(() => {
    act.setValue(0);
    if (still) return;
    enter.setValue(0);
    const walk = Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    walk.start();
    return () => walk.stop();
  }, [room, still, act, enter]);

  const press = () => {
    if (!still) {
      answer(act, motion).start();
      ripple.setValue(0);
      Animated.timing(ripple, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    if (active) onTouch();
  };

  const moved = Animated.add(act, beckon);
  const origin = (pivot: [number, number]) => `${pivot[0] * scale}px ${pivot[1] * scale}px`;
  const propStyle =
    motion.kind === "swing"
      ? {
          transformOrigin: origin(motion.pivot),
          transform: [
            {
              rotate: moved.interpolate({
                inputRange: [-1, 1],
                outputRange: [`-${motion.degrees}deg`, `${motion.degrees}deg`],
              }),
            },
          ],
        }
      : motion.kind === "pop"
        ? {
            transformOrigin: origin(motion.pivot),
            transform: [
              {
                translateY: moved.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -motion.lift * scale],
                }),
              },
              { scale: moved.interpolate({ inputRange: [0, 1], outputRange: [1, motion.scale] }) },
            ],
          }
        : {
            transform: [
              {
                translateX: moved.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, motion.dx * scale],
                }),
              },
              {
                translateY: moved.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, motion.dy * scale],
                }),
              },
            ],
          };

  /** A box of the drawing, as a place on the page. */
  const place = (x: number, y: number, w: number, h: number) =>
    ({
      position: "absolute",
      left: `${(x / SCENE_WIDTH) * 100}%`,
      top: `${(y / SCENE_HEIGHT) * 100}%`,
      width: `${(w / SCENE_WIDTH) * 100}%`,
      height: `${(h / SCENE_HEIGHT) * 100}%`,
    }) as const;

  // the touch target is a little larger than the glow it sits on
  const reach = touch.r * 1.3;
  const standing = people.slice(0, SPOTS.length).map((person, index) => ({
    person,
    spot: SPOTS[index],
  }));
  // far before near, so a watcher in front hides the one behind
  const byDepth = [...standing].sort(
    (a, b) => a.spot[0] + a.spot[1] - (b.spot[0] + b.spot[1])
  );
  const sealed = missionRoom === room;

  const exitLabel = (exit: SceneExit): { text: string; fill: string } => {
    const name = roomName(exit.room);
    if (exit.door !== "open") return { text: `✕ ${name}`, fill: "#8A93B5" };
    if (exit.room === missionRoom) return { text: `■ ${name}`, fill: colors.danger };
    if (exit.room === nextMissionRoom) return { text: `□ ${name}`, fill: colors.info };
    return { text: name, fill: ROOM_COLOR[ROOMS[exit.room]] };
  };
  const back = (exit: SceneExit) => exit.side === "left" || exit.side === "right";

  return (
    <Animated.View
      style={[styles.frame, { opacity: enter }]}
      onLayout={(event) => setScale(event.nativeEvent.layout.width / SCENE_WIDTH)}
    >
      <Layer shapes={scene.back} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, propStyle]}>
        <Layer shapes={scene.prop} />
      </Animated.View>
      <Layer shapes={scene.front} />

      {sealed ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { opacity: drift.interpolate({ inputRange: [0.3, 1], outputRange: [0.55, 1] }) },
          ]}
        >
          <Layer shapes={sealShapes(colors.danger)} />
        </Animated.View>
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
            ],
          },
        ]}
      >
        <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
          {byDepth.map(({ person, spot }) => (
            <Shapes
              key={person.key}
              shapes={
                person.kind === "me"
                  ? pawnShapes(spot, colors.primary, PAPER)
                  : person.kind === "other"
                    ? pawnShapes(spot, colors.info, PAPER)
                    : pawnShapes(spot, SHADE, "#6C769C")
              }
            />
          ))}
          {standing.map(({ person, spot }) => {
            const [x, y] = pawnTop(spot);
            return (
              <Label
                key={person.key}
                x={x}
                y={y - 2}
                text={short(person.label)}
                fill={person.kind === "me" ? colors.primary : PAPER}
              />
            );
          })}
          {scene.exits.map((exit) => (
            <Label key={exit.side} x={exit.x} y={exit.y} {...exitLabel(exit)} />
          ))}
        </Svg>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: flicker }]}>
        <Layer shapes={scene.glow} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: drift }]}>
        <Layer shapes={scene.glow2} />
      </Animated.View>

      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) },
          ]}
        >
          <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
            <Circle cx={touch.x} cy={touch.y} r={touch.r} fill={GLOW} opacity={0.16} />
            <Circle
              cx={touch.x}
              cy={touch.y}
              r={touch.r}
              fill="none"
              stroke={GLOW}
              strokeWidth={1.4}
            />
            <Circle
              cx={touch.x}
              cy={touch.y}
              r={touch.r + 4}
              fill="none"
              stroke={GLOW}
              strokeWidth={0.6}
              opacity={0.6}
            />
          </Svg>
        </Animated.View>
      ) : null}

      {book && scene.book && book.unread ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: drift }]}>
          <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
            <Circle cx={scene.book.x} cy={scene.book.y} r={scene.book.r} fill={GLOW} opacity={0.16} />
            <Circle
              cx={scene.book.x}
              cy={scene.book.y}
              r={scene.book.r}
              fill="none"
              stroke={GLOW}
              strokeWidth={1.1}
            />
          </Svg>
        </Animated.View>
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          place(touch.x - touch.r, touch.y - touch.r, touch.r * 2, touch.r * 2),
          styles.ripple,
          {
            opacity: ripple.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.8, 0] }),
            transform: [
              { scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] }) },
            ],
          },
        ]}
      />

      {scene.exits.map((exit) => (
        <Pressable
          key={exit.side}
          accessibilityRole="button"
          accessibilityLabel={roomName(exit.room)}
          onPress={() => onExit(exit.room)}
          style={
            back(exit)
              ? place(exit.x - 22, exit.y - 8, 44, 62)
              : place(exit.x - 24, exit.y - 22, 48, 28)
          }
        />
      ))}
      {book && scene.book ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={book.label}
          onPress={book.onOpen}
          style={[
            place(scene.book.x - 13, scene.book.y - 13, 26, 26),
            styles.round,
          ]}
        />
      ) : null}
      <Pressable
        accessible={active}
        accessibilityRole="button"
        accessibilityLabel={active ? touchLabel : undefined}
        onPress={press}
        style={[place(touch.x - reach, touch.y - reach, reach * 2, reach * 2), styles.round]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: SCENE_WIDTH / SCENE_HEIGHT },
  round: { borderRadius: 999 },
  ripple: { borderRadius: 999, borderWidth: 2, borderColor: GLOW },
});
