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
- **Artwork** is listed per game in `assets/games/<game>/README.md`
  (file, size, what it replaces), with generator prompts beside it.
  Draw small icons in code rather than asking for images.
- **Bots** for testing: add a policy to `backend/scripts/bots.py`
  (`POLICIES`, `MIN_PLAYERS`) and the game key to `BOT_GAMES` in
  `backend/app/bots.py`; the lobby's bot button then works for it.
- **Design first.** New games are written up as a rules draft (Chinese,
  e.g. `../避难所_规则草案.md`, `../守夜_规则v2.txt`) and agreed with the
  owner before any code.
