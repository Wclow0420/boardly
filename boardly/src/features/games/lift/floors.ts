// What stands on each floor of the lift (the Games tab), by game: the
// emblem by its number on the dial, the landing's colours, the game's
// lead, and the game's own things set out on the landing — its rooms
// (Seal the Manor's chapel, Shelter's house, a study of the manor at
// midnight) or the pieces it is played with (the parlour's inlaid board,
// the agency's dossier and stamp, the den's eave and lanterns, the dice
// bar's back shelf and cups), all drawn from the games' own art. A floor
// is baked once into one image (floorImage) and kept with the app's
// other baked art.

import { Skia, type SkCanvas, type SkImage } from "@shopify/react-native-skia";
import { PixelRatio } from "react-native";

import { bakedDrawing, bakedSvg } from "@/components/badges/bake";
import { toSvg, type EmblemData } from "@/components/engraved/emblem";
import { emblemData } from "@/components/icons";
import { recordShapes } from "@/components/iso/IsoCanvas";
import { closedArt, stampArt } from "@/games/avalon/dossier/art";
import { denArt as eaveArt, denLayout as eaveLayout, lanternArt, tileArt, LANTERN_W, LANTERN_H } from "@/games/coup/den/denArt";
import { cupArt, denArt as barArt, denLayout as barLayout, dieArt, matArt, slateArt, steinArt } from "@/games/liarsdice/art";
import { ROOMS } from "@/games/nightwatch/logic";
import { SCENE_HEIGHT, SCENE_WIDTH } from "@/games/nightwatch/manorShapes";
import { buildScene } from "@/games/nightwatch/roomScenes";
import { shelterScene } from "@/games/shelter/shelterScenes";
import { boardArt, cellAt, markArt } from "@/games/tictactoe/art";
import { landingArt, landingShade, type LandingLook } from "./art";
import { LEADS, MEEPLE } from "./leads";

const f = (n: number) => +n.toFixed(2);

/** An SVG document drawn at (x, y), w × h. */
export function drawSvg(c: SkCanvas, markup: string, x: number, y: number, w: number, h: number) {
  const svg = Skia.SVG.MakeFromString(
    markup.replace(/^(\s*<svg\b[^>]*?)\swidth="[^"]*"\s+height="[^"]*"/, `$1 width="${f(w)}" height="${f(h)}"`),
  );
  if (!svg) return;
  c.save();
  c.translate(x, y);
  c.drawSvg(svg, w, h);
  c.restore();
}

/** An SVG document's own size. */
function sizeOf(markup: string): [number, number] {
  const m = markup.match(/width="([\d.]+)"\s+height="([\d.]+)"/);
  return m ? [Number(m[1]), Number(m[2])] : [100, 100];
}

/** An SVG document drawn `h` tall with its foot at (cx, foot). */
function stand(c: SkCanvas, markup: string, cx: number, foot: number, h: number) {
  const [sw, sh] = sizeOf(markup);
  const w = (h * sw) / sh;
  drawSvg(c, markup, cx - w / 2, foot - h, w, h);
}

/** An isometric scene (its own w × h) fitted into a box, centred. */
function scene(c: SkCanvas, shapes: Parameters<typeof recordShapes>[0], box: { x: number; y: number; w: number; h: number }) {
  const k = Math.min(box.w / SCENE_WIDTH, box.h / SCENE_HEIGHT);
  c.save();
  c.translate(box.x + (box.w - SCENE_WIDTH * k) / 2, box.y + (box.h - SCENE_HEIGHT * k) / 2);
  c.scale(k, k);
  c.drawPicture(recordShapes(shapes));
  c.restore();
}

/** The agency's window, w × h: a gilt frame, venetian blinds half
 *  down over the night outside, slats lit along their edges. */
