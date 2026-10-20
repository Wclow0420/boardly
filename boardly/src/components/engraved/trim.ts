// The engraved trim on the app's own pieces (title plaques, section
// heads, buttons, panels, medallions), as plain SVG path data in points.
// Sized at run time to whatever the piece holds, drawn once (they never
// move), and shared with the concept sheets in scripts/. See "The house
// drawing style" in AGENTS.md.

import { acanthus, curl, fmt, ribbon, type Pt } from "./shapes";

/** A rounded rectangle. */
export function rrect(x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M${x + k} ${y}H${x + w - k}Q${x + w} ${y} ${x + w} ${y + k}` +
    `V${y + h - k}Q${x + w} ${y + h} ${x + w - k} ${y + h}` +
    `H${x + k}Q${x} ${y + h} ${x} ${y + h - k}V${y + k}Q${x} ${y} ${x + k} ${y}Z`
  );
}

/** A metal bezel `t` thick round a face: the rim (draw it even-odd),
 *  the face inside, a groove down the middle of the rim, and the line
 *  of light along its top-left. */
export function bezel(
  w: number,
  h: number,
  r: number,
  t: number,
  x = 0,
  y = 0,
) {
  const inner = rrect(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(1, r - t));
  const outer = rrect(x, y, w, h, r);
  const k = Math.min(r, h / 2);
  return {
    outer,
    rim: outer + inner,
    face: inner,
    groove: rrect(
      x + t / 2,
      y + t / 2,
      w - t,
      h - t,
      Math.max(1, r - t / 2),
    ),
    shine: `M${fmt([x + k * 0.8, y + t * 0.42])}H${(x + Math.min(w * 0.42, w - k)).toFixed(2)}`,
  };
}

/** The scrolls curling off the left end of a plaque `h` tall, whose left
 *  edge is at x = 0 and middle at y = h / 2 (mirror them for the right). */
export function plaqueScrolls(h: number) {
  const main = acanthus(4, h / 2 - h * 0.05, Math.PI + 0.25, h * 1.45, 3.8, h * 0.28, true);
  const low = curl(5, h / 2 + h * 0.16, Math.PI - 0.55, h * 0.62, -3.3, h * 0.15);
  return [...main, low];
}

/** How far a plaque's scrolls reach out past its end. */
export const scrollReach = (h: number) => h * 0.95;

/** One panel corner's scrolls, for the top-left corner of a frame whose
 *  rim starts at 0, 0 (mirror them for the other three). */
export function cornerScrolls(size = 16) {
  const w = size * 0.36;
  // a leaf in the corner, pointing in along the diagonal
  const leaf = curl(1.5, 1.5, Math.PI / 4, size * 0.95, 0.5, size * 0.42, "leaf");
  return [
    leaf,
    curl(2.5, size + 5, -Math.PI / 2, size, 3.6, w, 0.6),
    curl(size + 5, 2.5, Math.PI, size, -3.6, w, 0.6),
  ];
}

/** A section head's rule: a gold band from x = 0 to `len`, thinning to
 *  the right and ending in a curl, centred on y = 0. */
export function sectionRule(len: number) {
  const end = Math.max(24, len - 15);
  const band = ribbon(
    [
      [4, 0],
      [end * 0.5, 0],
      [end, 0],
    ] as Pt[],
    [4.4, 3.2, 1.9],
  );
  const tail = curl(end - 0.8, 0, 0, 19, -5, 2.6, 0.55);
  // a bead where it starts
  const bead = { cx: 3.4, cy: 0, r: 3.4 };
  return { band, tail, bead };
}

/** A section head's tab: a bar with pointed ends, w × h, shrunk evenly
 *  by `inset` (for the enamel inside the gold). */
export function tab(w: number, h: number, inset = 0) {
  const p = h * 0.36;
  const k = inset;
  return (
    `M${p + k * 0.6} ${k}H${w - p - k * 0.6}L${w - k} ${h / 2}` +
    `L${w - p - k * 0.6} ${h - k}H${p + k * 0.6}L${k} ${h / 2}Z`
  );
}
