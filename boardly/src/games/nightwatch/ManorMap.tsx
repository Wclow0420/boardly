import { View } from "react-native";
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { fontFamily, useTheme } from "@/theme";
import { ROOMS, ROOM_COLOR, type NightwatchState } from "./logic";
import { GameText as AppText } from "./GameText";
import {
  MANOR_HEIGHT,
  MANOR_WIDTH,
  floorPath,
  floorPoint,
  manorShapes,
  type Tint,
} from "./manorShapes";

/** Someone standing in a room, as this player knows it. */
interface Marker {
  key: string;
  label: string;
  /** `unknown` is company I couldn't make out; `note` is my own guess. */
  kind: "me" | "decoy" | "other" | "unknown" | "note";
}

const HALO = "#0B0E16";
const PAPER = "#E9E2CF";
const SHADE = "#3A4263";

/** Who I know to be in each room on the night being looked at, and
 *  where my own notes put everyone else. */
function markersByRoom(
  state: NightwatchState,
  mySeat: number,
  round: number,
  decoy: number | undefined,
  notes: Record<number, number>,
  nameOf: (seat: number) => string,
  you: string,
  decoyLabel: string
): Map<number, Marker[]> {
  const rooms = new Map<number, Marker[]>();
  const known = new Set<number>([mySeat]);
  const put = (room: number, marker: Marker) =>
    rooms.set(room, [...(rooms.get(room) ?? []), marker]);
  const person = (room: number, seat: number) => {
    known.add(seat);
    put(
      room,
      seat === mySeat
        ? { key: "me", label: you, kind: "me" }
        : { key: `seat-${seat}`, label: nameOf(seat), kind: "other" }
    );
  };
  const tonight = round === state.round;

  // once the game is over everyone's place is shown
  if (tonight && state.phase === "finished" && state.positions) {
    state.positions.forEach((room, seat) => person(room, seat));
    return rooms;
  }

  // on a night gone by I am where I patrolled; tonight, where I stand
  const patrol = state.log.find((note) => note.kind === "patrol" && note.round === round);
  const myRoom = tonight ? state.myRoom : patrol?.kind === "patrol" ? patrol.room : null;
  if (myRoom !== null) {
    put(myRoom, { key: "me", label: you, kind: "me" });
    // the people I saw on that patrol, while I'm still in that room
    if (patrol?.kind === "patrol" && patrol.room === myRoom) {
      for (const seat of patrol.seen ?? []) person(myRoom, seat);
      // in a blackout there was somebody, but no telling who
      if (patrol.seen === null && patrol.company) {
        put(myRoom, { key: "someone", label: "?", kind: "unknown" });
      }
    }
  }
  const fake = tonight ? (decoy ?? state.myFake) : patrol?.kind === "patrol" ? patrol.fake : null;
  if (fake !== null && fake !== undefined) {
    put(fake, { key: "decoy", label: decoyLabel, kind: "decoy" });
  }
  for (const [seat, room] of Object.entries(notes)) {
    if (!known.has(Number(seat))) {
      put(room, { key: `note-${seat}`, label: nameOf(Number(seat)), kind: "note" });
    }
  }
  return rooms;
}

/** Names are cut to fit beside a dot. */
const short = (name: string) => (name.length > 9 ? `${name.slice(0, 8)}…` : name);

const NAME_SIZE = 7.5;

/** How wide a name is drawn, near enough: Chinese characters are square,
 *  Latin letters a little over half as wide. */
const widthOf = (text: string) =>
  [...text].reduce((sum, char) => sum + (char > "\u2e7f" || char === "■" || char === "□" ? 1 : 0.58), 0) * NAME_SIZE;

/** Each room's name on a plate, well inside its own floor: the people
 *  stand behind it, and no name strays next door. Tonight's mission
 *  room and the next one are picked out in their colours. */
