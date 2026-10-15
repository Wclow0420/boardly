# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Game prompt sheets

A game board that asks the player for a move in a bottom sheet must
drive it with `usePromptSheet(needsMe, step)` (`src/hooks/usePromptSheet.ts`),
passing its `ref` and `onDismiss` to `<BottomSheetModal>`. Don't write
your own `present()`/`dismiss()` effect: @gorhom/bottom-sheet drops a
`present()` that arrives while the sheet is still closing, which leaves
the player with no prompt until they reload.

# Isometric drawing and live scenes (`src/components/iso/`)

Any game that wants a drawn world (rooms, a map, a board) builds it with
this shared kit. Two games use it: Seal the Manor (`src/games/nightwatch/`
— nine rooms and a map: `roomScenes.ts`, `RoomScene.tsx`, `ManorMap.tsx`)
and Shelter (`src/games/shelter/` — one house whose shelves show the
real food count, with tappable night posts: `shelterScenes.ts`,
`ShelterScene.tsx`). Read them before starting.

- `kit.ts` — the camera and parts. A builder places parts in world
  units (x right-front, y left-front, z up) and gets back `Shape[]`
  (SVG path data + fill/stroke) in painter's order, back to front.
  Set the view and ink first (`withView`, `setOrigin`, `setInk`), then
  call parts: `box`, `flat`, `onX`/`onY`, `arch`, `cylinder`, `ball`,
  `candle`, `moon`… Shapes are plain data, so the same drawing can be
  shown as still SVG (thumbnails, rules pages) or on the canvas.
- Live effects: `flame`, `steam`, `firefly`, `lightPool`, `moonShaft`
  draw ordinary shapes, but inside `live(() => …)` they are handed back
  as `Effect`s for the canvas to animate instead. Don't draw your own
  pulsing "glow" shapes — use these.
- `room.ts` — a room on its plinth: `shell()` (plinth, two back walls
  with doors, floor, trim), `setExits` for the four ways out, and
  furniture helpers (`solid`, `drum`, `table`, `chair`, `picture`,
  `windowOn`, `sconce`, `planks`, `flags`…). Wrap the one part that
  moves when touched in `prop(() => …)`; anything before it is drawn
  behind, anything after in front. Keep the front of the floor
  (x + y > 1.3) clear: pawns stand there.
