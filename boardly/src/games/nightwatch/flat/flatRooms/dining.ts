// Seal the Manor's dining room, seen flat on (the iso one is
// rooms/dining.ts): oxblood damask over an oak wainscot, the long table
// laid for a feast running away from you down the middle of the room
// under a brass chandelier — a white cloth with a crimson runner, two
// five-branched candelabra, plates at every place — high-backed chairs
// in crimson velvet down both sides and the host's at the far end, the
// founder's portrait over it between two sconces, the sideboard on the
// right wall with the tureen and a gilt mirror. At the near end of the
// table, on a silver salver, the two goblets for the toast: the thing
// that works the room (it takes two). Touched, they rise, lean in and
// clink. As SVG markup, baked once (FlatRoom); the goblets, the flames
// and the candlelight on the cloth live.

import { Skia } from "@shopify/react-native-skia";

import { linear, radial } from "@/components/engraved/panel";
import { MATERIALS } from "@/components/engraved/shapes";
import { rrect } from "@/components/engraved/trim";
import { BODY, LIFT } from "@/features/mascot/rig";
import type { Side } from "../../roomScenes";
import { exitFoot, exitPlate, type FlatLayout } from "../layout";
import {
  INK,
  VEIN,
  WOOD_INK,
  backDoorArt,
  bracketArt,
  ceilingArt,
  f,
  floorArt,
  floorShade,
  lit,
  partDefs,
  plateBox,
  sideWallArt,
  spillArt,
  svg,
} from "../parts";
import {
  box,
  candle,
  disc,
  face,
  flameAt,
  floorShadow,
  goblet,
  metalDefs,
  oval,
  partBDefs,
  type Flame,
  type P3,
} from "./partsB";
import { flatRoom, type FlatExit, type FlatFrame } from "./types";

const PAPER = ["#8E2E38", "#5E1622", "#34080E"];
const VELVET = ["#C2203A", "#8A1424", "#4A0610"];
const LIGHT = "#FFB45E";

/** Where the dining room's pieces stand, for a layout. */
export function diningPlan(L: FlatLayout, _exits: FlatExit[]) {
  const { bx0, bx1, ceil, floorY, wallH, vx, at, k } = L;
  const W = bx1 - bx0;
  const rail = Math.round(floorY - wallH * 0.27);
  // the table runs from near the wall to just short of the back row
  const backRow = floorY + (L.h - L.foot - floorY) * 0.36;
  const tw = W * 0.17;
  const table = {
    x0: vx - tw,
    x1: vx + tw,
    top: floorY - wallH * 0.2,
    z0: 16,
    z1: Math.max(80, L.zAtFloor(backRow) - 34),
  };
  const len = table.z1 - table.z0;
  const seatY = floorY - wallH * 0.13;
  const backTop = floorY - wallH * 0.43;
  const chairs = [0.12, 0.37, 0.62, 0.87].flatMap((t) =>
    ([-1, 1] as const).map((side) => ({ side, z: table.z0 + len * t })),
  );
  // a chair is behind the table's near end when a line from the eye to
  // its foot passes over the table first
  const off = tw + 18;
  const near = (z: number) => L.F + (z - L.F) * (tw / off) > table.z1;
  // the candelabra on the table, the chandelier over it, the sconces
  const flames: Flame[] = [];
  const cands = [-1, 1].map((side) => {
    const z = table.z0 + len * 0.3;
    const [x, y] = at(vx + side * tw * 0.52, table.top, z);
    const s = k(z) * 0.95;
    const tops = [-17, -9, 0, 9, 17].map((dx, i) => ({ x: x + dx * s, top: y - [22, 27, 33, 27, 22][i] * s }));
    tops.forEach((c) => flames.push(flameAt(c.x, c.top, s * 0.95)));
    return { x, y, s, tops };
  });
  const ch = {
    z: table.z0 + len * 0.45,
    y: ceil + wallH * 0.17,
    r: W * 0.12,
  };
  const arms = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const p: P3 = [vx + Math.cos(a) * ch.r, ch.y - 4, ch.z + Math.sin(a) * ch.r * 0.8];
    const [sx, sy] = at(...p);
    return { x: sx, y: sy, s: k(p[2]), back: Math.sin(a) < 0 };
  });
  arms.forEach((a) => flames.push(flameAt(a.x, a.y - 13 * a.s * 0.8, a.s * 0.8)));
  const portrait = { x: vx - W * 0.105, y: ceil + wallH * 0.2, w: W * 0.21, h: wallH * 0.32 };
  const sconces = [-1, 1].map((side) => ({ x: vx + side * W * 0.185, y: ceil + wallH * 0.44 }));
  sconces.forEach((sc) => [-6, 6].forEach((dx) => flames.push(flameAt(sc.x + dx, sc.y - 14, 0.85))));
  // the sideboard on the right wall, two candlesticks on it
  const side = { x0: bx1 - 22, x1: bx1, top: floorY - wallH * 0.23, z0: 46, z1: Math.min(124, L.zEdge * 0.96) };
  const sticks = [side.z0 + 8, side.z1 - 8].map((z) => {
    const [x, y] = at(side.x0 + 9, side.top, z);
    const s = k(z);
    flames.push(flameAt(x, y - 20 * s, s * 0.9));
    return { x, y, s };
  });
  // the goblets on their salver at the near end
  const gz = table.z1 - 13;
  const gs = k(gz);
  const [gx, gy] = at(vx, table.top, gz);
  const gh = Math.round(28 * gs);
  const prop = { x: gx - gh * 1.15, y: gy - gh - 4, w: gh * 2.3, h: gh + 7 };
  return {
    rail,
    table,
    tw,
    seatY,
    backTop,
    chairs: chairs.map((c) => ({ ...c, near: near(c.z) })),
    cands,
    ch,
    arms,
    portrait,
    sconces,
    side,
    sticks,
    gh,
    prop,
    touch: { x: gx, y: gy - gh * 0.55, rx: gh * 1.35, ry: gh * 0.95 },
    flames,
    pool: { x: vx - tw * 1.9, y: at(vx, table.top, table.z0)[1] - 30, w: tw * 3.8, h: gy - at(vx, table.top, table.z0)[1] + 50 },
    glints: arms.map((a, i) => ({ x: a.x + (i % 2 ? 3 : -3), y: a.y + 7 * a.s })),
  };
}
export type DiningPlan = ReturnType<typeof diningPlan>;

