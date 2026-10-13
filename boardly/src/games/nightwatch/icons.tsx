// The game's own icons, drawn on a 24-unit grid in one line weight so
// they sit together as a set and take any colour. They stand in for
// the emoji the game's text is written with (see GameText.tsx): an
// emoji listed in EMOJI_ICON is drawn as its icon wherever it appears.

import Svg, { Path } from "react-native-svg";

/** A circle as path data. */
const o = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;

const FLAME = "c1.5 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .5-2 2-4z";

/** An icon: outlines, and the parts that are filled in. */
interface Glyph {
  line?: string;
  fill?: string;
}

const GLYPHS = {
  night: {
    line: "M12 2v2M9 4h6l1 2H8zM8 6v11a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6M7 21h10M12 18v3",
    fill: `M12 9${FLAME}`,
  },
  mask: {
    line: "M4 5c5 2 11 2 16 0v6a8 8 0 0 1-16 0zM7.5 10h3M13.5 10h3M9.5 14.5c1.5 1.2 3.5 1.2 5 0",
  },
  bricks: {
    line: "M3 6h18v12H3zM3 10h18M3 14h18M9 6v4M15 6v4M6 10v4M12 10v4M18 10v4M9 14v4M15 14v4",
  },
  walk: {
    line: "M12.5 8l-2.5 5 3 3v5M10 13l-2 7M12.5 8l3.5 3h2.5M11.5 9.5L8 11v3",
    fill: o(13.5, 4.5, 1.7),
  },
  door: {
    line: "M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18",
    fill: o(14.5, 12.5, 1.1),
  },
  frame: { line: "M3 5h18v14H3zM6.5 8h11v8h-11zM6.5 15l3-3 2 2 2.5-3.5 3.5 4.5" },
  book: {
    line: "M12 6C10 4.5 7 4.5 4 5v13c3-.5 6-.5 8 1 2-1.5 5-1.5 8-1V5c-3-.5-6-.5-8 1zM12 6v13",
  },
  target: { line: `${o(12, 12, 9)}${o(12, 12, 5)}`, fill: o(12, 12, 1.6) },
  bell: {
    line: "M5.5 17c1.2-1 2-3 2-6a4.5 4.5 0 0 1 9 0c0 3 .8 5 2 6zM12 4v2.5M10.3 19.5a1.8 1.8 0 0 0 3.4 0",
  },
  scroll: {
    line: "M8 4h10v13a3 3 0 0 1-3 3H7a2 2 0 0 1-2-2v-1h8v1a2 2 0 0 0 2 2M8 4a2 2 0 0 0-2 2v11M10.5 8h5M10.5 11.5h5",
  },
  ghost: {
    line: "M5 20v-9a7 7 0 0 1 14 0v9l-2.4-2-2.3 2-2.3-2-2.3 2-2.3-2z",
    fill: `${o(9.5, 11, 1.2)}${o(14.5, 11, 1.2)}`,
  },
  steps: {
    fill: "M8 4.5c1.5 0 2.5 1.6 2.5 3.6S9.8 11.5 8.5 11.5 6 10 6 8 6.7 4.5 8 4.5zM7 13h3v1.5a1.5 1.5 0 0 1-3 0zM16 10c1.5 0 2.5 1.6 2.5 3.6S17.8 17 16.5 17 14 15.5 14 13.500s.7-3.5 2-3.5zM15 18.500h3V20a1.5 1.5 0 0 1-3 0z",
  },
  crown: { line: "M4 17.5L3 8l5 4 4-7 4 7 5-4-1 9.500zM4 21h16" },
  pray: { line: "M12 9v12M8 13h8M12 2v3M5.5 4.500l2 2.500M18.5 4.500l-2 2.5" },
  ballot: { line: "M3 12h18v8H3zM9 12V4h6v8M10.5 7.500l1.2 1.3 2-2.3" },
  dagger: { line: "M12 2l2.2 4v8H9.800V6zM7.5 14h9M12 14v6", fill: o(12, 21, 1.2) },
  key: { line: `${o(8, 8, 4)}M11 11l9 9M17.5 17.500l2-2M14.5 14.500l2-2` },
  hole: {
    line: "M3 14.500a9 4 0 1 0 18 0a9 4 0 1 0-18 0zM10 14V4M14 14V4M10 7h4M10 10.500h4",
    fill: "M6.5 14.500a5.5 2.2 0 1 0 11 0a5.5 2.2 0 1 0-11 0z",
  },
  lock: { line: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3", fill: o(12, 15.5, 1.4) },
  notebook: { line: "M7 3h12v18H7zM7 3H5v18h2M10.5 8h5M10.5 12h5" },
  up: {
    line: "M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.5 2.500L13 10h5a2 2 0 0 1 2 2.300l-1 6a2 2 0 0 1-2 1.700H7",
  },
  down: {
    line: "M7 13V4H4v9zM7 13l4 7c1.5 0 2.5-1 2.5-2.500L13 14h5a2 2 0 0 0 2-2.300l-1-6A2 2 0 0 0 17 4H7",
  },
  eye: { line: "M2 12c3-5 6.5-7 10-7s7 2 10 7c-3 5-6.5 7-10 7s-7-2-10-7z", fill: o(12, 12, 3) },
  goblet: { line: "M7 4h10c0 5-2 8.5-5 8.500S7 9 7 4zM12 12.500V20M8 20h8" },
  cauldron: {
    line: "M4 9h16M6 9c-1 6 1 10 6 10s7-4 6-10M8.5 18.500L7 21M15.5 18.500L17 21M10 6c0-1 1-1 1-2.500M14 6c0-1 1-1 1-2.5",
  },
  fog: { line: "M4 8h13M7 12h13M4 16h9M16 16h4" },
  moon: { line: "M19.5 14.500A8 8 0 0 1 9.5 4.500a8 8 0 1 0 10 10z" },
  dark: { line: o(12, 12, 9), fill: o(12, 12, 5.5) },
  church: { line: "M12 2v5M10 4h4M6 21v-9l6-5 6 5v9zM10.5 21v-4a1.5 1.5 0 0 1 3 0v4" },
  hush: {
    line: `${o(12, 12, 9)}M12 11v7.500M10 14.500h4`,
    fill: `${o(8.8, 9.5, 1.1)}${o(15.2, 9.5, 1.1)}`,
  },
  blocked: { line: `${o(12, 12, 9)}M5.6 5.600l12.8 12.8` },
  dizzy: {
    line: `${o(12, 12, 9)}M7.5 8.500l2.5 2.500M10 8.500L7.5 11M14 8.500l2.5 2.500M16.5 8.500L14 11${o(12, 16, 1.6)}`,
  },
  map: { line: "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" },
  news: { line: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 12h7M7 15h4" },
  candle: { line: "M9.5 12h5v8h-5zM7 20h10M12 9.500V12", fill: `M12 3${FLAME}` },
  orb: { line: `${o(12, 10, 7)}M7 21h10l-1.5-4h-7zM9 8a3.5 3.5 0 0 1 3-2` },
  next: { line: "M4 12h12M12 7l5 5-5 5M20.5 6v12" },
  horn: { line: "M4 10v4h3l8 4V6l-8 4zM18 9a4 4 0 0 1 0 6M20.3 6.500a7.5 7.5 0 0 1 0 11" },
  people: {
    line: `${o(9, 8, 3)}M3 20a6 6 0 0 1 12 0${o(17, 9, 2.5)}M16.5 14.200a5 5 0 0 1 4.5 5.8`,
  },
  leaf: { line: "M5 19C5 10 10 5 20 4c-1 10-6 15-15 15zM5 19l9-9" },
  cross: { line: "M6 6l12 12M18 6L6 18" },
  spark: {
    line: "M11 3l1.9 5.600L18.5 10.500l-5.6 1.900L11 18l-1.9-5.600L3.5 10.500l5.6-1.900z",
    fill: "M18.5 15l.800 2.2 2.2.800-2.2.800-.800 2.2-.800-2.2-2.2-.800 2.2-.800z",
  },
  letter: { line: "M3 6h18v12H3zM3 6l9 7 9-7" },
  check: { line: "M5 12.500l4.5 4.500L19 7.5" },
  storm: {
    line: "M7 15a4 4 0 0 1 .500-8 5 5 0 0 1 9.5 1.5 3.3 3.3 0 0 1 0 6.5",
    fill: "M12.5 12l-3 4.500h2.500l-1.5 4.5 4.5-6h-2.500l1.5-3z",
  },
  wait: { line: "M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" },
} satisfies Record<string, Glyph>;

export type IconName = keyof typeof GLYPHS;

/** The emoji the game's text is written with, and the icon each is
 *  drawn as. (Without the variation selector some of them carry.) */
export const EMOJI_ICON: Record<string, IconName> = {
  "🏮": "night",
  "🎭": "mask",
  "🧱": "bricks",
  "🚶": "walk",
  "🚪": "door",
  "🖼": "frame",
  "📖": "book",
  "🎯": "target",
  "🔔": "bell",
  "📜": "scroll",
  "👻": "ghost",
  "👣": "steps",
  "👑": "crown",
  "🙏": "pray",
  "🗳": "ballot",
  "🗡": "dagger",
  "🗝": "key",
  "🕳": "hole",
  "🔒": "lock",
  "📓": "notebook",
  "👍": "up",
  "👎": "down",
  "👀": "eye",
  "🍷": "goblet",
  "🍲": "cauldron",
  "🌫": "fog",
  "🌙": "moon",
  "🌑": "dark",
  "⛪": "church",
  "🤫": "hush",
  "🚫": "blocked",
  "😵": "dizzy",
  "🗺": "map",
  "🗞": "news",
  "🕯": "candle",
  "🔮": "orb",
  "🔜": "next",
  "📣": "horn",
  "👥": "people",
  "🍃": "leaf",
  "❌": "cross",
  "✨": "spark",
  "✉": "letter",
  "✅": "check",
  "⛈": "storm",
  "⏳": "wait",
};

/** Splits text at every emoji that has an icon; the odd parts are the
 *  emoji, with any variation selector dropped. */
const EMOJI = new RegExp(`(${Object.keys(EMOJI_ICON).join("|")})️?`, "u");
export const splitIcons = (text: string) => text.split(EMOJI);

export function GameIcon({
  name,
  size = 24,
  color,
}: {
  name: IconName;
  size?: number;
  color: string;
}) {
  const glyph: Glyph = GLYPHS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph.fill ? <Path d={glyph.fill} fill={color} /> : null}
      {glyph.line ? (
        <Path
          d={glyph.line}
          fill="none"
          stroke={color}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}
