# Roadmap and working method

How we build Your Guide's web app feature by feature, page by page. For each feature we agree how the page looks, how it talks to the API, build it in small commits, verify it against the real backend, and write its doc in `docs/features/`. The API contract is [handoff.md](./handoff.md); decisions already taken are in [DECISIONS.md](./DECISIONS.md).

## Where we are

Done (foundation, 9 commits on `main`):

- Project, tooling, tests: Next.js 16, Tailwind 4, shadcn/ui (Radix, RTL), Vitest, Playwright.
- Design tokens for light and dark (the path green palette from the approved sign-in screen, see `DESIGN.md`), Figtree and IBM Plex Sans Arabic, `/styleguide`.
- English and Arabic with next-intl, cookie-based locale, `lang` and `dir` on the document.
- API client with error codes translated by code, server-side helper, all response types.
- Register, login, logout, auth gate, start-up routing (`/`), proxy for the return path.
- App shell (top nav on laptop, bottom bar on phone), settings (language, theme, logout).
- Placeholder pages for everything that comes next, so navigation never 404s.

Sign-in pages done (feature 0, `docs/features/00-auth.md`), checked against the local API on 2026-10-27. The app frame and Home's week rhythm tile done on 2026-10-28 (`DESIGN.md` §9). The landing page is paused until the owner has a direction.

## The loop for every feature

1. **Page spec (before code).** I write `docs/features/NN-name.md` from the template: the page's job, what is on it, the layout at phone and laptop width, every state (empty, loading, error, success), the API calls and which error codes the page handles, and the decisions to settle. You read it, we adjust, you say go.
2. **Build in steps.** Each step is a commit: skeleton and layout → API wiring → states and errors → tests. Pushed to `main` as it lands.
3. **Verify against the API.** Run the flow in the browser against `localhost:3001` in English and Arabic, on a phone-width window and a laptop one. The feature's Playwright test covers the main path.
4. **Document what was decided.** The feature doc gets a "Decisions" section: anything technical, performance-related or UX-related we chose, with the reason. If a decision applies to the whole app, it also goes into `DECISIONS.md`.

Definition of done for a feature: works against the API in both languages at both widths, every state in the spec is handled, the Playwright path passes, the doc is complete, and the commits are on `main`.

## Feature order

The order follows the product arc, because each feature needs the one before it to produce data:

who am I → where am I now → what matters → where do I want to go → why → what is stopping me → what should I do next

| # | Feature | Pages | Needs | Size |
| --- | --- | --- | --- | --- |
| 1 | Onboarding wizard | `/onboarding/basics` … `/onboarding/values` | foundation | L |
| 2 | First goal and goals list | `/onboarding/goal`, `/goals` | 1 | M |
| 3 | Goal detail: tasks and steps | `/goals/[id]` | 2 | L |
| 4 | Home | `/home` | 3 | M |
| 5 | Focus session | `/session` (start, timer, review) | 3 | L |
| 6 | I'm struggling | `/struggling` plus the follow-up | 5 | M |
| 7 | Progress | `/progress` | 5 | M |
| 8 | Profile editing and polish | `/settings/profile`, empty states, Arabic review | 1–7 | M |
| 9 | Hardening and deploy | e2e of the whole arc, performance pass, Vercel | 8 | M |

Size: S is a session, M is two or three, L is four or more.

---

### 1 · Onboarding wizard

**Job.** Seven short screens about the person, saved one at a time, resumable, never diagnosing.

**Pages.** One route per screen: `basics`, `situation`, `achievements`, `patterns`, `self-view`, `confidence`, `values`. The URL is the step, so refresh and back work.

**What is on each screen.**
- A quiet header: "Step 3 of 7", the screen's name, one line that says why the app asks (frontend copy).
- The questions, in the handoff's wording. Required ones first, optional ones marked.
- Long text areas with `dir="auto"` and a soft character count near the limit (1000; 3000 for "who I am"; 300 for a value note).
- Screen 1: tap choices (employment status required; age range, education, years of experience, country optional; occupation as short text). Skippable.
- Screen 6: eight statements, each a row of five options from "strongly disagree" to "strongly agree". No score, no total, no label, ever.
- Screen 7: pick 2 to 5 values as toggle chips, an optional note per picked value, then the three questions.
- Footer: Back, and Save and continue. Saving is the only way forward; nothing autosaves to the API.

**Layout.** Phone: one column, questions stacked, footer buttons full width, sticky at the bottom. Laptop: the same column centred at about 640px; no second column, the wizard should feel like a conversation, not a form.

**API.** `GET /api/profile/onboarding` to find where to start and which screens are done. `GET /api/profile/sections/<screen>` to prefill (404 `profile.screen_not_saved` means empty). `PUT /api/profile/sections/<screen>` with every field of the screen. Field errors from `validation.failed` land under the right input.

