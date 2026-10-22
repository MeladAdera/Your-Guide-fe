Frontend handoff · backend as of commit 9d0379e, 2026‑10‑19

# Your Guide

Everything the web app needs from the backend: the API contract, the rules behind it, the codes to translate, and the order the screens have to follow. The backend is finished through week 6 of the plan (auth, onboarding, goals, tasks, steps, focus sessions, progress, the “I’m struggling” button and the AI task breakdown).

API in developmenthttp://localhost:3001/api

Try every routehttp://localhost:3001/api/docs (Swagger UI, dev only)

OpenAPI file[openapi.json](openapi.json) (snapshot of /api/docs-json)

Reasons behind the rulesPROJECT.md · DECISIONS.md · SCHEMA.md · docs/week-0N-\*.md in the repo

Contents

1. [1. What the app is](#product)
2. [2. Agreed stack and setup](#stack)
3. [3. Request conventions](#conventions)
4. [4. Accounts and the cookie](#auth)
5. [5. Errors and codes](#errors)
6. [6. Fixed lists to translate](#lists)
7. [7. Routing on app start](#boot)
8. [8. Onboarding](#onboarding)
9. [9. Goals](#goals)
10. [10. Tasks and steps](#tasks)
11. [11. Focus sessions](#sessions)
12. [12. I’m struggling](#struggles)
13. [13. Progress and history](#progress)
14. [14. English and Arabic](#i18n)
15. [15. Not built, on purpose](#notbuilt)
16. [16. Endpoint reference](#reference)

## 1. What the app is

Your Guide is a work/study manager for the moment someone is alone with a hard task and wants to give up. It knows the person’s goal and why it matters, breaks the goal into tasks and small steps, times focus sessions, and when the person presses **I’m struggling** it answers with advice that fits them and one small next step. Progress counts the number that matters most: how often they struggled and continued anyway.

The whole product follows one arc, and the screens follow it in this order:

who am I → where am I now → what matters to me → where do I want to go → why → what is stopping me → what should I do next

#### Onboarding

Seven short screens about the person. Then the first goal with its why.

#### Plan

Goal → tasks → steps. A step is small enough for one session. The model can suggest steps.

#### Work

Pick a step, start the timer. One open session at a time. It ends only with a review.

#### Struggle

Choose the situation, describe it, get advice and one next step. Then: did you continue?

#### Progress

Per day: focus minutes, steps done, times struggled and continued. Plus session history.

Three product rules that shape the UI

**The app never diagnoses.** It never names a condition, never shows a score or a label from the check‑in. The check‑in stores eight answers and nothing else.

**The goal comes last.** The backend refuses to create a goal until onboarding screens 2–7 are saved. The wizard cannot be reordered around that.

**The person stays the author.** AI suggestions are returned, never saved. The user picks what to keep.

## 2. Agreed stack and setup

| Topic | Decision |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript. The frontend is UI only; every business rule lives in the API. |
| Repo | One git repo, two independent projects: `backend/` exists, `frontend/` is new, each with its own `package.json`. No shared package: the frontend declares the request and response types it uses itself (this page and `openapi.json` are the source). |
| Reaching the API | Next.js rewrites `/api/*` to the API server (`API_URL`, e.g. `http://localhost:3001`). The browser sees one origin, so there is no CORS and the session cookie just works. Call the API with relative URLs: `fetch('/api/goals')`. |
| Ports | Web on 3000, API on 3001, PostgreSQL on 5433 (Docker), pgAdmin on 5050. |
| Languages | English and Arabic, with `next-intl`: `en.json` and `ar.json`, no language in the URL, right‑to‑left layout with logical CSS (start/end). See [§14](#i18n). |
| Charts | Recharts, for the progress page. |
| Out of scope | Mobile app, notifications, teams or sharing, integrations, email verification, password reset, OAuth login. |

### Run the backend locally

You need Node.js 24+, pnpm and Docker.

```
cd backend
pnpm install
cp .env.example .env          # add ZAI_API_KEY for the two AI routes; everything else works without it
docker compose up -d --wait   # PostgreSQL on 5433
pnpm migrate up
pnpm dev                      # http://localhost:3001/api/health → {"status":"ok"}
```

Swagger UI at `/api/docs` lets you log in once and then try every protected route from the browser (the cookie is kept by the browser; the Authorize button cannot set it). Every example body there is sent to the real API by a test, so the pre‑filled examples work as they are.

Server components and the cookie

A fetch from the browser carries the cookie through the rewrite by itself. A fetch from a Server Component or Route Handler does not: forward the incoming `Cookie` header yourself, and call the API by `API_URL`, not by the rewrite. In production the hosting platform and the rewrite are proxies in front of the API, so the API is deployed with `TRUST_PROXY` set, otherwise the login rate limit counts the proxy’s IP.

## 3. Request conventions

- **JSON in, JSON out.** `Content-Type: application/json` on every body. Routes that create answer **201**; deletes and logout answer **204** with no body; login, stop, end, archive and the breakdown answer **200**.
- **Unknown fields are refused.** A body with a field the route does not know is a **400** `validation.failed` with the rule `whitelistValidation`. Never send `id`, `status`, `sessionId` or anything not listed for that route.
- **Ids are UUIDs.** A malformed id in the path is a **400** `bad_request`. Every “not yours” is a **404**: the API never reveals that someone else’s row exists.
- **Times are ISO 8601 UTC strings** (`2026-10-19T14:03:22.118Z`). Format them in the browser. The one exception is `date` on the progress page: a `YYYY-MM-DD` string already in the user’s timezone, to be shown as it is.
- **Query values are strings.** `?archived=true`, `?days=7`. Anything else is a 400.
- **PATCH sends only what changed.** A field left out stays as it is. `null` clears an optional field; `null` on a required field is a 400.
- **PUT replaces.** The onboarding screens are saved whole: send every field of the screen each time, optional ones as `null` or left out.
- **Free text is never trimmed or changed by the API.** An empty string is refused (`minLength`); trim in the form before sending. Limits: titles 200, answers 1000, the one self‑description 3000, a value note 300, an occupation 120.
- **Only one write at a time per user is guaranteed safe.** Double clicks are handled server‑side (ending a session or answering a struggle twice gives 404/409, not a second write), but disable the button anyway.

## 4. Accounts and the cookie

Email and password only. Register and login set an **httpOnly cookie** named `your_guide_session`: `SameSite=Lax`, `Path=/`, `Secure` in production, valid for **30 days**, backed by a server‑side session row. JavaScript cannot read it, so the app learns whether someone is logged in by calling `GET /api/auth/me`: 200 is a user, 401 is not.

| Route | Body | Answers |
| --- | --- | --- |
| POST `/api/auth/register` | `email` (≤254), `password` (8–128), `timezone` (IANA name), `locale` (`en`\|`ar`) | 201 User + cookie · 400 validation · 409 `auth.email_taken` · 429 `rate_limited` |
| POST `/api/auth/login` | `email`, `password` | 200 User + cookie · 401 `auth.invalid_credentials` (wrong password and unknown email look the same) · 429 `rate_limited` |
| POST `/api/auth/logout` | none | 204 always, even with no or a stale cookie. Public on purpose so a stale cookie can always be cleared. |
| GET `/api/auth/me` | none | 200 User · 401 `auth.not_logged_in` |
| PATCH `/api/auth/me` | `locale` only | 200 User. The language switch: show the new language at once client‑side, then make it follow the account with this call. |

```
// User, as every auth route returns it
{ "id": "uuid", "email": "you@example.com", "timezone": "Asia/Dubai", "locale": "en" }
```

- **Timezone and locale are sent by the browser, nobody types them.** `Intl.DateTimeFormat().resolvedOptions().timeZone` for the timezone, and whichever language the app is currently showing for the locale. Both are required at register: a forgotten field would silently become a wrong day or a wrong language.
- **Rate limit:** 5 register or login requests a minute per IP. On 429 show “too many attempts, try again in a minute”.
- **Timezone and email cannot be changed yet.** `PATCH /api/auth/me` takes `locale` and nothing else.
- **On any 401 from any route**, treat the person as logged out: clear local state, go to the login screen, keep the return path.

## 5. Errors and codes

The API speaks codes, the frontend speaks languages. Every error answer the API gives on purpose has one shape:

```
{ "statusCode": 409, "error": "Conflict",
  "code": "goal.has_work_history",
  "message": "This has work history. Archive the goal instead." }   // English, for developers only
```

**Translate by `code`, never show `message`.** The sentence can be reworded at any time; a code is never renamed once the frontend uses it. A code the frontend does not know, and any **500** (which has no code at all), gets the app’s general “something went wrong” text, the same one used when the network is down.

### Every code, and what the screen should do

| Code | Status | When | What the UI does |
| --- | --- | --- | --- |
| `auth.not_logged_in` | 401 | Any protected route without a live session | Go to login, remember where the person was |
| `auth.invalid_credentials` | 401 | Login | One message for both wrong password and unknown email |
| `auth.email_taken` | 409 | Register | Under the email field; offer “log in instead” |
| `rate_limited` | 429 | Register or login, more than 5 a minute | “Too many attempts, try again in a minute” |
| `validation.failed` | 400 | A body or query broke a rule | Per‑field messages from `errors[]`, see below |
| `bad_request` | 400 | An id in the path is not a UUID | Should not happen from the UI; general error |
| `not_found` | 404 | Unknown route | General error |
| `profile.onboarding_not_done` | 404 | `GET /profile` before screens 2–7 are saved | Go to the wizard; `GET /profile/onboarding` says where |
| `profile.screen_not_saved` | 404 | `GET` of one screen not yet saved | Normal while resuming: show the screen empty |
| `goal.onboarding_required` | 409 | `POST /goals` before screens 2–7 are saved. The body adds `missing: ["situation", …]` | Send the person to the first missing screen |
| `goal.not_found` · `task.not_found` · `step.not_found` · `session.not_found` · `struggle.not_found` | 404 | No such row, or someone else’s | The list is stale: reload it |
| `goal.has_work_history` | 409 | `DELETE /goals/:id` when a session was ever run under it | Offer **Archive** instead of delete |
| `task.has_work_history` · `step.has_work_history` | 409 | Delete of a task or step with a session | Explain it cannot be deleted; it keeps the progress |
| `goal.archived` | 409 | Any write under an archived goal (tasks, steps, order, session start, breakdown) | Show the goal read‑only; offer **Unarchive** |
| `goal.session_running` | 409 | Archive while a session under the goal is open | Link to the open session: review it first |
| `step.order_mismatch` | 400 | `PUT …/steps/order` without every step exactly once | The list changed underneath: reload the steps and retry |
| `session.already_active` | 409 | Start while a session is open (running or awaiting review) | Go to the open session (`GET /sessions/active`) |
| `session.step_done` | 409 | Start on a step that is done | Offer “mark it not done” first |
| `session.none_active` | 404 | `GET /sessions/active` with nothing open | Not an error: the normal “no session” state |
| `session.not_running` | 404 | `POST …/stop` on a session already stopped, reviewed, or not yours | Refresh the active session and continue |
| `struggle.onboarding_required` | 409 | `POST /struggles` before onboarding is complete; body adds `missing` | Same as the goal case |
| `struggle.already_answered` | 409 | Second answer to “did you continue?” | Reload the struggle; show the stored answer |
| `ai.daily_limit` | 429 | More than 10 model calls today (advice + breakdowns together, counted in the user’s day) | “Today’s advice is used up, it comes back tomorrow”; disable both AI buttons until the user’s next day |
| `ai.unavailable` | 503 | The model did not answer in time (45 s) or answered badly. Nothing was saved | “Not available right now, try again in a minute”; keep what the person typed |

### Validation errors name the field and the rule

```
{ "statusCode": 400, "error": "Bad Request", "code": "validation.failed",
  "message": ["values.0.note must be shorter than or equal to 300 characters"],
  "errors":  [{ "field": "values.0.note", "code": "maxLength" }] }
```

Put the translated sentence under the input named by `field`. Inside a list the path is *list.position.field*, position from 0. The rule codes currently in use, which is the list a translation file needs: `isEmail`, `isString`, `minLength`, `maxLength`, `isIn`, `isInt`, `min`, `max`, `isBoolean`, `isUuid`, `isTimeZone`, `isArray`, `arrayMinSize`, `arrayMaxSize`, `arrayUnique`, `matches`, `whitelistValidation`. Validate the same limits in the form so these are a safety net, not the normal path.

## 6. Fixed lists to translate

Every fixed list is codes. The label in each language belongs to the frontend. Store and send the code exactly as written here.

| List | Codes | Used by |
| --- | --- | --- |
| Locale | `en` `ar` | Register, `PATCH /auth/me` |
| Employment status | `student` `employed` `self_employed` `between_jobs` `caregiver` `retired` `other` | Screen 1 (required) |
| Age range | `under_18` `18_24` `25_34` `35_44` `45_54` `55_plus` | Screen 1 |
| Education level | `secondary` `vocational` `bachelor` `master` `doctorate` `other` | Screen 1 |
| Years of experience | `none` `under_2` `2_5` `6_10` `over_10` | Screen 1 |
| Country | ISO 3166‑1 alpha‑2 (`AE`, `SY`, …). Country only, never a city. | Screen 1 |
| Life values | `family` `health` `career` `learning` `contribution` `financial_security` `creativity` `relationships` `spirituality` `independence` | Screen 7: pick 2 to 5, each once |
| Onboarding screens | `basics` `situation` `achievements` `patterns` `selfView` `confidence` `values` (in the path: `self-view`) | `/profile/onboarding`, `missing` |
| Task status | `todo` `in_progress` `done` | Read‑only on a task |
| Session outcome | `done` `progress` `stuck` `distracted` `tired` | The review form |
| Struggle situation | `stuck` `tired` `comparing` `negative_thought` | The “I’m struggling” picker |

### The eight check‑in statements (screen 6)

The API documents the exact English wording, so the two languages say the same thing. Each is answered 1 (strongly disagree) to 5 (strongly agree). Show no total, no score, no label.

| Field | Statement |
| --- | --- |
| `canLearnIfPersist` | I can learn difficult things if I keep at them. |
| `canTryAgain` | When I fail, I can usually try again. |
| `followThrough` | I usually follow through on commitments I make to myself. |
| `focusWithoutMotivation` | I can stay focused on something important even when I do not feel motivated. |
| `actionsShapeFuture` | My actions can significantly improve my future. |
| `doubtDespiteEvidence` | I often doubt my ability even when I have evidence that I can succeed. |
| `avoidWhenAfraid` | I avoid difficult situations because I am afraid of failing. |
| `compareTooMuch` | I compare myself with other people too much. |

## 7. Routing on app start

Three calls decide where a returning person lands. Do them in this order; each one is cheap.

1. **`GET /api/auth/me`**. 401 → login or register. 200 → keep the user (its `locale` sets the language, its `timezone` is informational).
2. **`GET /api/profile/onboarding`**, never 404. `completed: false` → open the wizard at the first screen in `missing` (basics is optional and never in `missing`; offer it only when starting fresh). `completed: true` → next step.
3. **`GET /api/goals`**. Empty → the wizard’s last step, “your first goal”. Otherwise → the home screen. Also check **`GET /api/sessions/active`**: 200 means a session is open and the timer screen (or its review) should be offered right away; 404 is the normal case.

```
// GET /api/profile/onboarding
{ "completed": false,
  "screens": { "basics": true, "situation": true, "achievements": false, "patterns": false,
               "selfView": false, "confidence": false, "values": false },
  "missing": ["achievements", "patterns", "selfView", "confidence", "values"] }
```

## 8. Onboarding

Seven screens about the person, each saved on its own with `PUT /api/profile/sections/<screen>` (create or replace), each readable back with `GET` (404 `profile.screen_not_saved` until saved). Each screen opens with one line that says why it asks; that line is frontend copy. The questions below are the API’s own descriptions and are the wording to translate.

| # | Screen · path | Required | Optional |
| --- | --- | --- | --- |
| 1 | **Basics** · `basics` The only skippable screen | `employmentStatus` | `ageRange`, `country`, `educationLevel`, `occupation` (≤120, “What do you do now, in your words?”), `yearsExperience` |
| 2 | **Your days now** · `situation` | `typicalDay` “What does your typical day look like?” · `wantToChange` “What would you most like to change?” | `satisfiedWith` “What part of your life are you satisfied with?” · `wishMoreTimeFor` “What do you wish you had more time for?” |
| 3 | **What you have done** · `achievements` | `proudOf` “Something you achieved, got through, or surprised yourself with.” | `whatWasHard` “What was difficult about it?” · `learnedAboutSelf` “What did you learn about yourself from it?” |
| 4 | **What gets in the way** · `patterns` | `oftenPostpone` “What do you keep postponing or avoiding?” | `lessonFromMistake` “A mistake or regret that taught you something.” · `patternToChange` “A habit or pattern you would like to change.” |
| 5 | **How you see yourself** · `self-view` | `whoIAm` (≤3000) “Describe yourself honestly. Who are you at this point in your life?” | `goodAt` “What are you naturally good at?” · `othersComeToMeFor` “What do other people usually come to you for?” · `stillFiguringOut` “What are you still trying to understand about yourself?” |
| 6 | **Quick check‑in** · `confidence` | All eight statements, integers 1–5 ([§6](#lists)) | none |
| 7 | **What matters to you** · `values` | `values`: 2–5 picks `{ value, note? }`, each value once, note ≤300 “Why this one matters to you.” A set, not a ranking · `personToBecome` “What kind of person do you want to become?” | `wouldRegretNotDoing` “What would you regret not doing?” · `rememberedFor` “What do you want people to remember about you?” |
| then | **Your first goal** | An ordinary goal: `POST /api/goals` ([§9](#goals)). 409 with `missing` until 2–7 are saved | `obstacle`, `firstOutcome` |

- Text answers are 1 to 1000 characters unless noted. Eight written answers are required in all, the first goal’s two included; everything else is a tap or optional, and the more personal questions are the optional ones.
- **Resuming:** prefill a screen from its `GET`; a 404 means “start empty”. Saving a screen again replaces it whole.
- **Editing later:** the same routes serve a settings/profile page. `GET /api/profile` returns all seven at once (each `null` when not saved, only `basics` can be `null` after completion) and 404 `profile.onboarding_not_done` before completion.
- Every screen answers with its saved data plus `updatedAt`.

Why the goal is last

Values before plans: the goal is written after the person has recalled what they can do, named what they avoid and chosen what matters. That is why the backend, not the wizard, enforces the order.

## 9. Goals

```
// Goal
{ "id": "uuid", "title": "Ship my first product",
  "whyItMatters": "I want to build my own products without waiting for anyone.",
  "obstacle": null, "firstOutcome": null,
  "createdAt": "2026-10-04T09:12:00.000Z", "archivedAt": null }
```

| Route | Body / query | Notes |
| --- | --- | --- |
| GET `/api/goals` | `?archived=true` for the archived ones | Active goals by default, oldest first. Two lists, two tabs. |
| POST `/api/goals` | `title` (≤200) “What would you like to change or accomplish?” · `whyItMatters` (≤1000) “Why does it matter to you?” · optional `obstacle` “What might get in the way?” · `firstOutcome` “What would be the first sign you are moving?” | 201 · 409 `goal.onboarding_required` + `missing` |
| PATCH `/api/goals/:id` | Any of the four; `null` clears `obstacle` or `firstOutcome` | Works on an archived goal too (the goal itself is not “under” itself). |
| DELETE `/api/goals/:id` | none | 204, with its tasks and steps · 409 `goal.has_work_history` → offer archive |
| POST `/api/goals/:id/archive` | none | 200 Goal with `archivedAt` · 409 `goal.session_running` |
| POST `/api/goals/:id/unarchive` | none | 200 Goal |

- **Delete or archive?** Show *Delete* for a goal nobody has worked under, *Archive* once it has history. The UI cannot know which in advance, so try delete and switch to the archive offer on `goal.has_work_history`, or show both and let the 409 explain.
- **An archived goal is read‑only.** Its tasks and steps can still be listed, but every write under it answers 409 `goal.archived`. Render the whole tree without edit controls and with an Unarchive button.
- There is no `GET /api/goals/:id`: keep the goal from the list.

## 10. Tasks and steps

```
// Task                                              // Step
{ "id": "uuid", "goalId": "uuid",                     { "id": "uuid", "taskId": "uuid",
  "title": "Learn PostgreSQL",                          "title": "Understand SELECT",
  "status": "in_progress",                              "doneAt": null,              // or an ISO time
  "createdAt": "…" }                                    "createdAt": "…" }
```

| Route | Body | Notes |
| --- | --- | --- |
| GET `/api/goals/:goalId/tasks` | none | Oldest first, each with its `status`. Works for archived goals. |
| POST `/api/goals/:goalId/tasks` | `title` (≤200) | 201 Task, `todo` · 409 `goal.archived` |
| PATCH `/api/tasks/:id` | `title` | Rename only. `status` cannot be sent. |
| DELETE `/api/tasks/:id` | none | 204 with its steps · 409 `task.has_work_history` or `goal.archived` |
| GET `/api/tasks/:taskId/steps` | none | In order. The order of the list is the order of the steps. |
| POST `/api/tasks/:taskId/steps` | `title` (≤200) | 201 Step, placed last |
| PUT `/api/tasks/:taskId/steps/order` | `stepIds`: every step of the task, each once, in the new order | 200 Step\[\] · 400 `step.order_mismatch` → reload and retry. Drag‑and‑drop sends the whole list once at drop. |
| PATCH `/api/steps/:id` | `title` and/or `done: true\|false` | The checkbox. `doneAt` is the server’s time. |
| DELETE `/api/steps/:id` | none | 204 · 409 `step.has_work_history` or `goal.archived` |
| POST `/api/tasks/:id/breakdown` | none | 200 `{ "steps": ["…", "…", "…"] }`, 3 to 7 titles · 409 `goal.archived` · 429 `ai.daily_limit` · 503 `ai.unavailable` |

- **A task’s status is derived, never set.** `todo` while no step is done (or there are no steps), `in_progress` once one is, `done` when all are. Ticking the last step finishes the task by itself; adding a step to a finished task reopens it. After any step change, refresh the task to show the new status.
- **“Break this task into steps”** is a suggestion screen: call the breakdown, show the titles as editable, checkable rows, then create the ones the person keeps with `POST …/steps` one by one, in order. Nothing is saved by the breakdown itself. The suggestions come in the language of the task title (Arabic title → Arabic steps), the account’s language when the title does not say. The call waits for the model: show a spinner, allow cancel on the client, and expect up to 45 s in the worst case.
- No single‑item GET for a task or a step: keep them from their lists.

## 11. Focus sessions

A session starts on one step and belongs to nobody but its user. The server’s clock is the truth: **the timer on screen is *now − startedAt*, computed by the client**, so a page reload or a second device shows the same time.

Running

`endedAt: null`. The clock counts. Shown on `/sessions/active`.

Awaiting review

`endedAt` set, no review yet. “Later” was pressed. Still the open session; still on `/sessions/active`.

Completed

Reviewed: `outcome`, `rating`, `note`. In `GET /sessions` history. Only now can another session start.

```
// Session (active)                                   // EndedSession adds, after POST …/end:
{ "id": "uuid",                                        "endedAt": "2026-10-19T15:02:10.000Z",   // never null
  "startedAt": "2026-10-19T14:03:22.118Z",             "outcome": "done",
  "endedAt": null,                                     "rating": 4,
  "step": { "id": "uuid", "title": "Understand SELECT" },   "note": "Wrote three SELECT queries." // or null
  "task": { "id": "uuid", "title": "Learn PostgreSQL" },
  "goal": { "id": "uuid", "title": "Ship my first product" } }
```

| Route | Body | Notes |
| --- | --- | --- |
| POST `/api/sessions` | `stepId` | 201 Session · 409 `session.already_active`, `session.step_done`, `goal.archived` · 404 `step.not_found` |
| GET `/api/sessions/active` | none | 200 Session (running or awaiting review) · 404 `session.none_active`. After a reload this answer is all the timer screen needs: it carries the step, task and goal by name. |
| POST `/api/sessions/:id/stop` | none | “Later” on the review screen: stops the clock, keeps the review owed. 200 Session with `endedAt` · 404 `session.not_running` |
| POST `/api/sessions/:id/end` | `outcome` (one of five) · `rating` 1 (bad) to 5 (good) · optional `note` (≤1000) “What did you do?” | Works for a running *or* a stopped session, one form for both. 200 EndedSession · 404 `session.not_found` (already reviewed) |
| GET `/api/sessions?days=7` | `days` 1–90, default 7 | Completed sessions of the last days, newest first, as EndedSession\[\]. The open one is never in it. |

- **Nothing closes a session but the user.** Leaving the app leaves the clock running; the session is waiting on the next visit. There is no cancel and no discard: a session started by mistake is ended with a review like any other. Design the review form so a two‑second mistake is quick to close (outcome + rating, note optional).
- **“Later” stops the clock**, so minutes measure the work, not the time until the form was filled in. While a session awaits its review nothing else can start, and the goal above it cannot be archived. Surface the owed review prominently (home banner, the step list).
- **Outcome `done` marks the step done** as of `endedAt`, not of the moment the form was sent. The other four leave the step as it is. A step ticked by hand during the session keeps its earlier time.
- **Use the id from the screen**, never “end the active one”: a tab open since yesterday could otherwise review today’s session.
- A reviewed session cannot be edited.

## 12. I’m struggling

The button the app exists for. Available anywhere, most of all during a session. One request does the whole thing; the server attaches the session that is open at that moment, so the body never names one.

1. **Choose the situation**: `stuck`, `tired`, `comparing` (yourself with others), `negative_thought`.
2. **Describe it in your own words**, 1 to 1000 characters.
3. **`POST /api/struggles`** and wait, with a visible spinner and the typed text kept. Usually 5–17 s; the server gives up after 45 s with a 503.
4. **Show `advice` and `nextStep`**, in the user’s language, with `dir="auto"`. Both come from the model and are the only text the backend ever writes for a person.
5. **Ask “Did you continue?”** at a fitting moment (after the next step, at the end of the session, on the next visit): `PATCH /api/struggles/:id` with `{ "continued": true|false }`. **Once.** Confirm before sending; a second answer is 409.

```
POST /api/struggles
{ "situation": "stuck",
  "description": "I have read the same JOIN explanation three times and still cannot write the query." }

201
{ "id": "uuid", "situation": "stuck", "description": "…",
  "advice": "Being stuck is where learning happens, not a sign about your ability. …",
  "nextStep": "Write down exactly which two tables you want to join and which column connects them.",
  "continued": null, "sessionId": "uuid-or-null", "createdAt": "2026-10-19T…" }
```

| Answer | Code | Meaning for the screen |
| --- | --- | --- |
| 400 | `validation.failed` | Missing or unknown situation, empty or long description, or a field the route does not know (`sessionId` is one) |
| 409 | `struggle.onboarding_required` | Onboarding not complete; the body lists `missing`. Hide the button or route to the wizard |
| 429 | `ai.daily_limit` | Ten model calls today already (advice and breakdowns together). Nothing was sent. Comes back at the user’s midnight |
| 503 | `ai.unavailable` | The model did not answer. Nothing was saved; the person may press again in a minute |

Why “did you continue?” matters

The advice is a hypothesis; the answer is the result. “Times I struggled and continued anyway” is the headline number on the progress page, and only this answer, with `continued: true`, feeds it. There is no list of past struggles yet; keep the ids of today’s struggles in client state if the question is asked later in the same visit.

## 13. Progress and history

```
GET /api/progress?days=7
{ "days": [ { "date": "2026-10-13", "focusMinutes": 50, "stepsDone": 2, "struggledAndContinued": 1 },
            …  /* one entry per day, zeros where nothing happened, oldest first, today last */ ],
  "totals": { "focusMinutes": 310, "stepsDone": 9, "struggledAndContinued": 4 } }
```

- **Every day is present**, so the chart gets an even axis without filling gaps. `days` is 1 to 90 (default 7); the same value draws the week and lists its sessions (`GET /api/sessions?days=7`), so one control can drive both.
- **`date` is already the user’s day** (their account timezone) as `YYYY-MM-DD`. Do not parse it into a `Date` and reformat it through the browser’s timezone; it can shift by a day. Format the string itself.
- **Minutes are whole**, summed before rounding: a few seconds of work show 0. A running session adds nothing yet; a stopped one awaiting review counts. A session counts entirely on the day it started.
- **Numbers can go down**: a done step that is later deleted (possible only while it has no session) no longer counts.
- **Headline:** `totals.struggledAndContinued`. Then minutes and steps. Nothing per goal or per task exists; add days up client‑side for weeks or months.

## 14. English and Arabic

Three kinds of text, each with one home:

| Kind | Examples | Who writes it in the user’s language |
| --- | --- | --- |
| App text | Buttons, the onboarding questions and their “why” lines, option labels, error sentences | **The frontend**, from `en.json` / `ar.json` |
| User text | Answers, goal titles, notes, struggle descriptions | Nobody. Stored and shown as written |
| AI text | `advice`, `nextStep`, breakdown steps | The backend’s model call, in `user.locale` (steps: the task title’s language) |

- The API translates nothing and ignores `Accept-Language`. The person’s language is `user.locale`; the switch is `PATCH /api/auth/me`. Apply the new language immediately client‑side and let the call make it follow the account to other devices.
- No language in the URL. Direction follows the locale: `dir="rtl"` on the document for `ar`, logical properties (`margin-inline-start`, `padding-inline-end`, `text-align: start`) everywhere, icons that imply direction mirrored.
- **`dir="auto"` on every piece of user or AI text**: an Arabic user writes “تعلم PostgreSQL”, an English user may paste Arabic. The model can also, rarely, answer in the other language; the backend saves it anyway and logs the mismatch.
- Arabic wording must not assume a gender: the app does not ask for one. Phrase in the second person without gendered forms where the language allows, or in the neutral plural.
- The “never diagnose, no shame” rule applies to translations too. The product owner reviews the Arabic wording of the onboarding questions before it ships.
- Numbers and dates: format with the locale (`Intl`), but the chart’s `date` strings stay as they are until formatted for display.

## 15. Not built, on purpose

So the UI does not wait for or imitate something that is not there:

- No `GET /api/struggles` list, and no way to change a “did you continue?” answer. A struggle exists in the client only from the moment it was created.
- No editing of a session review, no cancel, no delete.
- No single‑item GET for a goal, task or step. Lists only; the active session carries the names the timer screen needs.
- No changing the timezone or the email; no password reset, email verification or OAuth.
- No pagination anywhere: lists are per goal or per task, history and progress are bounded by `days`.
- No progress per goal or per task, no weekly or monthly units.
- No evaluation quiz yet (a later phase), and no retaking the check‑in over time.
- The Swagger page is off in production: only the web app talks to the API there.

Each of these has a reason in `DECISIONS.md`. If a screen needs one of them, it is a new backend issue, not a workaround in the frontend.

## 16. Endpoint reference

All 31 routes, in the order a person meets them. 🔒 needs the cookie. The full schemas with every limit and example are in [openapi.json](openapi.json); the live version is at `/api/docs-json` while the API runs.

| Method | Path | Purpose | Success | Errors besides 400 · 401 |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | API up, database reachable | 200 `{status:"ok"}` | 503 |
| POST | `/api/auth/register` | Create account, set cookie | 201 User | 409 email_taken · 429 |
| POST | `/api/auth/login` | Log in, set cookie | 200 User | 401 invalid_credentials · 429 |
| POST | `/api/auth/logout` | End session, clear cookie | 204 | none |
| GET | `/api/auth/me` 🔒 | Current user | 200 User |  |
| PATCH | `/api/auth/me` 🔒 | Change `locale` | 200 User |  |
| GET | `/api/profile/onboarding` 🔒 | Which screens are saved, what is missing | 200 OnboardingStatus | never 404 |
| GET | `/api/profile` 🔒 | All seven screens | 200 Profile | 404 onboarding_not_done |
| GET | `/api/profile/sections/{screen}` 🔒 | One screen: `basics` `situation` `achievements` `patterns` `self-view` `confidence` `values` | 200 | 404 screen_not_saved |
| PUT | `/api/profile/sections/{screen}` 🔒 | Save one screen, whole | 200 |  |
| GET | `/api/goals` 🔒 | Active goals; `?archived=true` | 200 Goal\[\] |  |
| POST | `/api/goals` 🔒 | Create a goal with its why | 201 Goal | 409 onboarding_required + missing |
| PATCH | `/api/goals/{id}` 🔒 | Change sent fields | 200 Goal | 404 |
| DELETE | `/api/goals/{id}` 🔒 | Delete, no history | 204 | 404 · 409 has_work_history |
| POST | `/api/goals/{id}/archive` 🔒 | Archive | 200 Goal | 404 · 409 session_running |
| POST | `/api/goals/{id}/unarchive` 🔒 | Unarchive | 200 Goal | 404 |
| GET | `/api/goals/{goalId}/tasks` 🔒 | Tasks with status | 200 Task\[\] | 404 |
| POST | `/api/goals/{goalId}/tasks` 🔒 | Add a task | 201 Task | 404 · 409 archived |
| PATCH | `/api/tasks/{id}` 🔒 | Rename | 200 Task | 404 · 409 archived |
| DELETE | `/api/tasks/{id}` 🔒 | Delete, no history | 204 | 404 · 409 archived / has_work_history |
| POST | `/api/tasks/{id}/breakdown` 🔒 | Model suggests 3–7 step titles; nothing saved | 200 Breakdown | 404 · 409 archived · 429 · 503 |
| GET | `/api/tasks/{taskId}/steps` 🔒 | Steps in order | 200 Step\[\] | 404 |
| POST | `/api/tasks/{taskId}/steps` 🔒 | Add a step, last | 201 Step | 404 · 409 archived |
| PUT | `/api/tasks/{taskId}/steps/order` 🔒 | Reorder, all ids once | 200 Step\[\] | 400 order_mismatch · 404 · 409 archived |
| PATCH | `/api/steps/{id}` 🔒 | Rename, done / not done | 200 Step | 404 · 409 archived |
| DELETE | `/api/steps/{id}` 🔒 | Delete, no history | 204 | 404 · 409 archived / has_work_history |
| POST | `/api/sessions` 🔒 | Start on a step | 201 Session | 404 · 409 already_active / step_done / archived |
| GET | `/api/sessions/active` 🔒 | The open session | 200 Session | 404 none_active |
| POST | `/api/sessions/{id}/stop` 🔒 | Stop the clock, review later | 200 Session | 404 not_running |
| POST | `/api/sessions/{id}/end` 🔒 | Review and complete | 200 EndedSession | 404 not_found |
| GET | `/api/sessions?days=7` 🔒 | Completed sessions, newest first | 200 EndedSession\[\] |  |
| POST | `/api/struggles` 🔒 | Advice and one next step | 201 Struggle | 409 onboarding_required · 429 · 503 |
| PATCH | `/api/struggles/{id}` 🔒 | Did you continue? Once | 200 Struggle | 404 · 409 already_answered |
| GET | `/api/progress?days=7` 🔒 | Per day: minutes, steps, struggled‑and‑continued; totals | 200 Progress |  |

Response shapes at a glance

```
User          { id, email, timezone, locale }
Profile       { basics|null, situation|null, achievements|null, patterns|null, selfView|null, confidence|null, values|null }
Onboarding    { completed, screens: {7 booleans}, missing: Screen[] }
Goal          { id, title, whyItMatters, obstacle|null, firstOutcome|null, createdAt, archivedAt|null }
Task          { id, goalId, title, status, createdAt }
Step          { id, taskId, title, doneAt|null, createdAt }
Session       { id, startedAt, endedAt|null, step:{id,title}, task:{id,title}, goal:{id,title} }
EndedSession  Session + { endedAt, outcome, rating, note|null }
Struggle      { id, situation, description, advice, nextStep, continued|null, sessionId|null, createdAt }
Breakdown     { steps: string[] }
Progress      { days: [{ date, focusMinutes, stepsDone, struggledAndContinued }], totals: {…} }
ApiError      { statusCode, error, code, message, missing? }
Validation    ApiError + { message: string[], errors: [{ field, code }] }
```

Built from the backend at commit 9d0379e (2026‑10‑19): 31 routes, 29 error codes, e2e‑tested against a real PostgreSQL. Questions about a rule go to `DECISIONS.md` first; the date on each entry says when and why it was decided.