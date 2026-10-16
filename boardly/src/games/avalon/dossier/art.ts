// The operation's dossier and the two stamps it is marked with, as
// engraved SVG (baked once each by the dossier's components; the light
// is drawn live):
//
//   stamp "approve" — a desk stamp: a turned walnut handle under a gold
//            cap set with an emerald, gold ferrules, a gold block, the
//            green rubber die. It marks an operation's file APPROVED.
//   stamp "seal"    — the moles' sealing iron: a blackened baluster with
//            a thorned guard, a ruby in its cap, a round die smeared
//            with red wax. It seals the file COMPROMISED.
//   page   — the open dossier on the desk: a manila folder, the orders
//            on an ivory sheet, a photograph clipped on, a dashed box
//            where the stamp comes down.
//   closed — the dossier shut and tied, the agency crest on its cover,
//            a red band across it: where everyone's card goes.
//   mark   — what each stamp leaves: a green ink stamp, a red wax seal.
//   envelope — a team member's sealed card (open while they decide).
//   slip   — a played card at the reveal: its manila back, its face.

import { INKS, JEWELS, MATERIALS } from "@/components/engraved/shapes";
import {
  GOLD,
  GREEN,
  INK,
  IRON,
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
} from "../stage/svg";

export type StampKind = "approve" | "seal";

/** The stamps' box, and where each touches the desk. */
export const STAMP_W = 100;
export const STAMP_H = 132;
export const FOOT = { x: 50, y: 129 };
/** Where the glow of a stamp's jewel sits. */
export const STAMP_JEWEL = { x: 50, y: 15 };

export const PAGE_W = 200;
export const PAGE_H = 140;
/** Where on the page a stamp comes down. */
export const STAMP_SPOT = { x: 140, y: 102 };

export const CLOSED_W = 150;
export const CLOSED_H = 190;
/** The red band across the shut dossier, for its words. */
export const BAND = { x: 0, y: 112, w: 150, h: 20, angle: -12 };

export const MARK_W = 120;
export const MARK_H = 70;
export const SEAL_D = 96;

export const ENV_W = 46;
export const ENV_H = 46;

export const SLIP_W = 56;
export const SLIP_H = 80;

const WOOD = MATERIALS.wood;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const DEFS = `<defs>
${lin("g", GOLD)}
${rad("gr", GOLD)}
${lin("gh", GOLD, 1, 0)}
${lin("iv", IVORY, 0, 1)}
${lin("ir", IRON)}
${lin("irh", IRON, 1, 0)}
${lin("wd", WOOD, 1, 0)}
${rad("wdr", WOOD)}
${lin("mn", MANILA)}
${lin("mb", MANILA_BACK)}
${rad("wx", WAX)}
${rad("gn", GREEN)}
${rad("tl", TEAL)}
${lin("sv", SILVER)}
${rad("em", JEWELS.emerald)}
${rad("rb", JEWELS.ruby)}
${lin("paper", ["#FFFFFF", "#F6F0E0"], 0, 1)}
</defs>`;

const jewel = (x: number, y: number, r: number, id: "em" | "rb") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})" stroke="${INK}" stroke-width="1"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.38)}" r="${f(r * 0.26)}" fill="#fff" fill-opacity="0.9"/>`;

/** A gold band across a handle, x0..x1 at y, h tall. */
const ferrule = (x0: number, x1: number, y: number, h: number) =>
  part(rrect(x0, y, x1 - x0, h, 1.4), "url(#gh)", INK, 0.9, {
    vein: `M${f(x0 + 2)} ${f(y + h / 2)}H${f(x1 - 2)}`,
    shine: `M${f(x0 + 2)} ${f(y + 1.2)}H${f(x0 + (x1 - x0) * 0.5)}`,
  });

function approveStamp() {
  // the turned walnut knob and neck
  const knob = "M50 9C73 9 77 33 60 42L57 47H43L40 42C23 33 27 9 50 9Z";
  const neck = "M43 53H57L59 72Q60 78 62 82H38Q40 78 41 72Z";
  const block = "M20 92H80L86 118H14Z";
  const top = "M24 86H76L80 92H20Z";
  const die = "M17 118H83L81 127H19Z";
  return svg(
    STAMP_W,
    STAMP_H,
    `${DEFS}