/** The damask motif: a pomegranate in a lozenge of leaves. */
function damask(x: number, y: number, s: number) {
  return `M${f(x)} ${f(y - s)}C${f(x + s * 0.7)} ${f(y - s * 0.4)} ${f(x + s * 0.7)} ${f(y + s * 0.5)} ${f(x)} ${f(y + s)}C${f(x - s * 0.7)} ${f(y + s * 0.5)} ${f(x - s * 0.7)} ${f(y - s * 0.4)} ${f(x)} ${f(y - s)}Z
M${f(x - s * 0.25)} ${f(y - s * 1.05)}q${f(s * 0.25)} ${f(-s * 0.5)} ${f(s * 0.5)} 0Z
M${f(x + s * 0.6)} ${f(y + s * 0.2)}q${f(s * 0.6)} ${f(-s * 0.2)} ${f(s * 0.7)} ${f(s * 0.5)}q${f(-s * 0.4)} ${f(s * 0.1)} ${f(-s * 0.7)} ${f(-s * 0.5)}Z
M${f(x - s * 0.6)} ${f(y + s * 0.2)}q${f(-s * 0.6)} ${f(-s * 0.2)} ${f(-s * 0.7)} ${f(s * 0.5)}q${f(s * 0.4)} ${f(s * 0.1)} ${f(s * 0.7)} ${f(-s * 0.5)}Z`;
}

/** The founder's portrait: a gilt frame with a ribbon of beading, a
 *  faceless meeple in black velvet with a white ruff and a gold chain on
 *  a dark ground, a little brass lamp over it. */
function portraitArt(Pt: DiningPlan["portrait"]) {
  const { x, y, w, h } = Pt;
  const t = 6;
  const ix = x + t;
  const iy = y + t;
  const iw = w - 2 * t;
  const ih = h - 2 * t;
  const k = (iw * 0.8) / 100;
  const mx = ix + iw / 2 - 50 * k;
  const my = iy + ih * 0.16;
  const beads: string[] = [];
  for (let i = 0; i < 14; i++) {
    beads.push(`<circle cx="${f(x + 3 + ((w - 6) * i) / 13)}" cy="${f(y + 3)}" r="1" fill="url(#pgd)"/>`);
    beads.push(`<circle cx="${f(x + 3 + ((w - 6) * i) / 13)}" cy="${f(y + h - 3)}" r="1" fill="url(#pgd)"/>`);
  }
  const ruff: string[] = [];
  const rcx = ix + iw / 2;
  const rcy = my + (LIFT + 38) * k;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ruff.push(`${f(rcx + Math.cos(a) * 13 * k * 1.25)} ${f(rcy + Math.sin(a) * 5 * k * 1.25)}`);
    const b = a + Math.PI / 12;
    ruff.push(`${f(rcx + Math.cos(b) * 10 * k * 1.25)} ${f(rcy + Math.sin(b) * 3.6 * k * 1.25)}`);
  }
  return `<defs>${radial("dpbg", ["#5A5A3A", "#2E2E1E", "#14140C"], undefined, 0.5, 0.35, 0.7)}${linear("dpv", ["#8A2234", "#56101E", "#2A060E"])}<clipPath id="dpc"><rect x="${f(ix)}" y="${f(iy)}" width="${f(iw)}" height="${f(ih)}"/></clipPath></defs>
<rect x="${f(x + 2)}" y="${f(y + 3)}" width="${f(w)}" height="${f(h)}" fill="#000" fill-opacity="0.45"/>
<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.9"/>
<rect x="${f(x + 4)}" y="${f(y + 4)}" width="${f(w - 8)}" height="${f(h - 8)}" fill="none" stroke="${VEIN}" stroke-width="0.7"/>
${beads.join("")}
<rect x="${f(ix)}" y="${f(iy)}" width="${f(iw)}" height="${f(ih)}" fill="url(#dpbg)" stroke="${INK}" stroke-width="0.7"/>
<g clip-path="url(#dpc)">
<path d="M${f(ix + iw * 0.15)} ${f(iy + ih)}V${f(iy + ih * 0.55)}h${f(iw * 0.08)}V${f(iy + ih)}Z" fill="#3A1A10" fill-opacity="0.6"/>
<g transform="translate(${f(mx)} ${f(my)}) scale(${f(k)}) translate(0 ${LIFT})"><path d="${BODY}" fill="url(#dpv)" stroke="#000" stroke-width="${f(1 / k)}"/></g>
<path d="M${ruff.join("L")}Z" fill="#F4EEDF" stroke="#8A7A5A" stroke-width="0.4"/>
<path d="M${f(rcx - 8 * k)} ${f(rcy + 6 * k)}Q${f(rcx)} ${f(rcy + 22 * k)} ${f(rcx + 8 * k)} ${f(rcy + 6 * k)}" fill="none" stroke="#F0CC72" stroke-width="${f(Math.max(0.8, 2.2 * k))}" stroke-dasharray="1.6 0.8"/>
<circle cx="${f(rcx)}" cy="${f(rcy + 15 * k)}" r="${f(Math.max(1.2, 3 * k))}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.4"/>
<path d="M${f(ix + 2)} ${f(iy + ih - 2)}V${f(iy + 2)}H${f(ix + iw * 0.6)}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1"/>
</g>
<path d="M${f(x + 1.2)} ${f(y + h - 2)}V${f(y + 1.2)}H${f(x + w * 0.6)}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.8"/>
<rect x="${f(x + w / 2 - 9)}" y="${f(y - 7)}" width="18" height="3.4" rx="1.6" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>
<path d="M${f(x + w / 2)} ${f(y - 3.6)}V${f(y)}" stroke="${INK}" stroke-width="1.2"/>
<path d="M${f(x + w / 2 - 12)} ${f(y - 3.6)}h24l-3 6h-18Z" fill="#FFE3A8" fill-opacity="0.12"/>`;
}

