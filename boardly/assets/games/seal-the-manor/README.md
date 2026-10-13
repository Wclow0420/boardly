# Seal the Manor (守夜) art

Drop the files below into this folder. Nothing here is wired up yet:
the game still draws emoji and its own vector rooms. Art can arrive
piece by piece — each file gets registered in
`src/games/nightwatch/art.ts` (to be created, like `avalon/art.ts`).

PNG or WebP. Keep each file under ~300 KB — they ship inside the app.
One style for the whole set: night, candlelight, a haunted manor.

## 1. Brand (3)

| File | Size | Notes |
|---|---|---|
| `backdrop.webp` | 1125 × 900 | The manor at night, for the top of the game screen. Dark; the bottom third fades to `#0B0E16`. No text. |
| `logo.png` | 900 × 300, transparent | "守夜 / Seal the Manor" wordmark. |
| `card-back.png` | 300 × 420 | Back of the role card dealt at the start (now a 🏮 on a dashed card). |

## 2. Roles (8) — 512 × 512, dark or transparent background

| File | Role | Side | Now |
|---|---|---|---|
| `role-prophet.png` | 先知 Prophet | good | 🔮 |
| `role-apprentice.png` | 学徒 Apprentice | good | 📖 |
| `role-tracker.png` | 跟踪者 Tracker | good | 👣 |
| `role-keeper.png` | 守门人 Keeper | good | 🗝️ |
| `role-watcher.png` | 守夜人 Watcher | good | 🏮 |
| `role-double.png` | 替身 Double | evil | 🎭 |
| `role-hermit.png` | 隐者 Hermit | evil | 🌫️ |
| `role-possessed.png` | 附身者 Possessed | evil | 👻 |

## 3. Cards (4) — 300 × 420

| File | Used for | Now |
|---|---|---|
| `card-success.png` | Mission card: success | ✅ |
| `card-fail.png` | Mission card: fail | ❌ |
| `vote-approve.png` | Vote: send this team | 👍 |
| `vote-reject.png` | Vote: reject this team | 👎 |

## 4. Rooms

### Room icons (9) — 128 × 128, transparent

Small badge beside a room's name (header, notebook, prompts).

| File | Room | Its colour | Now |
|---|---|---|---|
| `room-belltower.png` | 钟楼 | amber `#FFB733` | 🔔 |
| `room-study.png` | 书房 | light blue `#8CCBFF` | 📜 |
| `room-chapel.png` | 礼拜堂 | white `#F6F3EA` | ⛪ |
| `room-gallery.png` | 画廊 | purple `#B58CFF` | 🖼️ |
| `room-hall.png` | 大厅 | red `#F0605D` | 🕯️ |
| `room-dining.png` | 餐厅 | orange `#FF8442` | 🍷 |
| `room-cellar.png` | 地窖 | dark grey `#7F8594` | 🕳️ |
| `room-kitchen.png` | 厨房 | beige `#E3CFA4` | 🍲 |
| `room-garden.png` | 花园 | green `#6FCF8E` | 🌙 |

### Room backgrounds (9) — 950 × 1040 (the room view's 190 : 208)

`roombg-belltower.webp` … `roombg-garden.webp`, same nine names.
See "Decision needed" below before painting these.

## 5. Night events (8) — 256 × 256, transparent

| File | Event | Now |
|---|---|---|
| `event-blackout.png` | 停电 | 🌑 |
| `event-collapse.png` | 塌方 | 🧱 |
| `event-secret-door.png` | 暗门 | 🚪 |
| `event-storm.png` | 暴风雨 | ⛈️ |
| `event-insomnia.png` | 失眠 | 😵 |
| `event-echo.png` | 回音 | 📣 |
| `event-fog.png` | 雾 | 🌫️ |
| `event-calm.png` | 平静 | 🍃 |

## 6–7. Menu buttons and action icons — done in code

These 27 are drawn as vectors in `src/games/nightwatch/icons.tsx`, so
no files are needed. Until the painted art above arrives, the same set
also stands in for the role, room and event emoji.

## 8. Full-screen moments (2)

| File | Size | Used for | Now |
|---|---|---|---|
| `hush.png` | 512 × 512, transparent | The "Shhh…" screen at the start | 🤫 |
| `envelope.png` | 512 × 512, transparent | An anonymous letter arriving | ✉️ |

## Decision needed: room backgrounds

The room you stand in is drawn in code: the glowing object you touch,
the doors and the watchers are all placed on that drawing. So there are
two ways to use painted rooms:

- **A. Scenery behind the drawn room** (simplest). The picture is the
  mood behind the cut-away room — the wing of the manor it belongs to,
  in the room's colour. Any angle works. The drawn room stays.
- **B. The picture replaces the drawn room.** Then each picture must be
  the same 30° isometric cut-away, back corner top-centre, with the
  front of the floor left empty for the watchers, and the room's object
  supplied as a second transparent file (`roomobj-<room>.png`, same
  canvas size) so it can still move when touched.
