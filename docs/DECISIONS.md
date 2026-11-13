# Frontend decisions

Dated, so a later reader knows when and why. The backend's own decisions live in its repo; the API contract is in [handoff.md](./handoff.md).

## 2026-10-22 · Kickoff

- **Standalone project.** This repo holds the web app only. The backend stays in its own repo; the frontend declares the API types it uses itself (`src/lib/api/types.ts`).
- **Stack.** Next.js (App Router) + TypeScript, Tailwind CSS 4, shadcn/ui on Radix, next-intl (English and Arabic, no locale in the URL), TanStack Query, react-hook-form + zod, Recharts for the progress page. pnpm, Node 24.
- **Vertical slices in the arc's order.** Foundation → onboarding → first goal → tasks and steps → focus session → I'm struggling → progress. Each slice works against the real API before the next starts.
- **Responsive from day one.** Phone width is designed first and widened to laptop.
- **Tests.** Vitest + Testing Library for logic and forms; Playwright for the main arc against the local API.
- **Hosting.** Vercel. `/api/*` is rewritten to `API_URL`; the API runs with `TRUST_PROXY`.

## 2026-10-22 · Theme and language mechanics

- **Theme**: `next-themes` with a class on `<html>`; three states (system, light, dark). A dimmed variant of the session screen is planned for the session slice.
- **Language**: the `NEXT_LOCALE` cookie decides the request's language; it is set client-side on switch and from the account after login. `<html lang dir>` follows it. User and AI text always renders with `dir="auto"`.
- **Message keys**: API error codes contain dots, which next-intl reads as nesting, so `goal.archived` lives at `errors.goal.archived`.

## 2026-10-22 · Auth gate

- The `(app)` layout asks `GET /api/auth/me` server-side and redirects to `/sign-in` on 401. Server calls go to `API_URL` directly and forward the incoming cookie (`src/lib/api/server.ts`).
- In the browser, any 401 from any route dispatches a window event; a listener sends the person to `/sign-in?next=<path>&reason=expired`.
- `/` is the start-up router from handoff §7: me → onboarding → goals → active session → home.

## 2026-11-13 · Fonts on our own server; server data and shared query keys

- **Fonts are self-hosted** (`src/app/fonts/`, `next/font/local`, OFL files from github.com/google/fonts cut to the subsets we used): `next/font/google` broke the dev server and builds whenever Google answered with its `l/font?kit=` URL style, which Turbopack cannot resolve. Builds no longer reach Google. Not taken: deleting `.next` and hoping Google answers differently.
- **Server data handed to a component that shares a query key goes in as `placeholderData`, not `initialData`**, when other components on the page read the same key. Seeding the shared cache during the server render changes what those components render on the server but not in the browser, a hydration mismatch (found on Home with the week card, `docs/features/04-home.md` §6.6). `initialData` stays right where one component owns the key, as on the goals and goal pages.
- **Pages that write nothing can be Server Components end to end** (Home): rendered fresh on each visit, no client queries to keep in step.

## 2026-11-10 · Build every page now, review later; app-wide pieces from features 1–3

- **Working method changed by the owner:** every remaining page is built and committed in the sign-in look without a design round; the owner reviews and adjusts each page afterwards. Each feature doc ends with "Design choices made without the owner" for that review. (Until then: ideas → owner's pick → design options → owner's pick → build, and no visual commit before the owner had seen it.)
- **Drafts of typed answers live on the device** (`src/lib/drafts.ts`, `src/lib/use-draft.ts`, keys `yg:draft:<screen>`), restored only into fields the server left empty and dropped on save. Not taken: autosave to the API, because each `PUT` replaces a whole screen.
- **A field error with no place on the screen also shows the form alert** (`src/lib/api/field-errors.ts`), so Save never seems to do nothing.
- **The AI's daily limit is remembered per device and per day** (`src/lib/ai-limit.ts`, `yg:ai-limit`, the account's own date): after `ai.daily_limit` every AI button rests until the person's next day. The API stays the judge; this only spares a refused call.
- **Optimistic updates only where a wait would be felt:** the step checkbox and moving a step. Adds, deletes and archiving wait for the API; a wrong guess there would be more confusing than a short wait.
- **Dates in the account's time zone** (`timeZone: user.timezone`) whenever a date is formatted, so the server render and the browser agree.
- **End-to-end tests create accounts through the API** (`e2e/helpers.ts`), filling onboarding when a test starts later in the arc, and wait out the API's 5 sign-ups a minute per IP. A full run takes about five minutes.

## 2026-10-28 · The app frame and the week rhythm