<path d="M18 129H82" stroke="#000" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round"/>
${part(knob, "url(#wdr)", INKS.wood.ink, 1.3, {
  vein: "M36 20Q33 30 40 40M64 20Q67 30 60 40M50 12V44",
  veinColor: INKS.wood.vein,
  vw: 0.7,
  shine: "M33 24Q35 15 44 12",
})}
${part(circle(50, 15, 9.5), "url(#gr)", INK, 1)}
${jewel(50, 15, 6, "em")}
${ferrule(40, 60, 46, 7)}
${part(neck, "url(#wd)", INKS.wood.ink, 1.1, { vein: "M50 54V80M46 56Q45 68 42 80", veinColor: INKS.wood.vein, vw: 0.6, shine: "M45 56L44 74" })}
${ferrule(34, 66, 80, 7)}
${part(top, "url(#g)", INK, 0.9, { shine: "M27 88H55" })}
${part(block, "url(#g)", INK, 1.2, { vein: "M24 96H76L80 114H20Z", vw: 0.6 })}
${[29, 71].map((x) => `<circle cx="${x}" cy="105" r="2.2" fill="url(#gr)" stroke="${INK}" stroke-width="0.6"/>`).join("")}
<path d="M40 105H60" stroke="#7A5212" stroke-width="0.8"/><path d="M50 99V111" stroke="#7A5212" stroke-width="0.8"/>
${part(die, "#1E5A32", "#0C2A16", 1)}
<path d="M19 126H81" stroke="#4AE07A" stroke-opacity="0.85" stroke-width="1.4"/>`,
  );
}

function sealStamp() {
  // the iron baluster, its thorned guard, the round die
  const handle = "M50 22C64 22 68 32 62 42Q56 50 56 56Q56 64 63 72L66 78H34L37 72Q44 64 44 56Q44 50 38 42C32 32 36 22 50 22Z";
  const guard = "M24 80Q50 74 76 80Q78 84 76 88Q50 94 24 88Q22 84 24 80Z";
  const neck = "M43 90H57V104H43Z";
  const dieSide = "M20 108H80V122Q80 127 50 127Q20 127 20 122Z";
  const dieTop = "M20 108Q20 103 50 103Q80 103 80 108Q80 113 50 113Q20 113 20 108Z";
  const thorns = [
    "M24 82L12 78L22 86Z",
    "M76 82L88 78L78 86Z",
    "M32 79L28 70L37 78Z",
    "M68 79L72 70L63 78Z",
    "M30 90L24 99L35 91Z",
    "M70 90L76 99L65 91Z",
  ];
  const prongs = ["M41 9L44 15L39 16Z", "M59 9L56 15L61 16Z", "M45 23L50 28L55 23Z"];
  const drips = `M24 124Q26 130 28 124Q30 128 33 125M60 126Q63 131 66 125Q68 129 72 124`;
  return svg(
    STAMP_W,
    STAMP_H,
    `${DEFS}
<path d="M18 129H82" stroke="#000" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round"/>
${thorns.map((d) => part(d, "url(#ir)", INKS.iron.ink, 0.9)).join("")}
${part(handle, "url(#ir)", INKS.iron.ink, 1.3, {
  vein: "M40 30Q52 36 60 30M38 40Q50 48 62 40M44 60Q50 64 56 60M40 70Q50 74 60 70",
  veinColor: "#8A909A",
  vw: 0.6,
  shine: "M40 28Q42 24 48 23",
})}
${prongs.map((d) => part(d, "url(#ir)", INKS.iron.ink, 0.8)).join("")}
${part(circle(50, 15, 9.5), "url(#ir)", INKS.iron.ink, 1)}
${jewel(50, 15, 6, "rb")}
${part(guard, "url(#irh)", INKS.iron.ink, 1.1, { vein: "M28 84Q50 80 72 84", veinColor: "#8A909A", vw: 0.6, shine: "M30 80Q42 78 54 78" })}
${part(neck, "url(#irh)", INKS.iron.ink, 1)}
${part(dieSide, "url(#irh)", INKS.iron.ink, 1.1)}
${part(dieTop, "url(#ir)", INKS.iron.ink, 1, { shine: "M28 106Q38 104 50 104" })}
<path d="M20 120Q50 126 80 120V122Q80 127 50 127Q20 127 20 122Z" fill="url(#wx)"/>
<path d="${drips}" fill="none" stroke="#B8182E" stroke-width="2.4" stroke-linecap="round"/>`,
  );
}

export function stampArt(kind: StampKind) {
  return kind === "approve" ? approveStamp() : sealStamp();
}

/** A faceless figure for a file's photograph. */
const silhouette = (x: number, y: number, w: number, h: number) =>
  `<path d="${circle(x + w / 2, y + h * 0.36, w * 0.18)}" fill="#0A2422"/><path d="M${f(x + w * 0.16)} ${f(y + h)}Q${f(x + w * 0.2)} ${f(y + h * 0.6)} ${f(x + w / 2)} ${f(y + h * 0.58)}Q${f(x + w * 0.8)} ${f(y + h * 0.6)} ${f(x + w * 0.84)} ${f(y + h)}Z" fill="#0A2422"/>`;

/** A silver paper clip over an edge at (x, y). */
const clip = (x: number, y: number, h = 22) => {
  const d = `M${x} ${y + h}V${y + 3}Q${x} ${y - 1} ${x + 3.5} ${y - 1}Q${x + 7} ${y - 1} ${x + 7} ${y + 3}V${y + h - 4}Q${x + 7} ${y + h - 1.5} ${x + 5} ${y + h - 1.5}Q${x + 3.4} ${y + h - 1.5} ${x + 3.4} ${y + h - 4}V${y + 5}`;
  return `<path d="${d}" fill="none" stroke="#1E242C" stroke-width="2.4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#sv)" stroke-width="1.3" stroke-linecap="round"/>`;
};

const typedLines = (x: number, y: number, w: number, n: number, gap = 6) =>
  Array.from({ length: n }, (_, k) => {
    const len = w * (k === n - 1 ? 0.55 : 0.82 + ((k * 37) % 17) / 100);
    return `<path d="M${x} ${f(y + k * gap)}H${f(x + len)}" stroke="#4A4436" stroke-opacity="0.6" stroke-width="1.3" stroke-dasharray="3 1.2"/>`;
  }).join("");

/** The dossier open on the desk. */
export function pageArt() {
  const folder = `M0 10H14L18 2H70L74 10H${PAGE_W}V${PAGE_H}H0Z`;
  return svg(
    PAGE_W,
    PAGE_H + 4,
    `${DEFS}
