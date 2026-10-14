// Shelter's own icons, on a 24-unit grid in one line weight (the same
// style as Seal the Manor's set) so they take any colour. The game's
// text is written with emoji; GameText.tsx draws each emoji listed in
// EMOJI_ICON as its icon instead.

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

export const GLYPHS = {
  // resources
  food: { line: "M4 18v-5a8 6 0 0 1 16 0v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9 9.5l-1.5 3M13 8.5l-1.5 3M17 9.5l-1.5 3" },
  medicine: { line: "M8 4h8v4H8zM7 8h10v12H7zM12 11v6M9 14h6" },
  fire: { line: "M12 21a6 6 0 0 1-6-6c0-4 3-6 4-10 1 2 2 3 3 3 0-1 .5-2 1-3 2 2 4 5 4 10a6 6 0 0 1-6 6z", fill: `M12 14${FLAME}` },
  // places
  farm: { line: "M3 21V11l5-4 5 4v10zM6.5 21v-5h3v5M13 21h8M15 21v-4M18 21v-6M21 21v-3" },
  market: { line: "M4 9l1.5-5h13L20 9M4 9h16v3a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 12zM5.5 14v6h13v-6M10 20v-4h4v4" },
  hospital: { line: "M4 21V8l8-4 8 4v13zM12 9v6M9 12h6M10 21v-3h4v3" },
  // night posts
  store: { line: "M4 4h16v16H4zM4 10h16M4 15h16M8 7h2M14 12h2M9 17.5h3" },
  door: { line: "M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M8 8l8 6M16 8l-8 6", fill: o(15, 16.5, 0.9) },
  sleep: { line: "M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-8v5M7 11.5a1.5 1.5 0 1 0 0-.1" },
  // the Infected's acts
  steal: { line: "M7 12V6.5a1.5 1.5 0 0 1 3 0V11M10 6V4.5a1.5 1.5 0 0 1 3 0V11M13 6.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4.5a1.5 1.5 0 0 1 2.5-1.6L7 13" },
  open: { line: "M6 21V4h9v17M3 21h18M15 5l4 2v12l-4 2", fill: o(12.5, 12.5, 0.9) },
  sabotage: { line: `${o(12, 10, 7)}M9 21v-4M15 21v-4M12 21v-3M8 17h8`, fill: `${o(9.2, 10, 1.6)}${o(14.8, 10, 1.6)}` },
  stealth: { line: "M3 12c3-5 6.5-7 10-7M21 12c-1.3 2.2-2.8 3.8-4.4 4.9M10.6 18.8C7.6 18.3 5 16 3 12M3 3l18 18" },
  // people and states
  survivor: { line: `${o(12, 7, 3.5)}M5 21a7 7 0 0 1 14 0`, fill: `M18 3${FLAME}` },
  infected: { line: `${o(12, 12, 3)}M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M18.4 5.6l-2.9 2.9M8.5 15.5l-2.9 2.9` },
  cough: { line: `${o(9, 12, 6.5)}M6.5 10.5l1.5-.6M11.5 10.5L10 9.9M16.5 9l3-1.5M17 12h4M16.5 15l3 1.5`, fill: o(9, 15, 1.4) },
  injured: { line: "M8.5 3.5l12 12-5 5-12-12zM6 6l4-4M18 18l-4 4M11 9l1 1M13 11l1 1M9 11l1 1M11 13l1 1" },
  hungry: { line: `${o(12, 12, 9)}M8 16c2.5-2 5.5-2 8 0M8 9l2 1.5M16 9l-2 1.5` },
  fallen: { line: "M7 21V9a5 5 0 0 1 10 0v12M5 21h14M12 10v6M9.5 12.5h5" },
  tired: { line: "M4 5h5l-5 6h5M12 10h4l-4 5h4M17.5 15h3l-3 4h3" },
  saw: { line: "M2 12c3-5 6.5-7 10-7s7 2 10 7c-3 5-6.5 7-10 7s-7-2-10-7z", fill: o(12, 12, 3) },
  // the morning
  vote: { line: "M3 12h18v8H3zM9 12V4h6v8M10.5 7.5l1.2 1.3 2-2.3" },
  exile: { line: "M10 4H5v16h5M14 8l5 4-5 4M19 12H9" },
  rescue: { line: "M2 7h11v10H2zM13 10h4l4 3v4h-8M7 19.5a2 2 0 1 0 0-.1M17 19.5a2 2 0 1 0 0-.1M5 10h5M7.5 7.5v5" },
  day: { line: `${o(12, 12, 4)}M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8` },
  night: { line: "M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" },
  wait: { line: "M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" },
  zombie: { line: `${o(12, 9, 6)}M8 21l1-6M16 21l-1-6M9 15h6M9.5 11.5h1M13.5 11.5h1`, fill: `${o(9.5, 8, 1.2)}${o(14.5, 8, 1.2)}` },
  mold: { line: `${o(12, 12, 8)}`, fill: `${o(9, 9, 1.6)}${o(14.5, 10, 1.2)}${o(11, 14.5, 1.4)}${o(15.5, 15, 0.9)}` },
  empty: { line: `${o(12, 12, 8)}M7 17L17 7` },
} satisfies Record<string, Glyph>;

export type IconName = keyof typeof GLYPHS;

/** The emoji Shelter's text is written with, and the icon each is
 *  drawn as. (Without the variation selector some of them carry.) */
export const EMOJI_ICON: Record<string, IconName> = {
  "🍞": "food",
  "💊": "medicine",
  "🔥": "fire",
  "🌾": "farm",
  "🛒": "market",
  "🏥": "hospital",
  "📦": "store",
  "🚪": "door",
  "🛏": "sleep",
  "✋": "steal",
  "🔓": "open",
  "💀": "sabotage",
  "👣": "stealth",
  "🧍": "survivor",
  "☣": "infected",
  "🤧": "cough",
  "🩹": "injured",
  "😵": "hungry",
  "⚰": "fallen",
  "💤": "tired",
  "👀": "saw",
  "🗳": "vote",
  "🚷": "exile",
  "🚚": "rescue",
  "☀": "day",
  "🌙": "night",
  "⏳": "wait",
  "🧟": "zombie",
  "🦠": "mold",
  "⭕": "empty",
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
