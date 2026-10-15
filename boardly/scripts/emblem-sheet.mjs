// Draws a set of emblems (see src/components/engraved/emblem.ts) as one
// contact sheet, large and at text size, on the app's tile colours:
//
//   node scripts/emblem-sheet.mjs src/games/shelter/emblems.ts out.png [EXPORT]
//
// The module's export (default: EMBLEMS) is a { name: EmblemData } map.
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

const [file, out, name = "EMBLEMS"] = process.argv.slice(2);
if (!file || !out) {
  console.error("usage: node scripts/emblem-sheet.mjs <module.ts> <out.png> [EXPORT]");
  process.exit(1);
}
const { toSvgBody } = await import(new URL("components/engraved/emblem.ts", SRC).href);
const set = (await import(pathToFileURL(resolve(file)).href))[name];
const entries = Object.entries(set);

const COLS = 6;
const CELL = 150;
const W = COLS * CELL;
const H = Math.ceil(entries.length / COLS) * CELL;
const cells = entries
  .map(([key, data], i) => {
    const x = (i % COLS) * CELL;
    const y = Math.floor(i / COLS) * CELL;
    const big = toSvgBody(data, "#3A7BD5", `a${i}`);
    const small = toSvgBody(data, "#3A7BD5", `b${i}`);
    return `<g transform="translate(${x} ${y})">
      <rect x="4" y="4" width="${CELL - 8}" height="${CELL - 8}" rx="12" fill="${i % 2 ? "#F39A3A" : "#5A3A22"}"/>
      <g transform="translate(15 12) scale(2)">${big}</g>
      <g transform="translate(112 100) scale(0.4)">${small}</g>
      <text x="12" y="${CELL - 12}" font-family="Helvetica" font-size="15" fill="#fff">${key}</text>
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