<path d="${folder}" fill="#000" fill-opacity="0.4" transform="translate(2 4)"/>
${part(folder, "url(#mb)", INK, 1.2, { shine: "M3 12H90" })}
<path d="${rrect(12, 15, 178, 122, 2)}" fill="#000" fill-opacity="0.25" transform="translate(1.5 2)"/>
${part(rrect(10, 13, 178, 122, 2), "url(#paper)", "#8A7A5A", 0.8)}
${part(rrect(20, 24, 44, 52, 1.5), "url(#tl)", "#06201E", 0.9)}
${silhouette(20, 30, 44, 46)}
<path d="M23 27H38" stroke="#fff" stroke-opacity="0.4" stroke-width="1" stroke-linecap="round"/>
${clip(26, 18)}
<path d="M74 26H152" stroke="#2A2010" stroke-width="2.2"/>
${typedLines(74, 36, 104, 6)}
${typedLines(22, 88, 62, 6)}
<path d="${rrect(96, 80, 88, 46, 3)}" fill="none" stroke="#8A7A5A" stroke-width="1" stroke-dasharray="4 3"/>
<path d="M98 132H186" stroke="#C9B890" stroke-width="0.6"/>`,
  );
}

/** The dossier shut and tied. */
export function closedArt() {
  const W = CLOSED_W;
  const H = CLOSED_H;
  const back = `M4 14H92L98 4H138L144 14H${W - 4}V${H - 4}H4Z`;
  const front = rrect(4, 20, W - 8, H - 24, 3);
  const bandY = BAND.y;
  const cx = W / 2;
  const cy = 64;
  return svg(
    W,
    H,
    `${DEFS}
