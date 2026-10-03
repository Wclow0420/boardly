# New Project Playbook

The standard setup **every new app** follows — all of it is **day-one**,
not "later". It is written generically; replace names/ports per project.
Boardly is the reference implementation: when in doubt, copy from it.

---

## 1. Repository layout

```
<project>/
├── backend/            # API server (one deployable unit)
├── <app>/              # Mobile app (Expo / React Native)
├── README.md           # How to run everything, game/module flow
└── NEW_PROJECT_PLAYBOOK.md
```

One repo, frontend and backend side by side. Each is independently
runnable and has no imports across the boundary — they talk only through
the HTTP/WebSocket API.

---

## 2. Frontend (Expo / React Native)

### 2.1 Bootstrap

```bash
npm install --global eas-cli
npx create-expo-app <app>
cd <app> && eas init --id <EAS_PROJECT_ID>
```

Then **delete `app.json`** and use:

- **`eas.json`** — build profiles: `development` (simulator, dev client),
  `development-device`, `preview` (internal APK / TestFlight), `production`.
  Every profile sets `APP_ENV` and `EXPO_PUBLIC_API_URL`.
- **`app.config.js`** — dynamic config keyed on `process.env.APP_ENV`:
  app name (`App Dev` / `App Preview` / `App`), bundle id
  (`com.x.app.dev` / `.preview` / base), scheme, icons. Version read from
  `package.json`. `extra.eas.projectId`, `owner`, `updates.url`,
  `runtimeVersion: { policy: "appVersion" }`.

Rules:
- Never hardcode API URLs in code — always `process.env.EXPO_PUBLIC_API_URL`
  with a localhost fallback for dev.
- Different bundle id per environment so dev/preview/prod install side by side.

### 2.2 Folder structure (`src/`)

```
src/
├── app/                  # expo-router routes ONLY (thin — compose features)
│   ├── _layout.tsx       #   fonts + all providers + root Stack
│   ├── (tabs)/           #   tab screens
│   └── <flow>/[param].tsx
├── theme/                # design system source of truth
│   ├── tokens.ts         #   palette, spacing, radius, typography, shadows
│   ├── colors.ts         #   SEMANTIC ColorScheme: light + dark objects
│   ├── ThemeContext.tsx   #   ThemeProvider, useTheme(), useThemeMode()
│   └── index.ts          #   barrel
├── i18n/
│   ├── index.ts          #   i18next init + SUPPORTED_LANGUAGES + device detect
│   ├── LocaleContext.tsx  #   LocaleProvider, useLocale() (persisted)
│   └── locales/          #   en.json, zh.json, ms.json … (keys mirror screens)
├── components/
│   ├── ui/               #   REUSABLE design-system components (see 2.4)
│   ├── icons/            #   SVG icon set (react-native-svg), themed via props
│   └── navigation/       #   TabBar and other chrome
├── features/             # one folder per screen/domain
│   └── <feature>/        #   hooks.ts (data) + presentational components
├── games/ (or modules/)  # one folder per game/module: logic + UI + index
│   ├── types.ts          #   shared contracts (GameDefinition, BoardProps)
│   ├── registry.ts       #   explicit registry — mirrors backend registry
│   └── <key>/            #   logic.ts, <Key>Board.tsx, index.ts, __tests__/
├── context/              # app-wide contexts (SessionContext, …)
├── hooks/                # generic reusable hooks (useOtaUpdates, …)
├── api/                  # client.ts (REST), socket.ts, tokenStorage.ts
└── data/                 # types.ts (domain models), mock.ts (until API wired)
```

Principles:
- **Routes are thin.** Files in `app/` only compose feature components and
  hooks. No business logic, no fetch calls, no styles beyond layout glue.
- **Features own their data hooks.** `features/x/hooks.ts` is the seam:
  screens never import mock data or the API client directly, so swapping
  mock → real API touches one file per feature.
- **Per-module folders** (games here): logic and UI live together, exposed
  through a typed registry. Adding a module = new folder + one registry line.

### 2.3 Theme (mandatory pattern)

- `tokens.ts` holds raw values (palette hexes, spacing scale, radius scale,
  Poppins/whatever type ramp, shadow presets). **No component imports raw
  palette hexes for surfaces/text** — brand-fixed elements (gradient heroes,
  logo art) are the only exception.
