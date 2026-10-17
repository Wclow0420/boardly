// Each game's room on its floor of the lift, seen flat on as the lift's
// floors are: what the back wall is made of, the board the house rules
// hang on, the table against the wall, the lamps (one over each spot,
// lit when that player is ready), the pieces set out on the table for
// each player, and the floor's wood. Hustle's is the den behind the night
// market (its eave of glazed tiles and gilt ends, the crimson beam with
// its key-fret, the dark lattice screen, the signboard with cloud
// scrolls, the green baize table, red silk lanterns, a mahjong tile for
// each player). A game without a room of its own gets its lift landing's
// colours, a panelled wall and brass lamps. As SVG markup, baked once
// (RoomScene).

import { toSvgBody, type EmblemData } from "@/components/engraved/emblem";
import { EMBLEMS as SPIES } from "@/components/engraved/emoji/spies";
import { linear, moulding, radial } from "@/components/engraved/panel";
import { INKS, MATERIALS, curl, shade } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import type { PopupLook } from "@/features/game/Popup";
import type { LandingLook } from "@/features/games/lift/art";
import { LANTERN_H, LANTERN_W, lanternArt, tileArt, TILE_H, TILE_W } from "@/games/coup/den/denArt";
import { boardsArt, doorArt, lit, skirting, svg } from "./art";
import type { RoomLayout } from "./layout";

const f = (n: number) => +n.toFixed(2);
const INK = INKS.gold.ink;
const VEIN = INKS.gold.vein;

export interface RoomLook {
  /** The lamps' light, for the glows and pools. */
  light: string;
  /** The room's still art, w × h (the door, the wall, the board, the
   *  table, the floor), for the lift's `floor` of `floors`. */
  art: (R: RoomLayout, floor: number, floors: number) => string;
  /** A lamp over a spot, lit and out, w × h (hung from the middle of
   *  its top edge). */
  lamp: { lit: () => string; out: () => string; w: number; h: number };
  /** What's set out on the table for each player, w × h. */
  piece?: { art: () => string; w: number; h: number };
  /** The board's ink: its title and its line. */
  board: { title: string; text: string };
  /** The popups opened from the room. */
  popup: PopupLook;
}

// ------------------------------------------------------------- Hustle

const LACQUER = ["#E04A52", "#A8182A", "#5A0810"];
const ROOF = ["#3E4C48", "#222C2A", "#121816"];
const SCREEN = ["#3A2216", "#24140C", "#160A06"];
const JADE = ["#9AF0C0", "#2E9A62", "#0C4A2A"];

/** A cloud scroll (two curls back to back) in gold, for a board's corner. */
function cloud(x: number, y: number, side: number, id: string, size = 1) {
  const parts: EmblemData = [
    curl(x, y, side > 0 ? 0 : Math.PI, 15 * size, side * 3.6, 3.6 * size, 0.7),
    curl(x, y, Math.PI / 2, 10 * size, side * -3.2, 3 * size, 0.7),
  ].map((p) => ({ d: p.outline, m: "gold", vein: p.vein, ink: 0.7, vw: 0.4 }));
  return toSvgBody(parts, undefined, id);
}

/** The key-fret (回纹) running along a band. */
function fret(x0: number, x1: number, y: number, id: string) {
  const d: string[] = [];
  for (let x = x0; x + 10 <= x1; x += 12) d.push(`M${f(x)} ${f(y + 3)}V${f(y - 3)}H${f(x + 8)}V${f(y + 1.5)}H${f(x + 3)}V${f(y - 1)}`);
  return `<path d="${d.join("")}" fill="none" stroke="url(#${id})" stroke-width="1.1" stroke-linejoin="round"/>`;
}

