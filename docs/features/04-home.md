# 04 · Home

Status: **built 2026-11-13** (40202c8 spec, ec3315b, 401a1d4, 53a6654, tests and docs after), each step shown to the owner running before its commit · the Playwright paths pass against the local API on phone and laptop · **owner's design review pending** (§8)

## 1. Job

Answer "what should I do next?" in one glance, and surface anything owed. After this feature a person who opens the app lands on one step they can work on, sees their goals with how far each has come, and is told when a focus session is still open.

Rules that apply: **one primary action** (the next step), never a list of chores; **no zeros as judgement** (an empty week is a kind line, as on the week tile); the person's own words (goal, task and step titles) render with `dir="auto"`.

## 2. Page and route

`/home`, under the app frame. The start-up router (`/`) already sends a person here once onboarding is done and a goal exists, or to `/session` when a session is open (handoff §7).

Everything is loaded by the server render, so Home opens complete, without a spinner per part:

1. In parallel: `GET /api/sessions/active` (404 `session.none_active` → none), `GET /api/goals`, `GET /api/sessions?days=7`, `GET /api/progress?days=7` (for the phone's week card, §6.6).
2. In parallel: every active goal's tasks (they give each goal's progress line too).
3. Steps only where the next step is looked for (§3.2), task by task, stopping at the first open step. Usually one or two calls, not every step of every goal.

## 3. What is on the page

In reading order:

1. **Open session banner**, only when a session is open, above everything on both widths (on a phone also above the week card). Running: "A focus session is running" · step title · task and goal names · **Back to the session** (→ `/session`). Stopped and waiting for its review: "Your last session is waiting for its review" · the same names · **Review it**. The review is owed, so the banner comes first (handoff §11). It holds the page's one primary button; while it shows, **Open the goal** below turns to an outline button. Soft green tint, not ink: ink stays the I'm struggling button's alone.
2. **Your next step**, the one primary action. This is the page heading:
   - "Your next step" (small, above), the **step title** (the heading, large), then "Goal › Task" in muted text.
   - **Open the goal** (primary button) → `/goals/[id]`, where the step sits. Start session joins it in feature 5 (§6.1).
   - **How the step is chosen**: goals in order of the last focus session on each one (newest first, from `GET /api/sessions?days=7`), then the rest oldest first. Inside a goal: tasks in their order, skipping done ones; the first task with an open step gives its first open step (steps in their order). If a goal has no open step, the next goal is tried.
   - **Nothing open anywhere** (goals but no open steps): "Make the next step small" · "{goal} has no open steps. Name a task, then a step you could finish in one sitting." · **Open the goal**, on the first goal in the order above.
   - **No active goals** (all archived): "No active goals right now" · "Pick an archived goal back up, or start a new one." · **Go to Goals**.
3. **Your goals**: the active goals in the same order as above, at most five, each a row linking to its page with the title and a progress line: "2 of 5 tasks done", "No tasks yet", or "All 4 tasks done". More than five: **All goals (n)** → `/goals`; otherwise a quiet **All goals** link. Hidden when there are no active goals (the card above already says so).
4. **This week**: the existing week rhythm (`WeekRhythm`): the compact card at the top on a phone, the mint tile beside the card on a laptop. Unchanged.

Removed: the placeholder intro, "Signed in as", the style guide link (the style guide stays reachable at `/styleguide`).

## 4. Layout and states

```
Phone (about 400px)                 Laptop (about 1024px)
+--------------------------+        +--------------------------------+-----------+
| [banner, when open]      |        | [banner, when open]            | mint tile |
| week (compact mint card) |        | Your next step                 | this week |
| Your next step           |        | Step title (large)             |           |
| Step title               |        | Goal › Task                    |           |
| Goal › Task              |        | [Open the goal]                |           |
| [Open the goal]  (full)  |        |                                |           |
| Your goals               |        | Your goals                     |           |
|  Goal A   2 of 5 tasks › |        |  Goal A        2 of 5 tasks ›  |           |
|  Goal B   No tasks yet › |        |  Goal B        No tasks yet ›  |           |
| All goals                |        | All goals                      |           |
+--------------------------+        +--------------------------------+-----------+
```