- `colors.ts` defines a **semantic** `ColorScheme` interface (background,
  surface, card, border, text, textMuted, primary, success, …) with a
  `lightColors` and `darkColors` object. Dark mode is designed here once,
  free everywhere.
- `ThemeContext` exposes `useTheme()` → `{ colors, spacing, radius,
  typography, shadows, isDark }` and `useThemeMode()` → `light | dark |
  system`, persisted in AsyncStorage.
- Fonts loaded once in root `_layout.tsx` (`@expo-google-fonts/*`), splash
  screen held until ready.

### 2.4 Reusable UI kit (`components/ui/`)

Build these before building screens, from the design's component sheet:

`AppText` (typography variants + semantic colors) · `Screen` (safe-area +
scroll + padding) · `Button` (primary/secondary/tertiary × lg/md/sm,
loading state) · `Card` · `Chip` (selectable pill) · `Toggle` · `StatusPill`
(tinted badges) · `Avatar` (initial + deterministic tint + presence dot +
crown) · `AvatarStack` (+N overflow) · `IconButton` · `SectionHeader` ·
`Skeleton` / `SkeletonListItem` / `SkeletonCard` · `EmptyState` ·
`ErrorState` · `BottomSheetModal` (see 2.5).

Rules:
- Screens **never** restyle these ad-hoc; if a variant is missing, add it
  to the component.
- Every component reads `useTheme()` — zero hardcoded colors.
- `style` props are `StyleProp<ViewStyle>`.
- Accessibility props (`accessibilityRole`, `accessibilityState`) on every
  interactive component.

### 2.5 Bottom sheets — @gorhom/bottom-sheet (standard)

`@gorhom/bottom-sheet` is our bottom-sheet library on every project.
Wrap it once in the UI kit (`components/ui/BottomSheetModal.tsx`) with the
themed background, backdrop, and handle — screens use the wrapper, never
the raw library. Canonical imports:

```tsx
import {
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";
```

Setup: `<BottomSheetModalProvider>` in the root layout (inside
`GestureHandlerRootView`); present/dismiss via a
`useRef<GorhomBottomSheetModal>` ref.

### 2.6 The three UI states (mandatory on every async screen)

Every screen that loads data designs **all three** states — the happy
path alone is not "done":

1. **Loading** — `Skeleton` components mirroring the real layout
   (list rows → `SkeletonListItem`, cards → `SkeletonCard`).
   **Never a bare spinner.**
2. **Empty** — `EmptyState` (emoji + title + optional action) when the
   list is legitimately empty.
3. **Error** — `ErrorState` with a working **retry** button.

Reference: the Games screen (`app/(tabs)/games.tsx`) renders all three
from one TanStack Query hook.

### 2.7 Server state — TanStack Query (standard)

- `@tanstack/react-query` owns **all server data**: fetching, caching,
  retries, refetch-on-focus, optimistic updates. No hand-rolled
  `useEffect` + `useState` fetching, ever.
- One `QueryClient` created in the root layout (`staleTime` ~30s,
  `retry: 2` as baseline).
- Feature hooks wrap `useQuery`/`useMutation` and expose
  `{ data, isLoading, isError, refetch }` to screens — screens never call
  the API client directly.
- React Context is **only** for client state (theme, locale, session) —
  never for server data.

### 2.8 i18n (mandatory pattern)

- `i18next` + `react-i18next` + `expo-localization` (device detect) +
  AsyncStorage persistence via `LocaleProvider`.
- **No user-visible string literals in components.** Everything goes
  through `t("scope.key")`; interpolation for counts
  (`t("lobby.playersCount", { current, max })`).
- Locale files mirror screen structure (`home.*`, `games.*`, `common.*`,
  `updates.*`). Add all supported languages when adding a key — never let
  languages drift.
- Language switcher lives in Profile/Settings alongside the theme switcher.

### 2.9 Contexts & hooks

- Provider order in root `_layout.tsx`:
  `GestureHandlerRootView → SafeAreaProvider → QueryClientProvider →
  ThemeProvider → LocaleProvider → SessionProvider →
  BottomSheetModalProvider → navigation`.
- Every context ships a `useX()` hook that **throws** outside its provider.
- Contexts hold cross-cutting client state only; server state lives in
  TanStack Query hooks (2.7).

### 2.10 Security — auth, token & secret storage

