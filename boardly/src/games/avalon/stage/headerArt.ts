// Double Agent's header across the top of the stage: the agency's steel
// canopy, lit through venetian blinds, a riveted rail along its foot.
// At the top, the agency crest (a gold medallion on a star of silver
// rays, laurel either side, a keyhole in sea-green enamel and an emerald
// over it); under it a row of five case files, one per operation, each a
// manila folder with its papers peeking out and a numbered tab: cleared
// ones carry a green seal, compromised ones a red wax seal and a red
// band, the one under way stands raised with a clip on it, the ones
// ahead wait in shadow. The ivory plaque on the rail holds the
// operation's name. As SVG, baked once per state by CaseHeader, which
// adds the live light (the lamp on today's file, the jewel, a glint and
// a sweep over the crest).

import { INKS, JEWELS, LEAF } from "@/components/engraved/shapes";
import {
  GOLD,
  GREEN,
  INK,
  IVORY,
  MANILA,
  MANILA_BACK,
  SILVER,
  TEAL,
  WAX,
  blob,
  circle,
  f,
  lin,
  part,
  rad,
  rrect,
} from "./svg";

export type FileState = "won" | "lost" | "now" | "ahead";

const VEIN = INKS.gold.vein;

/** Where everything sits, for a header `w` wide whose content starts at
 *  `top` (below the status bar), with `n` case files. */
export function headerLayout(w: number, top: number, n = 5) {
  const cx = w / 2;
  const fw = 44;
  const gap = Math.min(10, (w - 120 - n * fw) / Math.max(n - 1, 1));
  const span = n * fw + (n - 1) * gap;
  const fy = top + 50;
  const fh = 56;
  return {
    w,
    h: top + 156,
    cx,
    top,
    crest: { x: cx, y: top + 23, r: 14.5 },
    files: Array.from({ length: n }, (_, i) => {
      const x = cx - span / 2 + i * (fw + gap);
      // the tabs step along, as in a drawer
      const tab = x + 3 + (i % 3) * 6;
      return { x, y: fy, w: fw, h: fh, mid: x + fw / 2, tab: { x: tab, w: 18 } };
    }),
    rail: top + 126,
    plaque: { x: cx - 104, y: top + 110, w: 208, h: 38 },
  };
}
export type HeaderLayout = ReturnType<typeof headerLayout>;

/** The crest's medallion, for the light sweeping across it. */
export const crestDisc = (L: HeaderLayout) => circle(L.crest.x, L.crest.y, L.crest.r + 1);

/** A laurel branch hugging the medallion at (x, y) on one side (`dir`
 *  ±1): a stem along an arc from below to the upper side, leaves stepped
 *  along it, pointing the way it grows, alternately out and in. */
function laurel(x: number, y: number, R: number, dir: number) {
  const leaves: string[] = [];
  const stem: string[] = [];
  const from = 168;
  const to = 52;
  const N = 7;
  const deg = Math.PI / 180;
  for (let i = 0; i <= N; i++) {
    const a = (from + ((to - from) * i) / N) * deg;
    const px = x + dir * Math.sin(a) * R;
    const py = y - Math.cos(a) * R;
    stem.push(`${f(px)} ${f(py)}`);
    if (i === 0) continue;
    const along = dir > 0 ? a / deg - 90 : 90 - a / deg;
    const tilt = (i % 2 ? 34 : -34) * dir * (dir > 0 ? 1 : -1);
    const len = 9.5 - (i / N) * 3;
    leaves.push(
      part(LEAF(len, len * 0.38), "url(#hgold)", INK, 0.65, {
        vein: `M0 -1V${f(-len * 0.8)}`,
        veinColor: VEIN,
        vw: 0.4,
      }).replace(/<path /g, `<path transform="translate(${f(px)} ${f(py)}) rotate(${f(along + tilt)})" `),
    );
  }
  return `<path d="M${stem.join("L")}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
<path d="M${stem.join("L")}" fill="none" stroke="url(#hgold)" stroke-width="1.2" stroke-linecap="round"/>${leaves.join("")}`;
}

