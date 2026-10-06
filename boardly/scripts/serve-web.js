#!/usr/bin/env node
// Preview the production web build locally: serves ./dist and answers
// unknown paths with index.html, like a real single-page-app host must.
//   npm run build:web && npm run serve:web   (PORT=8096 by default)

const fs = require("fs");
const http = require("http");
const path = require("path");

// Optional first argument: a different build directory
const root = path.resolve(process.argv[2] || path.join(__dirname, "..", "dist"));
const port = Number(process.env.PORT) || 8096;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".wasm": "application/wasm",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(root, urlPath);
    // Stay inside dist; anything that isn't a real file is an app route
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(root, "index.html");
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Serving dist on http://localhost:${port}`));