**Decisions to settle.**
- Keep an unsaved draft of the current screen in `localStorage` so a closed tab does not lose a long answer? (Proposal: yes, per screen, cleared on save.)
- Can the person jump between screens from a step indicator, or only Back/Next? (Proposal: Back/Next only during the first pass; free jumping later from the profile page.)
- How the "why we ask" line is worded per screen in both languages. You review the Arabic.

### 2 · First goal and goals list

**Job.** Write the first goal after the person knows what matters to them; later, manage goals.

**Pages.** `/onboarding/goal` (the wizard's last step) and `/goals` (two tabs: active, archived).

**What is on it.**
- The goal form in WOOP order: wish (title), why it matters, obstacle (optional), first sign you are moving (optional). One plain line under each field on why it is asked.
- Goals list: cards with title, why, a status line (number of tasks, last worked), and an overflow menu: edit, archive or delete, unarchive.
- Delete tries `DELETE`; on `goal.has_work_history` the dialog switches to offering Archive.
- Archived goals render read-only with an Unarchive button.

**Layout.** Phone: list of full-width cards, form as one column. Laptop: list in a single column of about 720px; the form opens in a dialog from the list and as a page in onboarding.

**API.** `POST /api/goals` (409 `goal.onboarding_required` with `missing` sends the person back to the first missing screen), `GET /api/goals`, `GET /api/goals?archived=true`, `PATCH`, `DELETE`, `archive`, `unarchive`.

**Decisions to settle.**
- Goal form as a dialog on the list or always a page? (Proposal: page in onboarding, dialog on the list.)
- Query keys and invalidation for goals, and whether archive/unarchive is optimistic.

### 3 · Goal detail: tasks and steps

**Job.** Break a goal into tasks and steps small enough for one session; the model can suggest steps; the person keeps what they want.

**Page.** `/goals/[id]`: the goal's title and why at the top, then tasks, each expanding to its steps.

**What is on it.**
- Task rows with the derived status chip (to do, in progress, done), rename inline, delete with the has-work-history explanation.
- Step rows: checkbox, title, drag handle; ticking a step gives a quiet acknowledgement; ticking the last one finishes the task.
- Add step at the end of each task; add task at the end of the list.
- "Break into steps": calls the breakdown, shows 3 to 7 suggested titles as editable, checkable rows with a spinner up to 45 seconds and a cancel; the kept ones are created one by one in order. `ai.daily_limit` disables both AI buttons until the next day; `ai.unavailable` keeps the suggestions screen open to retry.
- A Start session button on each not-done step.

**Layout.** Phone: tasks as a stacked list, steps indented under an expanded task, drag-and-drop with a handle and long press. Laptop: same list at about 760px; no side panel.

**API.** Tasks and steps routes from handoff §10, `PUT …/steps/order` on drop with every step id, `POST /api/tasks/:id/breakdown`. Refresh the task after any step change so the status is right.

**Decisions to settle.**
- Drag-and-drop library (proposal: `@dnd-kit`) and keyboard reordering.
- Optimistic updates for the checkbox and reorder, with rollback on `step.order_mismatch`.
- Whether the goal page loads tasks and steps in one go or steps lazily per task.

### 4 · Home

**Job.** Answer "what should I do next" in one glance and surface anything owed.

**Page.** `/home`.

**What is on it.**
- If a session is open: a banner that takes you to the timer, or to the review if it was stopped. This comes before everything else.
- Next step: one card with the goal and task names, the step title, Start session, and the ink I'm struggling button.
- A short list of active goals with their progress line.
- This week: the hero number (struggled and continued) with minutes and steps as smaller tiles.

**Layout.** Phone: banner, next step card, hero, goals. Laptop: two columns, next step and goals on the start side, this week on the end side.

**API.** `GET /api/sessions/active`, `GET /api/goals`, tasks and steps of the goals to find the next step, `GET /api/progress?days=7`.

**Decisions to settle.**
- How "next step" is chosen when several goals are active (proposal: the first not-done step of the most recently worked goal, else the oldest goal).
- How many calls home makes and whether to cache the next-step choice client-side.

### 5 · Focus session

**Job.** Pick a step, start the clock, work, end with a review. Nothing else can start until the review is done.

**Pages.** `/session` with three views: start (choose length), running, review. Also reached from the home banner and the step rows.

**What is on it.**
- Start: the step, task and goal names; a suggested length (25, 50, custom); the Start button.
- Running: the dimmed variant of the theme; the step title large; the timer computed as now minus `startedAt` from the server; a thin progress line toward the suggested length; the ink I'm struggling button; End and review; Later. Distraction-free mode hides the shell; full-screen on request; ambient sound (brown noise, rain) generated in the browser, remembered per device.
- Review: outcome (five options), rating 1 to 5, optional note; quick to close for a mistaken start. If a struggle happened during the session, the review asks "did you continue?" once, with a confirm.
- The visual cue when the suggested length is reached is a colour shift and a line of text, never an alarm.

**Layout.** Phone: everything centred in one column, controls at the bottom. Laptop: the same, centred, with generous whitespace; the shell is hidden either way during a session.

**API.** `POST /api/sessions`, `GET /api/sessions/active`, `POST …/stop`, `POST …/end`, `PATCH /api/struggles/:id` for the follow-up. Always use the session id from the screen.

**Decisions to settle.**
- Timer drift and visibility: how the clock recovers after the tab sleeps (proposal: recompute from `startedAt` on every tick and on `visibilitychange`).
- Keeping the suggested length and sound preferences in `localStorage`.
- Where the dimmed tokens live (proposal: a `data-session` attribute on the root that remaps six tokens).
- Screen wake lock while running.

### 6 · I'm struggling

**Job.** The button the app exists for. Situation, description, advice and one next step, then "did you continue?".

**Page.** `/struggling`, reachable from everywhere; during a session it opens as a sheet over the timer so the clock stays visible.

**What is on it.**
- Four situation choices as large buttons: stuck, tired, comparing, negative thought.
- A text area for the description with `dir="auto"`.
- A waiting state that keeps the text and shows that the answer usually takes 5 to 17 seconds.
- The answer: advice and the next step, both `dir="auto"`, the next step visually primary. A button to go back to work.
- "Did you continue?" asked at the end of that session, or on the next visit via a banner for struggles outside a session (ids in `localStorage`). One answer, confirmed before sending; `struggle.already_answered` shows the stored answer.

**Layout.** Phone: full-screen sheet. Laptop: a centred sheet of about 560px over the current page.

**API.** `POST /api/struggles` (the server attaches the open session), `PATCH /api/struggles/:id`. Handles `struggle.onboarding_required`, `ai.daily_limit`, `ai.unavailable`.

**Decisions to settle.**
- Where today's struggle ids live and for how long (proposal: `localStorage`, cleared once answered or after 7 days).
- Whether the advice is kept visible in the session view after closing the sheet.

### 7 · Progress

**Job.** Show the number that matters most and the week behind it.

**Page.** `/progress`.

**What is on it.**
- Hero: struggled and continued, in ink, with the previous period for comparison.
- Three small charts, one per measure, each with its own axis: steps done, struggled and continued, focus minutes. Recharts, colours from `chart-1..3`.
- A range control: 7, 14, 30, 90 days, driving both the charts and the list.
- Session history: newest first, each with step, task, goal, minutes, outcome and rating, the note on expand.

**Layout.** Phone: hero, charts stacked, history. Laptop: hero across the top, charts in a row of three, history below.

**API.** `GET /api/progress?days=N`, `GET /api/sessions?days=N`. Dates are shown as the API's `YYYY-MM-DD` strings, formatted without going through a `Date`.

**Decisions to settle.**
- Weekly and monthly totals are added up client-side; which units to show for 30 and 90 days.
- Chart accessibility: a table view of the same numbers.

### 8 · Profile editing and polish

**Job.** Let the person revisit their answers, and make every screen complete.

**What is in it.** `/settings/profile` reusing the onboarding screens from `GET /api/profile`; empty states for goals, tasks and progress; loading skeletons everywhere data loads; an accessibility pass (focus order, labels, contrast in dark); your review of the Arabic wording of every onboarding question and the "why" lines.

### 9 · Hardening and deploy

**What is in it.** A Playwright run of the whole arc against the API; a performance pass (bundle size, calls per page, images); production environment on Vercel with `API_URL` and the API behind `TRUST_PROXY`; `docs/DEPLOY.md`.

## Conventions every feature follows

- **Data**: TanStack Query, one key per resource (`['goals']`, `['tasks', goalId]`, `['steps', taskId]`, `['session','active']`, `['progress', days]`). Mutations invalidate the keys they touch. Optimistic updates only where the handoff says a double write is safe.
- **Errors**: every code in handoff §5 that a page can receive is handled on that page the way the table says; the rest fall through to the general message.
- **Text**: app text in `messages/*.json` only; user and AI text with `dir="auto"`; logical CSS properties; numbers through `Intl`.
- **Forms**: react-hook-form + zod with the API's limits; API field errors mapped by `field`; one primary action per screen.
- **Loading**: skeletons that match the final layout, never spinners for page loads; spinners only for the two AI calls, with cancel.
- **Tests**: Vitest for logic (timer maths, next-step choice, error mapping), Playwright for the feature's main path.

## Feature doc template

Each feature gets `docs/features/NN-name.md` from [`features/_template.md`](./features/_template.md). The doc is written before building (sections 1 to 5) and completed after (sections 6 to 8).
