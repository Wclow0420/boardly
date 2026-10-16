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
- Everything is drawn engraved automatically (gradients lit from the
  upper left, ink outlines, a shine, grain on `GRAINED` tones); a Shape
  can carry its own `grad`. Detailed pieces live in one library,
  `pieces/` (import `@/components/iso/pieces`): `materials` (tones;
  grained woods registered there once), `helpers`, `turned`, `walls`,
  `floors`, `seating`, `tables`, `storage`, `lighting`, `decor`,
  `paintings`, `tableware`, `outdoor`, `provisions`. Add new pieces
  there; a room file (Seal the Manor's are one each in
  `games/nightwatch/rooms/`) keeps only its builder. `shell(base, { panelled })`
  gives panelled walls with a gilded rail, or plain ones. Look a game's
  rooms over with `node scripts/room-sheet.mjs <game> <png>`.
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
be worklets. Below 42pt a border stands still, only six move at once
(`MOVING_AT_ONCE`), and borders on screens you've left pause. Every
border must hold 60 fps with four copies at 74pt
(`boardly-dev://dev/borders?perf=1&size=74&ids=…`): bake the still
parts once and record one picture per layer per frame, as
`art/dragon.tsx` does (see "Borders must run at 60 fps" in the root
CLAUDE.md). Rarity is common → rare → epic → legendary → mythic
(10,000+ coins); the shop sorts by it. Every new border's id
and price go in `backend/app/cosmetics.py` too (`BORDER_PRICES`, or
`EARNED_BORDERS` for one that comes with a badge). Check them all at
`boardly-dev://dev/borders`. A border draws well outside its avatar, so
anything laid out after it would cover it: inside an `<AvatarStage>`
(`components/ui`) bordered avatars are drawn in a top layer instead.
Scrolling `Screen`s have one; a screen with its own ScrollView puts one
inside its scroll content (profile, lobby). Leave room round the avatar
for the wings and flames (lobby cards: 26 above, the name 24 below).

# The house drawing style

How the app should look wherever something is drawn (borders, emblems,
icons): engraved metal and ivory, the craft every border in `art/` is
drawn with (each border its own idea; none is the template).

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
- The app's own pieces wear the same trim (`components/ui`; shapes in
  `engraved/trim.ts`, drawn once as still SVG): the tray's wood or felt
  stays, the trim is engraved metal, gold for what matters and silver
  for the second choice.
  - `TitlePlaque`: a page's title (ivory plaque, gold scrolls, a
    sapphire).
  - `SectionTitle`: a section's name on an enamel tab in its colour,
    then a gold rule; `right` holds a "See all" or a count.
  - `Frame`: a tray in a gold moulding; `ornate` (corner scrolls) only
    for the one card that leads a page.
  - `Button` (enamel in gold; `secondary` in silver), `Chip`,
    `CoinPill`, `Medallion` (a stat number on a beaded gold coin).
  - Anything drawn by hand (a home card, a big button) gets
    `<BezelOverlay r t metal />` after its fill and before its content.
    No plain borders.
- Still art baked from SVG (`bakedSvg`) goes through Skia's SVG
  reader: a gradient fill on an `<ellipse>` comes out black there (it
  works on `<circle>`, `<rect>` and `<path>`), so draw ovals as paths.
  A Skia `<Canvas>` ignores `pointerEvents`: wrap one laid over
  buttons in a `<View pointerEvents="none">`.
- Life comes from a light `Sweep`, `Glint`s, one jewel that glows or
  beats, and a gentle sway. No creature heads drawn in code. People
  with faces are only the avatar figures (`src/features/avatar`).

# The mascot (`src/features/mascot/`)

Every player is the Boardly meeple, dressed. Use it wherever a game
needs a person.

- **What a look is.** A look is a skin plus a part in each slot (eyes,
  mouth, nose, hat, top, bottom, shoes, hand, back). It's built on the
  rig's fixed points (`rig.ts`).
  - `dress.ts` layers a look.
  - `asLook()` reads one from the server.
- **Drawing it.**
  - `MascotFigure` is the mascot alive on Skia: it breathes, blinks and
    sways. Give it a `seed` so a room of mascots isn't in step, and
    `paused` with the scene.
  - `MascotPortrait` is a still head and shoulders, for circles. Every
    `Avatar` and `AvatarBorder` shows it when there is no photo.
- **In a game.** Players carry `mascot` (`GamePlayer`). See Seal the
  Manor's `RoomScene` (`mascotAt`) and Shelter's `ShelterScene`.
- **Adding or repricing an item.** Draw it in `parts/` or `skins.ts`,
  look it over (`node scripts/emblem-sheet.mjs
  src/features/mascot/preview.ts out.png HAT 100x130`), then run
  `node scripts/export-mascot-catalog.mjs`. The server only accepts
  items in `backend/app/mascot_catalog.json`.
