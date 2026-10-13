#!/usr/bin/env node
// Turns the legal documents in docs/legal into pages of the website:
//   docs/legal/privacy-policy.md   -> website/public/privacy.html
//   docs/legal/terms-of-service.md -> website/public/terms.html
// The markdown files are the ones to edit; run this afterwards and
// commit the pages it writes.
//   node website/build-legal.js

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pages = [
  { from: "privacy-policy.md", to: "privacy.html", other: ["/terms", "Terms of Service"] },
  { from: "terms-of-service.md", to: "terms.html", other: ["/privacy", "Privacy Policy"] },
];

const escape = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Bold and links, the only inline markdown these documents use
const inline = (text) =>
  escape(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

function toHtml(markdown) {
  const out = [];
  let depth = 0; // how many lists are open
  const closeLists = (to = 0) => {
    while (depth > to) {
      out.push("</li></ul>");
      depth--;
    }
  };

  for (const line of markdown.split("\n")) {
    const item = /^(\s*)- (.*)$/.exec(line);
    if (item) {
      const level = item[1].length / 2 + 1;
      if (level > depth) {
        out.push("<ul><li>");
        depth++;
      } else {
        closeLists(level);
        out.push("</li><li>");
      }
      out.push(inline(item[2]));
      continue;
    }
    if (!line.trim()) {
      closeLists();
      continue;
    }
    closeLists();
    const heading = /^(#{1,3}) (.*)$/.exec(line);
    out.push(
      heading
        ? `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`
        : `<p>${inline(line)}</p>`
    );
  }
  closeLists();
  // Lines that follow each other with no blank line between (the
  // contact block) read as one paragraph broken over lines.
  return out.join("\n").replace(/<\/p>\n<p>(?=<strong>)/g, "<br />");
}

let unfinished = false;
for (const page of pages) {
  const markdown = fs.readFileSync(path.join(root, "docs/legal", page.from), "utf8");
  const title = /^# (.*)$/m.exec(markdown)[1];

  // [DATE], [CONTACT EMAIL]... still waiting for a real value
  const blanks = [...new Set(markdown.match(/\[[A-Z][A-Z ,./]+[^\]]*\](?!\()/g) || [])];
  if (blanks.length) {
    unfinished = true;
    console.warn(`${page.from} still has blanks to fill in: ${blanks.join(", ")}`);
  }

  const html = `<!doctype html>
<!-- Written by website/build-legal.js from docs/legal/${page.from}.
     Edit that file, not this one. -->
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(title)}</title>
    <meta name="theme-color" content="#18202b" />
    <link rel="icon" href="/favicon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Poppins:wght@400;500;600;700&display=swap"
    />
    <link rel="stylesheet" href="/site.css" />
    <link rel="stylesheet" href="/legal.css" />
  </head>
  <body class="legal">
    <header>
      <a class="brand" href="/">
        <img src="/icon.png" alt="" width="36" height="36" />
        <span>Boardly</span>
      </a>
      <a href="${page.other[0]}">${page.other[1]}</a>
    </header>
    <article>
${toHtml(markdown)}
    </article>
  </body>
</html>
`;
  fs.writeFileSync(path.join(__dirname, "public", page.to), html);
  console.log(`Wrote website/public/${page.to}`);
}

// Pages are still written so they can be previewed, but this must not
// pass quietly: a page with blanks in it is not fit to publish.
if (unfinished) process.exitCode = 1;