Auth pattern (reference: Boardly's SessionContext + api/client.ts):
- Backend issues **JWT access (short) + refresh (long) tokens**;
  identity on every endpoint comes from the Bearer token — never from
  a client-sent username/userId in the body.
- `SessionProvider` owns the lifecycle: bootstrap from stored tokens →
  `/auth/me`, `login`/`register`/`logout` methods, and a
  `status: loading | signedOut | signedIn` that drives
  **`Stack.Protected` route guards** in the root layout.
- The API client auto-refreshes once on 401 (rotating both tokens) and
  signs the user out if the refresh fails.
- Localized error mapping: server error `code`s map to `errors.*` i18n
  keys with the server message as fallback.

- Auth tokens (access/refresh) go in **`expo-secure-store`**
  (Keychain/Keystore) via a single `api/tokenStorage.ts` module.
  **Never in AsyncStorage** — AsyncStorage is plain text on disk and is
  only for non-sensitive preferences (theme, language).
- No secrets in the JS bundle: anything in `EXPO_PUBLIC_*` ships to every
  device — only non-secret config belongs there. Real secrets live on the
  backend or in EAS secrets.
- Production API traffic is HTTPS only; `NSAllowsLocalNetworking` is
  enabled for the development environment only.

### 2.11 Lists & performance

- Any list that can grow (friends, catalogue, chat, history) uses
  **`FlatList`** (upgrade to `@shopify/flash-list` for very long/complex
  lists) — `.map()` inside a ScrollView is only acceptable for small,
  fixed collections (a settings group, a 2-card row).
- Screen pattern: `Screen scroll={false}` + `FlatList` with
  `ListHeaderComponent` (title/filters), `ListEmptyComponent`
  (skeleton / empty / error per 2.6), `ItemSeparatorComponent`.
- `React.memo` list rows once they re-render measurably; stable
  `keyExtractor` always.
- Remote images use `expo-image` (built-in caching), never `Image` from
  react-native.

### 2.12 OTA updates (EAS Update) — must-have flow

Every app ships the same update loop (reference:
`hooks/useOtaUpdates.ts`):

1. On launch **and** on returning to foreground, check for an update
   (`Updates.checkForUpdateAsync`) — skipped in dev.
2. Download silently (`Updates.fetchUpdateAsync`).
3. **Prompt the user to restart** (localized alert: Restart / Later) —
   never force-reload mid-session. Restart applies via
   `Updates.reloadAsync()`.

Discipline: JS-only changes ship OTA on the matching channel
(`development` / `preview` / `production` in `eas.json`); anything native
(new package with native code, config change) requires a store build —
`runtimeVersion: appVersion` enforces this. Always verify an update on
the preview channel before publishing to production.

### 2.13 Push notifications

- Standard stack: `expo-notifications` + FCM (Android) / APNs (iOS),
  configured per environment in `app.config.js`
  (`google-services.json` per bundle id — see the Net7 reference config).
- Pattern: a `usePushNotifications` hook requests permission at a
  sensible moment (not on first launch), registers the Expo push token
  with the backend, and handles foreground notifications + tap routing
  (deep link into the relevant screen, e.g. a lobby invite).
- Backend stores tokens per user and sends via Expo's push API.
- Android 13+ needs `android.permission.POST_NOTIFICATIONS`.

### 2.13a Game feel — haptics (day-one for game-like apps)

- `expo-haptics`, wrapped once in `utils/haptics.ts`
  (`tapHaptic` light / `moveHaptic` medium / `successHaptic` /
  `errorHaptic`), no-op on web, failures swallowed.
- Wired **inside the UI kit** (Button, Chip, Toggle, IconButton, TabBar)
  so screens get it for free; game boards use `moveHaptic`, game-start
  and wins use `successHaptic`. Screens never call expo-haptics directly.

### 2.13b Press feedback rule

Press states must survive both themes and brand-colored surfaces:
**opacity-based feedback by default** — a theme-colored pressed
*background* looks like a black blob on a brand surface in dark mode.
Background-color press states are only for elements that always sit on
a known surface (chips on cards).

### 2.13c Confirmations & invite links

- Destructive/irreversible actions (leave table, close room, forfeit)
  use the kit's `ConfirmSheet` (bottom sheet: title, message,
  destructive confirm, cancel) — never `Alert.alert`.
