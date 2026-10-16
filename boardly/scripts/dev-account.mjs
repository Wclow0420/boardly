// Hands the local test account (DEV_TEST_USERNAME / DEV_TEST_PASSWORD in
// backend/.env.example) to a simulator on localhost only, for
// boardly-dev://dev/signin. Keep it running while testing:
//   node scripts/dev-account.mjs

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

const env = Object.fromEntries(
  readFileSync(resolve(import.meta.dirname, "../../backend/.env.example"), "utf8")
    .split("\n")
    .filter((line) => /^DEV_TEST_(USERNAME|PASSWORD)=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]),
);
createServer((req, res) => {
  if (req.url !== "/dev-account") {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ username: env.DEV_TEST_USERNAME, password: env.DEV_TEST_PASSWORD }));
}).listen(8098, "127.0.0.1", () => console.log("dev account on 127.0.0.1:8098"));
