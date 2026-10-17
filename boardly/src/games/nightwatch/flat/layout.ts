// Where everything in a flat-on room sits: a stage set seen straight on,
// like the table lobby's room (features/lobby/floor). The back wall faces
// you; the two side walls and the floor run towards you in one-point
// perspective, so an archway in a side wall reads as a way out to the
// left or right. Plain numbers for a box w × h, shared by the art
// (flatRooms/<room>.ts, parts.ts), the canvas and the views laid over it.
//
// Points of the room are given as (x, y, z): x and y where they'd be on
// the back wall's plane, in the box's pixels, and z how far in front of
// the back wall (0 at the wall, growing towards you).
//
// The four ways out keep the sides they have in the iso room and on the
// manor's map: the two back walls' doors (iso "left", "right") are the
// doors in the back wall, left and right; the two front steps (iso
// "frontLeft", "frontRight") are the archways in the left and right walls.

import { placeSpots, type Spot } from "@/features/lobby/floor/layout";
import type { Side } from "../roomScenes";

export type { Spot };

export interface DoorBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** An archway in a side wall: from z0 to z1 along the wall, its jambs
 *  rising to `spring`, a round head of radius (z1 - z0) / 2 above. */
export interface ArchBox {
  wall: "left" | "right";
  z0: number;
  z1: number;
  spring: number;
}

export function flatLayout(w: number, h: number, people: number) {
  const ceil = Math.round(Math.max(24, h * 0.07));
  const side = Math.round(w * 0.15);
  const floorY = Math.round(Math.min(h * 0.56, h - 176));
  const bx0 = side;
  const bx1 = w - side;
  const vx = w / 2;
  // the eye a little under the middle of the wall
  const vy = floorY - (floorY - ceil) * 0.42;
  // how far the eye is from the back wall, in the wall's pixels
  const F = (bx1 - bx0) * 1.45;
  const k = (z: number) => F / (F - z);
  const at = (x: number, y: number, z: number): [number, number] => {
    const s = F / (F - z);
    return [vx + (x - vx) * s, vy + (y - vy) * s];
  };
  /** The depth at which a floor point reaches screen height `y`. */
  const zAtFloor = (y: number) => F * (1 - (floorY - vy) / (y - vy));
  /** The depth at which a side wall reaches the screen's edge. */
  const zEdge = F * (1 - (vx - bx0) / vx);
  const zFront = zAtFloor(h);

  const wallH = floorY - ceil;
  // the back wall's doors, near either end
  const doorW = Math.round(Math.min(58, (bx1 - bx0) * 0.21));
  const doorH = Math.round(Math.min(wallH * 0.6, doorW * 2.45));
  const doors: Record<"left" | "right", DoorBox> = {
    left: { x: bx0 + 6, y: floorY - doorH, w: doorW, h: doorH },
    right: { x: bx1 - 6 - doorW, y: floorY - doorH, w: doorW, h: doorH },
  };
  // the archways in the side walls, within what shows of them
  const z0 = zEdge * 0.14;
  const z1 = zEdge * 0.8;
  const spring = floorY - doorH * 0.78;
  const arches: Record<"frontLeft" | "frontRight", ArchBox> = {
    frontLeft: { wall: "left", z0, z1, spring },
    frontRight: { wall: "right", z0, z1, spring },
  };

  const count = Math.max(1, Math.min(10, people));
  const foot = 30;
  const spots = placeSpots(count, w, floorY, h, 0, foot);

  return {
    w,
    h,
    ceil,
    side,
    floorY,
    bx0,
    bx1,
    vx,
    vy,
    F,
    k,
    at,
    zAtFloor,
    zEdge,
    zFront,
    wallH,
    doors,
    arches,
    spots,
    foot,
  };
}
export type FlatLayout = ReturnType<typeof flatLayout>;

/** Where the name plate of each way out hangs (its middle) and how wide,
 *  in the box: over a back door on its lintel, on an iron bracket out of
 *  the side wall over an archway. */
export function exitPlate(L: FlatLayout, side: Side) {
  if (side === "left" || side === "right") {
    const D = L.doors[side];
    const w = Math.max(D.w + 12, 78);
    // kept on the back wall, clear of the corners
    const x = Math.min(Math.max(D.x + D.w / 2, L.bx0 + w / 2 - 6), L.bx1 - w / 2 + 6);
    return { x, y: D.y - 11, w, h: 18 };
  }
  const A = L.arches[side];
  const z = (A.z0 + A.z1) / 2;
  const wx = A.wall === "left" ? L.bx0 : L.bx1;
  const [sx] = L.at(wx, 0, z);
  const sy = L.ceil + 36;
  const w = 78;
  const reach = 10;
  return {
    x: A.wall === "left" ? sx + reach + w / 2 : sx - reach - w / 2,
    y: sy,
    w,
    h: 18,
    /** Where the bracket leaves the wall. */
    wall: sx,
  };
}

/** Where someone coming through a way out first stands: in the doorway,
 *  on the floor. */
export function exitFoot(L: FlatLayout, side: Side): [number, number] {
  if (side === "left" || side === "right") {
    const D = L.doors[side];
    return [D.x + D.w / 2, L.floorY + 4];
  }
  const A = L.arches[side];
  return L.at(A.wall === "left" ? L.bx0 + 6 : L.bx1 - 6, L.floorY, (A.z0 + A.z1) / 2);
}
