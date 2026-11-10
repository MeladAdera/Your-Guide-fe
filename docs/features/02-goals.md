# 02 · First goal and goals list

Status: spec 2026-11-10 · built without a design round, on the owner's word ("build as you see fit; I will come back to each page") · **owner's design review pending** (§8)

## 1. Job

Write the first goal right after the person has said what matters to them, and later keep goals in order: add, edit, archive, unarchive, delete. After this feature the start-up router has somewhere real to send a person with no goal, and every later feature (tasks, sessions, struggling) has a goal to hang from.

Rules that apply: **the goal comes last** (the API refuses a goal until onboarding 2–7 is saved); **the person stays the author** (nothing is suggested or filled in without a tap; the backend has no AI for goals and the page must not look as if it had one).

## 2. Pages and routes

| Route | What | Data |
| --- | --- | --- |
| `/onboarding/goal` | The first goal, the wizard's last step, then the arrival moment | `GET /api/profile/onboarding` (guard), `GET /api/goals` (guard), `GET /api/profile` (their own words) |
| `/goals` | Active and archived goals, with add, edit, archive, unarchive, delete | `GET /api/goals`, `GET /api/goals?archived=true` |

`/onboarding/goal` sends a person with unsaved screens to the first missing one, and a person who already has a goal to `/goals`. It is a static route beside `/onboarding/[screen]`.

## 3. What is on the page

### The first goal (`/onboarding/goal`)

Built on the wizard's card: the questions on the start side, the mint tile on the end side (laptop); one column on a phone.

1. Above the title "The last step", the title "Your first goal", one intro line.
2. **Which of your values does this serve?** Their 2–5 values as toggle chips (optional, not saved: the API has no field for it). Tapping some changes the starter of the why to "Because Family and Health matter to me". Reason: recalling one's own values before a hard commitment makes people more open to it (self-affirmation research).
3. **What would you like to change or accomplish?** (`title`, required, ≤200).
4. **Why does it matter to you?** (`whyItMatters`, required, ≤1000) with the starter chip.
5. **What might get in the way?** (`obstacle`, optional, ≤1000), framed as an if–then plan: the starter is "If I start to put it off, then I will", and their own screen-4 answer is quoted under the label ("Earlier you wrote: …"), display only. Reason: if–then plans are among the best-supported tools in goal research, and this one is quoted back later when they struggle.
6. Under "Add more, if you like": **What would be the first sign you are moving?** (`firstOutcome`, optional).
7. Footer: Back (to values) and **Save my goal**.

**The tile (laptop): their own words, and the goal taking shape.** "In your own words": the values as chips, "You want to become" with their answer, "You'd like to change" with theirs. At the bottom the path, all seven points filled, and at the flag the goal as they type it ("Your goal appears here" while empty). Phone: the same words in a mint panel that opens on tap ("Your own words"); no live preview, since the field is right there.

**Drafts** as in onboarding: `yg:draft:goal`, restored into empty fields, dropped on save.

### The arrival moment

After a successful save the same card changes in place (no new route): the tile shows the journey picture with its flag and "Your path has a flag now."; the main side shows "Your first goal", the goal as the heading, why it matters, and the if–then and first sign when given. Then "Next: break it into steps small enough for one sitting." and **Go to Home**. Focus moves to the heading. When feature 3 exists, the button becomes "Break it into tasks" and goes to the goal.

### Goals (`/goals`)

1. Heading "Goals", intro, and **New goal** at the end of the heading row.
2. Tabs **Active** and **Archived**, each with its count.
3. A card per goal: the title, why it matters (three lines, then cut), and when given "If it gets hard" and "First sign" in small text, plus "Since 4 November". Active cards: **Edit**, **Archive**, **Delete** as quiet text buttons. Archived cards: read-only, **Unarchive** only.
4. New and Edit open a dialog with the same four questions.
5. Delete asks first. If the API answers `goal.has_work_history`, the dialog changes to "This goal has work behind it, so it can be archived instead, with everything kept." and offers **Archive**.
6. After archive, unarchive or delete a short toast says what happened.
7. Empty: Active "No active goals. A goal gives every step a reason." with New goal; Archived "Archived goals appear here, with everything kept."

## 4. States

- **Loading**: server-rendered; no spinner on open. Buttons show their pending state.
- **Field error**: under the field (client zod or server `validation.failed`, as in onboarding, including the form alert for fields with no place).
- **409 `goal.onboarding_required`** on the first goal: go to the first missing screen.
- **409 `goal.session_running`** on archive: the toast says a session is open under this goal.
- **Network / unknown**: form alert in the form or dialog; a toast for card actions.

## 5. API integration

| Call | When | After |
| --- | --- | --- |
| `POST /api/goals` | Save my goal, New goal | arrival moment / close the dialog, refresh both lists |
| `PATCH /api/goals/:id` | Edit | all four fields sent, empty optional ones as `null` (clears them) |
| `DELETE /api/goals/:id` | Delete | 204 → refresh; 409 `goal.has_work_history` → offer archive |
| `POST /api/goals/:id/archive` · `/unarchive` | buttons | refresh both lists |

Lists are TanStack queries `["goals", "active"]` and `["goals", "archived"]`, filled from the server render (`initialData`); every write invalidates `["goals"]`. Not optimistic: these are rare, deliberate actions, and a wrong optimistic move of a goal between tabs would be confusing; the round trip is short.

## 6. Decisions

1. **The arrival is a state of the same page, not a route.** There is no `GET /api/goals/:id`, the moment only makes sense right after saving, and a reload should not replay it (the start-up router sends the person Home instead).
2. **The value chips are not saved.** The API has no field; they shape the why's starter only. Alternative not taken: writing the chosen values into the why without a tap.
3. **The if–then is one text, stored in `obstacle`.** Two fields ("if" / "then") would have to be glued together and split again on edit; one sentence with a starter does the same job.
4. **Goal cards do not link anywhere yet.** `/goals/[id]` is feature 3.
5. **Text buttons on the card instead of an overflow menu.** Three actions fit, stay visible and need no extra component.

## 7. Tests

- Unit: the goal schema and payload (required, limits, empties as `null`, trimming), the why starter from the chosen values.
- Playwright (needs the API): an account with onboarding filled through the API writes its first goal, sees the arrival, goes Home, and `/` then lands on Home; on `/goals` a second goal is added, edited, archived, unarchived and deleted.

## 8. Design choices made without the owner (for the review)

- First goal: the wizard card with "their own words" and the live goal at the flag in the tile; value chips as an anchor; the if–then starter; first sign under "Add more".
- Arrival: in-place change, journey picture in the tile, no hold-to-commit (a normal button; hold-to-commit can be added at review).
- Goals list: single column of cards, tabs, text-button actions, dialogs for new/edit/delete, toasts.
