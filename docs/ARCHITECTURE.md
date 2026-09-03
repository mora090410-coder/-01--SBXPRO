# GridOne Architecture

One app. One design system. This file describes what is in the repository today.

## Topology

- **Frontend:** React 19 + TypeScript + Vite, built to `dist/` and served as a SPA by **Cloudflare Pages** (`wrangler.toml`, `pages_build_output_dir = "dist"`).
- **API:** **Cloudflare Pages Functions** under `functions/api/`. One file, one edge handler.
- **Scheduled work:** two **Cloudflare Workers** in `workers/`, each on a one-minute cron:
  - `workers/score-refresh-scheduler.ts` (`wrangler.score-scheduler.toml`) calls `POST /api/scores/refresh`.
  - `workers/notification-retry-scheduler.ts` (`wrangler.retry-scheduler.toml`) calls `POST /api/notifications/retry`.
  Both authenticate with `CRON_SECRET`; the endpoints do the work, the workers only wake them.
- **Data:** Supabase Postgres with Row Level Security. Schema and policies live in `supabase/migrations/` (`000`–`025`). The browser client is `services/supabase.ts`.
- **Payments:** Stripe Checkout — session creation and webhook activation in `functions/api/stripe/`.
- **NFL schedule and live score:** ESPN, server-side only, through `functions/_lib/espnNfl.ts`. `functions/api/nfl/games.ts` lists scheduled games; `functions/api/scores/refresh.ts` fetches the live scoreboard **once per cron tick for the whole slate** and promotes canonical snapshots.
- **Paper-board import:** Gemini OCR runs only inside `functions/api/boards/scan.ts`. It never runs in the browser.
- **Email:** Resend, server-side, from the notification endpoints.

## Routes

`App.tsx` owns every route with `react-router-dom` v7.

| Path | Element |
|---|---|
| `/` | `src/features/homepage/Homepage` (lazy). With `?poolId=` it renders `BoardView` instead. |
| `/demo` | `BoardView` in demo mode |
| `/b/:shareCode` | `BoardView` — the public viewer link |
| `/boards/:boardId` | `BoardView` behind `RequireAuth` — the organizer workspace |
| `/login` | `pages/Login` |
| `/dashboard` | `pages/Dashboard` behind `RequireAuth` |
| `/create` | `pages/CreateContest` behind `RequireAuth` |
| `/paid` | `pages/Paid` — checkout return |
| `/articles`, `/articles/:slug` (12 guides) | `pages/*` (lazy) |
| `/privacy`, `/terms` | `pages/Privacy`, `pages/Terms` |
| `*` | `pages/NotFound` |

## Frontend structure

### `src/design/` — the design system

- `tokens.css` is the single source of token truth: a fixed palette, plus semantic tokens that flip on `[data-base="dark"]` (viewer, homepage, site) and `[data-base="cream"]` (organizer).
- `src/index.css` re-exposes those variables to Tailwind v4 through `@theme inline`, and holds the deliberately unlayered cascade guards (button fill re-assertion, focus rule, dialog and organizer-header elevation, square board corners).
- `Base.tsx` sets `data-base` and the page ground.
- `primitives/`: `Glass`, `Island`, `Sheet`, `Capsule`, `Ring`, `Numeral`, `Eyebrow`, `Spotlight`, and `motion.ts` (durations, easings, `useReducedMotion()`). Everything else composes these.
- Mapping reference: `docs/DESIGN_TOKENS.md`. Normative meaning: root `DESIGN.md`.

### `src/features/` — the shipped surfaces

- `homepage/` — `Homepage.tsx`, `sections/` (`Hero`, `ScoreSection`, `OrganizerSection`, `ParentMoments`, `PriceAndClose`, `Footer`), `renders/` (the phone- and board-shaped product renders), `artifacts/`, `demoData.ts`, and `pricing.ts` — the one place the price ladder is written.
- `viewer/` — composed by `shell/ViewerShell.tsx`: `shell/ViewerIsland`, `score/ScoreInstrument`, `identity/FindSquaresEntry`, `personal/YourSquaresSummary`, `scenarios/ScenarioDisclosure`, `notifications/WinnerEmailDisclosure`, `details/BoardDetailsDisclosure`, `board/ViewerBoardGrid`. Pure logic sits beside each: `viewerScoreModel`, `viewerIdentityModel`, `scenarioModel`, `milestoneViewModel`, `boardGridModel`.
- `organizer/` — `workspace/OrganizerWorkspace.tsx` composes `WorkspaceHeader`, `OrganizerIsland`, `BoardEditor`, `RangeAssignBar`, `SquareSheet`, `DrawControl`, `ReconcileCard`, `PayoutRulesCard`, `BoardToolsCard`, the `PreviewSheet` → `PublishSheet` → `PublishedSheet` sequence, `UpgradeSheet`, and `gameday/` (`SharePanel`, `ScoreAuthorityCard`, `CorrectionsCard`, `DeliveryIssuesCard`, `FinalRecordCard`). Behavior lives in `lifecycle/organizerLifecycle.ts`, `draft/draftSaveModel.ts`, `game-day/manualScoringModel.ts`, and the workspace's own `useWorkspaceDraft`, `selection`, `secureDraw`, `publishBoard`, `applyScheduledGame`, `entryMetaService`, `renamePublishedSquare`.
- `site/` — the chrome shared by every non-product route: `SiteHeader`, `SiteFooter`, `SitePage`, `ArticleShell`.
- `instrumentation/` — `eventSchema.ts` (the closed event union) and `clientEvents.ts`.