- **The screens.** The Mascot tab is in the middle of the bar. The
  wardrobe (`app/wardrobe.tsx`) slides up over it. Jest stubs
  `MascotStage` in `jest.setup.js`.

# Standards for a new game

What made Seal the Manor feel good; follow it unless the design says
otherwise.

**A new game is not done without** (each is explained below):
- its badges as four-level missions on the server (`Badge(key, goals,
  match)`, bronze → silver → gold → diamond) and `player_outcome`;
- a `badges` entry (`{ glyph, emoji, loop }`) for every badge key and
  its own `badgeFrames` (`src/games/<key>/badgeFrames.ts`): four
  frames in the game's style, richer at each level, looked over with
  `scripts/badge-sheet.mjs` and at `boardly-dev://dev/badges?game=<key>`;
- badge names and counted asks (`desc_one`/`desc_other` with
  `{{count}}`) in `en`, `zh` and `ms`;
- its icons as engraved emblems (`src/games/<key>/emblems`), box art,
  a rules page with a player-count table, a Journal for its history,
  and a dev preview page;
- the app's own pieces for its menus and sheets (`TitlePlaque`,
  `SectionTitle`, `Frame`, `Button`; bordered avatars inside an
  `AvatarStage`), never plain borders or ribbons.

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
  - `badges = [Badge("<key>.<name>", goals, match)]`. Every badge is a
    mission in four levels, bronze → silver → gold → diamond, reached
    at its four `goals` (presets in `games/base.py`: `FEAT` 1/5/15/40
    for winning on a side, `RARE` 1/3/8/20 for a signature feat — the
    assassin finding the Prophet, rescued with a full larder —, `WINS`
    3/10/25/60 for all wins, `QUICK_WINS` for short games). Ship one
    per side's win (faction games), one or two signature feats, and
    one for all wins. `match` gets the outcome row (`won`, `side`,
    `role`, `facts`); use `won_as(side)` and keep wins handed over by a
    walk-out out of it. A badge-earned border names the level that
    brings it (`EARNED_BORDERS` in `backend/app/cosmetics.py`, and
    `earnedBy`/`earnedAt` in the app).
  App (`src/games/<key>/index.ts`): a `badges` entry for every key —
  `{ glyph, emoji, loop }`: `emoji` names the engraved emblem on the
  badge's disc (any emoji `<Emblem>` draws), `glyph` the line icon
  fallback, and how it moves (`flicker`, `sway`, `spin`, `bob`,
  `pulse`, `tumble`; pick what suits the object). And `badgeFrames`:
  the game's own frame for each level (`src/games/<key>/badgeFrames.ts`,
  a `BadgeStyle` of EmblemData in a 120 box; see
  `components/badges/frames/boardly.ts` and `frames/kit.ts`), richer
  at each level and in the game's style; no ribbons. Look a set over
  with `node scripts/badge-sheet.mjs <file.ts> <out.png> BADGE_FRAMES
  <tint>`. Name and ask under `badges.<key>.<name>.{name,desc_one,
  desc_other}` in all three locales: the ask takes `{{count}}`, the
  goal of the level being worked towards ("Win {{count}} games of
  Shelter"). The badge itself (the frame, the emblem, iron while
  locked, the light sweep and glints, the four-level sheet, the stamp
  when a level is reached) is shared: never draw your own. Check them
  all at `boardly-dev://dev/badges` (`?game=<key>` for one style).
  A player's card shows just four badges: the ones they pick in the
  badge hall (`app/badges.tsx`, opened through the meeple like the
  wardrobe; saved by `PUT /auth/me/showcase`), or their four best.
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
- **The stage.** A game with a drawn world fills the whole screen
  (`layout: "stage"` in its GameDefinition; the game screen hands the
  board its back button, rules, last error and the after-game content
  in `stage`). Seal the Manor's `ManorStage` is the model: the arch
  across the top (`features/game/stage/NightArch`), the scene in the
  middle with the tools down its side (`ToolButton`, no boxes), the
  main move on the `Plinth`. Every moment plays on the stage, not in a
  popup: the letter of the night, the patrol's map, everyone on the
  stage for the team and the vote (the leader's picks lit as they're
  made, coins over heads that turn green or red) and for the last
  chance, the lanterns of the mission, the ending's seal. Give each its own `sceneKey`: the red
  `StageCurtain` closes and opens between them (and holds the plinth's
  move until it's shut). A decision that matters is held, not tapped
  (`lantern/HoldButton`: fills, ticks harder in the hand, sends at the
  end). Results are revealed once each on the device (`useSetPieces`
  counters), everyone seeing the same reveal; nothing on the way shows
  whose choice was which. Preview every moment at
  `boardly-dev://dev/manor?sample=<moment>` (the `dev` tab on the left
  lists them and shows the fps) and keep each at 60.
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