- Invite links: share both the human-readable code **and** a deep link
  built with `Linking.createURL("join/<code>")` (resolves to the right
  scheme per environment). A `join/[code]` route shows a preview and
  handles every conflict: already a member → open; busy at another
  table → leave-and-join (with forfeit warning) or go back; full /
  started / not found → clear error states. Production links need
  universal links (https domain + AASA/assetlinks) — plan the domain.

### 2.14 Accessibility & responsive layout

Accessibility (works for every *user*):
- Touch targets ≥ 44pt — small visual icons get `hitSlop` (IconButton
  does this by default).
- `accessibilityRole` / `accessibilityState` / `accessibilityLabel` on
  all interactive components (built into the UI kit).
- Don't rely on color alone for state (pair dots/labels with text).
- Decide font-scaling behavior consciously: body text should respect the
  system setting; pinned UI (tab bar) may cap it via `maxFontSizeMultiplier`.

Responsive layout (works on every *screen size*):
- Flex + percentage/`gap` layouts; no hardcoded screen-width constants.
- Safe areas via `Screen` / `useSafeAreaInsets` — never magic paddings.
- Test the smallest target device (SE-class) and a tablet-ish width;
  long translations (ZH vs MS) must not break layouts — that's part of
  the i18n smoke test.

### 2.15 Testing (day-one)

- **Unit tests for all pure logic** — game engines (`games/*/logic.ts`),
  utils, reducers. Highest value per line; no mocks needed.
- **Component tests** for the UI kit with
  `@testing-library/react-native`: render inside real providers
  (ThemeProvider), assert behavior (press, disabled, loading) — not style
  snapshots. NOTE: RNTL v14 `render`/`fireEvent` are async — `await` them.
- Setup: `jest-expo` preset + `jest.setup.js` (official AsyncStorage
  mock), `npm test` script. Reference: `src/games/tictactoe/__tests__/`
  and `src/components/ui/__tests__/Button.test.tsx`.
- Backend: `pytest` — engine tests are pure (`backend/tests/`), route
  tests use a Flask test client + SQLite/temp DB. `requirements-dev.txt`
  pins test deps.
- Rule: a new game/module is not done until its logic tests exist on
  **both** sides.

### 2.16 Quality gates

- TypeScript `strict`; `npx tsc --noEmit`, `npx expo lint`, and
  `npm test` must all be clean before commit.
- Path alias `@/*` → `./src/*`; no `../../..` imports.
- Barrel exports (`index.ts`) for `ui/`, `theme/`, `icons/`.

---

## 3. Backend (Flask + PostgreSQL)

```
backend/
├── app/
│   ├── __init__.py       # create_app() factory
│   ├── config.py         # env-driven Config
│   ├── extensions.py     # db, migrate, cors, socketio singletons
│   ├── models/           # SQLAlchemy models
│   ├── routes/           # blueprints (thin — validate, call domain, emit)
│   ├── sockets/          # Socket.IO events
│   └── games/ (modules/) # one folder per module + base.py contract + registry
├── migrations/           # Alembic via Flask-Migrate
├── tests/                # pytest (engine tests are pure — no app fixture)
├── docker-compose.yml    # api + postgres (project-specific host ports)
├── Dockerfile
├── requirements.txt      # pinned versions
├── requirements-dev.txt  # -r requirements.txt + pytest
└── .env.example
```

- App-factory pattern; extensions initialized in `create_app`.
- **Primary keys are UUIDs, never auto-increment integers** — decided at
  table one, because switching later means redoing the schema. Sequential
  ids leak business information (row counts, growth rate) and make every
  resource enumerable (`/rooms/1`, `/rooms/2`, …). SQLAlchemy:
  `db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)`
  (from `sqlalchemy.dialects.postgresql`); Flask routes use the `<uuid:…>`
  converter; ids serialize as strings in every payload (`str(self.id)` in
  `to_dict`, and explicitly in socket emits — Socket.IO's JSON encoder
  does not handle UUID objects). Frontend types: ids are `string`.
  Human-facing lookups (invite codes) stay short random codes — UUIDs are
  identifiers, not something people type.
- Module state stored as JSONB; engines are **stateless** classes
  implementing a shared `Base` contract, registered in an explicit dict
  that mirrors the frontend registry.
