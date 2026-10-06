// Profile borders: decorations drawn around a player's avatar.
//
// Three ways a border can be drawn:
//   ring  – a plain circle (the everyday ones)
//   shape – a frame cut to a shape (hexagon, octagon, shield), drawn
//           from a path generated in code
//   glow  – an animated Skia glow (react-native-animated-glow preset)
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

export type ProfileBorder =
  (BorderBase & { kind: "none" }) | RingBorder | ShapeBorder | GlowBorder;

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
    kind: "shape",
    shape: "octagon",
    rarity: "rare",
    price: 200,
    colors: ["#C9D3DE", "#6F7F92"],
    rim: "#2F3B4A",
    inner: "#F1F5F9",
  },
  {
    id: "shield",
    name: "Guardian",
    kind: "shape",
    shape: "shield",
    rarity: "rare",
    price: 250,
    colors: ["#4C8FD6", "#234469"],
    rim: "#0F2138",
    inner: "#A9CFF7",
  },
  {
    id: "royal",
    name: "Royal Crown",
    kind: "shape",
    shape: "hexagon",
    rarity: "epic",
    price: 600,
    colors: ["#FFE27A", "#D99A1E"],
    rim: "#7A4E1C",
    inner: "#FFF6CF",
    extra: "crown",
  },

  // ── Epic / legendary: animated glows ────────────────────────────────
  {
    id: "golden-aura",
    name: "Golden Aura",
    kind: "glow",
    rarity: "epic",
    price: 700,
    roundness: 0.5,
    glow: {
      outlineWidth: 5,
      borderColor: ["#ffe65e", "white"],
      animationSpeed: 0,
      glowLayers: [
        {
          glowPlacement: "behind",
          colors: ["#ffa200", "#ffc100"],
          glowSize: 14,
          opacity: 0.25,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: ["#ffcd41", "#ff5a00"],
          glowSize: 7,
          opacity: 1,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: ["#ffffff", "#ffffff"],
          glowSize: 3,
          opacity: 1,
          coverage: 1,
        },
      ],
    },
  },
  {
    id: "neon-green",
    name: "Neon Green",
    kind: "glow",
    rarity: "legendary",
    price: 1000,
    roundness: 0.5,
    glow: {
      outlineWidth: 4,
      borderColor: [
        "rgba(225, 255, 109, 1)",
        "rgba(14, 255, 0, 1)",
        "rgba(251, 255, 105, 1)",
      ],
      animationSpeed: 3,
      glowLayers: [
        {
          glowPlacement: "behind",
          colors: ["#00ff84", "#ffff00", "#15ff00"],
          glowSize: [10, 20, 10],
          opacity: 0.2,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: ["#00ff84", "#ffff00", "#15ff00"],
          glowSize: [1, 8, 1],
          opacity: 0.3,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: ["rgba(90, 255, 0, 1)", "#ffff00", "#15ff00"],
          glowSize: [1, 8, 1],
          opacity: 0.3,
          coverage: 0.75,
        },
        {
          glowPlacement: "behind",
          colors: ["#44ff00", "#00ff84", "#96ff96"],
          glowSize: [2, 8, 2],
          opacity: 0.5,
          coverage: 1,
        },
      ],
    },
  },
  {
    id: "ripple",
    name: "Ripple",
    kind: "glow",
    rarity: "legendary",
    price: 1000,
    roundness: 0.5,
    glow: {
      outlineWidth: 4,
      borderColor: ["rgba(245, 178, 255, 1)", "rgba(111, 113, 208, 1)"],
      animationSpeed: 1,
      glowLayers: [
        {
          glowPlacement: "behind",
          colors: [
            "rgba(255, 0, 192, 1)",
            "rgba(84, 75, 211, 1)",
            "rgba(0, 0, 0, 0)",
          ],
          glowSize: 10,
          opacity: 0.4,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: [
            "rgba(255, 125, 222, 1)",
            "rgba(131, 159, 255, 1)",
            "rgba(0, 0, 0, 0)",
          ],
          glowSize: 3,
          opacity: 1,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: [
            "rgba(255, 121, 221, 1)",
            "rgba(0, 59, 255, 1)",
            "rgba(0, 0, 0, 0)",
          ],
          glowSize: [1, 2, 2, 1],
          opacity: 1,
          coverage: 1,
        },
      ],
    },
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    kind: "glow",
    rarity: "legendary",
    price: 1200,
    // a rounded square, like the original preset
    roundness: 0.24,
    glow: {
      outlineWidth: 0,
      borderColor: "white",
      animationSpeed: 2,
      glowLayers: [
        {
          glowPlacement: "behind",
          colors: [
            "rgba(255, 75, 169, 1)",
            "#01CDFE",
            "#05ffd2",
            "rgba(0, 0, 0, 0)",
            "rgba(0, 0, 0, 0)",
          ],
          glowSize: 5,
          opacity: 0.5,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: [
            "rgba(255, 76, 156, 1)",
            "#01CDFE",
            "#05ffd2",
            "rgba(0, 0, 0, 0)",
            "rgba(0, 0, 0, 0)",
          ],
          glowSize: 10,
          opacity: 0.5,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: ["#66d3ff", "#ff67ef"],
          glowSize: 4,
          opacity: 0.9,
          speedMultiplier: 0.8,
          coverage: 1,
        },
      ],
    },
  },
  {
    id: "ember",
    name: "Ember",
    kind: "glow",
    rarity: "legendary",
    price: 1200,
    roundness: 0.5,
    glow: {
      outlineWidth: 4,
      borderColor: ["#FFD36B", "#FF5A1F", "#C81E1E"],
      animationSpeed: 2.2,
      glowLayers: [
        {
          glowPlacement: "behind",
          colors: ["#FF3D00", "#FFB300", "rgba(0, 0, 0, 0)"],
          glowSize: [4, 18, 6],
          opacity: 0.35,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: ["#FF7A1A", "#FFE08A", "#FF2D00"],
          glowSize: [1, 9, 2],
          opacity: 0.7,
          coverage: 0.8,
        },
        {
          glowPlacement: "behind",
          colors: ["#FFF3C4", "#FF8A00"],
          glowSize: 2,
          opacity: 1,
          coverage: 1,
        },
      ],
    },
  },
  {
    id: "frost",
    name: "Frost",
    kind: "glow",
    rarity: "legendary",
    price: 1200,
    roundness: 0.5,
    glow: {
      outlineWidth: 4,
      borderColor: ["#FFFFFF", "#9BE4FF", "#4B8BFF"],
      animationSpeed: 0.8,
      glowLayers: [
        {
          glowPlacement: "behind",
          colors: ["#4B8BFF", "#B8F1FF", "rgba(0, 0, 0, 0)"],
          glowSize: 14,
          opacity: 0.3,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: ["#E8FBFF", "#6FC8FF", "rgba(0, 0, 0, 0)"],
          glowSize: [2, 7, 2],
          opacity: 0.8,
          coverage: 1,
        },
        {
          glowPlacement: "behind",
          colors: ["#FFFFFF", "#BFEFFF"],
          glowSize: 2,
          opacity: 1,
          coverage: 1,
        },
      ],
    },
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