- Canvas: `IsoCanvas` (draws in the picture's own units), `IsoLayer`
  (records shapes into one picture — hundreds of shapes cost one draw),
  `IsoGroup` (Reanimated transform), `IsoClip`, `IsoEffects`.
  Weather: `Darkness`, `Fog`, `Dust`, `Rain`, `Flash`, `Vignette`.
  Moments: `Burst`, `Seal`, `Shaft`, `GlowArea`, `Passage`.
- One clock per scene: `useIsoClock(paused)`. Pass `paused` when a
  popup covers the scene, the app is in the background
  (`AppState`), or reduce motion is on — the canvas then stops drawing.
- Shaders share `noise.ts`. Keep `effects.tsx` and `weather.tsx` from
  importing each other (a cycle blanks the canvas with an SkSL error).
- Also shared: `pawn`/`pawnTop`/`SPOTS` (room.ts), `IsoPicture` (a
  still SVG of shapes for thumbnails and choice cards), `Snow`.
  Outside the kit, `src/features/game/Popup.tsx` (the centred panel
  games open) and `EdgeGlow.tsx` (the frame of full-screen moments).
- Jest can't run Skia: `jest.setup.js` stubs every `@/components/iso`
  export and Reanimated/Worklets. Add a stub there for any new export.
- Dev previews (development builds only): `src/app/dev/iso.tsx`
  (`boardly-dev://dev/iso`, Seal the Manor's rooms and events) and
  `src/app/dev/shelter.tsx` (`boardly-dev://dev/shelter`, Shelter's board
  in every phase). Add one for a new game and check it on the simulator.

# Profile borders (`src/features/cosmetics/`)

Borders are `ring`, `shape`, `glow` or `art` (borders.ts). Art borders
are little Skia illustrations round the avatar, in `art/`: draw in the
space where the avatar is a circle of radius 50 at the origin (room out
to ~92), as a `back` layer (behind the avatar) and a `front` layer (over
its edge; keep off its face, r < 46). Use the kit (`art/kit.tsx`: Band,
Halo, Sparks, Glint, Flicker, polar/rnd, the iso `Fire`/`Steam`) and the
shared clock it is handed; helpers called inside `useDerivedValue` must
be worklets. Below 44pt a border stands still. Every new border's id
and price go in `backend/app/cosmetics.py` too (`BORDER_PRICES`, or
`EARNED_BORDERS` for one that comes with a badge). Check them all at
`boardly-dev://dev/borders`.

# The house drawing style

How the app should look wherever something is drawn (borders, emblems,
icons): engraved metal and ivory, like Winged Crest (`art/crest.tsx`)
and Baroque Silver (`art/baroque.tsx`).

- Every shape is a filled path with a gradient: gold
  (`#FFF2B8 #E2B04A #9A6B1E #F0CC72`), silver
  (`#FFFFFF #C9D0DA #7A8494 #E4E9F0`) or ivory
  (`#FFFFFF #F4EEDF #D8CCB0`). Each gets a dark ink outline: warm
  `#3A2408` on gold and ivory, cool `#1E242C` on silver.
- Engrave it: a thin vein down every leaf, scroll and feather, grooves
  along bands, and one white shine line.
- Build organic forms with the shared builders in
  `src/components/engraved/shapes.ts` rather than by hand:
  - `curl` and `acanthus` (`lush` for leaf-shaped lobes)
  - `ribbon`, a band of varying width through points
  - `frond`, a serrated leaf
  - `LEAF` and `FEATHER`

  The palettes (`MATERIALS`, `INKS`, `JEWELS`) are there too. Draw the
  right half and mirror it.
- Every icon is an engraved emblem in a 48 × 48 box, written as data
  (`EmblemData` in `src/components/engraved/emblem.ts`: shapes with a
  material, veins, shine; jewels; dark holes; `m: "tint"` takes the
  colour it's shown in) and drawn by `EmblemGlyph`.
  - App icons: `components/icons` (same names as ever) from
    `engraved/ui.ts`.
  - The tab bar, settings rows and gear: `engraved/icons.tsx`.
  - Emoji: `AppText` draws every emoji that has an emblem as that
    emblem, inline at letter height (a lone emoji is centred), so
    labels, buttons and game text need nothing. Use
    `<Emblem emoji="🏆" size>` for a picture on its own. The emblems
    come from `engraved/emoji/` (the app's set wins, then the sets
    drawn there, then the games' icons). A new emoji in any text gets
    an emblem there.
  - A game's icons: `src/games/<game>/emblems`, which its `GameIcon`
    draws. The line `GLYPHS` stay for badges and as the fallback.
  - Look a set over with
    `node scripts/emblem-sheet.mjs <file.ts> <out.png>`: each icon large
    and at text size. Every icon must read at about 17pt.
  - Never ship a bare emoji or a line icon as UI.
- Life comes from a light `Sweep`, `Glint`s, one jewel that glows or
  beats, and a gentle sway. Never draw faces or heads in code.

# Standards for a new game

What made Seal the Manor feel good; follow it unless the design says
otherwise.

- **Secrecy first.** Never show anything that leaks another player's
  hidden choice — e.g. only the player's own walk into a room is
  animated; everyone else is already standing there.
- **Set pieces play once per game.** Full-screen moments (the role
  card, anonymous letters, walking in) are remembered on the device by
  session with `useSetPieces`-style storage, so a reload or rejoin
  doesn't replay them. Popups wait until a set piece has finished.
- **Feel it.** Pair moments with `src/utils/haptics.ts`
  (`tapHaptic`, `moveHaptic`, `heavyHaptic`, `tickHaptic`,
  `successHaptic`); respect reduce motion.
- **Explain moves the game makes for you** (a mission moving you, a
  collapse) in the news and under the scene, so nothing looks like a bug.
- **Notes, records and news use `src/features/game/Journal.tsx`.**
  Never list a game's history as one flat run of lines. Write a
  `<game>Pages(state, parts, …)` builder that returns `JournalPage[]`:
  one page per day/night/round, split into sections (the vote, the
  mission, the night…). Each entry is one short line with `detail`
  lines under it (who voted what, which cards), and a `tone` for the
  reader's side (`good`/`bad`). What only this player knows goes in a
  `private` section ("🔒 Only you know"). Feed the same builder the
  whole state for the record/notebook panels (newest first) and only
  the unseen slices for the "what happened" popup (`order="oldest"`).
  Pass the game's `GameText` as `Text`. See `shelterPages`
  (`shelter/ShelterBoard.tsx`) and `manorPages`
  (`nightwatch/NightwatchBoard.tsx`).
- **Stats and badges.** Every game feeds the profile's player card.
  Backend (`backend/app/games/<key>/game.py`):
  - `player_outcome(state, seat)` returns the player's `side`
    ("good"/"evil" — required in any game with hidden sides), `role`,
    and `facts` (anything a badge needs: the win reason, food left…).
  - `badges = [Badge("<key>.<name>", tier, goal, match)]`. Ship at
    least: a bronze first win (in faction games, one per side), one or
    two silver/gold badges for the game's signature feats (the
    assassin finding the Prophet, being rescued with a full larder),
    and a legendary for 25 wins. `match` gets the outcome row (`won`,
    `side`, `role`, `facts`); use `won_as(side)` and keep wins handed
    over by a walk-out out of it. Badges counting the same thing with
    bigger goals are levels of one `series` ("wins": 1 → 10 → 25):
    give them the same series and the app shows the next level up.
  App (`src/games/<key>/index.ts`): a `badges` entry for every key —
  `{ glyph, loop }`, the emblem drawn from the game's own icon set
  (`icons.tsx`) or `components/badges/glyphs.ts`, and how it moves
  (`flicker`, `sway`, `spin`, `bob`, `pulse`, `tumble`; pick what
  suits the object). Name and description under
  `badges.<key>.<name>.{name,desc}` in all three locales. The badge
  itself (metal rim by tier, enamel in the game's colour, halo, light
  sweep, sparkles, the stamp when earned) is shared: never draw your
  own. Check them all at `boardly-dev://dev/badges`.
- **Player counts** get their own rules page: a table built from the
  game's count tables in `logic.ts` (sides, roles, team sizes, win
  thresholds) plus notes — see `CountsPage` in both games' `rules.tsx`.
- **Game text** goes through the game's own `GameText`/`GameButton`
  (see `nightwatch/GameText.tsx`): emoji become the game's vector icons
  (`icons.tsx`) and place names take their colour. Give every room or
  area a fixed colour, used for its floor and its name everywhere.
- **Strings** in all three locales (`en`, `zh`, `ms`) under the game's
  key. Rules pages: overview, roles, then one card per room/event with
  its picture where there is one (`nightwatch/rules.tsx`).
- **Box art.** Every game sits on the Games shelf and on Home's felt
  as a box (`features/games/GameBox.tsx`). Give it a `boxArt` in its
  GameDefinition — a picture `width` wide, e.g. a still of its own
  scene (`shelter/BoxArt.tsx`, `nightwatch/BoxArt.tsx`); without one
  the lid falls back to the skin's logo, then the game's emoji. Shared
  table pieces live in `src/components/tabletop/` (`Die`, `Meeple`);
  `boardly-dev://dev/tabletop` shows them all.
- **Artwork** is listed per game in `assets/games/<game>/README.md`
  (file, size, what it replaces), with generator prompts beside it.
  Draw small icons in code rather than asking for images.
- **Bots**: give the engine `has_bots = True` and a `bot_move(view,
  seat, rng)` (the policy lives in `backend/app/games/<key>/bot.py`)
  and the lobby's bot button works for it; the server plays them (see
  `backend/app/bots.py`).
- **Design first.** New games are written up as a rules draft (Chinese,
  e.g. `../避难所_规则草案.md`, `../守夜_规则v2.txt`) and agreed with the
  owner before any code.
