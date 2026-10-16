// Small still pictures of every art border, for wherever a border is shown
// small and still (the shop's tiles, lists of friends): one image per layer
// instead of the border running live at full resolution, which kept
// hundreds of MB of baked art for a screen of tiles.
//
//   1. node scripts/border-thumbs.mjs          (waits for the pictures)
//   2. open boardly-dev://dev/thumbs on the simulator
//
// The dev page draws each border's back and front layers offscreen and
// sends them here; they're written to assets/borders/thumbs/ and
// src/features/cosmetics/thumbs.ts is written to load them. Run it again
// whenever a border is added or redrawn.

import { Buffer } from "node:buffer";
import { createServer } from "node:http";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIR = join(ROOT, "assets/borders/thumbs");
const REGISTRY = join(ROOT, "src/features/cosmetics/thumbs.ts");
const PORT = 8099;

mkdirSync(DIR, { recursive: true });

function writeRegistry() {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".png"));
  const ids = [...new Set(files.map((f) => f.replace(/-(back|front)\.png$/, "")))].sort();
  const line = (id) => {
    const has = (layer) => files.includes(`${id}-${layer}.png`);
    const part = (layer) => (has(layer) ? `require("../../../assets/borders/thumbs/${id}-${layer}.png")` : "null");
    return `  ${JSON.stringify(id)}: { back: ${part("back")}, front: ${part("front")} },`;
  };
  writeFileSync(
    REGISTRY,
    `// Written by scripts/border-thumbs.mjs: each art border's layers as still
// pictures, for borders shown small and still (see AvatarBorder).

import type { ImageSourcePropType } from "react-native";

export const THUMBS: Record<string, { back: ImageSourcePropType | null; front: ImageSourcePropType | null }> = {
${ids.map(line).join("\n")}
};
`,
  );
  return ids.length;
}

createServer((req, res) => {
  if (req.method === "POST" && req.url === "/done") {
    const n = writeRegistry();
    console.log(`wrote ${REGISTRY} (${n} borders)`);
    res.end("ok");
    setTimeout(() => process.exit(0), 100);
    return;
  }
  const name = decodeURIComponent((req.url ?? "").slice(1));
  if (req.method !== "POST" || !/^[a-z0-9-]+-(back|front)\.png$/.test(name)) {
    res.statusCode = 400;
    res.end();
    return;
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    writeFileSync(join(DIR, name), Buffer.from(body, "base64"));
    console.log("got", name);
    res.end("ok");
  });
}).listen(PORT, () => console.log(`waiting for border pictures on :${PORT} — open boardly-dev://dev/thumbs`));