export function RoomNames({
  roomName,
  missionRoom = null,
  nextRoom = null,
}: {
  roomName: (room: number) => string;
  missionRoom?: number | null;
  nextRoom?: number | null;
}) {
  const { colors } = useTheme();
  return (
    <>
      {ROOMS.map((id, room) => {
        const [x, y] = floorPoint(room, 0.74, 0.74);
        // ■ tonight's mission, □ the next one, as in the legend
        const mark = missionRoom === room ? "■ " : nextRoom === room ? "□ " : "";
        const name = `${mark}${roomName(room)}`;
        const width = widthOf(name) + 8;
        const tint =
          missionRoom === room ? colors.danger : nextRoom === room ? colors.info : null;
        return (
          <G key={id}>
            <Rect
              x={x - width / 2}
              y={y - NAME_SIZE - 1}
              width={width}
              height={NAME_SIZE + 4.5}
              rx={(NAME_SIZE + 4.5) / 2}
              fill={HALO}
              fillOpacity={0.82}
              stroke={tint ?? ROOM_COLOR[id]}
              strokeWidth={tint ? 1.2 : 0.6}
            />
            <SvgText
              x={x}
              y={y}
              fontSize={NAME_SIZE}
              fontFamily={fontFamily.semiBold}
              textAnchor="middle"
              fill={ROOM_COLOR[id]}
            >
              {name}
            </SvgText>
          </G>
        );
      })}
    </>
  );
}

const NO_ROOMS: number[] = [];

/** The empty manor, every room named: the map as a picture, for the rules. */
export function ManorPicture({ roomName }: { roomName: (room: number) => string }) {
  const { colors } = useTheme();
  const shapes = manorShapes({
    accent: colors.primary,
    collapsed: NO_ROOMS,
    lockedDoor: null,
    secretDoors: [],
    tints: {},
  });
  return (
    <Svg
      viewBox={`0 0 ${MANOR_WIDTH} ${MANOR_HEIGHT}`}
      style={{ width: "100%", aspectRatio: MANOR_WIDTH / MANOR_HEIGHT }}
    >
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
      <RoomNames roomName={roomName} />
    </Svg>
  );
}

/** Spots on a room's floor for `count` markers: rows across the screen. */
function spots(room: number, count: number): [number, number][] {
  const perRow = 3;
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const across = (i % perRow) - (inRow - 1) / 2;
    const depth = 0.4 - row * 0.22;
    return floorPoint(room, depth + across * 0.26, depth - across * 0.26, 0.04);
  });
}

export interface ManorMapProps {
  state: NightwatchState;
  mySeat: number;
  /** The night being looked at; tonight when left out. */
  round?: number;
  /** My own notes for that night: the room I put each seat in. */
  notes?: Record<number, number>;
  /** Rooms the player may tap right now. */
  selectable: number[];
  selected?: number;
  /** The decoy room being picked, before it is sent. */
  decoy?: number;
  onSelect: (room: number) => void;
  nameOf: (seat: number) => string;
  roomName: (room: number) => string;
}

const NO_NOTES: Record<number, number> = {};

/** The manor drawn as one house: rooms joined by doors, with a dot for
 *  the player and for everyone they can see. */