<path d="${back}" fill="#000" fill-opacity="0.45" transform="translate(3 5)"/>
${part(back, "url(#mb)", INK, 1.2)}
${part(rrect(10, 9, W - 26, 40, 1.5), "url(#paper)", "#8A7A5A", 0.6)}
${part(rrect(16, 6, W - 30, 40, 1.5), "#FFFDF4", "#8A7A5A", 0.6)}
${typedLines(24, 13, 80, 2, 5)}
${part(front, "url(#mn)", INK, 1.3, { shine: "M8 23H90" })}
<clipPath id="fc"><path d="${front}"/></clipPath>
<g clip-path="url(#fc)" transform="rotate(${BAND.angle} ${cx} ${bandY + BAND.h / 2})">
<rect x="-30" y="${bandY}" width="${W + 60}" height="${BAND.h}" fill="#B8182E"/>
<path d="M-30 ${bandY + 1.5}H${W + 30}M-30 ${bandY + BAND.h - 1.5}H${W + 30}" stroke="#FFD8DC" stroke-opacity="0.75" stroke-width="0.8"/>
<path d="M-30 ${bandY}H${W + 30}M-30 ${bandY + BAND.h}H${W + 30}" stroke="#4A0410" stroke-width="1"/>
</g>
<path d="${circle(cx + 1, cy + 2, 22)}" fill="#000" fill-opacity="0.25"/>
${part(circle(cx, cy, 22), "url(#gr)", INK, 1.2, { shine: `M${cx - 16} ${cy - 8}Q${cx - 12} ${cy - 17} ${cx - 3} ${cy - 20}` })}
${part(circle(cx, cy, 16.5), "url(#tl)", "#06201E", 0.9)}
${part(`${circle(cx, cy - 3, 4.4)}M${cx - 2.4} ${cy}L${cx - 4} ${cy + 9}H${cx + 4}L${cx + 2.4} ${cy}Z`, "url(#g)", INK, 0.7)}
${Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2;
  return `<circle cx="${f(cx + Math.cos(a) * 19.3)}" cy="${f(cy + Math.sin(a) * 19.3)}" r="1.05" fill="#FFF2B8" stroke="#7A5212" stroke-width="0.3"/>`;
}).join("")}
${jewel(cx, cy - 26, 5, "em")}
<circle cx="${cx - 18}" cy="${H - 26}" r="5" fill="url(#gr)" stroke="${INK}" stroke-width="0.8"/>
<circle cx="${cx + 18}" cy="${H - 26}" r="5" fill="url(#gr)" stroke="${INK}" stroke-width="0.8"/>
<path d="M${cx - 18} ${H - 26}C${cx - 6} ${H - 38} ${cx + 6} ${H - 14} ${cx + 18} ${H - 26}C${cx + 8} ${H - 34} ${cx - 2} ${H - 18} ${cx - 18} ${H - 26}" fill="none" stroke="#7A2A18" stroke-width="1.4"/>
<path d="M${cx + 18} ${H - 26}Q${cx + 30} ${H - 18} ${cx + 26} ${H - 8}" fill="none" stroke="#7A2A18" stroke-width="1.4" stroke-linecap="round"/>`,
  );
}

/** What a stamp leaves: green ink (APPROVED) or a red wax seal. */
export function markArt(kind: StampKind) {
  if (kind === "approve") {
    // rubber leaves gaps in the ink
    const specks = Array.from({ length: 26 }, (_, i) => {
      const x = 6 + ((i * 47) % 108);
      const y = 6 + ((i * 29) % 58);
      return `<circle cx="${x}" cy="${y}" r="${0.7 + (i % 3) * 0.5}" fill="#F6F0E0"/>`;
    }).join("");
    return svg(
      MARK_W,
      MARK_H,
      `<path d="${rrect(4, 4, MARK_W - 8, MARK_H - 8, 7)}" fill="none" stroke="#1E8A4A" stroke-width="4.5"/>
<path d="${rrect(11, 11, MARK_W - 22, MARK_H - 22, 3.5)}" fill="none" stroke="#1E8A4A" stroke-width="1.6"/>
<path d="M20 35l9 10l17 -21" fill="none" stroke="#1E8A4A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
${specks}`,
    );
  }
  const C = SEAL_D / 2;
  const beads = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return `<circle cx="${f(C + Math.cos(a) * 26)}" cy="${f(C + Math.sin(a) * 26)}" r="1.7" fill="#E04A5A" stroke="#3A0408" stroke-width="0.6"/>`;
  }).join("");
  return svg(
    SEAL_D,
    SEAL_D,
    `<defs>${rad("wx", WAX)}${rad("ws", ["#000000", "#000000"], [0, 0.45], 0.62, 0.7, 0.7)}</defs>
<path d="${blob(C + 1.5, C + 3, 42, 3, 7, 0.4)}" fill="#000" fill-opacity="0.35"/>
<path d="${blob(C, C, 42, 3, 7, 0.4)}" fill="url(#wx)" stroke="#2A0208" stroke-width="1.3"/>
<path d="${blob(C, C, 34, 1.4, 9, 1.1)}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="4"/>
<path d="${circle(C, C, 30)}" fill="none" stroke="#3A0408" stroke-width="1.2"/>
${beads}
<path d="${circle(C, C, 21)}" fill="url(#wx)" stroke="#3A0408" stroke-width="1"/>
<path d="${circle(C, C, 21)}" fill="url(#ws)"/>
<path d="M${C - 10} ${C - 10}L${C + 10} ${C + 10}M${C + 10} ${C - 10}L${C - 10} ${C + 10}" stroke="#2A0208" stroke-width="5.5" stroke-linecap="round"/>
<path d="M${C - 10} ${C - 11}L${C + 9} ${C + 8}M${C + 9} ${C - 11}L${C - 10} ${C + 8}" stroke="#FF8A94" stroke-opacity="0.45" stroke-width="1.2" stroke-linecap="round"/>
<path d="M${C - 2} ${C - 41}L${C + 2} ${C - 30}L${C - 3} ${C - 22}M${C + 40} ${C + 6}L${C + 29} ${C + 3}L${C + 24} ${C + 10}" fill="none" stroke="#120004" stroke-width="2" stroke-linejoin="round"/>
<path d="M${C - 30} ${C - 18}Q${C - 22} ${C - 31} ${C - 8} ${C - 35}" stroke="#fff" stroke-opacity="0.7" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  );
}

