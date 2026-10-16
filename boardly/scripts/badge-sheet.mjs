// A badge style's four frames, for looking over: each level large and
// at the size the player card shows it, earned and locked (struck in
// iron), with a sample emblem on the disc.
//
//   node scripts/badge-sheet.mjs <style.ts> <out.png> [EXPORT] [tint]
//
// EXPORT is the BadgeStyle's name in the module (default BADGE_FRAMES);
// tint the game's colour for "tint" parts (default Boardly's teal).

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

const [file, out, name = "BADGE_FRAMES", tint = "#1F4E5F"] = process.argv.slice(2);
if (!file || !out) {
  console.error("usage: node scripts/badge-sheet.mjs <style.ts> <out.png> [EXPORT] [tint]");
  process.exit(1);
}
const { toSvgBody } = await import(new URL("components/engraved/emblem.ts", SRC).href);
const { UI_EMBLEMS } = await import(new URL("components/engraved/ui.ts", SRC).href);
const style = (await import(pathToFileURL(resolve(file)).href))[name];
const TIERS = ["bronze", "silver", "gold", "diamond"];

/** One badge, drawn in the 120 box: frame, emblem on the disc, front. */
function badge(tier, id) {
  const frame = style(tier);
  const k = (frame.face * 1.5) / 48;
  const emblem = `<g transform="translate(${60 - 24 * k} ${60 - 24 * k}) scale(${k})">${toSvgBody(UI_EMBLEMS.trophy, undefined, `${id}e`)}</g>`;
  return (
    toSvgBody(frame.back, tint, `${id}b`) +
    emblem +
    (frame.front ? toSvgBody(frame.front, tint, `${id}f`) : "") +
    frame.glints
      .map(([x, y, s]) => `<path d="M${x} ${y - s}Q${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y}Q${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s}Q${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y}Q${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s}z" fill="#fff" opacity="0.9"/>`)
      .join("")
  );
}

const BIG = 260;
const SMALL = 76;
const COL = BIG + 30;
const W = COL * 4;
const H = BIG + 40 + SMALL * 2 + 60;
const cells = TIERS.map((tier, i) => {
  const x = i * COL + 15;
  return `
    <g transform="translate(${x} 20) scale(${BIG / 120})">${badge(tier, `a${i}`)}</g>
    <g transform="translate(${x + 20} ${BIG + 50}) scale(${SMALL / 120})">${badge(tier, `b${i}`)}</g>
    <g filter="url(#iron)" transform="translate(${x + 40 + SMALL} ${BIG + 50}) scale(${SMALL / 120})">${badge(tier, `c${i}`)}</g>
    <text x="${x + BIG / 2}" y="${H - 18}" font-family="Helvetica" font-size="18" fill="#E8D8B8" text-anchor="middle">${tier}</text>`;
}).join("");
const iron = `<filter id="iron"><feColorMatrix type="matrix" values="0.16 0.5 0.05 0 0.02  0.17 0.52 0.05 0 0.02  0.18 0.56 0.06 0 0.03  0 0 0 1 0"/></filter>`;
// QuickLook draws an SVG a little larger than its size: leave it room
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W * 0.6)}" height="${Math.round(H * 0.6)}" viewBox="0 0 ${W} ${H}"><defs>${iron}</defs><rect width="${W}" height="${H}" fill="#2A1C12"/>${cells}</svg>`;

const dir = mkdtempSync(join(tmpdir(), "badges-"));
const svgPath = join(dir, "sheet.svg");
writeFileSync(svgPath, svg);
execFileSync("qlmanage", ["-t", "-s", String(Math.max(W, H)), "-o", dir, svgPath], { stdio: "ignore" });
renameSync(join(dir, "sheet.svg.png"), out);
console.log(`4 frames → ${out}`);