function blindsArt(w: number, h: number) {
  const t = 5;
  const slats = Array.from({ length: Math.floor((h * 0.62) / 7) }, (_, i) => {
    const y = t + 2 + i * 7;
    return `<rect x="${t + 1}" y="${f(y)}" width="${f(w - 2 * t - 2)}" height="5" fill="url(#bs)" stroke="#3A2408" stroke-width="0.5"/><path d="M${t + 2} ${f(y + 0.8)}H${f(w - t - 2)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">
<defs><linearGradient id="bn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22405A"/><stop offset="1" stop-color="#0A1620"/></linearGradient>
<linearGradient id="bs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4EEDF"/><stop offset="1" stop-color="#B8AC90"/></linearGradient>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF2B8"/><stop offset="0.5" stop-color="#E2B04A"/><stop offset="1" stop-color="#9A6B1E"/></linearGradient></defs>
<rect x="${t}" y="${t}" width="${f(w - 2 * t)}" height="${f(h - 2 * t)}" fill="url(#bn)"/>
<circle cx="${f(w * 0.7)}" cy="${f(h * 0.8)}" r="${f(h * 0.08)}" fill="#F4EEDF" fill-opacity="0.85"/>
${slats}
<path d="M${f(w * 0.5)} ${t}V${f(h * 0.7)}" stroke="#3A2408" stroke-width="0.8"/>
<path d="M0 0H${f(w)}V${f(h)}H0Z M${t} ${t}V${f(h - t)}H${f(w - t)}V${t}Z" fill="url(#bg)" fill-rule="evenodd" stroke="#3A2408" stroke-width="1"/>
<path d="M${f(w * 0.5)} ${t}V${f(h - t)}" stroke="url(#bg)" stroke-width="3"/>
<path d="M${f(w * 0.5)} ${t}V${f(h - t)}" stroke="#3A2408" stroke-width="0.6" stroke-opacity="0.7"/>
<path d="M3 2H${f(w * 0.45)}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
</svg>`;
}

export interface FloorArt {
  /** The emoji whose emblem marks the floor on the dial. */
  emblem: string;
  look: LandingLook;
  lead: EmblemData;
  /** Where the lead stands, as a fraction of the floor's width. */
  leadAt: number;
  /** The game's things on the landing, w × h. */
  things?: (c: SkCanvas, w: number, h: number) => void;
}

const room = (name: (typeof ROOMS)[number], accent: string) => () => {
  const s = buildScene(ROOMS.indexOf(name), { accent, collapsed: [], lockedDoor: null });
  return [...s.back, ...s.prop, ...s.front];
};

export const FLOORS: Record<string, FloorArt> = {
  tictactoe: {
    emblem: "⭕",
    look: { wall: ["#2F5D8A", "#16304E"], wood: "#6A4528", light: "#FFE7B0" },
    lead: LEADS.tictactoe,
    leadAt: 0.72,
    // the inlaid board hung on the parlour wall, a game under way on it
    things: (c, w, h) => {
      const s = Math.min(w * 0.5, h * 0.5);
      const x = w * 0.08;
      const y = h * 0.1;
      drawSvg(c, boardArt(s), x, y, s, s);
      ([[0, "X"], [4, "X"], [2, "O"], [6, "O"], [8, "X"]] as const).forEach(([i, kind]) => {
        const { x: mx, y: my, cell } = cellAt(s, i);
        const m = cell * 0.78;
        drawSvg(c, markArt(kind, m), x + mx - m / 2, y + my - m / 2, m, m);
      });
    },
  },
  avalon: {
    emblem: "🕵",
    look: { wall: ["#1E3A40", "#0D181C"], wood: "#4A2E1A", light: "#E8C890" },
    lead: LEADS.avalon,
    leadAt: 0.7,
    // the agency's desk: the dossier shut and tied, the stamp beside it
    things: (c, w, h) => {
      // a window behind the desk, its blinds half down, the street's
      // light slanting through them across the wall
      const bw = w * 0.34;
      const bh = h * 0.3;
      drawSvg(c, blindsArt(bw, bh), w * 0.58, h * 0.07, bw, bh);
      const desk = h * 0.66;
      const p = Skia.Paint();
      p.setAntiAlias(true);
      p.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: desk }, { x: 0, y: h }, ["#5A3620", "#2A160A"].map((k) => Skia.Color(k)), null, 0));
      c.drawRect(Skia.XYWHRect(0, desk, w, h - desk), p);
      const edge = Skia.Paint();
      edge.setAntiAlias(true);
      edge.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: desk - 3 }, { x: 0, y: desk + 4 }, ["#FFF2B8", "#E2B04A", "#9A6B1E"].map((k) => Skia.Color(k)), null, 0));
      c.drawRect(Skia.XYWHRect(0, desk - 3, w, 6), edge);
      stand(c, closedArt(), w * 0.24, desk + 6, h * 0.36);
      stand(c, stampArt("approve"), w * 0.48, desk + 4, h * 0.25);
    },
  },
  coup: {
    emblem: "🪙",
    look: { wall: ["#4A1418", "#1E0808"], wood: "#3A2418", light: "#FFB46A" },
    lead: LEADS.coup,
    leadAt: 0.7,
    // the den's eave across the top, red lanterns at its ends, the tiles
    // standing on the felt
    things: (c, w, h) => {
      const L = eaveLayout(w, -4, 1);
      drawSvg(c, eaveArt(L), 0, 0, w, L.h);
      const lantern = lanternArt();
      const lh = Math.min(LANTERN_H * 1.3, h * 0.3);
      const lw = (lh * LANTERN_W) / LANTERN_H;
      L.lanterns.forEach((at) => drawSvg(c, lantern, at.x - lw / 2, at.y, lw, lh));
      const felt = h * 0.66;
      const p = Skia.Paint();
      p.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: felt }, { x: 0, y: h }, ["#1E6A44", "#0A2A1A"].map((k) => Skia.Color(k)), null, 0));
      c.drawRect(Skia.XYWHRect(0, felt, w, h - felt), p);
      const rail = Skia.Paint();
      rail.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: felt - 4 }, { x: 0, y: felt + 4 }, ["#FFF2B8", "#E2B04A", "#9A6B1E"].map((k) => Skia.Color(k)), null, 0));
      c.drawRect(Skia.XYWHRect(0, felt - 3, w, 6), rail);
      const tile = tileArt("two");
      const th = h * 0.19;
      [0.12, 0.25, 0.38].forEach((k) => stand(c, tile, w * k, felt + th * 0.3, th));
      // the pot: coins stacked on the felt
      const coin = emblemData("🪙");
      if (coin) {
        const s = h * 0.12;
        [[0.14, 0.93], [0.27, 0.96], [0.4, 0.92]].forEach(([kx, ky]) => drawSvg(c, toSvg(coin.data, s, coin.tint), w * kx - s / 2, h * ky - s, s, s));
      }
    },
  },
  liarsdice: {
    emblem: "🎲",
    look: { wall: ["#3A1414", "#160808"], wood: "#4A2A18", light: "#FFC870" },
    lead: LEADS.liarsdice,
    leadAt: 0.72,
    // the back bar with its steins, the mat on the counter, a cup and dice
    things: (c, w, h) => {
      const L = barLayout(w, 10, 5);
      drawSvg(c, barArt(L), 0, 0, w, L.h);
      // the slate the calls are chalked on, hung under the shelf
      const sw = w * 0.36;
      drawSvg(c, slateArt(sw, sw * 0.62), w * 0.08, L.h + h * 0.04, sw, sw * 0.62);
      L.steins.forEach((s, i) => {
        const st = steinArt([0.9, 0.5, 0.2, 0.7, 1][i] ?? 0.5, false, L.stein);
        stand(c, st, s.x, L.shelfY + 1, L.stein * 1.3);
      });
      const mw = w * 0.56;
      const mh = mw * 0.4;
      const my = h - mh - h * 0.04;
      drawSvg(c, matArt(mw, mh), w * 0.04, my, mw, mh);
      stand(c, cupArt(mw * 0.3, false), w * 0.04 + mw * 0.32, my + mh * 0.5, mw * 0.34);
      const d = mw * 0.15;
      drawSvg(c, dieArt(5, d), w * 0.04 + mw * 0.52, my + mh * 0.18, d * 1.2, d * 1.2);
      drawSvg(c, dieArt(2, d), w * 0.04 + mw * 0.68, my + mh * 0.3, d * 1.2, d * 1.2);
    },
  },
  manor: {
    emblem: "🕰",
    look: { wall: ["#2E2240", "#140E1C"], wood: "#4A3020", light: "#F5B544" },
    lead: LEADS.manor,
    leadAt: 0.74,
    things: (c, w, h) => scene(c, room("study", "#F5B544")(), { x: 0, y: h * 0.02, w: w * 0.78, h: h * 0.96 }),
  },
  nightwatch: {
    emblem: "🕯",
    look: { wall: ["#1A2238", "#0B0E16"], wood: "#3A2A1E", light: "#F28B4B" },
    lead: LEADS.nightwatch,
    leadAt: 0.74,
    things: (c, w, h) => scene(c, room("chapel", "#F28B4B")(), { x: 0, y: h * 0.02, w: w * 0.78, h: h * 0.96 }),
  },
  shelter: {
    emblem: "🔥",
    look: { wall: ["#1E2E44", "#0C1118"], wood: "#3A3028", light: "#FF9A4D" },
    lead: LEADS.shelter,
    leadAt: 0.74,
    things: (c, w, h) => scene(c, shelterScene(9, "#FF9A4D").shapes, { x: 0, y: h * 0.02, w: w * 0.78, h: h * 0.96 }),
  },
};

