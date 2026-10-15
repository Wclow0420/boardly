// Draws a set of emblems (see src/components/engraved/emblem.ts) as one
// contact sheet, large and at text size, on the app's tile colours:
//
//   node scripts/emblem-sheet.mjs src/games/shelter/emblems.ts out.png [EXPORT] [WxH]
//
// The module's export (default: EMBLEMS) is a { name: EmblemData } map,
// drawn in a 48 × 48 box unless WxH says otherwise (e.g. 100x160 for a
// figure).
// Needs Node 22.18+ (it runs the TypeScript as is) and macOS (QuickLook
// turns the SVG into the PNG).

import { execFileSync } from "node:child_process";
import { mkdtempSync, renameSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = pathToFileURL(resolve(import.meta.dirname, "../src") + "/").href;
// Resolve the app's imports: "@/…" from src, and paths without ".ts".
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

const [file, out, name = "EMBLEMS", boxArg = "48x48"] = process.argv.slice(2);
const [BW, BH] = boxArg.split("x").map(Number);
if (!file || !out) {
  console.error("usage: node scripts/emblem-sheet.mjs <module.ts> <out.png> [EXPORT]");
  process.exit(1);
}
const { toSvgBody } = await import(new URL("components/engraved/emblem.ts", SRC).href);
const set = (await import(pathToFileURL(resolve(file)).href))[name];
const entries = Object.entries(set);

const COLS = BW === BH ? 6 : 4;
const CELL = 150;
// a square drawing is shown at 96; a tall one (a figure) 210 tall
const big = BW === BH ? 96 / BW : 210 / BH;
const CELL_H = BW === BH ? CELL : Math.round(BH * big + 30);
const W = COLS * (BW === BH ? CELL : 225);
const CW = W / COLS;
const H = Math.ceil(entries.length / COLS) * CELL_H;
const cells = entries
  .map(([key, data], i) => {
    const x = (i % COLS) * CW;
    const y = Math.floor(i / COLS) * CELL_H;
    const large = toSvgBody(data, "#3A7BD5", `a${i}`);
    const small = toSvgBody(data, "#3A7BD5", `b${i}`);
    return `<g transform="translate(${x} ${y})">
      <rect x="4" y="4" width="${CW - 8}" height="${CELL_H - 8}" rx="12" fill="${i % 2 ? "#F39A3A" : "#5A3A22"}"/>
      <g transform="translate(15 12) scale(${big})">${large}</g>
      <g transform="translate(${CW - 38} ${CELL_H - (BW === BH ? 50 : 60)}) scale(${(BW === BH ? 20 : 40) / BH})">${small}</g>
      <text x="12" y="${CELL_H - 12}" font-family="Helvetica" font-size="15" fill="#fff">${key}</text>
    </g>`;
  })
  .join("");
// QuickLook draws an SVG a little larger than its size: leave it room
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W * 0.8)}" height="${Math.round(H * 0.8)}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#1E1610"/>${cells}</svg>`;

const dir = mkdtempSync(join(tmpdir(), "emblems-"));
const svgPath = join(dir, "sheet.svg");
writeFileSync(svgPath, svg);
execFileSync("qlmanage", ["-t", "-s", String(Math.max(W, H)), "-o", dir, svgPath], {
  stdio: "ignore",
});
renameSync(join(dir, `${basename(svgPath)}.png`), out);
console.log(`${entries.length} emblems → ${out}`);
