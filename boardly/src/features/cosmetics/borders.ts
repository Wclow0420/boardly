// Profile borders: decorations drawn around a player's avatar.
//
// Three ways a border can be drawn:
//   ring  – a plain circle (the everyday ones)
//   shape – a frame cut to a shape (hexagon, octagon, shield), drawn
//           from a path generated in code
//   glow  – an animated Skia glow (react-native-animated-glow preset)
//   art   – a little illustration drawn and animated with Skia round
//           the avatar (art/: a dragon, a campfire, dice...), in two
//           layers, behind the avatar and over its edge
//
// Some art borders can't be bought: they come with a badge
// (`earnedBy`), and the server checks it before you can wear one.
//
// Prices are placeholders for the coin shop and are not charged yet.

import type { GlowConfig } from "react-native-animated-glow";

export type BorderRarity = "common" | "rare" | "epic" | "legendary";

interface BorderBase {
  id: string;
  name: string;
  rarity: BorderRarity;
  /** Coins to unlock; 0 means everyone has it. */
  price: number;
}

export interface RingBorder extends BorderBase {
  kind: "ring";
  /** Gradient of the band, top to bottom. */
  colors: [string, string];
  rim: string;
  /** Band thickness, where the avatar's radius is 50. */
  width: number;
}

export type FrameShape = "hexagon" | "octagon" | "shield";

export interface ShapeBorder extends BorderBase {
  kind: "shape";
  shape: FrameShape;
  colors: [string, string];
  rim: string;
  /** Thin line drawn just inside the edge. */
  inner: string;
  /** Extra piece on top of the frame. */
  extra?: "crown";
}

export interface GlowBorder extends BorderBase {
  kind: "glow";
  /** Corner radius as a share of the avatar size: 0.5 is a circle. */
  roundness: number;
  /** Glow sizes are in points for a 72pt avatar and scale with it. */
  glow: GlowConfig;
}

export interface ArtBorder extends BorderBase {
  kind: "art";
  /** Its drawing in art/ (usually the same as its id). */
  art: string;
  /** The badge that unlocks it, for borders that can't be bought. */
  earnedBy?: string;
}

export type ProfileBorder =
  | (BorderBase & { kind: "none" })
  | RingBorder
  | ShapeBorder
  | GlowBorder
  | ArtBorder;

export const RARITY_COLORS: Record<BorderRarity, string> = {
  common: "#B8A383",
  rare: "#5FA8F0",
  epic: "#C084FC",
  legendary: "#F7C948",
};

