// The two things every flat-on room keeps besides its working object: the
// manor's map and the notebook. Each room puts them somewhere of its own
// (a map nailed to the bell frame's post, chalked on a slate in the
// cellar, hung over a door in gilt; the notebook on a barrel, a crate, a
// sideboard...) but they are always the same two things: the map is the
// manor's nine rooms on a sheet, three by three in their own colours, a
// little gold compass star in the corner; the notebook is a small leather
// journal with gold corners, a strap and buckle and a crimson ribbon.
// Tapped, they open the satchel's Map and Notebook (FlatRoom draws them
// as two still images over the room, lifting a little at a touch).
//
// Plain SVG markup, w × h, baked once. A map can be drawn on a wall seen
// at an angle (a side wall): hand it the sheet's four corners in its box.

import { linear, radial } from "@/components/engraved/panel";
import { ROOMS, ROOM_COLOR } from "../logic";
import { GOLD, INK, IRON, OAK, WOOD_INK, f, poly, svg, type P2 } from "./parts";

/** A sheet's corners in its box: top left, top right, bottom right,
 *  bottom left. */
export type Quad = readonly [P2, P2, P2, P2];

/** How the map is shown: in a gilt or an oak frame, a sheet of parchment
 *  pinned up with two tacks, chalked on a slate hung from a nail, or in
 *  an iron frame against the weather. */
export type MapMount = "gilt" | "oak" | "pinned" | "slate" | "iron";

const PARCHMENT = ["#FBF3DC", "#EADBB4", "#C9B282"];
const SLATE = ["#4A545F", "#323A44", "#20262E"];
const CHALK = "#EEEBE0";
const LEATHER = ["#9A6236", "#6E3E1E", "#43220C"];
const LEATHER_DARK = ["#6A3A1A", "#4A240C", "#2A1206"];
const LEATHER_INK = "#1E0E04";
const RIBBON = ["#E0485C", "#A01A2E", "#5A0812"];

/** The projective map from the unit square onto a quad (exact for a sheet
 *  on a plane seen in perspective). */
function onto(q: Quad) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let g = 0;
  let h = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
  }
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  return (u: number, v: number): P2 => {
    const w = g * u + h * v + 1;
    return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];
  };
}

const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** The smallest box round some points, padded. */
export function boxAround(pts: readonly P2[], pad = 2) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.floor(Math.min(...xs) - pad);
  const y = Math.floor(Math.min(...ys) - pad);
  return { x, y, w: Math.ceil(Math.max(...xs) + pad - x), h: Math.ceil(Math.max(...ys) + pad - y) };
}

/** A quad given in the room's pixels, moved into its box. */
export const inBox = (q: Quad, b: { x: number; y: number }): Quad =>
  q.map(([x, y]) => [x - b.x, y - b.y] as P2) as unknown as Quad;

/** The manor's map, w × h. `sheet` is where the sheet's corners are in
 *  the box (flat on, filling it, when left out). */
