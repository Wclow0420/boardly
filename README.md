# Boardly

Play board games with friends — React Native (Expo) frontend + Flask backend.

```
Boardly/
├── backend/          Flask API + Socket.IO (port 5005)
│   ├── app/
│   │   ├── models/           # SQLAlchemy models (User, Room, GameSession)
│   │   ├── routes/           # REST endpoints (rooms, games, health)
│   │   ├── sockets/          # Socket.IO events (join/leave room channels)
│   │   └── games/            # ⭐ one folder per game
│   │       ├── base.py       #   BaseGame contract (stateless engines)
│   │       ├── __init__.py   #   game registry
│   │       ├── tictactoe/    #   example game (logic in game.py)
│   │       ├── avalon/       #   "Double Agent": hidden roles, 5-10 players
│   │       ├── coup/         #   "Hustle": bluffing card game, 2-6 players
│   │       ├── manor/        #   "Midnight Manor": hidden roles in a dark house, 4-8 players
│   │       └── liarsdice/    #   "Liar's Dice" (大话骰): bluffing dice drinking game, 2-6 players
│   ├── migrations/           # Alembic (via Flask-Migrate)
│   ├── docker-compose.yml    # backend :5005 + postgres :5439
│   └── Dockerfile
└── boardly/          Expo app (SDK 57, expo-router, TypeScript)
    ├── app.config.js         # dynamic config (replaces app.json)
    ├── eas.json              # build profiles: development / preview / production
    └── src/
        ├── app/              # expo-router routes (thin screens)
        ├── theme/            # design tokens + semantic light/dark + ThemeProvider
        ├── i18n/             # i18next + locales (en / zh / ms) + LocaleProvider
        ├── components/       # ui/ kit · icons/ (svg) · navigation/ (TabBar)
        ├── features/         # per-screen folders (hooks.ts = data seam)
        ├── context/          # SessionContext etc.
        ├── api/              # REST client + socket.io client
        ├── data/             # domain types + mock data
        └── games/            # ⭐ one folder per game
            ├── types.ts      #   GameDefinition / GameBoardProps contracts
            ├── registry.ts   #   game registry (mirrors backend)
            ├── tictactoe/    #   logic.ts (rules) + TicTacToeBoard.tsx (UI)
            ├── avalon/       #   "Double Agent" — logic.ts + AvalonBoard.tsx
            ├── coup/         #   "Hustle" — logic.ts + CoupBoard.tsx
            ├── manor/        #   "Midnight Manor" — logic.ts + ManorBoard.tsx
            └── liarsdice/    #   "Liar's Dice" — logic.ts + LiarsDiceBoard.tsx
```

New-app conventions (theme, i18n, folder standards, checklists):
see [NEW_PROJECT_PLAYBOOK.md](NEW_PROJECT_PLAYBOOK.md).

## Backend

```bash
cd backend
docker compose up --build
```

- API: http://localhost:5005/api/v1/health
- Postgres: localhost:5439 (user/pass/db: `boardly`)
- Errors use one envelope: `{"error": {"code": "...", "message": "..."}}`

First run — create the initial migration and apply it:

```bash
docker compose exec backend flask db migrate -m "initial tables"
docker compose exec backend flask db upgrade
```

After changing models: `flask db migrate -m "..."` then `flask db upgrade` (same `docker compose exec backend` prefix).

### Production

The image's default command is the production server (gunicorn, one
`gthread` worker); `docker-compose.yml` overrides it with the dev server.

Required environment:

- `APP_ENV=production`
- `SECRET_KEY` — random, 32+ characters. The app refuses to start in
  production without it
  (`python -c 'import secrets; print(secrets.token_urlsafe(48))'`).
- `DATABASE_URL`
- `TRUST_PROXY=1` when behind a reverse proxy, so rate limits see the
  real client IP.

Run `flask db upgrade` on every deploy. Keep it to **one worker / one
instance**: Socket.IO rooms, presence and rate-limit counters live in
process memory (scaling out needs Redis behind them). TLS is expected to
be terminated by the proxy in front.

## Frontend

```bash
cd boardly
npm run start          # Expo dev server
```

Config is dynamic: `app.config.js` switches name / bundle id / scheme by
`APP_ENV` (set per profile in `eas.json`). The API base URL comes from
`EXPO_PUBLIC_API_URL` (defaults to `http://localhost:5005`).

### Web

The same app runs in the browser (react-native-web). On wide screens it
is laid out as a centered phone-width column.

```bash
npm run web                                             # dev server
EXPO_PUBLIC_API_URL=https://api.example.com npm run build:web   # -> dist/
npm run serve:web                                       # preview dist/ on :8096
```