/** A floor's art, also for a game this build has no floor drawn for:
 *  its emoji, its colour, a plain meeple. */
export function floorArt(key: string, emoji?: string | null, tile?: string | null): FloorArt {
  const known = FLOORS[key];
  if (known) return known;
  const found = emoji ? emblemData(emoji) : null;
  return {
    emblem: emoji ?? "🎲",
    look: { wall: ["#4A3A2A", "#1E140C"], wood: "#5A3A22", light: tile ?? "#FFE7B0" },
    lead: MEEPLE,
    leadAt: 0.7,
    things: found
      ? (c, w, h) => {
          const s = Math.min(w, h) * 0.42;
          drawSvg(c, toSvg(found.data, s, found.tint), w * 0.12, h * 0.14, s, s);
        }
      : undefined,
  };
}

/** A floor's landing with its things on it, w × h, baked once. Seen
 *  through the gate it needs no more than twice the points in pixels,
 *  which keeps every floor the lift has called at small to hold. */
export function floorImage(key: string, art: FloorArt, w: number, h: number): SkImage | null {
  const k = Math.min(1, 2 / PixelRatio.get());
  return bakedDrawing(`lift-floor|${key}`, w * k, h * k, (c) => {
    c.scale(k, k);
    drawSvg(c, landingArt(w, h, art.look), 0, 0, w, h);
    art.things?.(c, w, h);
    drawSvg(c, landingShade(w, h), 0, 0, w, h);
  });
}

/** A lead's portrait, `size` square, baked once. */
export function leadImage(key: string, art: FloorArt, size: number): SkImage | null {
  return bakedSvg(`lift-lead|${key}`, size, size, () => toSvg(art.lead, size));
}