export function manorMapArt(w: number, h: number, mount: MapMount, sheet?: Quad) {
  const hang = mount === "slate" ? Math.max(5, h * 0.2) : 0;
  const q: Quad = sheet ?? [
    [1, 1 + hang],
    [w - 2.5, 1 + hang],
    [w - 2.5, h - 2.5],
    [1, h - 2.5],
  ];
  const P = onto(q);
  const W = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2;
  const H = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2;
  const R = (u0: number, v0: number, u1: number, v1: number) => poly([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]);
  const L = (pts: [number, number][]) => `M${pts.map(([u, v]) => P(u, v).map(f).join(" ")).join("L")}`;
  const fine = Math.max(0.5, Math.min(W, H) / 46);
  const framed = mount === "gilt" || mount === "oak" || mount === "slate" || mount === "iron";
  const t = framed ? Math.max(2.2, Math.min(W, H) * (mount === "iron" ? 0.09 : 0.13)) : 0;
  const tu = t / W;
  const tv = t / H;
  const out: string[] = [];
  const shadow = q.map(([x, y]) => [x + 1.6, y + 2.2] as P2);
  out.push(`<path d="${poly(shadow)}" fill="#000" fill-opacity="0.45"/>`);

  // the cord and the nail it hangs from
  if (mount === "slate") {
    const nail = [(q[0][0] + q[1][0]) / 2, q[0][1] - hang + 1.5] as const;
    out.push(
      `<path d="M${f(P(0.16, 0)[0])} ${f(P(0.16, 0)[1])}L${f(nail[0])} ${f(nail[1])}L${f(P(0.84, 0)[0])} ${f(P(0.84, 0)[1])}" fill="none" stroke="#2A1A0C" stroke-width="0.9"/>`,
      `<circle cx="${f(nail[0])}" cy="${f(nail[1])}" r="1.4" fill="url(#kiron)" stroke="#0E1014" stroke-width="0.5"/>`,
    );
  }

  // the frame, or the sheet's own edge
  if (mount === "gilt" || mount === "oak" || mount === "slate" || mount === "iron") {
    const fill = mount === "gilt" ? "url(#kgold)" : mount === "iron" ? "url(#kiron)" : "url(#koak)";
    const ink = mount === "gilt" ? INK : mount === "iron" ? "#0E1014" : WOOD_INK;
    out.push(
      `<path d="${R(0, 0, 1, 1)}" fill="${fill}" stroke="${ink}" stroke-width="${f(fine * 1.6)}"/>`,
      `<path d="${R(tu * 0.45, tv * 0.45, 1 - tu * 0.45, 1 - tv * 0.45)}" fill="none" stroke="${ink}" stroke-opacity="0.5" stroke-width="${f(fine)}"${mount === "gilt" ? ' stroke-dasharray="1.1 1.2"' : ""}/>`,
    );
    if (mount === "oak") {
      out.push(`<path d="${R(tu * 0.82, tv * 0.82, 1 - tu * 0.82, 1 - tv * 0.82)}" fill="none" stroke="url(#kgold)" stroke-width="${f(fine * 1.4)}"/>`);
    }
  }
  const [u0, v0, u1, v1] = framed ? [tu, tv, 1 - tu, 1 - tv] : [0, 0, 1, 1];
  const chalk = mount === "slate";
  if (mount === "pinned") {
    // a sheet a little wavy at its edges, its lower right corner curling
    const edge: [number, number][] = [
      [0, 0.02],
      [0.5, 0],
      [1, 0.03],
      [0.99, 0.5],
      [1, 0.82],
      [0.84, 1],
      [0.5, 0.985],
      [0, 1],
      [0.015, 0.5],
    ];
    out.push(`<path d="${L(edge)}Z" fill="url(#kparch)" stroke="#5A3E1A" stroke-width="${f(fine * 1.3)}"/>`);
  } else {
    out.push(`<path d="${R(u0, v0, u1, v1)}" fill="${chalk ? "url(#kslate)" : "url(#kparch)"}" stroke="${chalk ? "#0E1014" : INK}" stroke-width="${f(fine)}"/>`);
  }

  // the nine rooms, three by three in their colours (chalked on a slate)
  const iw = u1 - u0;
  const ih = v1 - v0;
  const gx0 = u0 + iw * 0.11;
  const gx1 = u1 - iw * 0.11;
  const gy0 = v0 + ih * 0.13;
  const gy1 = v1 - ih * 0.11;
  const cw = (gx1 - gx0) / 3;
  const ch = (gy1 - gy0) / 3;
  const cells: string[] = [];
  ROOMS.forEach((room, i) => {
    const c = i % 3;
    const r = Math.floor(i / 3);
    const pad = 0.06;
    const a = gx0 + cw * (c + pad);
    const b = gy0 + ch * (r + pad);
    const d = gx0 + cw * (c + 1 - pad);
    const e = gy0 + ch * (r + 1 - pad);
    cells.push(
      chalk
        ? `<path d="${R(a, b, d, e)}" fill="${CHALK}" fill-opacity="0.1" stroke="${CHALK}" stroke-opacity="0.85" stroke-width="${f(fine * 1.1)}"/>`
        : `<path d="${R(a, b, d, e)}" fill="${ROOM_COLOR[room]}" fill-opacity="0.78" stroke="${INK}" stroke-opacity="0.75" stroke-width="${f(fine * 0.9)}"/>`,
    );
  });
  out.push(cells.join(""));
  // the passages between the rooms, little ticks across the walls
  const ticks: string[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      const x = gx0 + cw * (c + 1);
      const y = gy0 + ch * (r + 0.5);
      ticks.push(L([[x - cw * 0.12, y], [x + cw * 0.12, y]]));
    }
  }
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 2; r++) {
      const x = gx0 + cw * (c + 0.5);
      const y = gy0 + ch * (r + 1);
      ticks.push(L([[x, y - ch * 0.12], [x, y + ch * 0.12]]));
    }
  }
  out.push(
    `<path d="${ticks.join("")}" stroke="${chalk ? CHALK : "#5A3E1A"}" stroke-opacity="0.8" stroke-width="${f(fine * 0.9)}"/>`,
    `<path d="${R(gx0, gy0, gx1, gy1)}" fill="none" stroke="${chalk ? CHALK : INK}" stroke-width="${f(fine * 1.5)}"/>`,
  );

  // a little compass star in the upper right corner (a pinned sheet has
  // its tacks there)
  const [sx, sy] = P(u1 - iw * 0.075, v0 + ih * 0.085);
  const sr = Math.max(1.6, Math.min(W, H) * 0.075);
  const star = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? sr * 0.38 : sr;
    return [sx + Math.cos(a) * r, sy + Math.sin(a) * r] as P2;
  });
  if (mount !== "pinned") out.push(`<path d="${poly(star)}" fill="${chalk ? CHALK : "url(#kgold)"}" stroke="${chalk ? "none" : INK}" stroke-width="${f(fine * 0.7)}"/>`);

  // tacks, bosses, and a line of light down the lit edges
  if (mount === "pinned") {
    for (const u of [0.07, 0.93]) {
      const [x, y] = P(u, 0.06);
      out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(1.3, fine * 2.6))}" fill="url(#kbrass)" stroke="${INK}" stroke-width="0.5"/>`);
    }
    // the curl at the lower right
    out.push(`<path d="${L([[0.84, 1], [1, 0.82], [0.9, 0.86]])}Z" fill="#FFF8E4" stroke="#5A3E1A" stroke-width="${f(fine)}"/>`);
  }
  if (mount === "gilt") {
    for (const [u, v] of [
      [tu / 2, tv / 2],
      [1 - tu / 2, tv / 2],
      [tu / 2, 1 - tv / 2],
      [1 - tu / 2, 1 - tv / 2],
    ]) {
      const [x, y] = P(u, v);
      out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(t * 0.36)}" fill="url(#kboss)" stroke="${INK}" stroke-width="0.45"/>`);
    }
  }
  if (mount === "iron") {
    for (const [u, v] of [
      [tu / 2, tv / 2],
      [1 - tu / 2, tv / 2],
      [tu / 2, 1 - tv / 2],
      [1 - tu / 2, 1 - tv / 2],
    ]) {
      const [x, y] = P(u, v);
      out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(0.9, t * 0.3))}" fill="#C9D0DA" stroke="#0E1014" stroke-width="0.4"/>`);
    }
  }
  out.push(
    `<path d="${L([
      [0.012, 0.95],
      [0.012, 0.012],
      [0.62, 0.012],
    ])}" fill="none" stroke="#fff" stroke-opacity="${mount === "pinned" ? 0.55 : 0.75}" stroke-width="${f(fine * 1.2)}"/>`,
  );

  return svg(
    w,
    h,
    `<defs>${linear("kgold", GOLD)}${linear("koak", OAK, false)}${linear("kiron", IRON, false)}${linear("kparch", PARCHMENT, false)}${linear("kslate", SLATE, false)}${radial("kboss", ["#FFF6D0", "#E2B04A", "#8A5A16"], undefined, 0.38, 0.32, 0.75)}${radial("kbrass", ["#FFF2B8", "#C8962E", "#6A4410"], undefined, 0.38, 0.32, 0.75)}</defs>${out.join("")}`,
  );
}