- **Loading**: a `loading.tsx` skeleton in the card's shape (heading bar, a button, three rows) while the server render runs on navigation.
- **Error**: the app's error page (`src/app/error.tsx`) with its retry, as everywhere else; the week tile keeps its own quiet empty state.
- **Success elsewhere**: ticking a step on a goal page and coming back shows the new next step: Home is rendered on the server on every visit.

## 5. API integration

| Call | When | Used for | Codes handled |
| --- | --- | --- | --- |
| `GET /api/sessions/active` | server render | the banner | 404 `session.none_active` → no banner |
| `GET /api/goals` | server render | the order, the next step, the list | |
| `GET /api/sessions?days=7` | server render | the last-worked order | |
| `GET /api/goals/:goalId/tasks` | server render, each active goal | the next step, the progress lines | |
| `GET /api/tasks/:taskId/steps` | server render, task by task until an open step | the next step | |
| `GET /api/progress?days=7` | the week tile, as now | this week | (the tile's own) |

No query keys of its own: Home writes nothing and is rendered on the server on every visit, so its parts are Server Components fed by the page (`src/features/home/components/`). The rules are pure functions in `src/features/home/next-step.ts`. The week card keeps its key `["progress", 7]`.

## 6. Decisions

1. **Open the goal, not Start session, for now** (owner, 2026-11-13). Starting a session opens it on the server, and until the session screen (feature 5) exists nobody could end it, while an open session blocks every other session and archiving its goal. Start session arrives on Home and on the goal page together with feature 5. Not taken: building feature 5 first.
2. **Next step from the goal worked on last** (owner, 2026-11-13), from the completed sessions of the last seven days, then the oldest goal. Not taken: always the oldest goal (ignores what the person was just doing), or a next step per goal (more to read, no single answer).
3. **This week is the existing week rhythm**, not a second set of tiles: it already shows the headline number (struggled and continued), with steps and minutes, and it already sits on Home.
4. **I'm struggling is not repeated on the card**: the frame already keeps it one tap away on every page.
5. **The progress line counts tasks, not steps**: the tasks are loaded for every goal anyway, and steps for every task of every goal would multiply the calls on the most visited page.
6. **The week card gets the server's week as a placeholder, not as cache data.** Home's `loading.tsx` makes the page stream in after the frame; the phone's week card then hydrated after the laptop tile had already fetched the week, so the server sent a skeleton and the browser drew the card (a hydration mismatch). Seeding the shared query cache from the server render was tried and moved the mismatch to the laptop tile. `useProgress(days, serverData)` uses it as `placeholderData`, which no other component sees.
7. **Server Components only, no client queries on Home** (the spec planned `initialData` per query key): nothing on Home changes while it is open, and every visit renders it fresh. Feature 5 adds the client side when Start session arrives. Not taken: a `sessionsApi` client module now; it comes with the session screen that needs it.

## 7. Tests

- Unit, `src/features/home/next-step.test.ts`: goal order (last session first, then oldest), skipping done tasks and goals with no open step, the "nothing open" and "no goals" cases, the progress line.
- Playwright, `e2e/home.spec.ts` (needs the API), phone and laptop: a goal with no tasks shows "Make the next step small"; after a task and two steps it shows the first step and "0 of 1 task done"; **Open the goal**, tick the step there, and Home shows the second; a session on a newer goal puts that goal and its step first. Second path: a running session shows its banner, a stopped one "Review it", a reviewed one none; with every goal archived, "No active goals right now" and **Go to Goals**.
- By hand, from screenshots on 2026-11-13: English and Arabic (RTL), phone and laptop, light and dark, every state above, no page errors.

## 8. Design choices made without the owner (for the review)

- The step title as the page's heading, with "Your next step" above it.
- The banner's wording and its place above everything.
- Goals as rows with a progress line, at most five on Home.
- Copy of the "nothing open" and "no goals" cards.
- The banner's soft green tint, and Open the goal turning to outline while it shows.
- When the open session is on the next step, the same step shows in the banner and in the card.

## 9. Follow-ups

- Feature 5: Start session on the next-step card (and on the goal page's steps); the banner's links then reach a real session screen.
- The Arabic copy of Home waits for the owner's review with the rest.
