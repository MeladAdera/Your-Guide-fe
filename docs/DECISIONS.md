# Frontend decisions

Dated, so a later reader knows when and why. The backend's own decisions live in its repo; the API contract is in [handoff.md](./handoff.md).

## 2026-10-22 · Kickoff

- **Standalone project.** This repo holds the web app only. The backend stays in its own repo; the frontend declares the API types it uses itself (`src/lib/api/types.ts`).
- **Stack.** Next.js (App Router) + TypeScript, Tailwind CSS 4, shadcn/ui on Radix, next-intl (English and Arabic, no locale in the URL), TanStack Query, react-hook-form + zod, Recharts for the progress page. pnpm, Node 24.
- **Vertical slices in the arc's order.** Foundation → onboarding → first goal → tasks and steps → focus session → I'm struggling → progress. Each slice works against the real API before the next starts.
- **Responsive from day one.** Phone width is designed first and widened to laptop.
- **Tests.** Vitest + Testing Library for logic and forms; Playwright for the main arc against the local API.
- **Hosting.** Vercel. `/api/*` is rewritten to `API_URL`; the API runs with `TRUST_PROXY`.

## 2026-10-22 · Colour: option E, "ink and cobalt"

Five directions were drawn and checked (contrast, colour-vision simulation, chart validation). The owner chose E:

- True-grey neutrals, near-black ink for text, **one cobalt blue** for every primary action, link, active state and focus ring.
- **The I'm struggling button is solid ink** (black on light, white on dark). It gets its identity from luminance contrast, not hue, so it stands out without the arousal a saturated accent brings.
- The hero number ("struggled and continued") is ink, carried by size.
- Green appears only on done states; amber only as an icon; **red only on destructive actions and validation errors**. Red never sits near the timer or the struggle button (Elliot et al., 2007).
- Chart marks: cobalt, ink, grey. Each measure has its own chart and axis; minutes and counts never share one.
- Light is the default (dark text on light reads more accurately); dark is a choice and is deep grey, not black.

Tokens are in `src/app/globals.css`. If the cobalt feels loud in use, pull its saturation toward steel blue (#405D8A) without changing anything else.

## 2026-10-22 · Theme and language mechanics

- **Theme**: `next-themes` with a class on `<html>`; three states (system, light, dark). A dimmed variant of the session screen is planned for the session slice.
- **Language**: the `NEXT_LOCALE` cookie decides the request's language; it is set client-side on switch and from the account after login. `<html lang dir>` follows it. User and AI text always renders with `dir="auto"`.
- **Message keys**: API error codes contain dots, which next-intl reads as nesting, so `goal.archived` lives at `errors.goal.archived`.

## 2026-10-22 · Auth gate

- The `(app)` layout asks `GET /api/auth/me` server-side and redirects to `/login` on 401. Server calls go to `API_URL` directly and forward the incoming cookie (`src/lib/api/server.ts`).
- In the browser, any 401 from any route dispatches a window event; a listener sends the person to `/login?next=<path>`.
- `/` is the start-up router from handoff §7: me → onboarding → goals → active session → home.

## 2026-10-27 · Sign-in pages and device data

Details and reasons in [features/00-auth.md](./features/00-auth.md). App-wide parts:

- **The working method is page by page**: ideas first, the owner picks; then design options, the owner picks; then the build. The next page starts from what the previous one settled.
- **Sign-in frame**: form on the start side, a static picture (a winding track, cobalt ball) on the end side, a band of it on phones. Static images on purpose: the owner chose no animation and no 3D. Mirrored in Arabic.
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