/** A brass sconce with two candles on the wall. */
function sconceArt(x: number, y: number) {
  return `<path d="${rrect(x - 3.6, y - 10, 7.2, 18, 3.2)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>
<circle cx="${f(x)}" cy="${f(y - 1)}" r="1.8" fill="url(#dsap)" stroke="${INK}" stroke-width="0.4"/>
<path d="M${f(x - 6)} ${f(y + 2)}Q${f(x - 6)} ${f(y + 9)} ${f(x)} ${f(y + 6)}Q${f(x + 6)} ${f(y + 9)} ${f(x + 6)} ${f(y + 2)}" fill="none" stroke="${INK}" stroke-width="2.6"/>
<path d="M${f(x - 6)} ${f(y + 2)}Q${f(x - 6)} ${f(y + 9)} ${f(x)} ${f(y + 6)}Q${f(x + 6)} ${f(y + 9)} ${f(x + 6)} ${f(y + 2)}" fill="none" stroke="url(#pgv)" stroke-width="1.4"/>
${candle(x - 6, y + 2, 9, 0.85)}${candle(x + 6, y + 2, 9, 0.85)}`;
}

/** A high-backed chair down the side of the table, seen in perspective:
 *  a crimson velvet back in a carved oak frame with a gilt finial on each
 *  post, the seat reaching in under the cloth. */
function sideChair(L: FlatLayout, P: DiningPlan, side: -1 | 1, z: number) {
  const { vx, floorY } = L;
  const xb = vx + side * (P.tw + 18);
  const xs = vx + side * (P.tw + 3);
  const hw = 9;
  const { seatY, backTop } = P;
  const out: string[] = [];
  out.push(floorShadow(L, Math.min(xb, xs) - 2, Math.max(xb, xs) + 2, z - hw - 2, z + hw + 4, 0.35));
  // legs: the front pair under the seat's near edge, the back pair
  const leg = (x: number, zz: number) => {
    const a = L.at(x, seatY + 3, zz);
    const b = L.at(x, floorY, zz);
    return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  };
  const legs = [leg(xb, z + hw - 1), leg(xs, z + hw - 1), leg(xb, z - hw + 1)].join("");
  out.push(
    `<path d="${legs}" stroke="${WOOD_INK}" stroke-width="${f(2.8 * L.k(z))}" stroke-linecap="round"/>`,
    `<path d="${legs}" stroke="url(#poakh)" stroke-width="${f(1.5 * L.k(z))}" stroke-linecap="round"/>`,
  );
  out.push(
    box(L, Math.min(xb, xs), Math.max(xb, xs), seatY, seatY + 4, z - hw, z + hw, {
      front: "url(#poakh)",
      top: "url(#dvel)",
      side: "url(#poak)",
    }),
  );
  // the back: its face towards the table, framed, upholstered
  const arch: P3[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    arch.push([xb, backTop - Math.sin(Math.PI * t) * 7, z - hw + 2 * hw * t]);
  }
  const back: P3[] = [[xb, seatY, z - hw], ...arch, [xb, seatY, z + hw]];
  const inner: P3[] = [
    [xb, seatY - 4, z - hw + 2.6],
    ...arch.map(([x, y, zz]) => [x, y + 4, z + (zz - z) * 0.68] as P3),
    [xb, seatY - 4, z + hw - 2.6],
  ];
  // the back's thickness: its outer edge, seen past its face
  const xo = xb + side * 3;
  const edge: P3[] = [[xo, seatY, z + hw], ...[...arch].reverse().map(([, y, zz]) => [xo, y, zz] as P3), [xo, seatY, z - hw]];
  out.push(
    `<path d="${face(L, edge)}" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.8"/>`,
    `<path d="${face(L, [...arch.map(([, y, zz]) => [xo, y, zz] as P3), ...[...arch].reverse()])}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
    `<path d="${face(L, back)}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>`,
    `<path d="${face(L, inner)}" fill="url(#dvel)" stroke="#2A0408" stroke-width="0.7"/>`,
    `<path d="${face(L, inner)}" fill="none" stroke="#E2B04A" stroke-opacity="0.55" stroke-width="0.6"/>`,
  );
  // buttons in the velvet, the finials
  const buttons: string[] = [];
  for (const [yy, zz] of [
    [backTop + 14, z - 2.6],
    [backTop + 14, z + 2.6],
    [backTop + 24, z],
  ] as const) {
    const [bx, by] = L.at(xb, yy, zz);
    buttons.push(`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(0.8 * L.k(z))}" fill="#3A0610"/>`);
  }
  for (const zz of [z - hw, z + hw]) {
    const [fx, fy] = L.at(xb, backTop - 1, zz);
    buttons.push(
      `<circle cx="${f(fx)}" cy="${f(fy - 1.6 * L.k(z))}" r="${f(1.7 * L.k(z))}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`,
    );
  }
  out.push(buttons.join(""));
  return out.join("");
}

/** The host's chair at the head of the table, facing you: taller, a gilt
 *  crest over its crimson back. */
