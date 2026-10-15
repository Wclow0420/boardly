// The shelter on a Skia canvas: snow outside, the fire inside, the
// storeroom shelves holding exactly as much food as the storeroom does,
// and at night the dark that only the fire breaks. At night the player
// taps a post (storeroom, door or bed) to choose it.

import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import {
  Darkness,
  IsoCanvas,
  IsoClip,
  IsoEffects,
  IsoLayer,
  Snow,
  useIsoClock,
} from "@/components/iso";
import { SPOTS } from "@/components/iso/room";
import type { Look } from "@/features/mascot/dress";
import { FEET, MascotFigure } from "@/features/mascot/MascotStage";
import { BOX as MASCOT_BOX } from "@/features/mascot/rig";
import { fontFamily, useTheme } from "@/theme";
import type { Shape } from "@/components/iso/kit";
import { POSTS, POST_COLOR, type Post } from "./logic";
import {
  SCENE_HEIGHT,
  SCENE_WIDTH,
  shelterOutline,
  shelterPawn,
  shelterPawnTop,
  shelterPoint,
  shelterScene,
} from "./shelterScenes";

const HALO = "#0B0E16";
const PAPER = "#E9E2CF";
const VIEW_BOX = `0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`;

/** Someone shown in the shelter. */
export interface ShelterPerson {
  seat: number;
  label: string;
  me: boolean;
  /** At a night post; otherwise by the fire. */
  post?: Post;
  /** Their mascot, standing in for a pawn. */
  look?: Look;
}

export interface ShelterSceneProps {
  food: number;
  night: boolean;
  people: ShelterPerson[];
  /** The posts can be tapped; with the names to say what each does. */
  choosing?: { labels: Record<Post, string>; onChoose: (post: Post) => void };
  /** Something covers the scene: it stops moving. */
  paused?: boolean;
}

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
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={shape.opacity}
        />
      ))}
    </>
  );
}

