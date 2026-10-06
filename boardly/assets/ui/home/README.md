# Home screen art

Drop the files below into this folder, then register them in
`src/features/home/art.ts` (one `require(...)` line each). Until a file is
registered the screen draws a flat placeholder, so art can arrive piece by
piece.

**No text inside any image** — labels are drawn by the app so they work in
every language.

| File | Size | Notes |
|---|---|---|
| `background.webp` | 1125 × 2436 | Dark wooden table. Calm in the middle so content stays readable. |
| `scene-top.png` | 1125 × 700, transparent | Game board with pawns; sits behind the quick-play area. Fade its edges out. |
| `scene-bottom.png` | 1125 × 600, transparent | Cards, dice and a pawn; sits at the bottom of the page. |
| `dice.png` | 300 × 300, transparent | The big white die on the quick-play panel. |
| `chair.png` | 300 × 300, transparent | Empty-tables illustration. |
| `invite-dice.png` | 240 × 240, transparent | Tile at the left of the friends panel. |
| `meeple.png` | 240 × 240, transparent | Decoration on the tables panel. |
| `crown-coin.png` | 200 × 200, transparent | Decoration on the tables panel. |

Panel frames, ribbons and buttons are drawn in code for now (colours in
`src/features/home/art.ts`). To replace one with a picture it has to be
made stretchable — plain edges, decorated corners — so ask before making
those.

PNG or WebP. Keep each file under ~300 KB (the background under ~500 KB).