function hostChair(L: FlatLayout, P: DiningPlan) {
  const { vx, floorY } = L;
  const z = 7;
  const hw = 15;
  const top = floorY - L.wallH * 0.52;
  const seat = P.seatY;
  const [x0, y0] = L.at(vx - hw, top, z);
  const [x1, y1] = L.at(vx + hw, seat, z);
  const cw = x1 - x0;
  const crest = `M${f(x0)} ${f(y0 + 8)}C${f(x0)} ${f(y0 - 2)} ${f(x0 + cw * 0.3)} ${f(y0 + 2)} ${f(x0 + cw / 2)} ${f(y0 - 8)}C${f(x0 + cw * 0.7)} ${f(y0 + 2)} ${f(x1)} ${f(y0 - 2)} ${f(x1)} ${f(y0 + 8)}V${f(y1)}H${f(x0)}Z`;
  const inner = `M${f(x0 + 4)} ${f(y0 + 10)}C${f(x0 + 4)} ${f(y0 + 4)} ${f(x0 + cw * 0.3)} ${f(y0 + 7)} ${f(x0 + cw / 2)} ${f(y0 + 1)}C${f(x0 + cw * 0.7)} ${f(y0 + 7)} ${f(x1 - 4)} ${f(y0 + 4)} ${f(x1 - 4)} ${f(y0 + 10)}V${f(y1 - 3)}H${f(x0 + 4)}Z`;
  return `<path d="${crest}" fill="#000" fill-opacity="0.4" transform="translate(1.5 2)"/>
<path d="${crest}" fill="url(#poak)" stroke="${WOOD_INK}" stroke-width="0.9"/>
<path d="${inner}" fill="url(#dvel)" stroke="#2A0408" stroke-width="0.7"/>
<path d="${inner}" fill="none" stroke="#E2B04A" stroke-opacity="0.6" stroke-width="0.6"/>
<path d="M${f(x0 + cw / 2 - 5)} ${f(y0 - 4)}l5 -6l5 6l-2 3h-6Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.6"/>
<circle cx="${f(x0 + cw / 2)}" cy="${f(y0 - 3)}" r="1.6" fill="url(#dsap)" stroke="${INK}" stroke-width="0.4"/>
<circle cx="${f(x0)}" cy="${f(y0 + 6)}" r="2" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>
<circle cx="${f(x1)}" cy="${f(y0 + 6)}" r="2" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(x0 + 1.2)} ${f(y1)}V${f(y0 + 8)}" stroke="#F0D0A8" stroke-opacity="0.35" stroke-width="0.8"/>`;
}

/** The long table: its shadow on the boards, the near legs, the white
 *  cloth hanging over its end with a gold band, the crimson runner down
 *  the middle, a place laid at every chair. */
function tableArt(L: FlatLayout, P: DiningPlan) {
  const { vx, floorY, at, k } = L;
  const { x0, x1, top, z0, z1 } = P.table;
  const out: string[] = [];
  const drop = 13;
  out.push(floorShadow(L, x0 - 8, x1 + 8, z0 - 4, z1 + 8, 0.5));
  // the legs at the near corners (the far ones are lost in the dark under it)
  for (const x of [x0 + 5, x1 - 5]) {
    const [lx, ly] = at(x, top + drop, z1 - 5);
    const [, fy] = at(x, floorY, z1 - 5);
    const s = k(z1);
    const turn = `M${f(lx - 2.6 * s)} ${f(ly)}h${f(5.2 * s)}l${f(-0.8 * s)} ${f((fy - ly) * 0.25)}q${f(2.4 * s)} ${f((fy - ly) * 0.12)} 0 ${f((fy - ly) * 0.25)}l${f(-0.8 * s)} ${f((fy - ly) * 0.42)}h${f(-1.8 * s)}l${f(-0.8 * s)} ${f(-(fy - ly) * 0.42)}q${f(-2.4 * s)} ${f(-(fy - ly) * 0.13)} 0 ${f(-(fy - ly) * 0.25)}Z`;
    out.push(`<path d="${turn}" fill="url(#poakh)" stroke="${WOOD_INK}" stroke-width="0.8"/>`);
  }
  // the cloth: its top, its end hanging down
  out.push(
    box(L, x0 - 2, x1 + 2, top, top + drop, z0 - 2, z1 + 2, {
      front: "url(#dclothf)",
      top: "url(#dcloth)",
      ink: "#5A4A30",
    }),
  );
  // a gold band along the hem, and the hem's scallops
  const [hx0, hy] = at(x0 - 2, top + drop, z1 + 2);
  const [hx1] = at(x1 + 2, top + drop, z1 + 2);
  const scallops: string[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = hx0 + ((hx1 - hx0) * i) / n;
    scallops.push(`M${f(a)} ${f(hy)}q${f((hx1 - hx0) / n / 2)} 3.4 ${f((hx1 - hx0) / n)} 0`);
  }
  out.push(
    `<path d="M${f(hx0)} ${f(hy - 3)}H${f(hx1)}" stroke="#E2B04A" stroke-width="1.6"/>`,
    `<path d="${scallops.join("")}" fill="#F4EEDF" stroke="#8A7A5A" stroke-width="0.5"/>`,
  );
  // the runner: crimson velvet with gold edges, over the end with a tassel
  const rw = P.tw * 0.32;
  const runner: P3[] = [
    [vx - rw, top, z0 + 4],
    [vx + rw, top, z0 + 4],
    [vx + rw, top, z1 + 2],
    [vx - rw, top, z1 + 2],
  ];
  const [ra] = at(vx - rw, top, z1 + 2);
  const [rb, ry] = at(vx + rw, top, z1 + 2);
  out.push(
    `<path d="${face(L, runner)}" fill="url(#dvel)" stroke="#E2B04A" stroke-width="0.8"/>`,
    `<path d="M${f(ra)} ${f(ry)}H${f(rb)}V${f(ry + drop + 4)}L${f((ra + rb) / 2)} ${f(ry + drop + 9)}L${f(ra)} ${f(ry + drop + 4)}Z" fill="url(#dvel)" stroke="#E2B04A" stroke-width="0.8"/>`,
    `<path d="M${f((ra + rb) / 2)} ${f(ry + drop + 9)}v3" stroke="#E2B04A" stroke-width="1.4"/>`,
    `<path d="M${f((ra + rb) / 2 - 2)} ${f(ry + drop + 12)}h4l1 5h-6Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.5"/>`,
  );
  // a place laid at every chair: a plate on a charger, a goblet beside it
  for (const c of P.chairs) {
    const px = vx + c.side * P.tw * 0.6;
    out.push(
      `<path d="${disc(L, px, top, c.z, P.tw * 0.27)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.5"/>`,
      `<path d="${disc(L, px, top, c.z, P.tw * 0.21)}" fill="url(#bchina)" stroke="#5A6070" stroke-width="0.5"/>`,
      `<path d="${disc(L, px, top, c.z, P.tw * 0.12)}" fill="none" stroke="#2A5AA8" stroke-opacity="0.55" stroke-width="0.6"/>`,
    );
    const [gx, gy] = at(px - c.side * P.tw * 0.32, top, c.z - 6);
    out.push(goblet(gx, gy, 12 * k(c.z)));
  }
  // between the candelabra: a bowl of fruit and a roast on its platter
  const zf = z0 + (z1 - z0) * 0.12;
  const [bx, by] = at(vx, top, zf);
  const s = k(zf);
  out.push(
    `<path d="${oval(bx, by, 11 * s, 3 * s)}" fill="url(#psv)" stroke="#1E242C" stroke-width="0.6"/>`,
    `<circle cx="${f(bx - 4 * s)}" cy="${f(by - 3 * s)}" r="${f(3.4 * s)}" fill="#C2453F" stroke="#3A0408" stroke-width="0.5"/>`,
    `<circle cx="${f(bx + 3 * s)}" cy="${f(by - 3.4 * s)}" r="${f(3.2 * s)}" fill="#E2B04A" stroke="${INK}" stroke-width="0.5"/>`,
    `<circle cx="${f(bx)}" cy="${f(by - 6 * s)}" r="${f(3 * s)}" fill="#6A2A6A" stroke="#1A0A1A" stroke-width="0.5"/>`,
    `<path d="M${f(bx + 5 * s)} ${f(by - 6 * s)}c2 -2 4 -1 4 1c-2 1 -3 1 -4 -1Z" fill="#6AAA3A" stroke="#14300A" stroke-width="0.4"/>`,
  );
  return out.join("");
}