/** Where on a notebook image its buckle catches the light (a share of
 *  its box). */
export const NOTEBOOK_GLINT: P2 = [0.74, 0.42];
/** A notebook's box is about this much wider than it is tall. */
export const NOTEBOOK_ASPECT = 1.55;

/** The notebook lying shut, w × h, seen a little from above: a leather
 *  cover tooled in gold with gold corners, the page block's edge in front,
 *  the strap round it with its brass buckle, the crimson ribbon hanging
 *  out; turned by `tilt` degrees on a surface that runs off at an angle. */
export function notebookArt(w: number, h: number, tilt = 0) {
  const cx = w / 2;
  const cy = h / 2;
  // the book in its own units, centred: a little narrower than the box so
  // a tilted one still fits
  const bw = w * (tilt ? 0.82 : 0.9);
  const bh = h * 0.78;
  const x0 = cx - bw / 2;
  const x1 = cx + bw / 2;
  const top = cy - bh / 2;
  const thick = bh * 0.24;
  const front = top + bh - thick;
  const narrow = bw * 0.05;
  const fine = Math.max(0.5, w / 36);
  const cover: P2[] = [
    [x0 + narrow, top],
    [x1 - narrow, top],
    [x1, front],
    [x0, front],
  ];
  const at = (u: number, v: number): P2 => {
    const xl = x0 + narrow * (1 - v);
    const xr = x1 - narrow * (1 - v);
    return [xl + (xr - xl) * u, top + (front - top) * v];
  };
  const out: string[] = [];
  out.push(
    // its shadow on what it lies on
    `<path d="M${f(x0 - 0.5)} ${f(front + thick + 0.6)}H${f(x1 + 1.5)}L${f(x1 - narrow + 1.5)} ${f(top + 2)}" fill="none" stroke="#000" stroke-opacity="0.4" stroke-width="${f(Math.max(1.6, thick * 0.6))}" stroke-linejoin="round"/>`,
    // the back cover's edge under the pages, and the page block
    `<path d="${poly([
      [x0, front],
      [x1, front],
      [x1, front + thick],
      [x0, front + thick],
    ])}" fill="url(#nbdark)" stroke="${LEATHER_INK}" stroke-width="${f(fine)}"/>`,
    `<path d="${poly([
      [x0 + bw * 0.06, front],
      [x1 - bw * 0.02, front],
      [x1 - bw * 0.02, front + thick * 0.72],
      [x0 + bw * 0.06, front + thick * 0.72],
    ])}" fill="url(#nbpage)" stroke="#5A4420" stroke-width="${f(fine * 0.6)}"/>`,
    `<path d="M${f(x0 + bw * 0.08)} ${f(front + thick * 0.36)}H${f(x1 - bw * 0.04)}" stroke="#A08A60" stroke-width="${f(fine * 0.5)}"/>`,
    // the crimson ribbon hanging out of the pages
    `<path d="M${f(x0 + bw * 0.34)} ${f(front + thick * 0.5)}v${f(thick * 1.1)}l${f(bw * 0.035)} ${f(-thick * 0.32)}l${f(bw * 0.035)} ${f(thick * 0.32)}v${f(-thick * 1.1)}Z" fill="url(#nbribbon)" stroke="#3A0408" stroke-width="${f(fine * 0.6)}"/>`,
    // the cover
    `<path d="${poly(cover)}" fill="url(#nbleather)" stroke="${LEATHER_INK}" stroke-width="${f(fine * 1.3)}"/>`,
    // the spine down the left, two raised bands on it
    `<path d="${poly([at(0, 0), at(0.13, 0), at(0.13, 1), at(0, 1)])}" fill="url(#nbdark)" stroke="${LEATHER_INK}" stroke-width="${f(fine * 0.8)}"/>`,
    `<path d="M${at(0, 0.3).map(f).join(" ")}L${at(0.13, 0.3).map(f).join(" ")}M${at(0, 0.7).map(f).join(" ")}L${at(0.13, 0.7).map(f).join(" ")}" stroke="#E2B04A" stroke-opacity="0.85" stroke-width="${f(fine * 0.8)}"/>`,
    // a tooled gold border, a lozenge in the middle
    `<path d="${poly([at(0.2, 0.14), at(0.93, 0.14), at(0.94, 0.86), at(0.2, 0.86)])}" fill="none" stroke="#E2B04A" stroke-opacity="0.6" stroke-width="${f(fine * 0.6)}"/>`,
    `<path d="${poly([at(0.5, 0.3), at(0.56, 0.5), at(0.5, 0.7), at(0.44, 0.5)])}" fill="url(#nbgold)" stroke="${INK}" stroke-width="${f(fine * 0.5)}"/>`,
  );
  // gold tips on the outer corners
  const tip = 0.13;
  out.push(
    `<path d="${poly([at(1, 0), at(1 - tip, 0), at(1, tip * 1.6)])}" fill="url(#nbgold)" stroke="${INK}" stroke-width="${f(fine * 0.6)}"/>`,
    `<path d="${poly([at(1, 1), at(1 - tip, 1), at(1, 1 - tip * 1.6)])}" fill="url(#nbgold)" stroke="${INK}" stroke-width="${f(fine * 0.6)}"/>`,
  );
  // the strap round it and its buckle
  const su0 = 0.7;
  const su1 = 0.79;
  out.push(
    `<path d="${poly([at(su0, 0), at(su1, 0), at(su1, 1), at(su0, 1)])}" fill="url(#nbdark)" stroke="${LEATHER_INK}" stroke-width="${f(fine * 0.7)}"/>`,
    `<path d="${poly([
      [at(su0, 1)[0], front],
      [at(su1, 1)[0], front],
      [at(su1, 1)[0], front + thick],
      [at(su0, 1)[0], front + thick],
    ])}" fill="url(#nbdark)" stroke="${LEATHER_INK}" stroke-width="${f(fine * 0.6)}"/>`,
  );
  const [bx, by] = at((su0 + su1) / 2, 0.5);
  const bk = Math.max(2.2, bw * 0.08);
  out.push(
    `<rect x="${f(bx - bk * 0.6)}" y="${f(by - bk * 0.7)}" width="${f(bk * 1.2)}" height="${f(bk * 1.4)}" rx="${f(bk * 0.2)}" fill="none" stroke="url(#nbgold)" stroke-width="${f(Math.max(0.8, bk * 0.32))}"/>`,
    `<rect x="${f(bx - bk * 0.6)}" y="${f(by - bk * 0.7)}" width="${f(bk * 1.2)}" height="${f(bk * 1.4)}" rx="${f(bk * 0.2)}" fill="none" stroke="${INK}" stroke-width="${f(fine * 0.4)}"/>`,
    // one line of light along the lit edge
    `<path d="M${at(0.16, 0.06).map(f).join(" ")}L${at(0.66, 0.06).map(f).join(" ")}" stroke="#FFE8C8" stroke-opacity="0.7" stroke-width="${f(fine * 0.7)}"/>`,
  );
  const body = out.join("");
  return svg(
    w,
    h,
    `<defs>${linear("nbleather", LEATHER, false)}${linear("nbdark", LEATHER_DARK)}${linear("nbpage", ["#FFFFFF", "#F4EEDF", "#D8CCB0"])}${linear("nbgold", GOLD)}${linear("nbribbon", RIBBON, false)}</defs>${
      tilt ? `<g transform="rotate(${f(tilt)} ${f(cx)} ${f(cy)})">${body}</g>` : body
    }`,
  );
}

/** A notebook's box resting on a surface at (x, y), `width` wide. */
export function notebookOn(x: number, y: number, width: number) {
  const w = Math.round(width);
  const h = Math.round(width / NOTEBOOK_ASPECT);
  // the book's foot is near the bottom of its box
  return { x: Math.round(x - w / 2), y: Math.round(y - h * 0.86), w, h };
}

/** Where the map or the notebook can be tapped: its box with a little
 *  room round it, at least 40 × 36 (or the box the room gives). */
export function keepHit(b: { x: number; y: number; w: number; h: number }, tap?: { x: number; y: number; w: number; h: number }) {
  if (tap) return { left: tap.x, top: tap.y, width: tap.w, height: tap.h };
  const width = Math.max(b.w + 8, 40);
  const height = Math.max(b.h + 8, 36);
  return { left: b.x + b.w / 2 - width / 2, top: b.y + b.h / 2 - height / 2, width, height };
}
