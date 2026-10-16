# Boardly

Monorepo: `boardly/` is the Expo app, `backend/` the Flask API (Docker:
`cd backend && docker compose up`), `website/` the static site. See
`README.md` for setup, adding a game and the game API.

App conventions, the shared isometric/Skia kit and the standards for
building a new game:

@boardly/AGENTS.md

# How to draw for Boardly

The owner chose the engraved look ("The house drawing style" in
AGENTS.md). The rule is the style, not any one drawing: the whole range
of borders is the reference (Cherry Blossom Shrine, Imperial Dragon,
Clockwork, Lunar New Year, Kraken's Deep, Celestial Throne, Phoenix,
Winged Crest, Baroque Silver...), each its own idea in the same
engraved craft. Don't copy one border's look onto everything.

## Designing a page or a big piece: discuss first

Treat a page (a screen's look, a header, a board) like a new border:
come up with several distinct concepts first, each its own idea and
mood (a shrine, a clockwork, a sea, a night sky...), describe them or
show quick sketches, and agree one with the owner before building.
Then draw it with the same craft, and give it life the borders' way
(Skia, still parts baked once, one picture per frame).

## Pages: what the owner liked (the badge hall, `app/badges.tsx`)

- Full screen, no frame round the screen. The art goes into the
  header, drawn like a border: an idea (here a winged crest with a
  palmette and a ruby over a crimson sign, under an iron canopy) and
  alive the borders' way (sway, a beating jewel, flickering lamps, slow
  rays, a sweep, glints), on Skia with the still parts baked once
  (`hall/HallCrest.tsx`, `hall/crest.ts`). Measure it: 60 fps.
- The background matches the app: warm wood (planks), not a new colour
  scheme. Colours stay in the app's palette (`theme/table.ts`): table
  wood, felt, cream, Quick Play yellow, orange buttons, gold trim.
- The page scrolls under the header; nothing may draw over a frame
  (clip, or draw the frame on top).
- Titles must be readable: never `adjustsFontSizeToFit` on a title
  (it shrank "BADGES" to nothing). Check every text on the simulator.
- Items in a grid are all the same size: reserve the lines a name may
  take (two), never size a card by its text.
- The most important thing comes first (the showcase friends see);
  a summary (the level tally, "12/25") sits beside what it sums up,
  not in a bar of its own.
- Boards like a game's collection screen: each group on its own board
  (planks in a riveted iron frame, gold brackets, a name plate), cards
  on clips that swing in once.
- Popups opened from a page wear the page's style (see
  `hall/BadgePopup.tsx`), not the plain shared card.
- A page must open fast, not only animate at 60 fps. Measure the time
  from mount to first frame (the hall went from ~2 s to ~0.3 s):
  - Still art (walls, boards, cards, cases, popups) is baked once into
    images and kept for the app (`components/badges/bake.ts`:
    `bakedSvg`, `badgePicture`), never re-parsed on every visit.
  - No `SvgXml` or `BezelOverlay` per repeated item: each is dozens of
    native views. A board of cards is one canvas drawing its images
    and pictures; only text and invisible buttons sit on top.
  - Still badges are one recorded picture each, shared by every copy.
  - Show the top of the page first and mount the rest a frame at a
    time.
- Animated scenes (the game rooms) hold 60 fps the same way:
  - Every still layer of a scene is painted once into an image
    (`IsoLayer` does it inside an `IsoCanvas`); replaying hundreds of
    gradient shapes each frame dropped a room to ~35 fps.
  - Never put `blendMode` or `opacity` on a Skia `Group` that redraws
    every frame: it costs an offscreen layer a frame. Put it on the
    shape itself.
  - Characters on top of a scene (mascots) are still canvases moved by
    native view transforms (`MascotFigure`), not canvases redrawn each
    frame. `transformOrigin` takes numbers (`[x, y, 0]`); a "12px 30px"
    string made the views vanish.
  - Measure each room on `boardly-dev://dev/stage?room=<name>`; when a
    number looks wrong, relaunch the app first (stacked screens and a
    stale bundle both skew it).