/** A five-branched candelabrum standing on the table. */
function candelabrumArt(c: DiningPlan["cands"][number]) {
  const { x, y, s, tops } = c;
  const armY = y - 17 * s;
  const arms = [0, 1, 3, 4]
    .map((i) => {
      const t = tops[i];
      return `M${f(x)} ${f(armY)}Q${f(t.x)} ${f(armY + 3 * s)} ${f(t.x)} ${f(t.top + 9 * s)}`;
    })
    .join("");
  return `<path d="M${f(x - 7 * s)} ${f(y)}h${f(14 * s)}l${f(-2.5 * s)} ${f(-3.5 * s)}h${f(-9 * s)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>
<path d="M${f(x - 1.6 * s)} ${f(y - 3.5 * s)}V${f(tops[2].top + 9 * s)}h${f(3.2 * s)}V${f(y - 3.5 * s)}Z" fill="url(#pgh)" stroke="${INK}" stroke-width="0.6"/>
<circle cx="${f(x)}" cy="${f(y - 9 * s)}" r="${f(2.6 * s)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.6"/>
<path d="${arms}" fill="none" stroke="${INK}" stroke-width="${f(3 * s)}"/>
<path d="${arms}" fill="none" stroke="url(#pgv)" stroke-width="${f(1.6 * s)}"/>
${tops.map((t) => candle(t.x, t.top + 9 * s, 9 * s, s)).join("")}`;
}

/** The chandelier over the table: a brass bowl on a chain, six arms in a
 *  ring, crystal drops, a candle on each arm. `back` the arms behind the
 *  bowl or in front of it. */
function chandelierArt(L: FlatLayout, P: DiningPlan, back: boolean) {
  const { vx, ceil, at } = L;
  const { ch, arms } = P;
  const [cx, cy] = at(vx, ch.y, ch.z);
  const s = L.k(ch.z);
  const out: string[] = [];
  if (back) {
    const [, topY] = at(vx, ceil, ch.z);
    out.push(
      `<path d="M${f(cx)} ${f(topY)}V${f(cy - 10 * s)}" stroke="#0E1014" stroke-width="2.4" stroke-dasharray="2.4 1.4"/>`,
      `<path d="M${f(cx)} ${f(topY)}V${f(cy - 10 * s)}" stroke="#E2B04A" stroke-width="1" stroke-dasharray="1.6 2.2"/>`,
    );
  }
  const armPath = (a: (typeof arms)[number]) =>
    `M${f(cx)} ${f(cy + 2 * s)}Q${f((cx + a.x) / 2)} ${f(cy + 9 * s)} ${f(a.x)} ${f(a.y)}`;
  for (const a of arms.filter((q) => q.back === back)) {
    out.push(
      `<path d="${armPath(a)}" fill="none" stroke="${INK}" stroke-width="${f(2.8 * a.s)}"/>`,
      `<path d="${armPath(a)}" fill="none" stroke="url(#pgv)" stroke-width="${f(1.4 * a.s)}"/>`,
      `<path d="M${f(a.x)} ${f(a.y + 1)}v${f(5 * a.s)}" stroke="#E8F0FF" stroke-opacity="0.8" stroke-width="0.6"/>`,
      `<path d="M${f(a.x - 1.4 * a.s)} ${f(a.y + 6 * a.s)}l${f(1.4 * a.s)} ${f(2.6 * a.s)}l${f(1.4 * a.s)} ${f(-2.6 * a.s)}l${f(-1.4 * a.s)} ${f(-1.6 * a.s)}Z" fill="#F0F6FF" fill-opacity="0.85" stroke="#5A6A8A" stroke-width="0.4"/>`,
      candle(a.x, a.y, 9 * a.s * 0.8, a.s * 0.8),
    );
  }
  if (back) {
    // the bowl, its crystal tiers, a finial under it
    out.push(
      `<path d="M${f(cx - 11 * s)} ${f(cy - 2 * s)}Q${f(cx)} ${f(cy + 14 * s)} ${f(cx + 11 * s)} ${f(cy - 2 * s)}Z" fill="url(#pgv)" stroke="${INK}" stroke-width="0.8"/>`,
      `<path d="M${f(cx - 11 * s)} ${f(cy - 2 * s)}h${f(22 * s)}" stroke="#fff" stroke-opacity="0.7" stroke-width="0.7"/>`,
      `<path d="M${f(cx - 4 * s)} ${f(cy - 2 * s)}l${f(1 * s)} ${f(-8 * s)}h${f(6 * s)}l${f(1 * s)} ${f(8 * s)}Z" fill="url(#pgh)" stroke="${INK}" stroke-width="0.6"/>`,
      `<circle cx="${f(cx)}" cy="${f(cy - 10 * s)}" r="${f(2.2 * s)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`,
      `<path d="M${f(cx)} ${f(cy + 6 * s)}l${f(-2.4 * s)} ${f(4 * s)}l${f(2.4 * s)} ${f(6 * s)}l${f(2.4 * s)} ${f(-6 * s)}Z" fill="#F0F6FF" fill-opacity="0.85" stroke="#5A6A8A" stroke-width="0.5"/>`,
    );
    const drops: string[] = [];
    for (let i = 0; i < 9; i++) {
      const dx = cx - 9 * s + (18 * s * i) / 8;
      const dy = cy + 3 * s + Math.sin((Math.PI * i) / 8) * 5 * s;
      drops.push(`M${f(dx)} ${f(dy)}l${f(-1 * s)} ${f(2 * s)}l${f(1 * s)} ${f(2 * s)}l${f(1 * s)} ${f(-2 * s)}Z`);
    }
    out.push(`<path d="${drops.join("")}" fill="#E8F0FF" fill-opacity="0.9" stroke="#5A6A8A" stroke-width="0.35"/>`);
  }
  return out.join("");
}

