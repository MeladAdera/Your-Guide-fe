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