## Rooms and 3D pieces

The game rooms are drawn like the borders: the iso kit
(`components/iso`) engraves every part by itself (each face a gradient
of its colour lit from the upper left, an ink outline, a line of light,
grain on wood), and the rooms are full of detailed pieces: panelled
cabinets with brass knobs, carved posts with iron straps, stained glass,
gilt frames, turned candlesticks. Reuse what exists before drawing new
(the shared library `components/iso/pieces/`, by kind: walls, floors,
seating, tables, storage, lighting, decor, tableware, outdoor…). Look
at rooms with `node scripts/room-sheet.mjs nightwatch <png> [room…]`
(or `shelter`). A set of rooms can be redrawn by parallel agents, one
room file each, keeping each room's working object (`prop`) in place.

## The craft

1. **Silhouette first.** Block in big, bold shapes that say what the
   thing is before any detail. If it doesn't read as a flat shape at
   17pt, detail won't save it.
2. **Layer back to front.** Draw what's behind first: the long
   feathers, then the short ones, then the band over their roots.
   Overlaps give depth for free.
3. **Mix materials for contrast.** Never all gold:
   - steel for blades
   - wood for handles and doors
   - ivory for paper, bone and cloth
   - flame for fire
   - crimson for wine, seals and blood
   - night for glass and sky

   Gold frames, ivory fills. One jewel gives a focal point.
4. **Engrave sparingly.** A midrib down a leaf, grooves along a band,
   one white shine on the lit edge (top-left). Then the ink outline over
   everything: about 1.5 on a 48 box, thinner on tiny parts.
5. **Generate organic forms, don't hand-draw them.**
   - Scrolls are tapering spirals (`curl`). Acanthus is a scroll with
     leaf-shaped lobes off its outer edge (`acanthus(..., lush)`).
   - Bands are `ribbon`s through a few points with a width at each.
   - Leaves are `frond`s or `LEAF`; feathers are `FEATHER`s, fanned by
     stepping their angle and length.
   - Draw one half and mirror it with `scaleX: -1`.
6. **Measure before you look.** Before rendering, compute a generated
   form's bounds with a few lines of Python. Borders must stay inside
   ±92 of the avatar's centre and off its face (r < 46). Tune the
   numbers until it fits, then look.
7. **Look, then fix, every time.**
   - Borders: open `boardly-dev://dev/borders` on the simulator,
     screenshot it, crop with `sips`, and judge it at the size people
     see. Put a new border in the large list at the top of that page.
   - Icons: run `node scripts/emblem-sheet.mjs <file> <png>` and read
     the PNG. Each icon shows large and at text size; fix any that
     smudge small.

   Expect three or four rounds. The first pass is never the one.