/** The sideboard on the right wall: oak with panelled doors and brass
 *  pulls, a silver tureen, two candlesticks, a gilt mirror over it. */
function sideboardArt(L: FlatLayout, P: DiningPlan) {
  const { at, floorY, k } = L;
  const S = P.side;
  const out: string[] = [];
  // the mirror on the wall over it
  const mz0 = S.z0 + 6;
  const mz1 = S.z1 - 8;
  const my0 = P.rail - L.wallH * 0.34;
  const my1 = S.top - 12;
  const mirror: P3[] = [
    [S.x1, my0, mz0],
    [S.x1, my0 - 6, (mz0 + mz1) / 2],
    [S.x1, my0, mz1],
    [S.x1, my1, mz1],
    [S.x1, my1, mz0],
  ];
  const glass: P3[] = [
    [S.x1, my0 + 4, mz0 + 4],
    [S.x1, my0 - 2, (mz0 + mz1) / 2],
    [S.x1, my0 + 4, mz1 - 4],
    [S.x1, my1 - 4, mz1 - 4],
    [S.x1, my1 - 4, mz0 + 4],
  ];
  out.push(
    `<path d="${face(L, mirror)}" fill="url(#pgv)" stroke="${INK}" stroke-width="0.9"/>`,
    `<path d="${face(L, glass)}" fill="url(#dglass)" stroke="${INK}" stroke-width="0.6"/>`,
    `<path d="${face(L, [[S.x1, my0 + 10, mz0 + 10], [S.x1, my0 + 6, mz0 + 18], [S.x1, my1 - 14, mz1 - 10], [S.x1, my1 - 10, mz1 - 18]])}" fill="#fff" fill-opacity="0.12"/>`,
  );
  out.push(floorShadow(L, S.x0 - 6, S.x1, S.z0 - 4, S.z1 + 6, 0.45));
  out.push(
    box(L, S.x0, S.x1, S.top + 4, floorY - 4, S.z0, S.z1, { front: "url(#poak)", top: "url(#poakd)" }),
    box(L, S.x0, S.x1, floorY - 4, floorY, S.z0 + 1, S.z1 - 1, { front: "url(#poakd)" }),
    box(L, S.x0 - 2, S.x1, S.top, S.top + 4, S.z0 - 2, S.z1 + 2, { front: "url(#poakh)", top: "url(#dtop)" }),
  );
  // three panelled doors along its front, a pull on each
  const n = 3;
  for (let i = 0; i < n; i++) {
    const za = S.z0 + 3 + ((S.z1 - S.z0 - 6) * i) / n + 1.5;
    const zb = S.z0 + 3 + ((S.z1 - S.z0 - 6) * (i + 1)) / n - 1.5;
    const pts: P3[] = [
      [S.x0, S.top + 9, za],
      [S.x0, S.top + 9, zb],
      [S.x0, floorY - 9, zb],
      [S.x0, floorY - 9, za],
    ];
    out.push(`<path d="${face(L, pts)}" fill="#24140A" fill-opacity="0.45" stroke="${WOOD_INK}" stroke-width="0.7"/>`);
    const [px, py] = at(S.x0, S.top + 16, (za + zb) / 2);
    out.push(`<circle cx="${f(px)}" cy="${f(py)}" r="${f(1.3 * k(za))}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.4"/>`);
  }
  // the tureen in the middle, a candlestick at each end
  const tz = (S.z0 + S.z1) / 2;
  const [tx, ty] = at(S.x0 + 10, S.top, tz);
  const s = k(tz);
  out.push(
    `<path d="M${f(tx - 6 * s)} ${f(ty)}h${f(12 * s)}l${f(-2 * s)} ${f(-3 * s)}h${f(-8 * s)}Z" fill="url(#psv)" stroke="#1E242C" stroke-width="0.6"/>`,
    `<path d="M${f(tx - 11 * s)} ${f(ty - 9 * s)}Q${f(tx - 11 * s)} ${f(ty - 2 * s)} ${f(tx)} ${f(ty - 2.6 * s)}Q${f(tx + 11 * s)} ${f(ty - 2 * s)} ${f(tx + 11 * s)} ${f(ty - 9 * s)}Z" fill="url(#psv)" stroke="#1E242C" stroke-width="0.7"/>`,
    `<path d="M${f(tx - 10 * s)} ${f(ty - 9 * s)}Q${f(tx)} ${f(ty - 19 * s)} ${f(tx + 10 * s)} ${f(ty - 9 * s)}Z" fill="url(#psv)" stroke="#1E242C" stroke-width="0.7"/>`,
    `<circle cx="${f(tx)}" cy="${f(ty - 15 * s)}" r="${f(1.8 * s)}" fill="url(#pgd)" stroke="${INK}" stroke-width="0.5"/>`,
    `<path d="M${f(tx - 8 * s)} ${f(ty - 10 * s)}Q${f(tx - 4 * s)} ${f(ty - 15 * s)} ${f(tx + 1 * s)} ${f(ty - 15.5 * s)}" fill="none" stroke="#fff" stroke-width="0.8"/>`,
  );
  for (const st of P.sticks) {
    out.push(
      `<path d="M${f(st.x - 4 * st.s)} ${f(st.y)}h${f(8 * st.s)}l${f(-2.4 * st.s)} ${f(-3 * st.s)}h${f(-3.2 * st.s)}Z" fill="url(#psv)" stroke="#1E242C" stroke-width="0.5"/>`,
      `<path d="M${f(st.x - 1.2 * st.s)} ${f(st.y - 3 * st.s)}V${f(st.y - 11 * st.s)}h${f(2.4 * st.s)}V${f(st.y - 3 * st.s)}Z" fill="url(#psvh)" stroke="#1E242C" stroke-width="0.5"/>`,
      candle(st.x, st.y - 11 * st.s, 9 * st.s, st.s * 0.9),
    );
  }
  return out.join("");
}

