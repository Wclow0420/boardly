import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, Pressable, StyleSheet, View } from "react-native";
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
  Burst,
  Darkness,
  Dust,
  Firefly,
  Flash,
  Fog,
  IsoCanvas,
  IsoClip,
  IsoEffects,
  IsoGroup,
  IsoLayer,
  LightPool,
  Rain,
  Seal,
  Vignette,
  useIsoClock,
} from "@/components/iso";
import type { Look } from "@/features/mascot/dress";
import { FEET, MascotFigure } from "@/features/mascot/MascotStage";
import { BOX as MASCOT_BOX } from "@/features/mascot/rig";
import { fontFamily, useTheme } from "@/theme";
import { heavyHaptic, successHaptic, tapHaptic, tickHaptic } from "@/utils/haptics";
import type { Arrival } from "./arrival";
import { ROOMS, ROOM_COLOR, type NightEvent } from "./logic";
import { SCENE_HEIGHT, SCENE_WIDTH, type Shape } from "./manorShapes";
import {
  SPOTS,
  buildScene,
  entryPoint,
  walkPrints,
  pawnShapes,
  pawnTop,
  sceneOutline,
  scenePoint,
  type Motion,
  type Payoff,
  type SceneExit,
} from "./roomScenes";

const GLOW = "#FFE3A8";
const NO_DOORS: number[][] = [];

/** How using the room feels in the hand. */
function feel(haptic: Payoff["haptic"]) {
  const later = (fn: () => void, ms: number) => setTimeout(fn, ms);
  switch (haptic) {
    case "ring":
      heavyHaptic();
      [220, 440, 660].forEach((ms) => later(tickHaptic, ms));
      break;
    case "bless":
      successHaptic();
      break;
    case "thud":
      heavyHaptic();
      break;
    case "clink":
      tickHaptic();
      later(tickHaptic, 90);
      break;
    case "ripple":
      [0, 140, 280].forEach((ms) => later(tickHaptic, ms));
      break;
    default:
      tapHaptic();
  }
}
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
  /** Secret doors joining two diagonal rooms, for good. */
  secretDoors?: number[][];
  /** The player has just come in this way: they are shown walking in. */
  arrival?: Arrival;
  /** They have reached their spot. */
  onArrived?: () => void;
  /** Players drawn as their own avatar figure instead of a pawn, by
   *  person key. */
  mascots?: Record<string, Look>;
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

/** Where a player's mascot stands on a spot: its box in the scene's
 *  drawing, feet on the spot, a little taller than a pawn; and the top
 *  of its head, for its name. */