function Label({ x, y, text, fill }: { x: number; y: number; text: string; fill: string }) {
  const common = { x, y, fontSize: 6.5, fontFamily: fontFamily.semiBold, textAnchor: "middle" as const };
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

const short = (name: string) => (name.length > 7 ? `${name.slice(0, 6)}…` : name);

/** Where a mascot stands on a spot: its box in the shelter's drawing,
 *  feet on the spot, a little taller than a pawn; and above its head,
 *  for its name. */
function mascotAt(spot: [number, number]) {
  const [bx, by] = shelterPoint(spot[0], spot[1], 0);
  const [, ty] = shelterPawnTop(spot);
  const s = ((by - ty) * 1.6) / 90;
  return {
    x: bx - FEET.x * s,
    y: by - FEET.y * s,
    w: MASCOT_BOX[0] * s,
    h: MASCOT_BOX[1] * s,
    head: by - (FEET.y - 12) * s,
  };
}

export function ShelterScene({ food, night, people, choosing, paused = false }: ShelterSceneProps) {
  const { colors } = useTheme();
  const scene = useMemo(() => shelterScene(food, colors.primary), [food, colors.primary]);
  const outline = useMemo(() => shelterOutline(), []);
  const fire = useMemo(() => shelterPoint(0.42, 0.46, 0.1), []);

  const [still, setStill] = useState(false);
  const [away, setAway] = useState(AppState.currentState !== "active");
  const clock = useIsoClock(paused || away || still);
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      ?.then((on) => {
        if (live && on) setStill(true);
      })
      .catch(() => {});
    const watch = AppState.addEventListener("change", (status) => setAway(status !== "active"));
    return () => {
      live = false;
      watch.remove();
    };
  }, []);

  // the posts glow while one can be chosen
  useEffect(() => {
    if (!choosing || still) return;
    const step = (toValue: number) =>
      Animated.timing(pulse, { toValue, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [choosing, still, pulse]);

  // by the fire, nearest the middle first; a post when someone has one
  const placed = people.map((person, index) => ({
    person,
    spot: person.post ? scene.stands[person.post] : SPOTS[index % SPOTS.length],
  }));
  const byDepth = [...placed].sort((a, b) => a.spot[0] + a.spot[1] - (b.spot[0] + b.spot[1]));
  const [scale, setScale] = useState(0);

  const place = (x: number, y: number, w: number, h: number) =>
    ({
      position: "absolute",
      left: `${(x / SCENE_WIDTH) * 100}%`,
      top: `${(y / SCENE_HEIGHT) * 100}%`,
      width: `${(w / SCENE_WIDTH) * 100}%`,
      height: `${(h / SCENE_HEIGHT) * 100}%`,
    }) as const;

  return (
    <Animated.View
      style={styles.frame}
      onLayout={(event) => setScale(event.nativeEvent.layout.width / SCENE_WIDTH)}
    >
      <IsoCanvas width={SCENE_WIDTH} height={SCENE_HEIGHT}>
        {/* it snows all round the house */}
        <Snow x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} clock={clock} />
        <IsoLayer shapes={scene.shapes} />
        <IsoEffects effects={scene.effects} layer={0} clock={clock} />
        <IsoEffects effects={scene.effects} layer={2} clock={clock} />
        {night ? (
          <IsoClip d={outline}>
            <Darkness
              x={fire[0]}
              y={fire[1]}
              radius={78}
              width={SCENE_WIDTH}
              height={SCENE_HEIGHT}
              clock={clock}
            />
          </IsoClip>
        ) : null}
      </IsoCanvas>

      <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill} pointerEvents="none">
        {byDepth
          .filter(({ person }) => !person.look)
          .map(({ person, spot }) => (
            <Shapes
              key={person.seat}
              shapes={shelterPawn(spot, person.me ? colors.primary : colors.info, PAPER)}
            />
          ))}
      </Svg>

      {/* everyone in the house as their mascot, alive, far before near */}
      {scale > 0
        ? byDepth.map(({ person, spot }) => {
            if (!person.look) return null;
            const m = mascotAt(spot);
            return (
              <View key={person.seat} pointerEvents="none" style={place(m.x, m.y, m.w, m.h)}>
                <MascotFigure
                  look={person.look}
                  width={m.w * scale}
                  seed={`seat-${person.seat}`}
                  paused={paused || away || still}
                />
              </View>
            );
          })
        : null}

      <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill} pointerEvents="none">
        {placed.map(({ person, spot }) => {
          const [x, y] = person.look ? [shelterPawnTop(spot)[0], mascotAt(spot).head] : shelterPawnTop(spot);
          return (
            <Label
              key={person.seat}
              x={x}
              y={y - 2}
              text={short(person.label)}
              fill={person.me ? colors.primary : PAPER}
            />
          );
        })}
      </Svg>

      {choosing ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) },
            ]}
          >
            <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill}>
              {POSTS.map((post) => {
                const spot = scene.posts[post];
                return (
                  <G key={post}>
                    <Circle cx={spot.x} cy={spot.y} r={spot.r} fill={POST_COLOR[post]} opacity={0.14} />
                    <Circle
                      cx={spot.x}
                      cy={spot.y}
                      r={spot.r}
                      fill="none"
                      stroke={POST_COLOR[post]}
                      strokeWidth={1.3}
                    />
                  </G>
                );
              })}
            </Svg>
          </Animated.View>
          <Svg viewBox={VIEW_BOX} style={StyleSheet.absoluteFill} pointerEvents="none">
            {POSTS.map((post) => {
              const spot = scene.posts[post];
              return (
                <Label
                  key={post}
                  x={spot.x}
                  y={spot.y + spot.r + 7}
                  text={choosing.labels[post]}
                  fill={POST_COLOR[post]}
                />
              );
            })}
          </Svg>
          {POSTS.map((post) => {
            const spot = scene.posts[post];
            const reach = spot.r * 1.25;
            return (
              <Pressable
                key={post}
                accessibilityRole="button"
                accessibilityLabel={choosing.labels[post]}
                onPress={() => choosing.onChoose(post)}
                style={[place(spot.x - reach, spot.y - reach, reach * 2, reach * 2), styles.round]}
              />
            );
          })}
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: SCENE_WIDTH / SCENE_HEIGHT },
  round: { borderRadius: 999 },
});
