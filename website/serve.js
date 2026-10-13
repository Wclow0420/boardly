#!/usr/bin/env node
// Preview the website locally, following the same rules as the host
// (see render.yaml): /join/CODE serves join.html, /privacy and /terms
// serve their pages, and the Apple link file is sent as JSON.
//   node website/serve.js   (PORT=8097 by default)

const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.join(__dirname, "public");
const port = Number(process.env.PORT) || 8097;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath.startsWith("/join/")) urlPath = "/join.html";
    if (urlPath === "/") urlPath = "/index.html";
    if (urlPath === "/privacy" || urlPath === "/terms") urlPath += ".html";

    const file = path.join(root, path.normalize(urlPath));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
      return;
    }
    const type = urlPath.endsWith("/apple-app-site-association")
      ? "application/json"
      : types[path.extname(file)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Boardly website on http://localhost:${port}`));
