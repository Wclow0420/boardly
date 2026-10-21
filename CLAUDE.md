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

## The Games tab and the lobby: the lift and its floors

The owner picked these over a space-ship hatch (off-theme: keep every page
in the app's own world and palette).
- **Games tab = a brass lift** (`features/games/lift/`): a floor dial
  (needle rides with you; tap a floor to go there), a folding brass gate
  and, through it, each game's floor (its room from the game's own art,
  its lead role breathing in front). One game per floor, swipe a floor at
  a time with a stop, lurch and ding; a players count dims what doesn't
  fit; last floor remembered. Keep the gate OPEN (5 pickets, tall
  diamonds, slim straps): a dense gate hid the floor and was rejected.
- **Many games:** banks of 7 by type (`category` in each GameDefinition:
  deduction, bluff, strategy, party, duel, classic; `lift/banks.ts`),
  the first bank "Your floors" (most played, from my stats). The dial
  shows one bank; its number drums roll over like an odometer between
  banks, studs jump banks. The Floors plate opens the letter-board
  directory (every floor by bank, players count, "new" tags, search past
  20 games). A new game needs a `category`, a floor in
  `lift/floors.ts` and a lead in `lift/leads.ts`; the lobby reads its
  floor number from the same building (`useLiftFloor`).
- **The lobby = that game's floor** (`features/lobby/floor/`), seen flat
  on like the lift's floors (not iso): the lift's landing sign
  ("3F · Hustle", floor = the game's place in the lift), the table code
  plate + QR to join; the room with the lift door on the left wall (new
  players walk out of it once per device); everyone as their mascot on
  the floor, two staggered rows (6: 4 front, 2 behind in the gaps, the
  door kept clear); a lamp lit with a beam and a pool over each ready
  player; dashed spots to invite; the house rules on the room's board,
  with what this count means (`tableNotes` in the GameDefinition); one
  status line; bots and a held start on the plinth.
- **Every game draws its own room** (`floor/rooms/<key>.ts`, Hustle's den
  in `rooms.ts` is the model): its wall, its board for the house rules,
  its table and pieces, its own lamp. Never ship the plain fallback room.

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

## Roles

Every game's roles are drawn as faceless meeple portraits, never
uploaded photos or a bare object: a gold meeple head on cloth shoulders,
told apart by what it wears or holds (a headset, a shield, a fedora, a
mask, a lantern), in the game's own palette. The model is Double Agent's
`ROLE_EMBLEMS` (`src/games/avalon/emblems.ts`, 48 × 48 `EmblemData`).
- The same portrait everywhere the role is pictured: in its card's
  window (`cards.ts`, `faceSvg`), on the ending's cards, and in the rules.
- In the rules a role is the portrait on its own: no card, window or
  background behind it (`RolePortrait`).
- Look the set over with `node scripts/emblem-sheet.mjs <file>
  <png> ROLE_EMBLEMS`; every one must read at 17pt.

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

# A game's flow on the stage (what Seal the Manor taught us)

Every game is played on the stage, Seal the Manor (`src/games/nightwatch/`)
is the model: read its `NightwatchBoard.tsx`, `ManorStage.tsx` and the
pieces it uses before building another. The owner loves its flow.

## The screen
- `layout: "stage"` in the GameDefinition; the board draws the whole
  screen with the shared `GameStage` (`features/game/stage/GameStage.tsx`):
  the game's own **header** across the top (Seal the Manor: the
  stained-glass arch showing the rounds; design one per game, in the
  game's mood, drawn like a border and baked), **under** it a line of
  tags (what's at stake now), the **middle** (the scene, full width),
  and the main move **on the plinth**. Back and rules are the corner
  studs.
- **The dock** (`GameStage dock=`, `stage/Dock.tsx`; every game on the stage uses it; Seal the Manor is
  the model): nothing sits over the scene. My **hand** at the
  plinth's left (my role card's back; tap → it flies to the middle
  turning over, tap → flies back into its slot), a **satchel** at its
  right (the lookup tools fan out in ~0.2 s and take taps at once; a red
  dot when something's unseen), and **one hint line** on the plinth's
  crest with an ⓘ for the rest. Put instructions into the button labels
  where you can ("Go to the Kitchen").
- **No spoilers in the header**: the header, tags and record show only
  what this device has watched (`useSetPieces` counters); a result fills
  in with a small moment after its reveal (`nightwatch/shownNight.ts`).
- Seal the Manor's rooms are flat-on stage sets filling the middle
  (`nightwatch/flat/`, one `FlatRoomDef` per room); iso only for the
  map. Tonight's event hangs from the arch as a medallion that rides
  like the lift's floors.
- Every moment is its own scene in the middle, never a popup: choosing,
  voting, playing a card, the reveal, the ending. Give each a `sceneKey`;
  the red curtain closes and opens between them and the plinth's move
  changes only once it's shut. The curtain covers the whole middle,
  under the header to the plinth.
- Popups only for looking things up (map, notes, record, role).
- The ending bleeds the full height (`bleed`, `StageInsets`): the result,
  every player's role/card face up, coins and badges; Back to Home and
  Play Again sit on the plinth (`stage.onward`).

## Players on the stage
- Anything with the players themselves (picking a team, a vote, an
  accusation, whose turn it is) uses the shared `StageLineup`
  (`features/game/stage/`): everyone as their own mascot under a lamp on
  the lighting rig, two staggered rows past five, a name plate at their
  feet, a crown on the leader's head. Hand it `lights` (full, low,
  nearly out, red, green), `plates` (a seal once someone has acted —
  never which way — turned green ✓ / red ✕ at a reveal), who can be
  tapped, and `hold`/`aim`/`struck` for a dramatic choice.
- Every game must hold up at its largest table (10 players): check each
  scene at the biggest count.
- A player's name anywhere on the stage or header goes through
  `PlayerName` (`features/game/stage/PlayerName.tsx`): centred in a fixed
  slot, one line, cut with "…", a bot's 🤖 drawn beside it (inline in the
  text it pushed the name off centre). Inside a sentence (a title, "X's
  turn") use `shortName` so the words round it still show. The dev
  samples carry a bot and long names; look at every scene with them.

## The flow
- Secrecy first: nothing on screen reveals a hidden choice until the
  game reveals it; the reveal is the same for everyone.
- A decision that matters (a mission card, naming someone) is held, not
  tapped (`HoldButton`: fills, ticks harder in the hand, sends at the
  end). Everyday choices (a vote, picking) are one tap.
- What only shows something to the table (the leader's picks so far) is
  a quiet move: `onMove(move, { quiet: true })`, debounced, never
  blocking the board; the server shares it in the view.
- Show my own action the moment I make it (my vote, my pick); don't wait
  for the server's answer.
- Results are revealed once per device (`useSetPieces` counters), each
  with a Continue on the plinth. Moves the game makes for you are
  explained on the stage.
- Don't move people on by surprise: after a step that shows them
  something (a room's result), stay until they tap Continue.
- Haptics with every moment (`utils/haptics`), reduce motion respected.

## Speed and memory (each of these cost us a lag or a crash)
- The server sends each player their own view with the update (no
  refetch); keep moves cheap there (no N+1, bots that owe a move at the
  same moment move together).
- Nothing is rebuilt on every update: memoize by content (`JSON.stringify`
  keys for arrays the server resends), stable callbacks into memoized
  children, `useDerivedValue` with deps, shaders through `shader()` (one
  compile each), still art through `bakedSvg`/`bakedDrawing` (one image,
  in the budgeted cache), a mascot through `MascotFigure` (baked per look).
- Still art on a canvas that never redraws: record it once as a picture
  (`stillSvg` in `bake.ts`) and show it with `StillPicture`
  (`components/ui`) — a picture costs KB, a baked image MB, and the
  canvas would keep a second copy. `bakedSvg` is for canvases that redraw
  every frame. A full-screen gradient is `TallGradient` (drawn narrow and
  stretched), never a full-size `LinearGradient`. Unmount a scene a
  moment covers instead of hiding it. These took every game page from
  +105–194 MB to +55–103 MB over Home.
- Never hold more than the screen shows: long lists are FlashList;
  small still borders are pictures; a canvas per item is a cost.
- An animation must not restart when an update arrives (depend on the
  key of what it shows, not on a new object; keep callbacks in refs).
- Look at memory, not only fps: `footprint -p $(pgrep -f BoardlyDev)`
  before and after a screen; a screen that adds 100+ MB is a bug.

## Building it
- A dev page with a sample of every moment (`app/dev/manor.tsx` is the
  model: `?sample=`, a `dev` tab listing them, `&perf=1` for fps), and a
  10-player sample of each moment with players.
- Look at every moment on the simulator, then fix, then look again.
- Strings in en, zh, ms; Jest must pass (stub new Skia exports in
  `jest.setup.js`).