### Shared app code

- `pages/` — route-level orchestration only.
- `components/` — `BoardView` (the viewer/organizer host), auth guards, error boundary, loading.
- `hooks/` — `usePoolData` (board read/write), `useContestEntries` (participants and assignments), `useLiveScoring` (score polling and freshness), `useBoardActions` (publish/join), `useAuth`, `useDialogFocus`.
- `services/` — `supabase.ts`, `scoreService.ts`, `stripe.ts`, `boardImportService.ts`. All external SDK/API calls live here.
- `utils/` — pure logic with unit tests: winner logic, retry/backoff, player-name matching, board image.
- `context/AuthContext` — Supabase session.

## SEO prerender

`seo/publicRouteMetadata.ts` declares the metadata for every public route. `build/staticSeoPages.ts` runs as a Vite `closeBundle` plugin and writes a static HTML file per route into `dist/`, injecting the title, canonical URL, robots directive, Open Graph tags, and JSON-LD between the `gridone:seo` markers. `tests/staticSeo.test.ts` keeps the route table, `public/sitemap.xml`, and `App.tsx` in agreement.

## Auth

1. The organizer authenticates with Supabase Auth.
2. The JWT lives in the browser session.
3. The browser sends `Authorization: Bearer <token>` to Pages Functions.
4. Functions resolve identity with `supabase.auth.getUser(token)`.
5. RLS decides everything else — client and server alike.
6. A signed-out visitor who starts a board is sent to `/login`; the draft is held in `sessionStorage` and adopted after sign-in.

Viewers never authenticate. A published board is readable through its share code and nothing more.

## API surface

```
functions/api/health.ts
functions/api/pools.ts                                  create
functions/api/pools/[id].ts                             read / update
functions/api/pools/[id]/publish.ts
functions/api/pools/[id]/score.ts                       viewer score projection
functions/api/pools/[id]/score/manual.ts                organizer manual authority
functions/api/pools/[id]/open-squares.ts
functions/api/pools/[id]/milestones/[milestone]/correct.ts
functions/api/pools/activate.ts
functions/api/scores/refresh.ts                         cron-driven slate refresh
functions/api/nfl/games.ts                              scheduled-game picker
functions/api/boards/scan.ts                            paper-board OCR
functions/api/boards/[shareCode]/subscribe.ts           winner-email opt-in
functions/api/notifications/verify.ts
functions/api/notifications/unsubscribe.ts
functions/api/notifications/retry.ts                    cron-driven delivery retry
functions/api/billing/status.ts
functions/api/stripe/create-checkout-session.ts
functions/api/stripe/webhook.ts
```

## Security boundaries

- Browser and server are separate security boundaries. Service-role, Stripe secret, Gemini, email, and cron secrets exist only in Pages Functions and Workers.
- Every contest table is under RLS; the anon key alone grants nothing an unauthenticated viewer should not see.
- Manual score authority is canonical until the organizer returns to automatic. A late or stale automatic result can never overwrite manual or newer state (`014_score_promotion_ordering.sql`).
- Publication is atomic (`010_atomic_board_publish.sql`); so is manual scoring (`011_atomic_manual_scoring.sql`).
- Network calls that matter use the retry utility in `utils/retry.ts` with explicit non-retry conditions. Schedule failures keep the organizer in the picker with a retry; score failures keep the last accepted snapshot and the manual path open.

## Engineering rules

- Feature-local first: components, hooks, models, and services live next to the surface that uses them. A primitive is promoted to `src/design/primitives/` only when two real features share the behavior.
- No UI logic in API handlers. No SDK side effects outside `services/`. Pure calculations in `*Model.ts` or `utils/`, with unit tests.
- Every new network call declares its retry policy and its non-retry conditions.
- Typed interfaces, not ad hoc object shapes.
