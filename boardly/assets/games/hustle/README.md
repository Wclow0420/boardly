# Hustle art

Drop the files below into this folder, then register them in
`src/games/coup/art.ts` (one `require(...)` line each). Until a file is
registered the game falls back to drawn placeholders, so art can arrive
piece by piece.

| File | Size | Notes |
|---|---|---|
| `backdrop.webp` | 1125 × 900 | Night-market scene for the top of the screen. Dark; the bottom third should fade to `#0A1020`. No text. |
| `logo.png` | 900 × 300, transparent | "Hustle" wordmark. Optional — the title is drawn as text without it. |
| `card-back.png` | 300 × 420 | Back of a face-down card. |
| `role-boss.png` | 512 × 512 | Portrait. Same style for all five roles; dark or transparent background. |
| `role-enforcer.png` | 512 × 512 | |
| `role-pickpocket.png` | 512 × 512 | |
| `role-fixer.png` | 512 × 512 | |
| `role-auntie.png` | 512 × 512 | |
| `action-dayjob.png` | 128 × 128, transparent | Optional, one flat colour (they sit in a tinted circle). |
| `action-borrow.png` | 128 × 128, transparent | |
| `action-rent.png` | 128 × 128, transparent | |
| `action-pickpocket.png` | 128 × 128, transparent | |
| `action-swap.png` | 128 × 128, transparent | |
| `action-roughup.png` | 128 × 128, transparent | |
| `action-shutdown.png` | 128 × 128, transparent | |

PNG or WebP. Keep each file under ~300 KB — they ship inside the app.
