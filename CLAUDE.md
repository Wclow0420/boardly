# Boardly

Monorepo: `boardly/` is the Expo app, `backend/` the Flask API (Docker:
`cd backend && docker compose up`), `website/` the static site. See
`README.md` for setup, adding a game and the game API.

App conventions, the shared isometric/Skia kit and the standards for
building a new game:

@boardly/AGENTS.md

# How to draw for Boardly

The owner chose the engraved look ("The house drawing style" in
AGENTS.md). Winged Crest, Baroque Silver and the emblem icons are the
reference for every drawing. This is how they were made; work the same
way.

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
