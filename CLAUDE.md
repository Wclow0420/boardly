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
- Rejected: faces and heads drawn in code, dark bubbles behind the
  picture, cheap plain rings.
- The lion and dragon head frames are waiting on painted art; prompts
  are in `boardly/assets/ui/borders/PROMPTS.md`.
- When the owner sends a reference picture, keep its composition (what
  sits where, the proportions) and render it in the house materials,
  with a jewel and a little motion.

## Icons specifically

- Use a 48 × 48 box with the drawing filling about 4–44, in 2–6
  parts, written as `EmblemData`.
- Shapes that stand for a place or a mood take `m: "tint"`, so they
  pick up the colour they're shown in.
- People are meeples, never faces. Tell them apart by what they hold or
  wear: a flame, a bandage, green spots, "Zz".
- A big set can be drawn by parallel agents, one file each. Brief them
  with the format, these rules and the sheet script, then review every
  sheet yourself before wiring it in.
