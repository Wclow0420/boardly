// The materials the isometric pieces are drawn in: each a set of tones
// (light, body, shadow) or, for a turned piece's sheen, four stops (light,
// body, shadow, the light thrown back at the far edge). The kit's own
// basics (WOOD, STONE, GOLD, LEAF…) live in kit.ts. Woods that show a
// grain are registered with the kit's GRAINED here, once.

import { GRAINED, tone, type Tones } from "../kit";

// ── metals ──────────────────────────────────────────────────────────

/** Dark iron, lit like a metal. */
export const IRONWORK: Tones = ["#5A6276", "#3A4050", "#262A36"];
/** Brass, warmer than gold. */
export const BRASS: Tones = ["#F2D38A", "#C99A44", "#8A6420"];
/** The house gold, brighter than the kit's GOLD: light, body, shadow. */
export const GILT = ["#FFF2B8", "#E2B04A", "#9A6B1E"];
/** GILT as a box's tones. */
export const GILT_TONES: Tones = [GILT[0], GILT[1], GILT[2]];
/** A paler gilt, for church plate (candlesticks, the altar cross). */
export const PALE_GILT: Tones = ["#FFE7A0", "#E2B04A", "#9A6B1E"];
/** The house gold and silver as a turned piece's sheen: light, body,
 *  shadow, and the light thrown back at the far edge. */
export const GILT_SHEEN = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#F0CC72"];
export const SILVER_SHEEN = ["#FFFFFF", "#C9D0DA", "#7A8494", "#E4E9F0"];
/** Polished silver. */
export const SILVER: Tones = ["#F2F4F8", "#C9D0DA", "#8A94A4"];
/** Bell bronze, lit from the left with a warm reflected light on the right. */
export const BRONZE = ["#FFF2B8", "#E2B04A", "#9A6B1E", "#C99A44"];
/** Pewter, for jugs and cups. */
export const PEWTER: Tones = ["#D4D9E0", "#9AA2AE", "#6E7684"];
/** Copper, for pans, pots and a hood (four stops, like a sheen). */
export const COPPER = ["#FFD3B0", "#D07A48", "#7E3A1A", "#E8986A"];
/** Iron and brass as a turned piece's sheen. */
export const IRON_SHEEN = [tone(IRONWORK[0], 0.25), IRONWORK[1], IRONWORK[2], IRONWORK[0]];
export const BRASS_SHEEN = [BRASS[0], BRASS[1], BRASS[2], BRASS[0]];
/** Tin plate. */
export const TIN: Tones = ["#F4F6FA", "#C9D0DA", "#7A8494"];
/** Steel, for blades. */
export const STEEL = { light: "#FFFFFF", mid: "#C9D0DA", dark: "#7A8494", ink: "#1E242C" };

// ── woods ───────────────────────────────────────────────────────────

/** Dark red mahogany, grained like the kit's wood (the hall, the dining
 *  room, the kitchen's bell board). */
export const MAHOGANY: Tones = ["#8C4A30", "#6B3422", "#4C2216"];
/** A warmer, redder mahogany (the gallery and the study). */
export const WARM_MAHOGANY: Tones = ["#8E4E34", "#6C3826", "#4A2418"];
/** Pale deal, for crates. */
export const PINE: Tones = ["#C29A68", "#A07A4E", "#7A5A38"];
/** Golden oak, for a dresser, a mantel, shelves. */
export const OAK: Tones = ["#C29462", "#9A6E44", "#6E4C2E"];
/** A table top scrubbed pale. */
export const SCRUBBED: Tones = ["#EEDFBE", "#D2BC92", "#A99068"];
/** Pale pine boards (Shelter's crates, fresh planks); not grained. */
export const PINE_BOARD: Tones = ["#D9B07A", "#B88A54", "#8A6236"];
/** Rough bark on a log. */
export const BARK: Tones = ["#8A6446", "#5E4230", "#3E2A1E"];
/** A sawn log end: pale wood, mid, the colour of its rings. */
export const END_GRAIN: Tones = ["#F0D29C", "#D6AC6E", "#9E7240"];
/** Charred wood in a fire, its ends glowing. */
export const CHAR: Tones = ["#4A3426", "#2E2018", "#1C130E"];
export const EMBER: Tones = ["#FFD58A", "#F07A32", "#9A3A16"];