export const BORDERS: ProfileBorder[] = [
  // ── Common: simple rings ────────────────────────────────────────────
  {
    id: "wood",
    name: "Oak Ring",
    kind: "ring",
    rarity: "common",
    price: 0,
    colors: ["#9A6B43", "#5E3D24"],
    rim: "#2E1C0F",
    width: 9,
  },
  { id: "none", name: "No Border", kind: "none", rarity: "common", price: 0 },

  // ── Rare / epic: shaped frames ──────────────────────────────────────
  {
    id: "octagon",
    name: "Steel Plate",
    kind: "art",
    art: "steel-plate",
    rarity: "rare",
    price: 200,
  },
  {
    id: "shield",
    name: "Guardian",
    kind: "art",
    art: "guardian",
    rarity: "rare",
    price: 250,
  },
  {
    id: "royal",
    name: "Royal Crown",
    kind: "art",
    art: "royal-crown",
    rarity: "epic",
    price: 600,
  },

  // ── Epic / legendary: animated glows ────────────────────────────────
  {
    id: "golden-aura",
    name: "Sunburst",
    kind: "art",
    art: "sunburst",
    rarity: "epic",
    price: 700,
  },
  {
    id: "neon-green",
    name: "Emerald Grove",
    kind: "art",
    art: "emerald-grove",
    rarity: "legendary",
    price: 1000,
  },
  {
    id: "ripple",
    name: "Moonpool",
    kind: "art",
    art: "moonpool",
    rarity: "legendary",
    price: 1000,
  },
  {
    id: "vaporwave",
    name: "Stained Glass",
    kind: "art",
    art: "stained-glass",
    rarity: "legendary",
    price: 1200,
  },
  {
    id: "ember",
    name: "Brazier",
    kind: "art",
    art: "brazier",
    rarity: "legendary",
    price: 1200,
  },
  {
    id: "frost",
    name: "Snowflake",
    kind: "art",
    art: "snowflake",
    rarity: "legendary",
    price: 1200,
  },

  // ── Art borders: illustrations drawn and animated round the avatar ──
  {
    id: "dice-orbit",
    name: "Dice Orbit",
    kind: "art",
    art: "dice-orbit",
    rarity: "rare",
    price: 1500,
  },
  {
    id: "card-fan",
    name: "Card Fan",
    kind: "art",
    art: "card-fan",
    rarity: "rare",
    price: 1500,
  },
  {
    id: "sakura",
    name: "Sakura Branch",
    kind: "art",
    art: "sakura",
    rarity: "rare",
    price: 1600,
  },
  {
    id: "meeple-parade",
    name: "Meeple Parade",
    kind: "art",
    art: "meeple-parade",
    rarity: "rare",
    price: 1800,
  },
  {
    id: "campfire",
    name: "Sun Blaze",
    kind: "art",
    art: "campfire",
    rarity: "epic",
    price: 3000,
  },
  {
    id: "glacier",
    name: "Glacier",
    kind: "art",
    art: "glacier",
    rarity: "epic",
    price: 2500,
  },
  {
    id: "thunderstorm",
    name: "Thunderstorm",
    kind: "art",
    art: "thunderstorm",
    rarity: "epic",
    price: 2800,
  },
  {
    id: "ghost-lantern",
    name: "Ghost Lantern",
    kind: "art",
    art: "ghost-lantern",
    rarity: "rare",
    price: 1800,
  },
  {
    id: "galaxy",
    name: "Galaxy",
    kind: "art",
    art: "galaxy",
    rarity: "epic",
    price: 3500,
  },
  {
    id: "phoenix",
    name: "Phoenix",
    kind: "art",
    art: "phoenix",
    rarity: "legendary",
    price: 5000,
  },
  {
    id: "fire-dragon",
    name: "Dragon Coil",
    kind: "art",
    art: "fire-dragon",
    rarity: "legendary",
    price: 4000,
  },
  {
    id: "king-crown",
    name: "King's Crown",
    kind: "art",
    art: "king-crown",
    rarity: "legendary",
    price: 5000,
  },
  {
    id: "queen-crown",
    name: "Queen's Tiara",
    kind: "art",
    art: "queen-crown",
    rarity: "legendary",
    price: 5000,
  },
  {
    id: "baroque-silver",
    name: "Baroque Silver",
    kind: "art",
    art: "baroque-silver",
    rarity: "epic",
    price: 3800,
  },
  {
    id: "winged-crest",
    name: "Winged Crest",
    kind: "art",
    art: "winged-crest",
    rarity: "epic",
    price: 3800,
  },
  {
    id: "fallen-angel",
    name: "Fallen Angel",
    kind: "art",
    art: "fallen-angel",
    rarity: "legendary",
    price: 5000,
  },
  {
    id: "seraph-wings",
    name: "Seraph Wings",
    kind: "art",
    art: "seraph-wings",
    rarity: "legendary",
    price: 5000,
  },
  {
    id: "angel-wings",
    name: "Angel Wings",
    kind: "art",
    art: "angel-wings",
    rarity: "epic",
    price: 2000,
  },

  // ── Rim borders: the effect is the ring ────────────────────────
  {
    id: "black-hole",
    name: "Black Hole",
    kind: "art",
    art: "black-hole",
    rarity: "legendary",
    price: 6000,
  },
  {
    id: "molten-lava",
    name: "Molten Lava",
    kind: "art",
    art: "molten-lava",
    rarity: "legendary",
    price: 4500,
  },
  {
    id: "shadow-flame",
    name: "Shadow Flame",
    kind: "art",
    art: "shadow-flame",
    rarity: "legendary",
    price: 4500,
  },
  {
    id: "aurora",
    name: "Aurora",
    kind: "art",
    art: "aurora",
    rarity: "epic",
    price: 4000,
  },
  {
    id: "tidal-wave",
    name: "Tidal Wave",
    kind: "art",
    art: "tidal-wave",
    rarity: "epic",
    price: 4000,
  },
  {
    id: "plasma-core",
    name: "Plasma Core",
    kind: "art",
    art: "plasma-core",
    rarity: "legendary",
    price: 5000,
  },
  {
    id: "toxic",
    name: "Toxic",
    kind: "art",
    art: "toxic",
    rarity: "epic",
    price: 3500,
  },
  {
    id: "divine-light",
    name: "Divine Light",
    kind: "art",
    art: "divine-light",
    rarity: "legendary",
    price: 5000,
  },
  {
    id: "prism",
    name: "Prism",
    kind: "art",
    art: "prism",
    rarity: "epic",
    price: 4000,
  },
  {
    id: "blood-moon",
    name: "Blood Moon",
    kind: "art",
    art: "blood-moon",
    rarity: "legendary",
    price: 4500,
  },

  // ── Earned with a badge, never bought ───────────────────────────
  {
    id: "seal-halo",
    name: "Seal Keeper's Halo",
    kind: "art",
    art: "seal-halo",
    rarity: "legendary",
    price: 0,
    earnedBy: "nightwatch.ghostbreaker",
  },
  {
    id: "winter-hearth",
    name: "Last Winter Hearth",
    kind: "art",
    art: "winter-hearth",
    rarity: "legendary",
    price: 0,
    earnedBy: "shelter.lastWinter",
  },
  {
    id: "spymaster",
    name: "Spymaster's Reticle",
    kind: "art",
    art: "spymaster",
    rarity: "legendary",
    price: 0,
    earnedBy: "avalon.spymaster",
  },
  {
    id: "table-legend",
    name: "Legend of the Table",
    kind: "art",
    art: "table-legend",
    rarity: "legendary",
    price: 0,
    earnedBy: "boardly.legend",
  },
];

/** What every player wears until they pick something else. */
export const DEFAULT_BORDER_ID = "wood";

export function getBorder(id: string | undefined): ProfileBorder {
  return (
    BORDERS.find((border) => border.id === id) ??
    BORDERS.find((border) => border.id === DEFAULT_BORDER_ID) ??
    BORDERS[0]
  );
}