`dist/` is a single-page app: upload it to any static host and configure
it to **serve `index.html` for unknown paths** (table links like
`/join/ABC123` are client-side routes). The API URL is baked in at build
time (`build:web` clears the bundler cache so a changed URL is picked
up); note that in development `.env.local` wins over the shell
variable. On web, auth tokens are kept in `localStorage`.

EAS builds:

```bash
eas build --profile development --platform ios      # simulator dev client
eas build --profile development-device --platform ios
eas build --profile preview --platform android      # internal APK
eas build --profile production --platform all
```

Folder names, registry keys and role ids (`avalon`, `coup`, `merlin`,
`duke`, ...) are internal only. Players see the themed names from the
locale files: `gameNames.*` for the game titles, `avalon.*` / `coup.*`
for roles and actions.

## Adding a new game

Backend:
1. Create `backend/app/games/<key>/game.py` with a `BaseGame` subclass
   (implement `initial_state`, `apply_move`, `get_result`). For
   hidden-information games override `view_for(state, seat)`: clients
   only ever receive that per-player view, never the stored state.
   `get_result` may return `{"winnerSeats": [...]}` for a winning team,
   and `on_abandon` decides what to store when a player leaves mid-game.
2. Register it in `backend/app/games/__init__.py` (`GAMES` dict).

Frontend:
1. Create `boardly/src/games/<key>/` with `logic.ts` (client-side rules
   for instant feedback) and a `Board` component.
2. Export a `GameDefinition` from `index.ts` and register it in
   `src/games/registry.ts`. Set `layout: "custom"` when the board draws
   its own players, status and result (anything that isn't a simple
   alternating-turn board — see `avalon/`).
3. If the board asks the player for a move in a bottom sheet, open and
   close it with `usePromptSheet(needsMe, step)` from
   `src/hooks/usePromptSheet.ts` (pass its `ref` and `onDismiss` to the
   `<BottomSheetModal>`), never with your own `present()`/`dismiss()`
   effect. A sheet asked to open while it is still closing gets dropped,
   and the player sees no prompt until they reload; the hook re-opens it.

The rooms/lobby/session plumbing (REST + Socket.IO broadcasts) is
game-agnostic — game state lives in a JSONB column and only the two
registries know about individual games. Socket broadcasts carry no game
state; they tell clients to refetch their own view. Moves are applied
under a row lock, so simultaneous actions (votes) are safe.

## Game flow (API, base `/api/v1`)

Auth: `POST /auth/register` / `POST /auth/login` `{username, password}` →
`{user, accessToken, refreshToken}`; `POST /auth/refresh`
`{refreshToken}`; `GET /auth/me`. All room endpoints require
`Authorization: Bearer <accessToken>` — identity always comes from the
token.

1. `POST /rooms` `{gameType}` → room + 6-char invite code (caller = host)
2. Friend: `POST /rooms/join` `{code}`
3. Clients: socket `authenticate {token}`, then `join_room {roomId}` (players at that table only) → receive `room_updated`, `game_started`, `game_updated`
4. Host only: `POST /rooms/<id>/start`
5. Turns: `POST /rooms/<id>/move` `{move}` — mover is the caller, validated by the game engine, broadcast to the room

6. Play again: `POST /rooms/<id>/rematch` on a finished room — the first
   player to ask opens a fresh table (and hosts it), the others join it.
   The finished room reports it as `rematchCode`.

Also: `GET /rooms/mine`, `GET /rooms/code/<code>`, `GET /games`,
`GET /auth/me/stats`.

Account: `POST /auth/password` `{currentPassword, newPassword}` (signs
out other devices) and `DELETE /auth/me` `{password}` (deletes the
account). `register` / `login` / `refresh` are rate-limited per IP and
answer `429 too_many_requests` when exceeded.

Friends (`/friends`): `GET ""` (friends with presence, incoming /
outgoing requests, recent players), `GET /search?q=`, `POST /requests`
`{userId}`, `POST /requests/<id>/accept`, `DELETE /requests/<id>`
(decline or cancel), `DELETE /<userId>` (unfriend),
`POST /<userId>/invite` (invite an online friend to your open table).
Presence is socket-based: once the client has sent `authenticate` it
receives `friends_updated` and `table_invite` on its
own channel. It is tracked in process memory, so run a single worker.

Backend tests: `pytest` inside `backend/` — the friends tests need the
compose Postgres running (`docker compose up -d db`) and use a separate
`boardly_test` database; they are skipped when it is unreachable.
The app is wired to all of this (Quick Play / tap a game → create table;
Join with a code → bottom sheet; lobby updates live over Socket.IO).
Testing on a real phone: set `EXPO_PUBLIC_API_URL` to your Mac's LAN IP
(e.g. `http://192.168.x.x:5005`) when starting Expo.
