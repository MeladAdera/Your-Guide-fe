# 04 · Home

Status: **spec 2026-11-13** · built in steps after it, each shown running before its commit · owner's design review after the build (§8)

## 1. Job

Answer "what should I do next?" in one glance, and surface anything owed. After this feature a person who opens the app lands on one step they can work on, sees their goals with how far each has come, and is told when a focus session is still open.

Rules that apply: **one primary action** (the next step), never a list of chores; **no zeros as judgement** (an empty week is a kind line, as on the week tile); the person's own words (goal, task and step titles) render with `dir="auto"`.

## 2. Page and route

`/home`, under the app frame. The start-up router (`/`) already sends a person here once onboarding is done and a goal exists, or to `/session` when a session is open (handoff §7).

Everything is loaded by the server render, so Home opens complete, without a spinner per part:

1. In parallel: `GET /api/sessions/active` (404 `session.none_active` → none), `GET /api/goals`, `GET /api/sessions?days=7`.
2. In parallel: every active goal's tasks (they give each goal's progress line too).
3. Steps only where the next step is looked for (§3.2), task by task, stopping at the first open step. Usually one or two calls, not every step of every goal.

## 3. What is on the page

In reading order:

1. **Open session banner**, only when a session is open. Running: "A focus session is running" · step title · task and goal names · **Back to the session** (→ `/session`). Stopped and waiting for its review: "Your last session is waiting for its review" · the same names · **Review it**. The review is owed, so the banner comes first (handoff §11).
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
| week (compact mint card) |        | [banner, when open]            | mint tile |
| [banner, when open]      |        | Your next step                 | this week |
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
- **Success elsewhere**: ticking a step on a goal page and coming back shows the new next step (the server render runs again; the query keys are shared, §5).

## 5. API integration

| Call | When | Used for | Codes handled |
| --- | --- | --- | --- |
| `GET /api/sessions/active` | server render | the banner | 404 `session.none_active` → no banner |
| `GET /api/goals` | server render | the order, the next step, the list | |
| `GET /api/sessions?days=7` | server render | the last-worked order | |
| `GET /api/goals/:goalId/tasks` | server render, each active goal | the next step, the progress lines | |
| `GET /api/tasks/:taskId/steps` | server render, task by task until an open step | the next step | |
| `GET /api/progress?days=7` | the week tile, as now | this week | (the tile's own) |

Query keys: the same as the goals and goal pages (`["goals", "active"]`, `["goals", id, "tasks"]`, `["tasks", taskId, "steps"]`), plus `["sessions", "active"]` and `["sessions", 7]`, filled from the server render as `initialData`. Every write on the goal pages already invalidates these keys. Home itself writes nothing.

## 6. Decisions

1. **Open the goal, not Start session, for now** (owner, 2026-11-13). Starting a session opens it on the server, and until the session screen (feature 5) exists nobody could end it, while an open session blocks every other session and archiving its goal. Start session arrives on Home and on the goal page together with feature 5. Not taken: building feature 5 first.
2. **Next step from the goal worked on last** (owner, 2026-11-13), from the completed sessions of the last seven days, then the oldest goal. Not taken: always the oldest goal (ignores what the person was just doing), or a next step per goal (more to read, no single answer).
3. **This week is the existing week rhythm**, not a second set of tiles: it already shows the headline number (struggled and continued), with steps and minutes, and it already sits on Home.
4. **I'm struggling is not repeated on the card**: the frame already keeps it one tap away on every page.
5. **The progress line counts tasks, not steps**: the tasks are loaded for every goal anyway, and steps for every task of every goal would multiply the calls on the most visited page.

## 7. Tests

- Unit, `src/features/home/next-step.test.ts`: goal order (last session first, then oldest), skipping done tasks and goals with no open step, the "nothing open" and "no goals" cases, the progress line.
- Playwright, `e2e/home.spec.ts` (needs the API), phone and laptop: a fresh account with one goal shows "Make the next step small"; after a task and two steps it shows the first step; ticking it moves Home to the second; **Open the goal** lands on the goal page; with every goal archived it shows "No active goals right now"; an open session (started through the API) shows the banner.
- By hand: English and Arabic, phone and laptop, light and dark.

## 8. Design choices made without the owner (for the review)

- The step title as the page's heading, with "Your next step" above it.
- The banner's wording and its place above everything.
- Goals as rows with a progress line, at most five on Home.
- Copy of the "nothing open" and "no goals" cards.