/** A team member's envelope: open and empty while they decide, shut
 *  with a gold seal once their card is in. */
export function envelopeArt(sealed: boolean) {
  const W = ENV_W;
  const body = rrect(2, 14, W - 4, 30, 2);
  const flapDown = `M2.6 15L${W / 2} 31L${W - 2.6} 15Z`;
  const flapUp = `M3 15L${W / 2} 2L${W - 3} 15Z`;
  return svg(
    W,
    ENV_H,
    `${DEFS}
<path d="${body}" fill="#000" fill-opacity="0.4" transform="translate(1.5 2.5)"/>
${sealed ? "" : part(flapUp, "url(#mb)", INK, 0.9)}
${sealed ? "" : `<path d="M5 15H${W - 5}V24H5Z" fill="#3A2A12"/>`}
${part(body, "url(#mn)", INK, 1, { shine: "M5 17H20" })}
<path d="M3 43L${W / 2} 28L${W - 3} 43" fill="none" stroke="#9A7A3A" stroke-width="0.8"/>
${
  sealed
    ? `${part(flapDown, "url(#mn)", INK, 0.9)}<circle cx="${W / 2}" cy="29" r="5.4" fill="url(#gr)" stroke="${INK}" stroke-width="0.8"/><circle cx="${W / 2}" cy="29" r="3.2" fill="none" stroke="#7A5212" stroke-width="0.6"/><circle cx="${W / 2 - 1.8}" cy="27" r="1" fill="#fff" fill-opacity="0.9"/>`
    : ""
}`,
  );
}

/** A played card at the reveal: its manila back, or its face. */
export function slipArt(face: "back" | "success" | "fail") {
  const W = SLIP_W;
  const H = SLIP_H;
  const card = rrect(1, 1, W - 2, H - 2, 4);
  if (face === "back") {
    return svg(
      W,
      H,
      `${DEFS}
${part(card, "url(#mn)", INK, 1.1, { shine: "M5 4H30" })}
${part(rrect(5, 5, W - 10, H - 10, 2.5), "none", "#9A7A3A", 0.8)}
${part(circle(W / 2, H / 2, 11), "url(#gr)", INK, 0.9)}
${part(circle(W / 2, H / 2, 7.6), "url(#tl)", "#06201E", 0.7)}
${part(`${circle(W / 2, H / 2 - 1.5, 2.2)}M${W / 2 - 1.2} ${H / 2}L${W / 2 - 2} ${H / 2 + 4.4}H${W / 2 + 2}L${W / 2 + 1.2} ${H / 2}Z`, "url(#g)", INK, 0.4)}`,
    );
  }
  const good = face === "success";
  return svg(
    W,
    H,
    `${DEFS}
${part(card, "url(#paper)", INK, 1.1)}
${part(rrect(4, 4, W - 8, H - 8, 2.5), "none", good ? "#1E8A4A" : "#B8182E", 2)}
${typedLines(10, 12, 36, 2, 5)}
${
  good
    ? `${part(circle(W / 2, 46, 13), "url(#gr)", INK, 1)}${part(circle(W / 2, 46, 9.6), "url(#gn)", "#06240F", 0.7)}<path d="M${W / 2 - 5} 46.4l3.4 3.6l6.6 -7.4" fill="none" stroke="#F0FFE8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
    : `${part(blob(W / 2, 46, 13.5, 1.2, 7, 0.6), "url(#wx)", "#2A0208", 1)}<path d="M${W / 2 - 4.5} 41.5l9 9M${W / 2 + 4.5} 41.5l-9 9" stroke="#2A0208" stroke-width="2.4" stroke-linecap="round"/>`
}
${typedLines(10, 66, 36, 1)}`,
  );
}
