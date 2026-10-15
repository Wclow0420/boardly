# Profile border frames (painted)

Painted frames for the borders that code can't draw well (see
`PROMPTS.md`). Drop the files here and tell Claude: each becomes an art
border (`src/features/cosmetics/art/`) with the picture as its frame
and the motion added in code.

| File | Size | Effects the app adds |
|---|---|---|
| `lion-dance.png` | 1024 × 1024, transparent | Head sway, eye blink, jaw bob, firecracker sparks below, light sweep on the gold |
| `dragon-head.png` | 1024 × 1024, transparent | Burning eye glow, smoke from the nostrils, fire glowing in the throat, a burst of fire, scale gleam |
| `*-eyes.png` (optional) | 1024 × 1024, transparent | The eyes alone, so they can blink and glow cleanly |

The hole in the middle must be 540 px across and exactly centred: the
app draws the player's picture there. PNG, under ~400 KB each.