function mascotAt(spot: [number, number]) {
  const [bx, by] = scenePoint(spot[0], spot[1], 0);
  const [, ty] = pawnTop(spot);
  const s = ((by - ty) * 1.6) / 90;
  return {
    x: bx - FEET.x * s,
    y: by - FEET.y * s,
    w: MASCOT_BOX[0] * s,
    h: MASCOT_BOX[1] * s,
    head: by - (FEET.y - 12) * s,
  };
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
  secretDoors = NO_DOORS,
  arrival,
  onArrived,
  mascots,
}: RoomSceneProps) {
  const { colors } = useTheme();
  // the server sends new copies of these arrays with every update: the
  // scene is rebuilt only when what's in them changes
  const walls = JSON.stringify([collapsed, lockedDoor]);
  const scene = useMemo(
    () =>
      buildScene(room, {
        accent: colors.primary,
        collapsed,
        lockedDoor,
        live: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `walls` stands for both
    [room, colors.primary, walls],
  );
  const { touch, motion } = scene;

  const [still, setStill] = useState(false);
  // with the app in the background nobody is looking either
  const [away, setAway] = useState(AppState.currentState !== "active");
  const resting = paused || away;
  // one clock for the canvas: when it stops, nothing is drawn
  const clock = useIsoClock(resting || still);
  const flash = useSharedValue(0);
  // a touch's payoff, and the echo of an echoing night: both play 0 → 1
  const burst = useSharedValue(1);
  // walking in: 0 at the doorway, 1 at your spot; the prints fade after
  const [walk] = useState(() => new Animated.Value(1));
  const [trace] = useState(() => new Animated.Value(0));
  const [scale, setScale] = useState(0);
  const arrived = useRef(onArrived);
  useEffect(() => {
    arrived.current = onArrived;
  });
  const echo = useSharedValue(1);
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

  // the player walks in from where they came, a tick for every step
  const walkKey = arrival?.key;
  useEffect(() => {
    if (!walkKey) return;
    if (still) {
      arrived.current?.();
      return;
    }
    walk.setValue(0);
    trace.setValue(1);
    const steps = [180, 420, 660, 900].map((ms) => setTimeout(tickHaptic, ms));
    const going = Animated.timing(walk, {
      toValue: 1,
      duration: 1150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    going.start(({ finished }) => {
      if (!finished) return;
      arrived.current?.();
      Animated.timing(trace, { toValue: 0, duration: 2600, useNativeDriver: true }).start();
    });
    return () => {
      steps.forEach(clearTimeout);
      going.stop();
      walk.setValue(1);
    };
  }, [walkKey, still, walk, trace]);

  // an echoing night: the room rings faintly now and then
  useEffect(() => {
    if (event !== "echo" || resting || still) return;
    const ring = setInterval(() => {
      echo.value = 0;
      echo.value = withTiming(1, { duration: 2600, easing: Ease.out(Ease.quad) });
    }, 5200);
    return () => clearInterval(ring);
  }, [event, resting, still, echo]);

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
    if (active) feel(scene.payoff.haptic);
    if (!still) {
      answer(act, motion);
      if (active) {
        burst.value = 0;
        burst.value = withTiming(1, { duration: scene.payoff.burst.duration, easing: Ease.linear });
      }
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
  const byDepth = [...standing]
    .filter(({ person }) => person.kind !== "me")
    .sort((a, b) => a.spot[0] + a.spot[1] - (b.spot[0] + b.spot[1]));
  const me = standing.find(({ person }) => person.kind === "me");
  const myMascot = me ? mascots?.[me.person.key] : undefined;
  /** A mascot's box, as a place on the page. */
  const mascotPlace = (spot: [number, number]) => {
    const m = mascotAt(spot);
    return place(m.x, m.y, m.w, m.h);
  };
  // the way in, from the doorway to your spot, and how far that is on the page
  const mySpot = scenePoint(SPOTS[0][0], SPOTS[0][1], 0);
  const entry = arrival ? entryPoint(room, arrival.from, arrival.how) : null;
  const prints = useMemo(
    () => (entry ? walkPrints(entry.at, mySpot, PAPER) : []),
    // the prints belong to one walk
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [walkKey],
  );
  const [dx, dy] = entry
    ? [(entry.at[0] - mySpot[0]) * scale, (entry.at[1] - mySpot[1]) * scale]
    : [0, 0];
  const bob = 1.6 * scale;
  const stepsAt = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  // the walk in, for your pawn or figure and its name
  const walkOpacity = entry?.fade
    ? walk.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] })
    : 1;
  const walking = [
    { translateX: walk.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] }) },
    {
      translateY: walk.interpolate({
        inputRange: stepsAt,
        outputRange: stepsAt.map((t, i) => dy * (1 - t) - (i % 2 ? bob : 0)),
      }),
    },
    { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
  ];
  const sealed = missionRoom === room;
  // in a blackout, all the light there is: the lantern at your own spot
  const lantern = scenePoint(SPOTS[0][0], SPOTS[0][1], 0.12);
  const outline = useMemo(() => sceneOutline(), []);
  // the seal under your own feet, as wide as the floor foreshortens it
  const seal = scenePoint(SPOTS[0][0], SPOTS[0][1], 0);
  const sealSize = SCENE_WIDTH / 190;
  const centre = scenePoint(0.5, 0.5, 0);
  // a secret door glows in the corner that leads to its room
  const passage = secretDoors
    .filter((door) => door.includes(room))
    .map((door) => {
      const other = door[0] === room ? door[1] : door[0];
      const [x, y] = [
        other % 3 > room % 3 ? 0.9 : 0.1,
        Math.floor(other / 3) > Math.floor(room / 3) ? 0.9 : 0.1,
      ];
      return scenePoint(x, y, 0.03);
    });

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
        {sealed ? (
          <Seal
            x={seal[0]}
            y={seal[1]}
            rx={20.8 * sealSize}
            ry={12 * sealSize}
            color={colors.danger}
            clock={clock}
          />
        ) : null}
        {passage.map(([x, y], index) => (
          <IsoGroup key={index}>
            <LightPool
              x={x}
              y={y}
              radius={26}
              color="#9CB8FF"
              flatten={0.58}
              strength={0.6}
              clock={clock}
            />
            <Firefly x={x} y={y - 6} clock={clock} />
          </IsoGroup>
        ))}
        <Burst spec={scene.payoff.burst} progress={burst} />
        {/* the night's weather lies over the room and nothing else */}
        <IsoClip d={outline}>
          {event === "insomnia" ? (
            <Vignette width={SCENE_WIDTH} height={SCENE_HEIGHT} color="#7C5CFF" clock={clock} />
          ) : null}
          {event === "echo" ? (
            <Burst
              spec={{
                kind: "ripples",
                x: centre[0],
                y: centre[1],
                size: 70,
                color: "#B9A8FF",
                duration: 2600,
                strength: 0.45,
              }}
              progress={echo}
            />
          ) : null}
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
          {byDepth
            .filter(({ person }) => !mascots?.[person.key])
            .map(({ person, spot }) => (
              <Shapes
                key={person.key}
                shapes={
                  person.kind === "other"
                    ? pawnShapes(spot, colors.info, PAPER)
                    : pawnShapes(spot, SHADE, "#6C769C")
                }
              />
            ))}
        </Svg>
        {/* the others as their mascots, alive, far before near */}
        {scale > 0
          ? byDepth.map(({ person, spot }) => {
              const look = mascots?.[person.key];
              if (!look) return null;
              return (
                <View key={person.key} style={mascotPlace(spot)}>
                  <MascotFigure
                    look={look}
                    width={mascotAt(spot).w * scale}
                    seed={person.key}
                    paused={resting || still}
                  />
                </View>
              );
            })
          : null}
        <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
          {byDepth.map(({ person, spot }) => {
            const [x, y] = mascots?.[person.key]
              ? [pawnTop(spot)[0], mascotAt(spot).head]
              : pawnTop(spot);
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

      {/* the prints of the walk in, fading once you have arrived */}
      {prints.length > 0 ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: trace }]}>
          <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
            <Shapes shapes={prints} />
          </Svg>
        </Animated.View>
      ) : null}

      {/* you: walking in from the doorway, then standing at your spot */}
      {me ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: walkOpacity, transform: walking }]}
        >
          {myMascot ? null : (
            <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
              <Shapes shapes={pawnShapes(me.spot, colors.primary, PAPER)} />
            </Svg>
          )}
        </Animated.View>
      ) : null}
      {/* your own mascot on its spot, waddling a little at every step */}
      {me && myMascot && scale > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            mascotPlace(me.spot),
            {
              opacity: walkOpacity,
              transformOrigin: "50% 92%",
              transform: [
                ...walking,
                {
                  rotate: walk.interpolate({
                    inputRange: stepsAt,
                    outputRange: stepsAt.map((_, i) =>
                      i === 0 || i === stepsAt.length - 1 ? "0deg" : i % 2 ? "7deg" : "-7deg",
                    ),
                  }),
                },
              ],
            },
          ]}
        >
          <MascotFigure
            look={myMascot}
            width={mascotAt(me.spot).w * scale}
            seed="me"
            paused={resting || still}
          />
        </Animated.View>
      ) : null}
      {/* your name, over your head wherever you are on the way in */}
      {me ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: walkOpacity, transform: walking }]}
        >
          <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
            <Label
              x={pawnTop(me.spot)[0]}
              y={(myMascot ? mascotAt(me.spot).head : pawnTop(me.spot)[1]) - 2}
              text={short(me.person.label)}
              fill={colors.primary}
            />
          </Svg>
        </Animated.View>
      ) : null}

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