8. **Life, not noise.** Movement comes from one shared clock:
   - a light `Sweep` across the metal every few seconds
   - `Glint`s on the jewels
   - one jewel that glows or beats (the heart's lub-dub)
   - feathers or fronds swaying a few hundredths of a radian

   No pulsing blobs.

## Borders specifically

- The owner loves rims and ornate frames, effects that are the ring
  itself.
  - Put the ring (band, rope, feathers, shader rim) on the front layer,
    over the picture's edge at r 51–63. Wings, scrolls and smoke go on
    the back layer.
  - Effects that only sit behind the picture feel detached.
- Loved: Phoenix wings, Sun Blaze, Thunderstorm, Galaxy, Sakura, the
  crowns, Angel Wings (a feather rim), Seraph Wings, Winged Crest,
  Baroque Silver.
- Rejected: creature heads drawn in code (lion, dragon, phoenix), dark bubbles behind the
  picture, cheap plain rings.
- The lion and dragon head frames are waiting on painted art; prompts
  are in `boardly/assets/ui/borders/PROMPTS.md`.
- When the owner sends a reference picture, keep its composition (what
  sits where, the proportions) and render it in the house materials,
  with a jewel and a little motion.

## Borders must run at 60 fps

The owner wants every scene exactly as drawn: speed comes from how a
border is drawn, never from cutting detail or motion. `art/dragon.tsx`
is the model; copy its helpers (`bake`, `put`, `lazy`, `own`, `begin`,
`sweep`, `faded`).

- **Bake what doesn't move.** Draw every still part (engraving, gold,
  jewels, shadows, blurred glows) once, on first use, into an image
  (`bake`, at 1.2× the screen's pixel ratio so it stays crisp to ~130pt).
  Each frame then draws that image, not hundreds of paths.
- **One picture per layer per frame.** Each layer is one
  `useDerivedValue` that records a `Skia.PictureRecorder` picture and
  hands it to `<Picture>`. Don't build moving parts as many separate
  React Skia components, each with its own derived values.
- **Move it with transforms and alpha.** Swaying feathers, a beating
  jewel, a turning gear: `c.save()`, rotate/scale, draw the baked image,
  `c.restore()`. Fade by setting a paint's alpha (`faded`), not with a
  group `opacity` or `layer`.
- **No per-frame blurs, clips or layers.** A `BlurMask` drawn every
  frame is the most expensive thing there is. Bake the blur in, or use a
  radial gradient for a glow. Draw the light `Sweep` by filling the
  metal's shape with a moving gradient (`sweep`), not a band clipped to
  it.
- **Shaders return early** where they draw nothing (outside their ring),
  and use the shared `NOISE` in `iso/noise.ts`.
- **Make paints and paths once** (`lazy`), and give each mounted copy
  its own paints (`own`): a paint's alpha is set per frame.
- **Skia only on first use.** Never call `Skia.*`, `vec()` or Skia enums
  at module top level (Jest has no Skia). Every helper called inside a
  derived value needs `"worklet"`.
- **Measure, every time.** Open `boardly-dev://` first (screens left
  open behind keep animating), then
  `boardly-dev://dev/borders?perf=1&size=74&ids=x,x,x,x`. Four copies
  must read 60 fps. Also check it with nine or ten other heavy
  legendary borders. Check the id line under the fps reading: it shows
  what is actually drawn. Keep the original file and compare
  screenshots: the new version must look the same.
- **The app's safety nets** (`art/kit.tsx`, `AvatarBorder.tsx`): only
  `MOVING_AT_ONCE` (6) borders move at once, the biggest first; borders
  on screens you've left stop; below 42pt a border stands still. They
  are a backstop, not a substitute for a cheap border.

## Badge frames specifically

Every badge has four levels, and each level wears a frame
(`components/badges/frames/`; a game's own in
`src/games/<key>/badgeFrames.ts`). Draw them like the borders:

- A 120 × 120 box, the emblem's disc (`m: "tint"`, r 25–28) at the
  centre left clear, everything inside 4–116, readable at 60pt.
- One idea per game that carries through all four levels (a board, a
  clock, an agency seal, a barrel hoop, gothic tracery), each level
  clearly richer: bronze a simple token in bronze; silver adds a
  wreath or a second ring; gold adds a crest, a jewel and the game's
  big motif (candles, wings, cards); diamond is platinum on a star of
  crystal (`rays`) with set diamonds and a cut gem (`gem`) on top.
- No ribbons or hanging tails, no creature heads, no plain rings.
- `sweep` is the rim the light crosses; `glints` sit on the lit upper
  left and on the jewels.
- Look before wiring it in: `node scripts/badge-sheet.mjs <file>
  <png> BADGE_FRAMES <tint>` shows each level large, small and locked
  in iron. Three or four rounds. A set of games can be drawn by
  parallel agents, one game each, with this brief; review every sheet.

## Icons specifically

- Use a 48 × 48 box with the drawing filling about 4–44, in 2–6
  parts, written as `EmblemData`.
- Shapes that stand for a place or a mood take `m: "tint"`, so they
  pick up the colour they're shown in.
- In icons, people are meeples with no faces (people with faces are the
  avatar figures, `features/avatar`). Tell them apart by what they hold or
  wear: a flame, a bandage, green spots, "Zz".
- A big set can be drawn by parallel agents, one file each. Brief them
  with the format, these rules and the sheet script, then review every
  sheet yourself before wiring it in.
