// The isometric pieces any game's rooms are furnished from, drawn with the
// kit (../kit.ts) the house way: gradient faces lit from the upper left,
// ink outlines, a line of light, grain on wood. Each takes world units
// (x right-front, y left-front, z up) and returns shapes back to front.
//
//   materials   tones: metals, woods, stone, cloth, glass, snow…
//   helpers     lit faces, strokes, wall points, rings, shadows, panels
//   turned      turned, turnedBody and lathe: round bodies from profiles
//   walls       stonework, windows, a staircase, things fixed to walls
//   floors      floor patches, flagstones, runners, rugs, a hatch
//   seating     chairs, a pew, benches, a stool, a cushion
//   tables      tables, desks, an altar, a lectern
//   storage     cupboards, shelves, chests, barrels, bookcase, cabinets
//   lighting    candlesticks, candelabra, a sconce, lanterns, a lamp post
//   decor       frames, banners, vases, urns, busts, desk things, bells
//   paintings   canvases for ornateFrame and giltFrame
//   tableware   goblets, decanters, plates, jugs, pans, a range, a sink
//   outdoor     hedges, trees, a well, a bench, pines, logs, snow
//   provisions  crates, sacks, tins, jars, bread, vegetables
export * from "./materials";
export * from "./helpers";
export * from "./turned";
export * from "./paintings";
export * from "./decor";
export * from "./walls";
export * from "./floors";
export * from "./seating";
export * from "./tables";
export * from "./storage";
export * from "./lighting";
export * from "./tableware";
export * from "./outdoor";
export * from "./provisions";
