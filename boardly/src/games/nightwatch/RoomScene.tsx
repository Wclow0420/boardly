import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import {
  cancelAnimation,
  Easing as Ease,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import {
  Darkness,
  Dust,
  Flash,
  Fog,
  IsoCanvas,
  IsoClip,
  IsoEffects,
  IsoGroup,
  IsoLayer,
  Rain,
  useIsoClock,
} from "@/components/iso";
import { fontFamily, useTheme } from "@/theme";
import { heavyHaptic } from "@/utils/haptics";
import { ROOMS, ROOM_COLOR, type NightEvent } from "./logic";
import { SCENE_HEIGHT, SCENE_WIDTH, type Shape } from "./manorShapes";
import {
  SPOTS,
  buildScene,
  pawnShapes,
  pawnTop,
  sceneOutline,
  scenePoint,
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
  /** Tonight's event, shown in the room: blackout, fog, storm... */
  event?: NightEvent | null;
  /** Something covers the room (a popup): it stops moving. */
  paused?: boolean;
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

/** Shapes over the canvas, in the scene's units. */
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

const sway = Ease.inOut(Ease.sin);
const glide = (value: number, duration: number) => withTiming(value, { duration, easing: sway });

/** The object's answer to a touch: a bell swings out and settles, a
 *  ledger is lifted and put back, a hatch slides open and shut. */
function answer(value: SharedValue<number>, motion: Motion) {
  value.value =
    motion.kind === "swing"
      ? withSequence(
          glide(1, 180),
          glide(-0.75, 300),
          glide(0.5, 280),
          glide(-0.28, 260),
          glide(0.12, 240),
          glide(0, 220),
        )
      : withSequence(glide(1, 280), glide(1, 520), glide(0, 420));
}

/** How the moving part stands for a given swing of its motion. */
function placed(motion: Motion, v: number) {
  "worklet";
  if (motion.kind === "swing") return [{ rotate: (v * motion.degrees * Math.PI) / 180 }];
  if (motion.kind === "pop") {
    return [{ translateY: -motion.lift * v }, { scale: 1 + (motion.scale - 1) * v }];
  }
  return [{ translateX: motion.dx * v }, { translateY: motion.dy * v }];
}

/** A slow, endless there-and-back between two values. */
function breathe(value: Animated.Value, from: number, to: number, duration: number) {
  const step = (toValue: number) =>
    Animated.timing(value, {
      toValue,
      duration,
      easing: ease,
      useNativeDriver: true,
    });
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
  event = null,
  paused = false,
}: RoomSceneProps) {
  const { colors } = useTheme();
  const scene = useMemo(
    () =>
      buildScene(room, {
        accent: colors.primary,
        collapsed,
        lockedDoor,
        live: true,
      }),
    [room, colors.primary, collapsed, lockedDoor],
  );
  const { touch, motion } = scene;

  const [still, setStill] = useState(false);
  // with the app in the background nobody is looking either
  const [away, setAway] = useState(AppState.currentState !== "active");
  const resting = paused || away;
  // one clock for the canvas: when it stops, nothing is drawn
  const clock = useIsoClock(resting || still);
  const flash = useSharedValue(0);
  const [pulse] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => new Animated.Value(1));
  // the moving part, on the canvas: a touch, and a little stir while it waits
  const act = useSharedValue(0);
  const beckon = useSharedValue(0);
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

  useEffect(() => {
    const watch = AppState.addEventListener("change", (status) => setAway(status !== "active"));
    return () => watch.remove();
  }, []);

  // a storm: lightning now and then, felt as well as seen
  useEffect(() => {
    if (event !== "storm" || resting || still) return;
    let timer: ReturnType<typeof setTimeout>;
    const strike = () => {
      timer = setTimeout(
        () => {
          flash.value = withSequence(
            withTiming(1, { duration: 60 }),
            withTiming(0.25, { duration: 90 }),
            withTiming(0.85, { duration: 50 }),
            withTiming(0, { duration: 650 }),
          );
          heavyHaptic();
          strike();
        },
        4000 + Math.random() * 6000,
      );
    };
    strike();
    return () => clearTimeout(timer);
  }, [event, resting, still, flash]);

  // the slow breathing of the mission seal and an unread book
  useEffect(() => {
    if (still || resting) return;
    const loop = breathe(drift, 1, 0.3, 1700);
    loop.start();
    return () => loop.stop();
  }, [still, resting, drift]);

  // while the object can be used it glows, and stirs a little
  useEffect(() => {
    if (!active) return;
    const loop = breathe(pulse, 0, 1, 900);
    loop.start();
    if (!still && !resting) {
      const from = motion.kind === "swing" ? -0.1 : 0;
      beckon.value = from;
      beckon.value = withRepeat(withSequence(glide(0.1, 1300), glide(from, 1300)), -1);
    }
    return () => {
      loop.stop();
      cancelAnimation(beckon);
      beckon.value = 0;
    };
  }, [active, still, resting, motion.kind, pulse, beckon]);

  // walking into a room: it comes up out of the dark
  useEffect(() => {
    cancelAnimation(act);
    act.value = 0;
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
      answer(act, motion);
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

  const propTransform = useDerivedValue(() => placed(motion, act.value + beckon.value));
  const pivot =
    motion.kind === "slide" ? { x: 0, y: 0 } : { x: motion.pivot[0], y: motion.pivot[1] };

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
  const byDepth = [...standing].sort((a, b) => a.spot[0] + a.spot[1] - (b.spot[0] + b.spot[1]));
  const sealed = missionRoom === room;
  // in a blackout, all the light there is: the lantern at your own spot
  const lantern = scenePoint(SPOTS[0][0], SPOTS[0][1], 0.12);
  const outline = useMemo(() => sceneOutline(), []);

  const exitLabel = (exit: SceneExit): { text: string; fill: string } => {
    const name = roomName(exit.room);
    if (exit.door !== "open") return { text: `✕ ${name}`, fill: "#8A93B5" };
    if (exit.room === missionRoom) return { text: `■ ${name}`, fill: colors.danger };
    if (exit.room === nextMissionRoom) return { text: `□ ${name}`, fill: colors.info };
    return { text: name, fill: ROOM_COLOR[ROOMS[exit.room]] };
  };
  const back = (exit: SceneExit) => exit.side === "left" || exit.side === "right";

  return (
    <Animated.View style={[styles.frame, { opacity: enter }]}>
      {/* the room itself, its moving part and its live light, on Skia */}
      <IsoCanvas width={SCENE_WIDTH} height={SCENE_HEIGHT}>
        <IsoLayer shapes={scene.back} />
        <IsoEffects effects={scene.effects} layer={0} clock={clock} />
        <IsoGroup transform={propTransform} origin={pivot}>
          <IsoLayer shapes={scene.prop} />
          <IsoEffects effects={scene.effects} layer={1} clock={clock} />
        </IsoGroup>
        <IsoLayer shapes={scene.front} />
        <IsoEffects effects={scene.effects} layer={2} clock={clock} />
        {/* the night's weather lies over the room and nothing else */}
        <IsoClip d={outline}>
          {event === "fog" ? (
            <Fog x={0} y={70} width={SCENE_WIDTH} height={SCENE_HEIGHT - 70} clock={clock} />
          ) : null}
          {event === "collapse" ? (
            <Dust x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} clock={clock} />
          ) : null}
          {event === "storm" && ROOMS[room] === "garden" ? (
            <Rain x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} clock={clock} />
          ) : null}
          {event === "storm" ? (
            <Flash width={SCENE_WIDTH} height={SCENE_HEIGHT} flash={flash} />
          ) : null}
          {event === "blackout" ? (
            <Darkness
              x={lantern[0]}
              y={lantern[1]}
              radius={46}
              width={SCENE_WIDTH}
              height={SCENE_HEIGHT}
              clock={clock}
            />
          ) : null}
        </IsoClip>
      </IsoCanvas>

      {sealed ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: drift.interpolate({
                inputRange: [0.3, 1],
                outputRange: [0.55, 1],
              }),
            },
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
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-6, 0],
                }),
              },
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

      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              }),
            },
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
            <Circle
              cx={scene.book.x}
              cy={scene.book.y}
              r={scene.book.r}
              fill={GLOW}
              opacity={0.16}
            />
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
            opacity: ripple.interpolate({
              inputRange: [0, 0.15, 1],
              outputRange: [0, 0.8, 0],
            }),
            transform: [
              {
                scale: ripple.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1.9],
                }),
              },
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
          style={[place(scene.book.x - 13, scene.book.y - 13, 26, 26), styles.round]}
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