GRAINED.add(MAHOGANY);
GRAINED.add(WARM_MAHOGANY);
GRAINED.add(PINE);
GRAINED.add(OAK);
GRAINED.add(SCRUBBED);

// ── stone ───────────────────────────────────────────────────────────

/** Pale veined marble (floors, a console top, a staircase's treads). */
export const MARBLE: Tones = ["#F3EEE3", "#DDD4C3", "#BBB09B"];
/** Whiter statuary marble, for plinths and busts. */
export const STATUARY_MARBLE: Tones = ["#F4F0E6", "#D9D2C3", "#ABA291"];
/** Pale limestone, for dressed stone, steps, a font, a sink. */
export const LIMESTONE: Tones = ["#F1EADA", "#D5CAB0", "#ADA086"];
/** Warm sandstone, for dressed stone round openings. */
export const SANDSTONE: Tones = ["#D8B878", "#B08C50", "#7E6236"];
/** Cellar stone: cool and grey. */
export const CELLAR_STONE: Tones = ["#6A6E78", "#50545E", "#3C4049"];
/** Garden stone, warm and pale. */
export const ASHLAR: Tones = ["#9A9C9E", "#7A7D82", "#5E6167"];
/** Field stones, warm grey. */
export const FIELDSTONE: Tones = ["#B9B2A6", "#8F887D", "#5F594F"];
/** Grey, weathered shingles. */
export const SHINGLE: Tones = ["#7A6656", "#5E4C40", "#463830"];

// ── cloth, paper, china ─────────────────────────────────────────────

/** Crimson velvet: runners, cushions, banners. */
export const VELVET: Tones = ["#B23A44", "#8E2A33", "#651C24"];
/** A deeper crimson velvet (the gallery's rope, cushions and books). */
export const DEEP_VELVET: Tones = ["#B8384A", "#8E2433", "#5E1420"];
/** White table linen. */
export const LINEN: Tones = ["#FBF8F0", "#ECE6D6", "#CFC6B0"];
/** Pages and candle wax. */
export const PAGES: Tones = ["#FBF6E8", "#E9E2CF", "#CFC5AA"];
/** Burlap. */
export const BURLAP: Tones = ["#E2C894", "#C4A46C", "#8E7046"];
/** Cream stoneware and brown-glazed crocks (four stops, like a sheen). */
export const CREAM = ["#FFF8E8", "#EADBB8", "#B49C70", "#F4E8CC"];
export const GLAZE = ["#D8985A", "#94562A", "#542C12", "#B07040"];
/** White china, and the blue it's painted with. */
export const CHINA = ["#FFFFFF", "#EEF2F8", "#A8B4CA"];
export const DELFT = "#2E4E9A";

// ── glass ───────────────────────────────────────────────────────────

/** Night glass, in a clock door or a mirror. */
export const NIGHT_GLASS = ["#4A5E92", "#1E2848", "#0D1020"];
/** Jewel colours for stained glass. */
export const STAINED_GLASS = {
  ruby: "#C23B54",
  sapphire: "#3D63C9",
  emerald: "#2E9A6A",
  amber: "#F0B54A",
  violet: "#8A55C0",
};
/** The lead between panes. */
export const LEAD = "#1E1A16";

// ── growing things, food, weather ───────────────────────────────────

/** Clipped yew, blue-green under the moon. */
export const YEW: Tones = ["#4F8A66", "#3A6B4F", "#2A503B"];
/** Evergreen needles. */
export const NEEDLES: Tones = ["#5E8E68", "#36624A", "#1F3F30"];
/** Bread crust and crumb. */
export const CRUST: Tones = ["#E2A25E", "#B86E32", "#7A4420"];
export const CRUMB: Tones = ["#FBE8C0", "#EAD09A", "#C9A66A"];
/** Fresh snow, lit and in shade. */
export const SNOW: Tones = ["#FFFFFF", "#E4ECF6", "#A9B8CE"];

// ── single colours ──────────────────────────────────────────────────

/** Warm ink, for outlining gold and ivory. */
export const WARM_INK = "#3A2408";
/** Crimson cloth: a frontal, hymn books, a bell rope's sally. */
export const CRIMSON = "#A8323C";
/** A ruby set in gilt. */
export const RUBY = "#D0304A";
/** Bell-rope hemp. */
export const HEMP = "#D8C49A";