/** The runner rug under the table: crimson in a gold-edged border. */
function rugArt(L: FlatLayout, P: DiningPlan) {
  const { vx, floorY } = L;
  const X0 = vx - P.tw - 30;
  const X1 = vx + P.tw + 30;
  const Z0 = 6;
  const Z1 = P.table.z1 + 46;
  const q = (x0: number, x1: number, z0: number, z1: number) =>
    face(L, [
      [x0, floorY, z0],
      [x1, floorY, z0],
      [x1, floorY, z1],
      [x0, floorY, z1],
    ]);
  return `<path d="${q(X0, X1, Z0, Z1)}" fill="url(#drugb)" stroke="#2A0408" stroke-width="0.8"/>
<path d="${q(X0 + 7, X1 - 7, Z0 + 6, Z1 - 6)}" fill="url(#drug)" stroke="#E2B04A" stroke-opacity="0.8" stroke-width="1"/>
<path d="${q(X0 + 3.5, X1 - 3.5, Z0 + 3, Z1 - 3)}" fill="none" stroke="#E2B04A" stroke-opacity="0.5" stroke-width="0.7" stroke-dasharray="3 2"/>`;
}

/** The whole dining room, still: everything but what lives. */
export function diningArt(L: FlatLayout, P: DiningPlan, exits: FlatExit[]) {
  const { w, h, ceil, floorY, bx0, bx1 } = L;
  const exit = (side: Side) => exits.find((e) => e.side === side) ?? null;
  const out: string[] = [];
  // the back wall: damask paper, the wainscot under a gilt rail
  const motifs: string[] = [];
  for (let r = 0, y = ceil + 16; y < P.rail - 4; r++, y += 17) {
    for (let x = bx0 + (r % 2 ? 10 : 0); x < bx1 + 6; x += 20) motifs.push(damask(x, y, 5.5));
  }
  out.push(
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#dwall)"/>`,
    `<path d="${motifs.join("")}" fill="#E2B04A" fill-opacity="0.16"/>`,
    `<rect x="${f(bx0)}" y="${f(ceil)}" width="${f(bx1 - bx0)}" height="${f(floorY - ceil)}" fill="url(#dwarm)"/>`,
  );
  const panels: string[] = [];
  const pw = 22;
  for (let x = bx0 + 3; x + pw - 3 < bx1; x += pw) {
    panels.push(
      `<path d="${rrect(x + 2, P.rail + 7, pw - 4, floorY - 12 - P.rail - 7, 1.5)}" fill="#24140A" fill-opacity="0.5" stroke="${WOOD_INK}" stroke-width="0.8"/><path d="M${f(x + 3)} ${f(floorY - 13)}V${f(P.rail + 8)}H${f(x + pw - 3)}" fill="none" stroke="#F0D0A8" stroke-opacity="0.22" stroke-width="0.6"/>`,
    );
  }
  out.push(
    `<rect x="${f(bx0)}" y="${f(P.rail)}" width="${f(bx1 - bx0)}" height="${f(floorY - P.rail)}" fill="url(#poak)"/>`,
    panels.join(""),
    `<rect x="${f(bx0)}" y="${f(P.rail - 2)}" width="${f(bx1 - bx0)}" height="4.4" fill="url(#pgv)" stroke="${INK}" stroke-width="0.7"/>`,
    `<path d="M${f(bx0)} ${f(P.rail - 1)}H${f(bx1)}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.6"/>`,
    `<rect x="${f(bx0)}" y="${f(floorY - 8)}" width="${f(bx1 - bx0)}" height="8" fill="url(#poakd)" stroke="${WOOD_INK}" stroke-width="0.7"/>`,
  );
  // the side walls, their archways
  for (const side of ["frontLeft", "frontRight"] as const) {
    const e = exit(side);
    const A = L.arches[side];
    out.push(sideWallArt(L, A.wall, PAPER, e ? { box: A, door: e.door, color: e.color } : null, P.rail));
  }
  out.push(ceilingArt(L));
  out.push(floorArt(L), rugArt(L, P));
  for (const e of exits) {
    if (e.door !== "open") continue;
    const [x, y] = exitFoot(L, e.side);
    const back = e.side === "left" || e.side === "right";
    out.push(
      spillArt(
        x + (back ? 0 : e.side === "frontLeft" ? 16 : -16),
        y + (back ? 8 : 4),
        back ? 34 : 30,
        back ? 11 : 16,
        e.color,
        `spill${e.side}`,
      ),
    );
  }
  // the back wall's doors, the portrait and the sconces between them
  for (const side of ["left", "right"] as const) {
    const e = exit(side);
    if (e) out.push(backDoorArt(L.doors[side], e.door, e.color, `bd${side[0]}`));
  }
  out.push(portraitArt(P.portrait), ...P.sconces.map((s) => sconceArt(s.x, s.y)));
  out.push(sideboardArt(L, P));
  // the chandelier's far arms, the host's chair, the chairs behind the
  // table's end, the table, the chairs in front of it
  out.push(hostChair(L, P));
  const chairs = [...P.chairs].sort((a, b) => a.z - b.z);
  for (const c of chairs) if (!c.near) out.push(sideChair(L, P, c.side, c.z));
  out.push(tableArt(L, P), ...P.cands.map(candelabrumArt));
  // the salver the goblets stand on
  const [gx, gy] = L.at(L.vx, P.table.top, P.table.z1 - 13);
  out.push(
    `<path d="${oval(gx, gy + 2, P.gh * 0.95, P.gh * 0.16)}" fill="#000" fill-opacity="0.35"/>`,
    `<path d="${oval(gx, gy, P.gh * 0.95, P.gh * 0.16)}" fill="url(#psv)" stroke="#1E242C" stroke-width="0.8"/>`,
    `<path d="${oval(gx, gy - 0.6, P.gh * 0.75, P.gh * 0.1)}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.7"/>`,
  );
  for (const c of chairs) if (c.near) out.push(sideChair(L, P, c.side, c.z));
  out.push(chandelierArt(L, P, true), chandelierArt(L, P, false));
  for (const e of exits) {
    const p = exitPlate(L, e.side);
    if ("wall" in p && p.wall !== undefined) out.push(bracketArt(p.wall, p.x, p.y, p.w, p.h));
    out.push(plateBox(p.x, p.y, p.w, p.h, `pl${e.side}`));
  }
  out.push(floorShade(L));
  return svg(
    w,
    h,
    `<defs>
${partDefs(L)}
${partBDefs()}
${linear("psv", MATERIALS.silver)}${linear("psvh", MATERIALS.silver, false)}
${lit("dwall", PAPER, bx0, ceil, bx0 + (bx1 - bx0) * 0.5, floorY + 40)}
${radial("dwarm", [LIGHT, LIGHT], [0.28, 0], 0.5, 0.45, 0.55)}
${linear("dvel", VELVET, false)}
${radial("dsap", ["#BFE0FF", "#3A6AC8", "#0C1E5A"], undefined, 0.38, 0.32, 0.75)}
${linear("dtop", ["#8A6440", "#6A4A2C", "#4E3420"])}
${lit("dcloth", ["#FFFFFF", "#F4EEDF", "#D8CCB0"], L.vx - P.tw, P.table.top - 30, L.vx + P.tw, P.table.top + 40)}
${linear("dclothf", ["#F4EEDF", "#D8CCB0"])}
${linear("dglass", ["#3A4A6A", "#1A2236", "#0A0E1A"])}
${linear("drug", ["#A01A2E", "#7A1020", "#4A0610"])}
${linear("drugb", ["#3A1A10", "#24100A", "#140806"])}
</defs>
${out.join("\n")}`,
  );
}