- **Frame: the sign-in row above one card.** Of three drawn frames (the sign-in row, a side rail, the card with a permanent mint tile) the owner chose the row: signing in then feels like entering the same place. Not taken: the side rail, more room for sections but less like the sign-in screen.
- **I'm struggling is always one tap away:** at the end of the row on a laptop, a round ink button above the bottom bar on a phone. Not taken: a floating button on every size (covers content, looks like a chat widget) or a fifth nav item (looks like just another page).
- **The mint tile lives on Home only and shows the week rhythm, not the photo.** The owner compared four contents (your own path, a helper with the goal's why, the week rhythm, a kind word) and chose the rhythm: the headline number is the one the product exists for (handoff §13). Repeating the photo on every page was rejected.
- **An empty week shows a kind line, not 0.** A big zero on day one reads like failing.
- **The tile reads `GET /api/progress?days=7` with the key `['progress', 7]`**, the same key the Progress page will use, so they share one request. On an error the tile shows the empty week: it is encouragement, not a place for an error message.
- **Weekday letters come from the API's `YYYY-MM-DD` string formatted in UTC** (`src/features/progress/week-days.ts`), so the browser's timezone can never shift the day.
- **Shared code stays free of features:** the layout passes the tile into `AppShell` as `homeTile` instead of the shell importing it.

## 2026-10-28 · The sign-in screen is the design reference

The owner approved the sign-in screen (a large rounded card on a sage ground, an inset mint photo tile that glides between sign-in and sign-up) and made it the rule: every page uses the same colours, type and feeling. The reference, with screenshots, tokens, type scale, shapes and motion, is [DESIGN.md](./DESIGN.md). Designs are shown to the owner before they are committed.

## 2026-10-28 · Dark mode stays as derived

Four dark palettes were shown on the real sign-in page (the current one, "deep forest", "moonlit sage", "charcoal and green"). The owner kept the current one: near-black green surfaces, the lighter action green #7FC79A, the picture dimmed with a CSS filter. The tile's edge under the message in dark mode remains an open follow-up.

## 2026-10-28 · Palette "path green" and Figtree

The colours and type of the approved sign-in screen, used across the app (details in [DESIGN.md](./DESIGN.md)).

- **Colours** (tokens in `src/app/globals.css`): foreground #0F3D35 (deep green ink), primary #2F6B47 (every action, link, focus ring), background #F4F6F2 (pale sage), illustration mint #D6EBDC. The owner gave those four; the rest (muted text, borders, accent, states, charts, the whole dark theme) are derived and checked: every text pair 4.5:1 or better, every control edge 3:1, in both themes.
- **Dark mode stays**, with derived greens (primary #7FC79A on #0E1613); the mint illustration is dimmed with a CSS filter in dark mode.
- **Fonts:** Figtree for Latin (closest to the reference's rounded geometric sans), IBM Plex Sans Arabic for Arabic, IBM Plex Mono for small labels.
- **Logo:** `public/images/logo.svg`, the path mark, in the app shell and on the auth screens.
- Rules: one green for every action, the struggle button in deep green ink, red only for errors and deleting.

## 2026-10-27 · Sign-in pages and device data

Details and reasons in [features/00-auth.md](./features/00-auth.md). App-wide parts:

- **The working method is page by page**: ideas first, the owner picks; then design options, the owner picks; then the build. The next page starts from what the previous one settled.
- **Sign-in screens** (updated 2026-10-28): one sliding shell for /sign-in and /sign-up; see features/00-auth.md §9.
- **Everything the app stores in the browser uses the `yg:` prefix** (`src/lib/device-data.ts`), so logging out can remove all of it. Any feature that writes to local or session storage must use that prefix.
- **A rate limit is a pause, not an error**: a calm note and a 60-second countdown on the button.

## 2026-10-27 · State: no global store

Almost everything the app shows belongs to the backend (goals, tasks, steps, sessions, progress). A global client store (Redux, Zustand) would keep a second copy of it that goes stale whenever the server changes. Each kind of state has its own home instead:

| State | Lives in | Why |
| --- | --- | --- |
| Server data | TanStack Query | Caching, no duplicate requests, refresh after changes by key, optimistic updates with rollback (step tick, reorder). |
| Form input | react-hook-form + zod | Inputs are not re-rendered on every keystroke, which matters for the long text areas. One zod schema mirrors the API limits and gives the TypeScript types; server field errors map onto the right input. |
| Theme | next-themes | Applies the theme before first paint (no flash), follows the OS setting, supports a manual choice. |
| Language | `NEXT_LOCALE` cookie | The server needs it to render the right language and direction on the first request. |
| Current page or step | The URL | Refresh, Back and shared links land on the right screen with no restore code. |
| Timer | Derived from the server's `startedAt` | Nothing to store; survives a sleeping tab. |
| Drafts, sound and length preferences | `localStorage` | Device-only and not worth a server round trip. Drafts cannot go to the API because each `PUT` replaces the whole screen. |

Pages fetch on the server first, and a client store does not exist there, so every page would also have to copy data into it on load. Add a small Zustand store only if browser-only state must be shared across pages (for example ambient sound that keeps playing while moving between pages).

## 2026-10-27 · Folder structure: by feature

```
src/
  app/           routes only: page, layout, loading, error files
  features/<f>/  components/, api.ts, schemas.ts, helpers, tests beside the code
  components/ui/ shadcn primitives, never edited by features
  components/shared/  app shell, form field, providers, used by several features
  lib/api/       client, server helper, error codes, response types
  i18n/          locale config and cookie
```

- **One feature, one folder.** Each feature adds components, schemas, API calls and tests; grouped by type they would spread over four or five folders. Grouped by feature, building or fixing one feature means opening one folder, matching the one-spec-one-slice way of working.
- **Thin routes.** A page loads data and renders a component from its feature. Next.js changes its rules for route files between versions, so less code there means less to break.
- **Imports go one way.** Features import from `components/` and `lib/`; shared code never imports from a feature. One feature uses another only through what it exports (the session screen opening the struggling sheet).
- **shadcn stays clean.** Generated files stay alone in `components/ui/`, so updating them is a simple replace.
- **Not taken:** private folders such as `_components` beside each route, because several pieces appear on more than one route (the goal form, the struggling sheet) and would have no clear home.