export function ManorMap({
  state,
  mySeat,
  round = state.round,
  notes = NO_NOTES,
  selectable,
  selected,
  decoy,
  onSelect,
  nameOf,
  roomName,
}: ManorMapProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const over = state.phase === "finished";
  const tonight = round === state.round;
  // the mission of the night being looked at; none once the game is over
  const missionRoom = tonight
    ? over
      ? null
      : state.missionRoom
    : (state.results.find((result) => result.round === round)?.room ?? null);
  const nextRoom = tonight && !over ? state.nextMissionRoom : null;

  const tints: Record<number, Tint | undefined> = {};
  ROOMS.forEach((_, room) => {
    const mission = missionRoom === room;
    const next = nextRoom === room;
    const isSelected = selected === room;
    const canGo = selectable.includes(room);
    const tint: Tint = {};
    if (isSelected) {
      tint.fill = colors.primary;
      tint.fillOpacity = 0.4;
      tint.stroke = colors.primary;
    } else {
      if (mission) {
        tint.fill = colors.danger;
        tint.fillOpacity = 0.28;
        tint.stroke = colors.danger;
      } else if (next) {
        tint.stroke = colors.info;
        tint.dash = "4 3";
      }
      if (canGo) {
        tint.stroke = PAPER;
        tint.dash = "4 3";
      }
    }
    if (tint.fill || tint.stroke) tints[room] = tint;
  });

  const shapes = manorShapes({
    accent: colors.primary,
    collapsed: state.collapsed,
    lockedDoor: tonight ? state.lockedDoor : null,
    secretDoors: state.doors,
    tints,
  });
  const markers = markersByRoom(
    state,
    mySeat,
    round,
    decoy,
    notes,
    nameOf,
    t("nightwatch.map.you"),
    t("nightwatch.map.decoy")
  );

  const label = (
    key: string,
    x: number,
    y: number,
    text: string,
    fill: string,
    size: number
  ) => (
    <G key={key}>
      <SvgText
        x={x}
        y={y}
        fontSize={size}
        fontFamily={fontFamily.semiBold}
        textAnchor="middle"
        fill={HALO}
        stroke={HALO}
        strokeWidth={2.4}
        strokeLinejoin="round"
      >
        {text}
      </SvgText>
      <SvgText
        x={x}
        y={y}
        fontSize={size}
        fontFamily={fontFamily.semiBold}
        textAnchor="middle"
        fill={fill}
      >
        {text}
      </SvgText>
    </G>
  );

  return (
    <View>
      <Svg
        viewBox={`0 0 ${MANOR_WIDTH} ${MANOR_HEIGHT}`}
        style={{ width: "100%", aspectRatio: MANOR_WIDTH / MANOR_HEIGHT }}
      >
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

        <RoomNames roomName={roomName} missionRoom={missionRoom} nextRoom={nextRoom} />

        {[...markers].map(([room, here]) => {
          const at = spots(room, here.length);
          return here.map((marker, i) => {
            const [x, y] = at[i];
            const me = marker.kind === "me";
            const mine = me || marker.kind === "decoy";
            // a decoy and a note are drawn hollow: neither is a sighting
            const hollow = marker.kind === "decoy" || marker.kind === "note";
            return (
              <G key={`${room}-${marker.key}`}>
                <Circle
                  cx={x}
                  cy={y}
                  r={me ? 4.2 : 3.4}
                  fill={
                    hollow
                      ? HALO
                      : me
                        ? colors.primary
                        : marker.kind === "unknown"
                          ? SHADE
                          : colors.info
                  }
                  stroke={marker.kind === "decoy" ? colors.primary : PAPER}
                  strokeWidth={1.2}
                  strokeDasharray={hollow ? "2 1.5" : undefined}
                />
                {label(
                  "label",
                  x,
                  // neighbours take turns above and below so names don't collide
                  i % 2 === 0 ? y - 6.5 : y + 11,
                  short(marker.label),
                  mine ? colors.primary : marker.kind === "note" ? colors.textMuted : colors.text,
                  7
                )}
              </G>
            );
          });
        })}

        {/* touch targets, one per floor, above everything else */}
        {selectable.map((room) => (
          <Path
            key={`tap-${room}`}
            d={floorPath(room)}
            fill="#000000"
            fillOpacity={0.01}
            onPress={() => onSelect(room)}
          />
        ))}
      </Svg>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
          marginTop: 6,
        }}
      >
        {missionRoom !== null ? (
          <AppText variant="tiny" style={{ color: colors.danger }}>
            {`■ ${t(tonight ? "nightwatch.map.mission" : "nightwatch.map.missionThen")}: ${roomName(missionRoom)}`}
          </AppText>
        ) : null}
        {nextRoom !== null ? (
          <AppText variant="tiny" style={{ color: colors.info }}>
            {`□ ${t("nightwatch.map.next")}: ${roomName(nextRoom)}`}
          </AppText>
        ) : null}
        {state.collapsed.length > 0 ? (
          <AppText variant="tiny" color="textSubtle">
            {`✕ ${t("nightwatch.map.sealed")}: ${state.collapsed.map(roomName).join(", ")}`}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