/** One goblet for the toast, as an image of its own (two are drawn). */
export function toastGobletArt(gh: number) {
  const w = gh * 0.62;
  return svg(w, gh + 1, `<defs>${metalDefs()}${partBDefs()}</defs>${goblet(w / 2, gh, gh)}`);
}

/** The goblets' place in the prop's box: each stands on the salver,
 *  leaning in towards the other as they're raised to clink. */
function clink(fx: FlatFrame, P: DiningPlan) {
  "worklet";
  const { c, draw, img } = fx;
  const gh = P.gh;
  const gw = gh * 0.62;
  const foot = P.prop.y + P.prop.h - 6;
  const mid = P.prop.x + P.prop.w / 2;
  const lean = Math.max(0, fx.move) * 13;
  for (const side of [-1, 1]) {
    const x = mid + side * gh * 0.5;
    c.save();
    c.translate(x, foot);
    c.rotate(-side * lean, 0, 0);
    draw(img.goblet, -gw / 2, -gh, gw, gh + 1);
    c.restore();
  }
}

/** The candlelight on the cloth, breathing with the flames, and the
 *  chandelier's crystals catching it. */
function diningUnder(fx: FlatFrame, P: DiningPlan) {
  "worklet";
  const { time, draw, img, c } = fx;
  const pool = P.pool;
  fx.screen[0].setAlphaf(0.5 + 0.08 * Math.sin(time * 5.1) + 0.05 * Math.sin(time * 11.7));
  draw(img.pool, pool.x, pool.y, pool.w, pool.h, fx.screen[0]);
  fx.fill.setColor(Skia.Color("#FFFFFF"));
  for (let i = 0; i < P.glints.length; i++) {
    const g = P.glints[i];
    const a = Math.max(0, Math.sin(time * 1.3 + i * 2.1)) ** 6;
    if (a < 0.02) continue;
    fx.fill.setAlphaf(a);
    const r = 2.6 * a;
    c.drawRect(Skia.XYWHRect(g.x - r, g.y - 0.35, r * 2, 0.7), fx.fill);
    c.drawRect(Skia.XYWHRect(g.x - 0.35, g.y - r, 0.7, r * 2), fx.fill);
  }
}

export const dining = flatRoom({
  id: "dining",
  light: LIGHT,
  plan: diningPlan,
  art: diningArt,
  // the prop itself is the space the goblets rise in; they are drawn by `onProp`
  propArt: (P) => svg(P.prop.w, P.prop.h, ""),
  motion: () => ({ kind: "pop", lift: 7, scale: 0.18 }),
  payoff: {
    burst: { kind: "sparks", size: 30, color: "#F0C87A", duration: 800 },
    haptic: "clink",
    at: (P) => [P.prop.x + P.prop.w / 2, P.prop.y + 4],
  },
  images: (_L, P) => ({
    goblet: { w: P.gh * 0.62, h: P.gh + 1, art: () => toastGobletArt(P.gh), key: `${P.gh}` },
    pool: {
      w: P.pool.w,
      h: P.pool.h,
      art: () =>
        svg(
          P.pool.w,
          P.pool.h,
          `<defs>${radial("dp", [LIGHT, LIGHT, LIGHT], [0.32, 0.12, 0])}</defs><rect width="${f(P.pool.w)}" height="${f(P.pool.h)}" fill="url(#dp)"/>`,
        ),
    },
  }),
  under: diningUnder,
  onProp: clink,
});