/** The agency crest at (x, y): rays, laurel, medallion, keyhole, jewel. */
function crest(x: number, y: number, r: number) {
  const rays: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const R = long ? r + 11 : r + 6;
    const wdt = long ? 4.2 : 3.2;
    const tip = [x + Math.cos(a) * R, y + Math.sin(a) * R];
    const l = [x + Math.cos(a - Math.PI / 2) * wdt, y + Math.sin(a - Math.PI / 2) * wdt];
    const rr = [x + Math.cos(a + Math.PI / 2) * wdt, y + Math.sin(a + Math.PI / 2) * wdt];
    rays.push(
      part(
        `M${f(l[0])} ${f(l[1])}L${f(tip[0])} ${f(tip[1])}L${f(rr[0])} ${f(rr[1])}Z`,
        "url(#hsilver)",
        "#1E242C",
        0.7,
        { vein: `M${f(x)} ${f(y)}L${f(tip[0])} ${f(tip[1])}`, veinColor: "#4A5462", vw: 0.5 },
      ),
    );
  }
  const beads = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    return `<circle cx="${f(x + Math.cos(a) * (r - 1.6))}" cy="${f(y + Math.sin(a) * (r - 1.6))}" r="0.9" fill="#FFF2B8" stroke="${VEIN}" stroke-width="0.3"/>`;
  }).join("");
  const key = `${circle(x, y - 1.8, 3.1)}M${f(x - 1.6)} ${f(y)}L${f(x - 2.8)} ${f(y + 6.4)}H${f(x + 2.8)}L${f(x + 1.6)} ${f(y)}Z`;
  const [jl, jb, jd] = JEWELS.emerald;
  const jy = y - r - 2.6;
  const mount = `M${f(x - 6)} ${f(jy + 3.4)}L${f(x - 4.4)} ${f(jy - 2.4)}L${f(x - 2)} ${f(jy + 0.6)}L${f(x)} ${f(jy - 4.2)}L${f(x + 2)} ${f(jy + 0.6)}L${f(x + 4.4)} ${f(jy - 2.4)}L${f(x + 6)} ${f(jy + 3.4)}Z`;
  return `${rays.join("")}
${laurel(x, y, r + 6.5, -1)}${laurel(x, y, r + 6.5, 1)}
<path d="${circle(x + 0.8, y + 1.6, r)}" fill="#000" fill-opacity="0.4"/>
${part(circle(x, y, r), "url(#hgoldR)", INK, 1.1, { shine: `M${f(x - r * 0.72)} ${f(y - r * 0.3)}Q${f(x - r * 0.55)} ${f(y - r * 0.72)} ${f(x - r * 0.1)} ${f(y - r * 0.86)}` })}
${beads}
${part(circle(x, y, r - 3.6), "url(#hteal)", "#06201E", 0.8)}
<path d="${circle(x, y, r - 3.6)}" fill="url(#hdeep)"/>
${part(key, "url(#hgold)", INK, 0.6, { evenOdd: false })}
<path d="M${f(x - 1)} ${f(y - 3.6)}l0.9 -0.6" stroke="#fff" stroke-width="0.6" stroke-linecap="round"/>
${part(mount, "url(#hgold)", INK, 0.7)}
<defs>${rad("hjw", [jl, jb, jd])}</defs>
<circle cx="${x}" cy="${f(jy)}" r="3.6" fill="url(#hjw)" stroke="${INK}" stroke-width="0.8"/>
<circle cx="${f(x - 1.2)}" cy="${f(jy - 1.3)}" r="0.95" fill="#fff" fill-opacity="0.9"/>`;
}

/** How a closed operation's file is marked: a green seal on a cleared
 *  one; a red band and a red wax seal on a compromised one. */
