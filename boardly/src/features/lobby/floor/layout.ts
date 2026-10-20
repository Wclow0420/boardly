// Where everything in the floor lobby sits: the landing sign across the
// top (signLayout) and the room under it (roomLayout), for a screen w
// wide. Plain numbers, shared by the art (art.ts, rooms.ts), the canvases
// and the views laid over them.

/** The landing sign: the frieze with the floor's sign and the corner
 *  studs, the room-number plate under it with the QR button beside. */
export function signLayout(w: number, top: number) {
  const frieze = { y: top + 4, h: 46 };
  const stud = 19;
  const studs = {
    left: { x: 12 + stud, y: frieze.y + frieze.h / 2 },
    right: { x: w - 12 - stud, y: frieze.y + frieze.h / 2 },
    r: stud,
  };
  const sign = { x: 60, y: frieze.y + 6, w: w - 120, h: frieze.h - 12 };
  const plateW = Math.min(196, w - 150);
  const qrS = 40;
  const plateH = 46;
  const plate = { x: w / 2 - (plateW + 10 + qrS) / 2, y: frieze.y + frieze.h + 12, w: plateW, h: plateH };
  const qr = { x: plate.x + plate.w + 10, y: plate.y + (plateH - qrS) / 2, s: qrS };
  const h = plate.y + plate.h + 14;
  return { w, h, top, frieze, studs, sign, plate, qr };
}
export type SignLayout = ReturnType<typeof signLayout>;

export interface Spot {
  /** Where the feet stand. */
  x: number;
  y: number;
  /** The mascot's width. */
  size: number;
  /** 0: the back row, 1: the front. */
  row: 0 | 1;
  /** Where its lantern hangs (the bottom of the cord). */
  lantern: { x: number; y: number };
}

export const LANTERN_SCALE = 0.62;

/** Where the spots are for a table of `max`: one row along the front up
 *  to five, past five a back row too, further up the boards and smaller,
 *  each of them in a gap of the front row (the rightmost gaps, clear of
 *  the lift's door on the left). */
export function placeSpots(max: number, w: number, floorY: number, h: number, beam: number, foot = 70): Spot[] {
  const two = max > 5;
  const front = two ? Math.min(5, Math.ceil((max + 1) / 2)) : max;
  const back = max - front;
  const across = w * 0.9;
  const left = (w - across) / 2;
  const frontSize = Math.min(80, across / (front + 0.55));
  const backSize = Math.min(64, frontSize * 0.76);
  const frontY = h - foot;
  const backY = floorY + (frontY - floorY) * 0.36;
  const spots: Spot[] = [];
  const gaps = Array.from({ length: front - 1 }, (_, j) => left + ((j + 1) * across) / front);
  const backXs =
    back <= gaps.length
      ? gaps.slice(gaps.length - back)
      : Array.from({ length: back }, (_, i) => left + ((i + 1) * across) / (back + 1));
  backXs.forEach((x) =>
    spots.push({ x, y: backY, size: backSize, row: 0, lantern: { x, y: beam + 4 } }),
  );
  for (let i = 0; i < front; i++) {
    const x = left + ((i + 0.5) * across) / front;
    spots.push({ x, y: frontY, size: frontSize, row: 1, lantern: { x, y: beam + 14 } });
  }
  // front row first: the first to sit down stand at the front
  return [...spots.filter((s) => s.row === 1), ...spots.filter((s) => s.row === 0)];
}

/** The room, w × h: the eave and its beam across the top, the lift's
 *  door on the left of the back wall, the house rules board beside it,
 *  the table against the wall, the boards in front with a spot for each
 *  seat; `foot` is kept clear under the front row's feet (its name
 *  plates and the line over the plinth). */
export function roomLayout(w: number, h: number, max: number, foot = 70) {
  const roof = 24;
  const beam = { y: roof + 4, h: 13 };
  const wallTop = beam.y + beam.h;
  const floorY = Math.round(Math.min(h * 0.5, h - 250));
  const doorTop = wallTop + 84;
  const door = { x: 12, y: doorTop, w: Math.min(104, w * 0.25), h: floorY - doorTop };
  // the opening inside its frame: pilasters each side, the lintel above
  const pil = 10;
  const lintel = 22;
  const opening = { x: door.x + pil, y: door.y + lintel, w: door.w - 2 * pil, h: door.h - lintel - 6 };
  const boardX = door.x + door.w + 18;
  const board = { x: boardX, y: doorTop, w: w - boardX - 14, h: 54 };
  const tableX = door.x + door.w + 22;
  const table = { x: tableX, y: floorY - 64, w: w - tableX - 18, h: 64 };
  const spots = placeSpots(max, w, floorY, h, beam.y + beam.h, foot);
  return { w, h, roof, beam, wallTop, floorY, door, opening, board, table, spots };
}
export type RoomLayout = ReturnType<typeof roomLayout>;