- Docker Compose runs db + api with a healthcheck gate; pick unique host
  ports per project (Boardly: db **5439**, api **5005**).
- **Always set the Compose project `name:` explicitly** (e.g.
  `name: boardly` at the top of docker-compose.yml). Without it, Compose
  uses the folder name — and every project whose folder is `backend/`
  collides under the same project name, so a `docker compose down -v`
  in one project can delete another project's containers and volumes.
- Migrations: `flask db migrate -m "..."` + `flask db upgrade` inside the
  container. Never edit applied migrations.
- **Production**: gunicorn + eventlet worker (required for
  Flask-SocketIO), CORS allowlist (not `*`), rate limiting on
  auth/join endpoints, TLS at the proxy, managed/encrypted Postgres with
  automated backups. The dev server (`wsgi.py`) is development-only.

### 3.1 API conventions

- Version the prefix: **`/api/v1/...`** from day one.
- One error envelope everywhere: `{ "error": { "code": "...",
  "message": "..." } }` — clients switch on `code`, display `message`.
- Pagination convention decided up front (e.g. `?cursor=` + `nextCursor`
  in responses) and used by every list endpoint.
- Client side: request timeouts + bounded retries in `api/client.ts`;
  TanStack Query handles retry/backoff above it.
- Realtime events named consistently (`room_updated`, `game_started`,
  `game_updated`) and documented in the README.

---

## 4. Design → code workflow

1. Import/read the design (Claude Design project, Figma, …).
2. Extract **tokens first**: palette, type ramp, radii, shadows → `theme/`.
3. Build the **UI kit** from the design's component sheet — including the
   skeleton/empty/error trio, which the design usually omits.
4. Draw custom **SVG icons** matching the design's stroke style
   (react-native-svg) — no icon-font grab-bag mixing styles.
5. Compose screens from kit + feature components; verify against the
   design side by side (light **and** dark, at least 2 languages, all
   three UI states).

---

## 5. New-project checklist (all day-one)

- [ ] Repo layout (§1); backend scaffold (§3) with unique ports
- [ ] UUID primary keys in every table from the first migration (§3)
- [ ] Expo app created, `app.json` → `eas.json` + `app.config.js` (§2.1)
- [ ] `src/` skeleton (§2.2) — delete template demo files
- [ ] Theme: tokens + semantic light/dark + provider (§2.3)
- [ ] i18n: locales + provider + device detect (§2.8)
- [ ] UI kit (§2.4) incl. Skeleton / EmptyState / ErrorState / BottomSheetModal
- [ ] Providers wired in root layout in the standard order (§2.9)
- [ ] TanStack Query client + feature hooks pattern (§2.7)
- [ ] Three UI states on every async screen (§2.6)
- [ ] FlatList for growable lists (§2.11)
- [ ] `expo-secure-store` token storage module (§2.10)
- [ ] OTA update hook: check → download → prompt restart (§2.12)
- [ ] Push notification hook + backend token registration (§2.13)
- [ ] Accessibility + responsive rules applied (§2.14)
- [ ] Jest + RNTL set up with reference tests; backend pytest (§2.15)
- [ ] API versioned `/api/v1` + error envelope + pagination (§3.1)
- [ ] Module/game registries on both sides — with logic tests
- [ ] `tsc` + lint + tests clean; light/dark + all languages smoke-tested
- [ ] README: run instructions, ports, how to add a module

---

## 6. Dependency baseline (frontend)

| Purpose    | Package |
|------------|---------|
| Navigation | `expo-router` (custom TabBar via `expo-router/js-tabs`) |
| Server state | `@tanstack/react-query` |
| Preferences | `@react-native-async-storage/async-storage` |
| Secure storage | `expo-secure-store` (tokens — never AsyncStorage) |
| Bottom sheets | `@gorhom/bottom-sheet` |
| OTA updates | `expo-updates` |
| Push | `expo-notifications` |
| i18n       | `i18next`, `react-i18next`, `expo-localization` |
| Fonts      | `expo-font`, `@expo-google-fonts/<family>` |
| Icons      | `react-native-svg` |
| Images     | `expo-image` |
| Gradients  | `expo-linear-gradient` |
| Clipboard  | `expo-clipboard` |
| Realtime   | `socket.io-client` |
| Testing    | `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest` |

Install Expo-managed packages with `npx expo install` (never bare
`npm install`) so versions match the SDK.