function fileMark(F: HeaderLayout["files"][number], kind: "won" | "lost", i: number, only?: "band" | "seal") {
  const x = F.x;
  const y = F.y;
  const w = F.w;
  const h = F.h;
  const front = rrect(x, y + 12, w, h - 12, 1.6);
  let mark = "";
  if (kind === "won") {
    const sx = x + w / 2;
    const sy = y + h - 15;
    const seal = `<path d="${circle(sx + 0.6, sy + 1.2, 9)}" fill="#000" fill-opacity="0.3"/>
${part(circle(sx, sy, 9), "url(#hgold)", INK, 0.8)}
${part(circle(sx, sy, 6.8), "url(#hgreen)", "#06240F", 0.6)}
<path d="M${f(sx - 3.4)} ${f(sy + 0.2)}l2.3 2.5l4.6 -5.2" fill="none" stroke="#F0FFE8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    const band = `<path d="M${f(x + 9)} ${f(y + 22)}H${f(x + w - 12)}M${f(x + 9)} ${f(y + 26)}H${f(x + w - 16)}" stroke="#5A5040" stroke-opacity="0.6" stroke-width="0.8" stroke-dasharray="2 0.8"/>`;
    mark = (only !== "band" ? seal : "") + (only !== "seal" ? band : "");
  } else if (kind === "lost") {
    const sx = x + w / 2 + 1;
    const sy = y + h - 15;
    const band = `<clipPath id="hc${i}"><path d="${front}"/></clipPath>
<g clip-path="url(#hc${i})"><path d="M${f(x - 6)} ${f(y + 30)}L${f(x + w + 6)} ${f(y + 14)}L${f(x + w + 6)} ${f(y + 22)}L${f(x - 6)} ${f(y + 38)}Z" fill="url(#hwaxband)"/>
<path d="M${f(x - 6)} ${f(y + 30)}L${f(x + w + 6)} ${f(y + 14)}M${f(x - 6)} ${f(y + 38)}L${f(x + w + 6)} ${f(y + 22)}" stroke="#4A0410" stroke-width="0.7"/>
<path d="M${f(x + 4)} ${f(y + 31.4)}L${f(x + w - 4)} ${f(y + 19.4)}" stroke="#FFD8DC" stroke-opacity="0.7" stroke-width="0.9" stroke-dasharray="2.4 1.2"/></g>`;
    const seal = `<path d="${blob(sx + 0.7, sy + 1.4, 9.4, 1, 7, 0.7)}" fill="#000" fill-opacity="0.35"/>
${part(blob(sx, sy, 9.4, 1, 7, 0.7), "url(#hwax)", "#2A0208", 0.8)}
<path d="${circle(sx, sy, 6)}" fill="none" stroke="#3A0408" stroke-opacity="0.6" stroke-width="1"/>
<path d="M${f(sx - 3)} ${f(sy - 3)}L${f(sx + 3)} ${f(sy + 3)}M${f(sx + 3)} ${f(sy - 3)}L${f(sx - 3)} ${f(sy + 3)}" stroke="#2A0208" stroke-width="1.6" stroke-linecap="round"/>
<path d="M${f(sx - 5.6)} ${f(sy - 4)}Q${f(sx - 3.8)} ${f(sy - 6.6)} ${f(sx - 0.8)} ${f(sy - 7)}" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
    mark = (only !== "seal" ? band : "") + (only !== "band" ? seal : "");
  }
  return mark;
}

/** Where a closed file's seal sits (its middle), for the stamp. */
export function sealAt(L: HeaderLayout, i: number, kind: "won" | "lost") {
  const F = L.files[i];
  return { x: F.x + F.w / 2 + (kind === "lost" ? 1 : 0), y: F.y + F.h - 15 };
}

/** The box round file `i` that its mark is drawn in, on its own. */
export function markBox(L: HeaderLayout, i: number) {
  const F = L.files[i];
  return { x: F.x - 12, y: F.y - 4, w: F.w + 24, h: F.h + 16 };
}

/** A closed file's mark on its own (the seal coming down on it), in the
 *  header's coordinates, framed by `markBox`: the band across it, or
 *  the seal. */
