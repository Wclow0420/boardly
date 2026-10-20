// Every room of a game drawn as a still picture, for looking over the
// isometric rooms without the simulator (gradients and all).
//
//   node scripts/room-sheet.mjs nightwatch <out.png> [room ...]
//   node scripts/room-sheet.mjs shelter <out.png>
//
// nightwatch: rooms by name (default all nine); shelter: the house (empty
// and full larder) and its four places.

import { execFileSync } from "node:child_process";
import { mkdtempSync, renameSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = pathToFileURL(resolve(import.meta.dirname, "../src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      const SRC = ${JSON.stringify(SRC)};
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) spec = new URL(spec.slice(2), SRC).href;
        if (/^(\\.|file:)/.test(spec) && !/\\.[cm]?[jt]sx?$/.test(spec)) {
          for (const ext of [".ts", "/index.ts"]) {
            try { return await next(spec + ext, ctx); } catch {}
          }
        }
        return next(spec, ctx);
      }`),
);

const [game, out, ...names] = process.argv.slice(2);
if (!game || !out) {
  console.error("usage: node scripts/room-sheet.mjs <nightwatch|shelter> <out.png> [room ...]");
  process.exit(1);
}

/** Shapes as SVG elements, gradients included. */
function svgOf(shapes, id) {
  let defs = "";
  const body = shapes
    .map((s, i) => {
      let fill = s.fill ?? "none";
      if (s.grad && s.fill) {
        const g = s.grad;
        const stops = g.colors.map((c, k) => `<stop offset="${k / Math.max(1, g.colors.length - 1)}" stop-color="${c}"/>`).join("");
        const gid = `${id}g${i}`;
        defs +=
          g.radius !== undefined
            ? `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${g.from[0]}" cy="${g.from[1]}" r="${g.radius}">${stops}</radialGradient>`
            : `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${g.from[0]}" y1="${g.from[1]}" x2="${g.to[0]}" y2="${g.to[1]}">${stops}</linearGradient>`;
        fill = `url(#${gid})`;
      }
      return `<path d="${s.d}" fill="${fill}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth ?? 1}"` : ""}${s.dash ? ` stroke-dasharray="${s.dash}"` : ""} stroke-linejoin="round" stroke-linecap="round"${s.opacity !== undefined ? ` opacity="${s.opacity}"` : ""}/>`;
    })
    .join("");
  return `<defs>${defs}</defs>${body}`;
}

let pictures = [];
let W = 190;
let H = 208;
if (game === "nightwatch") {
  const { buildScene } = await import(new URL("games/nightwatch/roomScenes.ts", SRC).href);
  const { ROOMS } = await import(new URL("games/nightwatch/logic.ts", SRC).href);
  const list = names.length ? names : ROOMS;
  pictures = list.map((name) => {
    const scene = buildScene(ROOMS.indexOf(name), { accent: "#F28B4B", collapsed: [], lockedDoor: null });
    return { name, shapes: [...scene.back, ...scene.prop, ...scene.front] };
  });
} else {
  const S = await import(new URL("games/shelter/shelterScenes.ts", SRC).href);
  const scene = (food) => {
    const sc = S.shelterScene(food, "#FF9A4D");
    return Object.values(sc).filter(Array.isArray).flat().filter((x) => x && x.d);
  };
  pictures = [
    { name: "house (empty)", shapes: scene(0) },
    { name: "house (full)", shapes: scene(12) },
  ];
}

const COLS = Math.min(3, pictures.length);
const SCALE = 2.2;
const CW = W * SCALE + 20;
const CH = H * SCALE + 40;
const rows = Math.ceil(pictures.length / COLS);
const cells = pictures
  .map(({ name, shapes }, i) => {
    const x = (i % COLS) * CW + 10;
    const y = Math.floor(i / COLS) * CH + 10;
    return `<g transform="translate(${x} ${y})"><rect width="${W * SCALE}" height="${H * SCALE}" rx="14" fill="#141A2A"/><g transform="scale(${SCALE})">${svgOf(shapes, `r${i}`)}</g><text x="${(W * SCALE) / 2}" y="${H * SCALE + 26}" font-family="Helvetica" font-size="20" fill="#E8D8B8" text-anchor="middle">${name}</text></g>`;
  })
  .join("");
const TW = COLS * CW + 20;
const TH = rows * CH + 20;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(TW * 0.7)}" height="${Math.round(TH * 0.7)}" viewBox="0 0 ${TW} ${TH}"><rect width="${TW}" height="${TH}" fill="#0B0E16"/>${cells}</svg>`;
const dir = mkdtempSync(join(tmpdir(), "rooms-"));
const p = join(dir, "rooms.svg");
writeFileSync(p, svg);
execFileSync("qlmanage", ["-t", "-s", String(Math.max(TW, TH)), "-o", dir, p], { stdio: "ignore" });
renameSync(join(dir, "rooms.svg.png"), out);
console.log(`${pictures.length} rooms → ${out}`);
