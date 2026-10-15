// Boardly icon set, in the house style: every icon is an engraved emblem
// (components/engraved). The names and props are the ones screens have
// always used; `color` and `strokeWidth` are still accepted but the
// emblems carry their own materials.

import {
  DoorEmblem,
  EmblemGlyph,
  FriendsEmblem,
  GamesEmblem,
  GearEmblem,
  HomeEmblem,
  LockEmblem,
  ProfileEmblem,
} from "@/components/engraved";
import { UI_EMBLEMS, type UiEmblemName } from "@/components/engraved/ui";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Emblems keep a margin inside their box; drawn a little larger, they
 *  fill the space a line icon of `size` did. */
const box = (size: number) => Math.round(size * 1.15);

const ui = (name: UiEmblemName, fallback = 24) =>
  function UiIcon({ size = fallback }: IconProps) {
    return <EmblemGlyph data={UI_EMBLEMS[name]} size={box(size)} />;
  };

export const BellIcon = ui("bell");
export const PlusIcon = ui("plus");
export const SearchIcon = ui("search");
export const SortIcon = ui("sort");
export const ChevronRightIcon = ui("chevronRight");
export const BackIcon = ui("back");
export const DotsIcon = ui("dots");
export const InfoIcon = ui("info");
export const BotIcon = ui("bot");
export const CopyIcon = ui("copy");
export const LinkIcon = ui("link");
export const MailIcon = ui("mail");
export const StarIcon = ui("star", 14);

export function HomeIcon({ size = 24 }: IconProps) {
  return <HomeEmblem size={box(size)} />;
}
export function GamesIcon({ size = 24 }: IconProps) {
  return <GamesEmblem size={box(size)} />;
}
export function FriendsIcon({ size = 24 }: IconProps) {
  return <FriendsEmblem size={box(size)} />;
}
export function ProfileIcon({ size = 24 }: IconProps) {
  return <ProfileEmblem size={box(size)} />;
}
export function GearIcon({ size = 24 }: IconProps) {
  return <GearEmblem size={box(size)} />;
}

// ── Emoji the screens used as pictures, drawn as emblems ─────────────

const JSX_EMBLEMS = {
  door: DoorEmblem,
  gear: GearEmblem,
  lock: LockEmblem,
  people: FriendsEmblem,
} as const;

/** Each emoji and the emblem drawn in its place. */
const EMOJI_EMBLEM: Record<string, UiEmblemName | keyof typeof JSX_EMBLEMS> = {
  "🎲": "die",
  "😵": "die",
  "🔍": "search",
  "👋": "hand",
  "📭": "mail",
  "✉": "mail",
  "🚪": "door",
  "🏆": "trophy",
  "🤝": "pact",
  "⚙": "gear",
  "👑": "crown",
  "🤖": "bot",
  "✕": "close",
  "✓": "check",
  "★": "star",
  "🏅": "medal",
  "🔒": "lock",
  "📷": "camera",
  "🪑": "chair",
  "👥": "people",
  "☀": "sun",
  "🎟": "ticket",
};

const strip = (emoji: string) => emoji.replace(/️/g, "");

/** Whether `emoji` has an emblem. */
export const hasEmblem = (emoji: string) => strip(emoji) in EMOJI_EMBLEM;

/** The emblem for an emoji, `size` points square (nothing if none). */
export function Emblem({ emoji, size }: { emoji: string; size: number }) {
  const name = EMOJI_EMBLEM[strip(emoji)];
  if (!name) return null;
  if (name in JSX_EMBLEMS) {
    const Drawn = JSX_EMBLEMS[name as keyof typeof JSX_EMBLEMS];
    return <Drawn size={size} />;
  }
  return <EmblemGlyph data={UI_EMBLEMS[name as UiEmblemName]} size={size} />;
}

/** Splits text at every emoji that has an emblem; the odd parts are the
 *  emoji. */
const EMOJI = new RegExp(`(${Object.keys(EMOJI_EMBLEM).join("|")})️?`, "u");
export const splitEmblems = (text: string) => text.split(EMOJI);
