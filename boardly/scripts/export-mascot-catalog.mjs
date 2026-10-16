// Writes the wardrobe's item keys and prices for the server:
//
//   node scripts/export-mascot-catalog.mjs
//
// Run it after adding or repricing anything in src/features/mascot.
// Needs Node 22.18+ (it runs the TypeScript as is).

import { writeFileSync } from "node:fs";
import { register } from "node:module";
import { resolve } from "node:path";
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

const { catalogPrices } = await import(new URL("features/mascot/catalog.ts", SRC).href);
const out = resolve(import.meta.dirname, "../../backend/app/mascot_catalog.json");
const catalog = catalogPrices();
writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`${Object.keys(catalog.items).length} items → ${out}`);
