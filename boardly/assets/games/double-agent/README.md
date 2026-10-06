# Double Agent art

Drop the files below into this folder, then register them in
`src/games/avalon/art.ts` (one `require(...)` line each). Until a file is
registered the game falls back to drawn placeholders, so art can arrive
piece by piece.

| File | Size | Notes |
|---|---|---|
| `backdrop.webp` | 1125 × 900 | Spy scene for the top of the screen (city at night, briefing room...). Dark; the bottom third should fade to `#0B1114`. No text. |
| `logo.png` | 900 × 300, transparent | "Double Agent" wordmark. Optional — the title is drawn as text without it. |
| `role-handler.png` | 512 × 512 | Portrait. Same style for all eight roles; dark or transparent background. |
| `role-bodyguard.png` | 512 × 512 | |
| `role-field-agent.png` | 512 × 512 | |
| `role-hitman.png` | 512 × 512 | |
| `role-decoy.png` | 512 × 512 | |
| `role-sleeper.png` | 512 × 512 | |
| `role-wildcard.png` | 512 × 512 | |
| `role-mole.png` | 512 × 512 | |
| `card-success.png` | 300 × 420 | Operation card shown when results are revealed. |
| `card-fail.png` | 300 × 420 | |

PNG or WebP. Keep each file under ~300 KB — they ship inside the app.
