# 守夜 — image generator prompts

Paste **STYLE** first, then one subject line. Generate each group in
one sitting (same model, same seed if it has one) so the set matches.
Sizes and file names are in `README.md`.

## STYLE (put in front of every prompt)

> Hand-painted digital illustration for a hidden-role board game set in
> a haunted manor at night. Deep navy and indigo shadows, warm amber
> candlelight as the only light source, soft painterly brushwork, clean
> readable silhouette, slightly stylised (not photorealistic, not
> anime), muted palette with one warm accent. No text, no letters, no
> watermark, no border.

## 1. Brand

- **backdrop.webp** (landscape 5:4) — An old stone manor on a hill at
  night seen from its garden gate, nine lit windows each a different
  faint colour, a bell tower on the left, mist on the ground, crescent
  moon. The bottom third fades to flat near-black navy `#0B0E16`.
- **logo.png** (3:1, transparent) — The wordmark "守夜" in carved,
  slightly weathered serif brush lettering, warm gold, with a small
  lit lantern hanging from the last stroke. *(Text is wanted here:
  drop the "no text" line of STYLE.)*
- **card-back.png** (5:7) — Back of a playing card: dark navy, an
  ornate gold border, a single lit lantern in the centre inside a
  sealing circle of runes. Symmetrical.

## 2. Roles (square, bust portrait, plain dark navy background)

All eight: night watchers of the manor in dark hooded cloaks, each
holding or wearing one telling object, lit from below by a lantern.

- **role-prophet** — a calm elder watcher with pale glowing eyes,
  holding a small crystal orb that shows faint ghostly faces.
- **role-apprentice** — a young watcher clutching an open book, looking
  up uncertainly at two shadows on the wall.
- **role-tracker** — a lean watcher crouched low with a shuttered
  lantern, glowing footprints on the floor in front of them.
- **role-keeper** — a broad watcher with a heavy ring of iron keys,
  one hand on a barred door.
- **role-watcher** — a plain, steady watcher holding a lit lantern up
  high, honest face.
- **role-double** — a watcher holding a porcelain mask away from their
  face; behind them a second, identical translucent figure. Faint red
  light in the eyes.
- **role-hermit** — a watcher almost swallowed by fog, only the hood's
  outline and one red eye visible.
- **role-possessed** — a watcher with a ghost rising out of their
  shoulders, eyes glowing red, lantern gone out.

Good roles: amber light. Evil roles: the same amber plus a thin red
rim light.

## 3. Cards (5:7, same frame as card-back)

- **card-success** — a seal lamp burning bright gold inside an unbroken
  rune circle.
- **card-fail** — the same lamp blown out, a wisp of smoke shaped like
  a ghost, the rune circle cracked, red glow.
- **vote-approve** — a gloved hand setting a lit candle down on a table.
- **vote-reject** — a gloved hand snuffing a candle with two fingers.

## 4. Room icons (square, transparent, one object, flat with soft shading)

Each in its room's colour (hex in README): belltower — a bronze bell;
study — an open ledger with a quill; chapel — a small cross between
two candles; gallery — a gilt picture frame; hall — a three-branch
candelabra; dining — two goblets touching; cellar — a trapdoor with an
iron ring; kitchen — a cauldron over a flame; garden — a stone well
under a crescent moon.

## 5. Room backgrounds (portrait ~9:10, no people)

Scenery that sits *behind* the drawn room, so keep the middle calm and
dark and put detail toward the edges. One per room, tinted with the
room's colour:

- **belltower** — inside a stone belfry looking up at beams and night
  sky through arches; amber.
- **study** — towering bookshelves disappearing into shadow, moonlit
  window; light blue.
- **chapel** — pale stone vault, stained-glass glow, dust in the
  light; white-grey.
- **gallery** — a long corridor of gilt frames receding into dark;
  purple.
- **hall** — a grand staircase and red banners under a dim chandelier;
  red.
- **dining** — a long room, firelight on panelled walls; orange.
- **cellar** — damp brick vaults and barrels, one lantern; dark grey.
- **kitchen** — hanging copper pans, a glowing hearth, steam; beige.
- **garden** — hedges and an old tree under the moon, fireflies; green.

## 6. Night events (square, transparent, one emblem each)

blackout — a candle just blown out, smoke trail; collapse — fallen
stones and a broken beam across a doorway; secret-door — a bookcase
swung open on a dark passage; storm — a window lashed by rain with a
lightning fork; insomnia — a wide-open eye reflected in a pocket
watch; echo — a bell with rings of sound; fog — a lantern dimmed in
rolling mist; calm — a single leaf drifting over still water.

## 7. Icons (menu, actions, status)

Drawn as vectors in `src/games/nightwatch/icons.tsx` — nothing to generate.

## 8. Full-screen moments (square, transparent)

- **hush** — a hooded watcher's lower face, one gloved finger raised
  to the lips, red rim light.
- **envelope** — a sealed, slightly crumpled envelope with a dark wax
  seal and no name, faint violet glow.