function denRoom(R: RoomLayout, floor: number, floors: number) {
  const { w, h, roof, beam, wallTop, floorY, board: B, table: T } = R;
  // the eave: dark glazed barrel tiles down to a row of gilt tile ends
  const barrels: string[] = [];
  for (let x = -4; x < w + 8; x += 13) {
    barrels.push(`<path d="M${x} 0V${roof - 3}" stroke="#0A0E0D" stroke-width="5" stroke-opacity="0.55"/>`);
    barrels.push(`<path d="M${x + 6.5} 0V${roof - 3}" stroke="#56645F" stroke-width="5.5" stroke-opacity="0.6" stroke-linecap="round"/>`);
    barrels.push(`<path d="M${x + 5} 0V${roof - 5}" stroke="#A8BCB4" stroke-width="0.8" stroke-opacity="0.35"/>`);
  }
  for (let y = 5; y < roof - 3; y += 7) barrels.push(`<path d="M0 ${y}H${w}" stroke="#0A0E0D" stroke-width="0.7" stroke-opacity="0.5"/>`);
  const ends: string[] = [];
  for (let x = 2.5; x < w + 8; x += 13) {
    ends.push(
      `<circle cx="${x + 4}" cy="${roof}" r="5.6" fill="url(#rgd)" stroke="${INK}" stroke-width="0.8"/><circle cx="${x + 4}" cy="${roof}" r="3" fill="none" stroke="${VEIN}" stroke-width="0.6"/><circle cx="${x + 2.6}" cy="${roof - 1.6}" r="1" fill="#FFFFFF" fill-opacity="0.75"/>`,
    );
  }
  // the lattice screen of the back wall
  const lattice: string[] = [];
  for (let x = 6; x < w; x += 22) {
    for (let y = wallTop + 6; y < floorY - 12; y += 22) lattice.push(`M${x} ${f(y)}h14v14h-14ZM${x + 4} ${f(y + 4)}h6v6h-6Z`);
  }
  // crimson lacquered posts at either side, gold-capped
  const post = (x: number) =>
    `<rect x="${f(x)}" y="${f(wallTop)}" width="9" height="${f(floorY - wallTop)}" fill="url(#rlacv)" stroke="${INK}" stroke-width="0.8"/><path d="M${f(x + 2)} ${f(wallTop + 4)}V${f(floorY - 4)}" stroke="#fff" stroke-opacity="0.3" stroke-width="0.8"/><rect x="${f(x - 1.5)}" y="${f(wallTop)}" width="12" height="5" fill="url(#rgv)" stroke="${INK}" stroke-width="0.6"/>`;

  // the house rules board: crimson in a gilt frame, cloud scrolls in the
  // corners, a jade boss on top, hung from the beam on gold rods; a round
  // gilt medallion at its right end for the count
  const corner = (x: number, y: number, sx: number, sy: number, k: string) =>
    `<g transform="translate(${f(x)} ${f(y)}) scale(${sx} ${sy})">${cloud(0, 0, 1, k, 0.85)}</g>`;
  const mx = B.x + B.w - 27;
  const my = B.y + B.h / 2;
  const boardArt = `
<path d="M${f(B.x + 22)} ${f(beam.y + beam.h)}V${f(B.y)}M${f(B.x + B.w - 48)} ${f(beam.y + beam.h)}V${f(B.y)}" stroke="url(#rgs)" stroke-width="2.4"/>
<path d="${rrect(B.x + 1, B.y + 3.5, B.w, B.h, 5)}" fill="#000" fill-opacity="0.5"/>
<path d="${rrect(B.x, B.y, B.w, B.h, 5)}" fill="url(#rgv)" stroke="${INK}" stroke-width="1.2"/>
<path d="${rrect(B.x + 2.6, B.y + 2.6, B.w - 5.2, B.h - 5.2, 4)}" fill="none" stroke="${VEIN}" stroke-width="0.6"/>
<path d="${rrect(B.x + 5, B.y + 5, B.w - 10, B.h - 10, 3)}" fill="url(#rsg)" stroke="${INK}" stroke-width="0.9"/>
<path d="${rrect(B.x + 8, B.y + 8, B.w - 16, B.h - 16, 2)}" fill="none" stroke="#F0CC72" stroke-opacity="0.4" stroke-width="0.6"/>
<path d="M${f(B.x + 9)} ${f(B.y + 7.5)}H${f(B.x + B.w * 0.4)}" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="0.9" stroke-linecap="round"/>
${corner(B.x + 2, B.y + 2, 1, 1, "bc1")}${corner(B.x + 2, B.y + B.h - 2, 1, -1, "bc3")}
<circle cx="${f(B.x + (B.w - 50) / 2)}" cy="${f(B.y)}" r="6" fill="url(#rgd)" stroke="${INK}" stroke-width="0.9"/>
<circle cx="${f(B.x + (B.w - 50) / 2)}" cy="${f(B.y)}" r="3.7" fill="url(#rjd)" stroke="${INK}" stroke-width="0.7"/>
<circle cx="${f(B.x + (B.w - 50) / 2 - 1.3)}" cy="${f(B.y - 1.3)}" r="1" fill="#FFFFFF" fill-opacity="0.9"/>
<circle cx="${f(mx + 1)}" cy="${f(my + 2.5)}" r="24" fill="#000" fill-opacity="0.45"/>
<circle cx="${f(mx)}" cy="${f(my)}" r="24" fill="url(#rgd)" stroke="${INK}" stroke-width="1.1"/>
${Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return `<circle cx="${f(mx + Math.cos(a) * 20.6)}" cy="${f(my + Math.sin(a) * 20.6)}" r="1.4" fill="url(#rgd)" stroke="${INK}" stroke-width="0.35"/>`;
  }).join("")}
<circle cx="${f(mx)}" cy="${f(my)}" r="17.4" fill="url(#rivory)" stroke="${INK}" stroke-width="0.9"/>
<path d="M${f(mx - 14)} ${f(my - 6)}A15 15 0 0 1 ${f(mx - 5)} ${f(my - 14.6)}" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;

  // the table against the wall: green baize seen over its gilt rail, a
  // crimson lacquered apron with the fret, dark legs; the pot of coins
  const top = T.y;
  const railY = top + 12;
  const apronH = 26;
  const legW = 9;
  const coin = SPIES["🪙"];
  const coinS = 15;
  const coins = coin
    ? [[0.1, 0], [0.16, -3], [0.88, -1]]
        .map(([k, dy], i) => `<g transform="translate(${f(T.x + T.w * k - coinS / 2)} ${f(railY - coinS + 3 + dy)}) scale(${f(coinS / 48)})">${toSvgBody(coin, undefined, `rc${i}`)}</g>`)
        .join("")
    : "";
  const tableArt = `
<path d="M${f(T.x + 6)} ${f(floorY + 2)}H${f(T.x + T.w - 6)}" stroke="#000" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round"/>
${[T.x + 8, T.x + T.w - 8 - legW].map((x) => `<path d="M${f(x)} ${f(railY + apronH)}H${f(x + legW)}V${f(floorY - 6)}Q${f(x + legW + 3)} ${f(floorY - 2)} ${f(x + legW + 2)} ${f(floorY + 1)}H${f(x - 2)}Q${f(x - 3)} ${f(floorY - 2)} ${f(x)} ${f(floorY - 6)}Z" fill="url(#rleg)" stroke="${INK}" stroke-width="0.8"/><path d="M${f(x + 2)} ${f(railY + apronH + 2)}V${f(floorY - 8)}" stroke="#fff" stroke-opacity="0.2" stroke-width="0.8"/>`).join("")}
<path d="M${f(T.x + 14)} ${f(top)}H${f(T.x + T.w - 14)}L${f(T.x + T.w)} ${f(railY)}H${f(T.x)}Z" fill="url(#rfelt)" stroke="#06200F" stroke-width="0.8"/>
<path d="M${f(T.x + 20)} ${f(top + 2.5)}H${f(T.x + T.w - 20)}" stroke="#9AF0C0" stroke-opacity="0.16" stroke-width="1"/>
<rect x="${f(T.x - 2)}" y="${f(railY)}" width="${f(T.w + 4)}" height="${apronH}" fill="url(#rlacv)" stroke="${INK}" stroke-width="0.9"/>
<rect x="${f(T.x - 3)}" y="${f(railY - 2)}" width="${f(T.w + 6)}" height="5" rx="2" fill="url(#rgv)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${f(T.x)} ${f(railY - 0.8)}H${f(T.x + T.w * 0.45)}" stroke="#fff" stroke-opacity="0.75" stroke-width="0.8" stroke-linecap="round"/>
${fret(T.x + 6, T.x + T.w - 6, railY + apronH / 2 + 1.5, "rgs")}
<path d="M${f(T.x - 2)} ${f(railY + apronH)}H${f(T.x + T.w + 2)}" stroke="url(#rgs)" stroke-width="2"/>
${coins}`;

  // a crimson rug on the boards where everyone stands, a gold key-fret
  // round its border
  const ry0 = floorY + 12;
  const ry1 = h - 6;
  const rx = (v: number, side: number) => w / 2 + side * (w * 0.33 + w * 0.17 * v);
  const quad = (inset: number) => {
    const v0 = (inset * 0.6) / (ry1 - ry0);
    const v1 = 1 - inset / (ry1 - ry0);
    return `M${f(rx(v0, -1) + inset)} ${f(ry0 + inset * 0.6)}H${f(rx(v0, 1) - inset)}L${f(rx(v1, 1) - inset * 1.4)} ${f(ry1 - inset)}H${f(rx(v1, -1) + inset * 1.4)}Z`;
  };
  const rug = `
<path d="${quad(0)}" fill="#000" fill-opacity="0.35" transform="translate(0 3)"/>
<path d="${quad(0)}" fill="url(#rrug)" stroke="${INK}" stroke-width="0.9"/>
<path d="${quad(5)}" fill="none" stroke="url(#rgs)" stroke-width="1.6"/>
<path d="${quad(11)}" fill="none" stroke="#E2B04A" stroke-opacity="0.35" stroke-width="0.8" stroke-dasharray="6 3 2 3"/>
<path d="${quad(16)}" fill="none" stroke="url(#rgs)" stroke-width="1"/>
<path d="${quad(0)}" fill="url(#rrugv)"/>`;

  return svg(
    w,
    h,
    `<defs>
${linear("rrug", ["#46101A", "#330A12", "#20050A"])}
${radial("rrugv", ["#000000", "#000000"], [0, 0.5], 0.5, 0.2, 0.9)}
${linear("rroof", ROOF)}
${linear("rlac", LACQUER)}
${lit("rlacv", LACQUER, 0, 0, 30, 0)}
${linear("rscreen", SCREEN)}
${linear("rgs", MATERIALS.gold, false)}
${linear("rgv", MATERIALS.gold)}
${linear("rivory", MATERIALS.ivory)}
${radial("rgd", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}
${radial("rjd", JADE, undefined, 0.38, 0.32, 0.75)}
${linear("rsg", ["#E8404C", "#B01E30", "#6A0A16"])}
${linear("rfelt", ["#2A7A50", "#1E6A44", "#14502F"])}
${linear("rleg", ["#3A2216", "#24140C", "#160A06"], false)}
${radial("rshade", ["#000000", "#000000"], [0, 0.55], 0.5, 0.1, 1)}
${radial("rwarm", ["#FFB46A", "#FFB46A"], [0.16, 0], 0.62, 0.55, 0.62)}
</defs>
<rect width="${w}" height="${f(floorY)}" fill="url(#rscreen)"/>
<path d="${lattice.join("")}" fill="none" stroke="#C89A4A" stroke-opacity="0.15" stroke-width="1.2"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#rshade)"/>
<rect y="${f(wallTop)}" width="${w}" height="${f(floorY - wallTop)}" fill="url(#rwarm)"/>
${post(0)}${post(w - 9)}
${boardsArt(w, floorY, h, "#4A2A1A")}
${skirting(w, floorY, "#3A2216")}
${rug}
${doorArt(R, floor, floors)}
${tableArt}
<path d="M0 0H${w}V${roof}H0Z" fill="url(#rroof)"/>
${barrels.join("")}
<path d="M0 ${f(beam.y + beam.h + 1.5)}H${w}" stroke="#000" stroke-opacity="0.5" stroke-width="4"/>
<path d="M0 ${beam.y}H${w}V${beam.y + beam.h}H0Z" fill="url(#rlac)" stroke="${INK}" stroke-width="0.9"/>
<path d="M0 ${beam.y + 2}H${w}" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.8"/>
${fret(4, w - 4, beam.y + beam.h / 2, "rgs")}
${ends.join("")}
${boardArt}`,
  );
}

/** A red silk lantern gone out: the same lantern, its silk dark. */
const lanternOut = () =>
  lanternArt()
    .replace('stop-color="#FFE0A0"', 'stop-color="#9A3A2A"')
    .replace('stop-color="#F2543A"', 'stop-color="#6A1A16"')
    .replace('stop-color="#B0142A"', 'stop-color="#4A0A12"')
    .replace('stop-color="#5A0410"', 'stop-color="#24040A"');

const DEN: RoomLook = {
  light: "#FFB46A",
  art: denRoom,
  lamp: { lit: lanternArt, out: lanternOut, w: LANTERN_W, h: LANTERN_H },
  piece: { art: () => tileArt("two"), w: TILE_W, h: TILE_H },
  board: { title: "#F0CC72", text: "#FFF2D8" },
  popup: { enamel: ["#E04A52", "#A8182A", "#5A0810"], jewel: "emerald", glow: "#FFB46A" },
};

// ------------------------------------------------------------- any game

const PENDANT_W = 30;
const PENDANT_H = 48;
/** A brass pendant lamp with an amber glass shade, lit or out. */
function pendantArt(on: boolean) {
  const c = PENDANT_W / 2;
  const glass = on ? ["#FFF2C8", "#FFC85A", "#C8781E"] : ["#7A5A3A", "#4A3220", "#24180C"];
  return svg(
    PENDANT_W,
    PENDANT_H,
    `<defs>${radial("pg", glass, undefined, 0.4, 0.35, 0.75)}${linear("pb", MATERIALS.gold, false)}</defs>
<path d="M${c} 0V16" stroke="#2A1A0A" stroke-width="1.2"/>
<path d="${rrect(c - 4, 14, 8, 6, 1.5)}" fill="url(#pb)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${c - 5} 20H${c + 5}L${c + 13} 36H${c - 13}Z" fill="url(#pb)" stroke="${INK}" stroke-width="0.9"/>
<path d="M${c - 3} 22L${c - 9} 34" stroke="#fff" stroke-opacity="0.7" stroke-width="0.9" stroke-linecap="round"/>
<path d="M${c - 9} 36A9 9 0 0 0 ${c + 9} 36Z" fill="url(#pg)" stroke="${INK}" stroke-width="0.9"/>`,
  );
}

/** A plain room for a game without one: the colours of its landing in
 *  the lift, a panelled wainscot with a gilt rail, a gilt board, a long
 *  table. */
function plainRoom(look: LandingLook) {
  return (R: RoomLayout, floor: number, floors: number) => {
    const { w, h, wallTop, floorY, board: B, table: T, roof, beam } = R;
    const rail = wallTop + (floorY - wallTop) * 0.55;
    const wood = look.wood;
    const panels = Math.max(3, Math.round(w / 80));
    const pw = w / panels;
    const panelArt = Array.from({ length: panels }, (_, i) => {
      const x = i * pw + 7;
      return `<path d="${rrect(x, rail + 10, pw - 14, floorY - rail - 22, 3)}" fill="${shade(wood, -0.18)}" stroke="${shade(wood, -0.6)}" stroke-width="1"/>`;
    }).join("");
    return svg(
      w,
      h,
      `<defs>${linear("pw", look.wall)}${lit("pk", [shade(wood, 0.15), wood, shade(wood, -0.35)], 0, rail, 0, floorY)}${linear("pgv", MATERIALS.gold)}${linear("pfelt", ["#2A7A50", "#14502F"])}${radial("pl", [look.light, look.light], [0.3, 0], 0.5, 0.05, 0.75)}</defs>
<rect width="${w}" height="${f(rail)}" fill="url(#pw)"/>
<rect y="${f(rail)}" width="${w}" height="${f(floorY - rail)}" fill="url(#pk)"/>
${panelArt}
<rect y="${f(rail - 2)}" width="${w}" height="5" fill="url(#pgv)" stroke="${INK}" stroke-width="0.8"/>
<rect width="${w}" height="${f(floorY)}" fill="url(#pl)"/>
${boardsArt(w, floorY, h, wood)}
${skirting(w, floorY, wood)}
${doorArt(R, floor, floors)}
<path d="M${f(T.x + 14)} ${f(T.y)}H${f(T.x + T.w - 14)}L${f(T.x + T.w)} ${f(T.y + 12)}H${f(T.x)}Z" fill="url(#pfelt)" stroke="#06200F" stroke-width="0.8"/>
<rect x="${f(T.x - 2)}" y="${f(T.y + 12)}" width="${f(T.w + 4)}" height="24" fill="${shade(wood, -0.2)}" stroke="${INK}" stroke-width="0.9"/>
<rect x="${f(T.x - 3)}" y="${f(T.y + 10)}" width="${f(T.w + 6)}" height="5" rx="2" fill="url(#pgv)" stroke="${INK}" stroke-width="0.8"/>
${[T.x + 8, T.x + T.w - 17].map((x) => `<rect x="${f(x)}" y="${f(T.y + 36)}" width="9" height="${f(floorY - T.y - 36)}" fill="${shade(wood, -0.4)}" stroke="${INK}" stroke-width="0.8"/>`).join("")}
<rect width="${w}" height="${roof}" fill="${shade(look.wall[1], -0.3)}"/>
<rect y="${beam.y}" width="${w}" height="${beam.h}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.9"/>
<path d="${rrect(B.x + 1, B.y + 3.5, B.w, B.h, 6)}" fill="#000" fill-opacity="0.5"/>
${moulding(B.x, B.y, B.w, B.h, 6, 5, "pbm")}
<path d="${rrect(B.x + 5, B.y + 5, B.w - 10, B.h - 10, 3)}" fill="${shade(look.wall[0], -0.25)}" stroke="${INK}" stroke-width="0.9"/>
<circle cx="${f(B.x + B.w - 27)}" cy="${f(B.y + B.h / 2)}" r="24" fill="url(#pgv)" stroke="${INK}" stroke-width="1.1"/>
<circle cx="${f(B.x + B.w - 27)}" cy="${f(B.y + B.h / 2)}" r="17.4" fill="#F4EEDF" stroke="${INK}" stroke-width="0.9"/>`,
    );
  };
}

const rooms = new Map<string, RoomLook>([["coup", DEN]]);

/** The room for a game: its own, or a plain one in the colours of its
 *  landing in the lift. */
export function roomLook(key: string, landing: LandingLook): RoomLook {
  const known = rooms.get(key);
  if (known) return known;
  const made: RoomLook = {
    light: "#FFC870",
    art: plainRoom(landing),
    lamp: { lit: () => pendantArt(true), out: () => pendantArt(false), w: PENDANT_W, h: PENDANT_H },
    board: { title: "#F0CC72", text: "#FFF2D8" },
    popup: { enamel: ["#D2384A", "#9A1828", "#5A0812"], jewel: "ruby", glow: "#FFD58A" },
  };
  rooms.set(key, made);
  return made;
}