export function markArt(L: HeaderLayout, i: number, kind: "won" | "lost", only: "band" | "seal") {
  const B = markBox(L, i);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${B.w}" height="${B.h}" viewBox="${f(B.x)} ${f(B.y)} ${f(B.w)} ${f(B.h)}">
<defs>${lin("hgold", GOLD)}${rad("hgreen", GREEN)}${rad("hwax", WAX)}${lin("hwaxband", ["#E04A5A", "#A01428"], 0, 1)}</defs>
${fileMark(L.files[i], kind, i, only)}
</svg>`;
}

/** A case file: its back cover with a numbered tab, the papers inside,
 *  the front cover, and how the operation went. */
function caseFile(F: HeaderLayout["files"][number], kind: FileState, i: number, bare = false) {
  const lift = kind === "now" ? -6 : 0;
  const x = F.x;
  const y = F.y + lift;
  const w = F.w;
  const h = F.h;
  const t = F.tab;
  const back = `M${f(x)} ${f(y + 8)}H${f(t.x)}L${f(t.x + 2.5)} ${f(y)}H${f(t.x + t.w - 2.5)}L${f(t.x + t.w)} ${f(y + 8)}H${f(x + w - 2)}Q${f(x + w)} ${f(y + 8)} ${f(x + w)} ${f(y + 10)}V${f(y + h)}H${f(x)}Z`;
  const papers = `${part(rrect(x + 3, y + 7.5, w - 7, 20, 1), "url(#hpaper)", "#8A7A5A", 0.5)}${part(rrect(x + 5.5, y + 6, w - 9, 20, 1), "#FFFDF4", "#8A7A5A", 0.5)}`;
  const typed = [0, 1, 2]
    .map((k) => `<path d="M${f(x + 9)} ${f(y + 8.6 + k * 1.6)}H${f(x + w - 9 - (k === 2 ? 10 : 0))}" stroke="#5A5040" stroke-opacity="0.55" stroke-width="0.8" stroke-dasharray="2 0.8"/>`)
    .join("");
  const front = rrect(x, y + 12, w, h - 12, 1.6);
  const cover = part(front, "url(#hmanila)", INK, 0.9, {
    shine: `M${f(x + 2.5)} ${f(y + 13.6)}H${f(x + w * 0.6)}`,
  });
  // the string-and-button tie and the label
  const tie = `<circle cx="${f(x + w / 2)}" cy="${f(y + h - 7)}" r="2.2" fill="url(#hgold)" stroke="${INK}" stroke-width="0.5"/>
<path d="M${f(x + w / 2)} ${f(y + h - 7)}C${f(x + w / 2 + 6)} ${f(y + h - 2)} ${f(x + w / 2 + 9)} ${f(y + h - 12)} ${f(x + w / 2 + 13)} ${f(y + h - 8)}" fill="none" stroke="#7A2A18" stroke-width="0.8"/>`;
  const label = part(rrect(x + 7, y + 18, w - 14, 13, 1.2), "#FFFDF4", "#8A7A5A", 0.6);
  let mark = "";
  if (kind === "won" || kind === "lost") {
    if (!bare) mark = fileMark(F, kind, i);
  } else if (kind === "now") {
    // a clip holds the orders on: it's this one's turn
    const cx0 = x + w - 9;
    mark = `${tie}
<path d="M${f(cx0)} ${f(y + 22)}V${f(y + 2.5)}Q${f(cx0)} ${f(y - 1)} ${f(cx0 + 3)} ${f(y - 1)}Q${f(cx0 + 6)} ${f(y - 1)} ${f(cx0 + 6)} ${f(y + 2.5)}V${f(y + 18)}Q${f(cx0 + 6)} ${f(y + 20)} ${f(cx0 + 4.5)} ${f(y + 20)}Q${f(cx0 + 3)} ${f(y + 20)} ${f(cx0 + 3)} ${f(y + 18)}V${f(y + 5)}" fill="none" stroke="#1E242C" stroke-width="1.9" stroke-linecap="round"/>
<path d="M${f(cx0)} ${f(y + 22)}V${f(y + 2.5)}Q${f(cx0)} ${f(y - 1)} ${f(cx0 + 3)} ${f(y - 1)}Q${f(cx0 + 6)} ${f(y - 1)} ${f(cx0 + 6)} ${f(y + 2.5)}V${f(y + 18)}Q${f(cx0 + 6)} ${f(y + 20)} ${f(cx0 + 4.5)} ${f(y + 20)}Q${f(cx0 + 3)} ${f(y + 20)} ${f(cx0 + 3)} ${f(y + 18)}V${f(y + 5)}" fill="none" stroke="url(#hsilverH)" stroke-width="1" stroke-linecap="round"/>`;
  } else {
    mark = tie;
  }
  const shade = kind === "ahead" ? `<path d="${back}" fill="#0A1418" fill-opacity="0.42"/><path d="${front}" fill="#0A1418" fill-opacity="0.42"/>` : "";
  return `<path d="${back}" fill="#000" fill-opacity="0.45" transform="translate(1.5 3)"/>
${part(back, "url(#hmanilaB)", INK, 0.9)}
${papers}${kind === "won" || kind === "lost" ? typed : ""}
${cover}
${kind === "won" || kind === "lost" ? "" : label}
${mark}
${shade}`;
}

/** The header, w × h: canopy, rail, crest, case files, plaque. File
 *  `bare` is drawn closed but not yet marked (its seal is coming down). */
export function agencyHeader(L: HeaderLayout, files: FileState[], bare = -1) {
  const { w, h, rail, plaque: P, crest: C } = L;
  // light through venetian blinds, falling across the steel
  const slats: string[] = [];
  for (let k = -4; k < 14; k++) {
    const x0 = k * 46;
    slats.push(`M${f(x0)} 0L${f(x0 + 26)} 0L${f(x0 + 26 + rail * 0.42)} ${rail}L${f(x0 + rail * 0.42)} ${rail}Z`);
  }
  const rivets: string[] = [];
  for (let x = 14; x < w; x += 28) rivets.push(`<circle cx="${x}" cy="${rail + 0.5}" r="1.6" fill="url(#hgoldR)" stroke="${INK}" stroke-width="0.5"/>`);
  const seams: number[] = [];
  for (let x = w / 2 - 150; x > 0; x -= 100) seams.push(x);
  for (let x = w / 2 + 150; x < w; x += 100) seams.push(x);
  const seamPaths = seams
    .map(
      (x) =>
        `<path d="M${f(x)} ${L.top - 2}V${rail - 4}" stroke="#0A1216" stroke-width="1.2"/><path d="M${f(x + 1.2)} ${L.top - 2}V${rail - 4}" stroke="#5A7880" stroke-opacity="0.35" stroke-width="0.6"/>` +
        [L.top + 8, L.top + 60, rail - 12]
          .map((yy) => `<circle cx="${f(x - 5)}" cy="${yy}" r="1.3" fill="#4A6068" stroke="#0A1216" stroke-width="0.5"/><circle cx="${f(x + 6)}" cy="${yy}" r="1.3" fill="#4A6068" stroke="#0A1216" stroke-width="0.5"/>`)
          .join(""),
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
${lin("hsteel", ["#34484E", "#22323A", "#162228"], 0, 1)}
${lin("hgold", GOLD)}
${rad("hgoldR", GOLD)}
${lin("hsilver", SILVER)}
${lin("hsilverH", SILVER, 1, 0)}
${lin("hivory", IVORY, 0, 1)}
${lin("hpaper", ["#FFFFFF", "#EEE6D2"], 0, 1)}
${lin("hmanila", MANILA)}
${lin("hmanilaB", MANILA_BACK)}
${rad("hteal", TEAL)}
${rad("hgreen", GREEN)}
${rad("hwax", WAX)}
${lin("hwaxband", ["#E04A5A", "#A01428"], 0, 1)}
${rad("hdeep", ["#000000", "#000000"], [0, 0.45], 0.5, 0.5, 0.6)}
${rad("hshade", ["#000000", "#000000"], [0, 0.5], 0.5, 0.15, 0.95)}
${lin("hslat", ["#FFE7B0", "#FFE7B0"], 0, 1, [0.07, 0.015])}
</defs>
<rect x="0" y="0" width="${w}" height="${rail}" fill="url(#hsteel)"/>
<path d="${slats.join("")}" fill="url(#hslat)"/>
<rect x="0" y="0" width="${w}" height="${rail}" fill="url(#hshade)"/>
${seamPaths}
<rect x="0" y="${L.top - 10}" width="${w}" height="3" fill="url(#hgold)" stroke="${INK}" stroke-width="0.5"/>
${crest(C.x, C.y, C.r)}
${L.files.map((F, i) => caseFile(F, files[i] ?? "ahead", i, i === bare)).join("")}
<rect x="0" y="${rail - 1}" width="${w}" height="10" fill="#000" fill-opacity="0.45" transform="translate(0 4)"/>
<rect x="0" y="${rail - 3}" width="${w}" height="7" fill="url(#hgold)" stroke="${INK}" stroke-width="0.8"/>
<path d="M0 ${rail - 1.4}H${w}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.9"/>
<path d="M0 ${rail + 2.2}H${w}" stroke="${VEIN}" stroke-width="0.6"/>
${rivets.join("")}
<path d="${rrect(P.x + 1, P.y + 4, P.w, P.h, 6)}" fill="#000" fill-opacity="0.45"/>
${part(rrect(P.x, P.y, P.w, P.h, 6), "url(#hgold)", INK, 1.1)}
${part(rrect(P.x + 4, P.y + 4, P.w - 8, P.h - 8, 3.5), "url(#hivory)", INK, 0.8)}
<path d="M${P.x + 10} ${P.y + 2}H${f(P.x + P.w * 0.45)}" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>
${[P.x + 9, P.x + P.w - 9].map((x) => `<circle cx="${x}" cy="${P.y + P.h / 2}" r="2.3" fill="url(#hgoldR)" stroke="${INK}" stroke-width="0.6"/>`).join("")}
</svg>`;
}

/** The agency crest on its own, in a box `size` wide (for the end of
 *  the game): drawn in a 64 box and scaled. */
export function crestArt(size: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
<defs>${lin("hgold", GOLD)}${rad("hgoldR", GOLD)}${lin("hsilver", SILVER)}${rad("hteal", TEAL)}${rad("hdeep", ["#000000", "#000000"], [0, 0.45], 0.5, 0.5, 0.6)}</defs>
${crest(32, 34, 17)}
</svg>`;
}

