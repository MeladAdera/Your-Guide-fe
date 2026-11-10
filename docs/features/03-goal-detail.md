# 03 · Goal detail: tasks and steps

Status: **built 2026-11-10** (5f4f3c0, 96d8e1e) without a design round, on the owner's word · the Playwright paths pass against the local API on phone and laptop · **owner's design review pending** (§8) · still to do by hand: Arabic and dark mode; one real breakdown call against the model (the tests play its answer)

## 1. Job

Break a goal into tasks, and tasks into steps small enough for one sitting. The model can suggest steps; the person keeps, edits or drops each suggestion, and nothing is saved until they say so. After this feature every goal has a page, the goals list and the first goal's arrival lead to it, and focus sessions (feature 5) have steps to start from.

Rules that apply: **the person stays the author** (suggestions are returned, never saved by the API; the person picks); **a task's status is derived, never set** (to do → in progress → done follows the steps).

## 2. Page and route

`/goals/[id]`. There is no `GET /api/goals/:id`, so the server render finds the goal in the active and archived lists (404 page when it is in neither), then loads its tasks and every task's steps in parallel. Reason for loading all steps at once: a goal has a handful of tasks, the lists are small and unpaginated, and the page then opens complete, with no spinner per task. Alternative not taken: steps fetched when a task is opened, which would add a wait to the most common action.

## 3. What is on the page

1. **Back to Goals**, then the goal: "Goal" above the title (48px laptop, 30px phone), why it matters, and "If it gets hard" / "First sign" when given. **Edit goal** opens the goal dialog from feature 2.
2. **Archived goal**: a soft notice "This goal is archived. Everything is kept, and it is read-only." with **Unarchive**; the whole tree below renders without any edit control.
3. **Tasks**, with "n of m done". Each task is a rounded card:
   - Header: an open/close toggle with the title, the status chip (To do, In progress, Done; Done in the done green) and "n of m steps".
   - A **⋯** menu: Rename, Delete. Rename turns the title into a field in place (Enter saves, Escape cancels). Delete asks first; `task.has_work_history` is explained in the dialog (it has sessions behind it and keeps the progress).
   - Open: its steps, then **Add a step** (a field; Enter adds and keeps the field ready for the next), then **Break into steps** (only while the task has no steps left to do, see §6.4).
4. **Steps**: a checkbox and the title (done steps muted and struck through). A **⋯** menu per step: Rename, Move up, Move down, Delete. Ticking a step is instant (optimistic) and says "Step done." quietly to screen readers; ticking the last one turns the chip to Done. Delete is immediate (a step is one line); `step.has_work_history` comes back as a toast.
5. **Add a task** at the end of the list, as a field.
6. **No tasks yet**: "Start with one task: a part of this goal you can name." and the Add a task field.

Which tasks are open on arrival: the first task that is not done; all of them when there are three or fewer. The open/closed state is component state, not the URL.

### Break into steps (the suggestion dialog)

1. Opens and calls `POST /api/tasks/:id/breakdown` at once: "Finding small steps…" with a spinner and "This can take up to 45 seconds." and **Cancel**, which aborts the request.
2. The 3–7 suggestions arrive as rows: a checkbox (on) and the title in an editable field. "Keep the ones that fit, change any of them."
3. **Add n steps** creates the kept ones one by one, in order, with `POST …/steps`; then the dialog closes and the task shows them. If one fails, the ones already added stay and the alert says so; pressing again adds the rest.
4. `ai.daily_limit`: "Today's suggestions are used up. They come back tomorrow." Both AI buttons (this one and, in feature 6, the struggling advice) stay disabled until the person's next day: the date is kept under `yg:ai-limit` in the account's time zone.
5. `ai.unavailable`: the message and **Try again**, in the same dialog.

## 4. States

- **Loading**: none on open (server render). Buttons show their pending state.
- **Errors**: field errors under the add/rename fields; card actions report in a toast in the API's own words (`errors.*`); `step.order_mismatch` reloads the steps and says the list changed.
- **401**: the global listener.

## 5. API integration

| Call | When | After |
| --- | --- | --- |
| `GET /api/goals/:goalId/tasks` | server render; after any step or task change | statuses refresh |
| `GET /api/tasks/:taskId/steps` | server render; after a step change | |
| `POST /api/goals/:goalId/tasks` · `PATCH /api/tasks/:id` · `DELETE /api/tasks/:id` | add, rename, delete a task | refresh the tasks |
| `POST /api/tasks/:taskId/steps` · `PATCH /api/steps/:id` · `DELETE /api/steps/:id` | add, tick/untick, rename, delete a step | refresh the steps and the tasks |
| `PUT /api/tasks/:taskId/steps/order` | Move up / Move down | every step id of the task, in the new order |
| `POST /api/tasks/:id/breakdown` | Break into steps | nothing saved; the kept titles are posted one by one |

Query keys: the goal `["goals", "detail", id]` (found in the lists, so it follows edits and archiving because every goal write invalidates `["goals"]`), tasks `["goals", id, "tasks"]`, steps `["tasks", taskId, "steps"]`. Server data fills them as `initialData`.

**Optimistic** for the checkbox and for moving a step (the two actions that must feel instant), with rollback on error; everything else waits for the API, because adds and deletes are rarer and a wrong guess would be confusing.

## 6. Decisions

1. **Start session is not on the step yet.** It belongs to feature 5: starting a session opens it on the server, and until the session screen exists nobody could end it, while an open session blocks archiving its goal and starting any other session. The button arrives with the session screen.
2. **Move up / Move down in the step menu, no drag and drop yet.** They work with keyboard, screen reader and touch, add no dependency, and send the same `PUT …/order`. Drag and drop (`@dnd-kit`, with a handle and long press) can come at the owner's review as an addition, never a replacement.
3. **A menu (⋯) per task and step** instead of visible buttons: a row with a checkbox, a title and three buttons is too crowded on a phone. The menu is Radix's (keyboard and screen-reader ready).
4. **Break into steps shows while the task has no open steps** (none yet, or all done), plus always in the task's menu. Reason: suggestions are most useful on an empty task, and a daily limit of ten model calls should not be spent by accident.
5. **The daily limit is remembered per device and per day** (`yg:ai-limit`, the account's date). The API is still the judge; this only spares a call that would be refused.

## 7. Tests

- Unit, `src/features/tasks/tasks.test.ts`: moving a step up/down, the derived status, the daily-limit day in the account's time zone.
- Playwright, `e2e/tasks.spec.ts` (needs the API), phone and laptop: from the goals list to a goal; add a task and three steps in a row; tick (chip to In progress, then Done after a delete and the last tick); rename and move a step, the order surviving a reload; rename and delete the task; break into steps with the model's answer played (keep two of three, edit one), then `ai.daily_limit` resting the button; an archived goal read-only until unarchived. `e2e/goals.spec.ts` checks the arrival's "Break it into tasks" link.

## 8. Design choices made without the owner (for the review)

- The page as a single column (about 760px) in the app card; tasks as rounded cards, open/close per task; status chip colours.
- ⋯ menus for task and step actions; Move up/down instead of drag and drop.
- The suggestion dialog: rows with a checkbox and an editable field, all kept by default.
- Arrival of the first goal now leads to "Break it into tasks" (the goal page), with Home as the quiet second choice.
