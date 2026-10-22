# 01 · Onboarding wizard

Status: **spec** (2026-10-22) · building · verified · done

## 1. Job

Seven short screens about the person, saved one at a time, before any goal exists. After this feature a new account can answer the screens in order, stop and come back later at the right place, and reach "Your first goal" (feature 2) with screens 2 to 7 saved.

Rules that apply: **the app never diagnoses** (screen 6 shows no score, no total, no label); **the goal comes last** (the backend refuses a goal until 2–7 are saved, so the wizard ends at the goal and not before); **the person stays the author** (every answer is their own text, stored as written).

## 2. Pages and routes

One route per screen, so refresh, back and a shared link all land on the right step.

| Route | Screen | Saved to | Required |
| --- | --- | --- | --- |
| `/onboarding/basics` | 1 · Basics (skippable) | `PUT /api/profile/sections/basics` | `employmentStatus` |
| `/onboarding/situation` | 2 · Your days now | `…/situation` | `typicalDay`, `wantToChange` |
| `/onboarding/achievements` | 3 · What you have done | `…/achievements` | `proudOf` |
| `/onboarding/patterns` | 4 · What gets in the way | `…/patterns` | `oftenPostpone` |
| `/onboarding/self-view` | 5 · How you see yourself | `…/self-view` | `whoIAm` |
| `/onboarding/confidence` | 6 · Quick check-in | `…/confidence` | all eight statements |
| `/onboarding/values` | 7 · What matters to you | `…/values` | `values` (2–5), `personToBecome` |
| `/onboarding/goal` | Your first goal | feature 2 | |

Reached from: `/` (the start-up router sends a new account to `basics`, a returning one to the first missing screen), and from the (app) shell's nav, which is hidden during the wizard.

## 3. What is on the page

Every screen shares one frame, the **wizard shell**:

1. **Progress line**: a thin seven-segment bar; saved screens filled, the current one half, the rest empty. Below it the text `Step n of 7` (`onboarding.stepOf`).
2. **Title** of the screen (`onboarding.screens.*`) and **one "why" line** that says why the app asks (`onboarding.why.*`, frontend copy, see §9).
3. **The questions**, required first, optional ones marked "(optional)". Each question is a label; under required long questions nothing else, under optional ones nothing else. No placeholders inside the fields except where noted; the label carries the question.
4. **Footer**, sticky at the bottom on phones: **Back** (ghost, hidden on screen 1) and **Save and continue** (primary, `xl`). On screen 1 also **Skip for now** (link) because basics is optional. On screen 7 the primary button reads **Save and write my first goal**.

The one primary action per screen is Save and continue.

### Screen 1 · Basics

| Element | Field | Control | Limit |
| --- | --- | --- | --- |
| "What is your situation right now?" | `employmentStatus` | 7 chips, single choice (radio group): student, employed, self-employed, between jobs, caregiver, retired, other | required if saved |
| "Age range" | `ageRange` | 6 chips | optional |
| "Education" | `educationLevel` | 6 chips | optional |
| "Years of experience" | `yearsExperience` | 5 chips | optional |
| "Country" | `country` | native select, names from `Intl.DisplayNames` in the current language, sorted | optional, ISO alpha-2 |
| "What do you do now, in your words?" | `occupation` | single-line text, `dir="auto"` | ≤120 |

### Screens 2–5 · Text screens

One shared component, `TextScreen`, fed by a per-screen definition. Each question is a multi-line text area that grows with its content, `dir="auto"`, with a character count that appears once the text passes 80% of the limit.

| Screen | Required | Optional | Limit |
| --- | --- | --- | --- |
| situation | `typicalDay` "What does your typical day look like?" · `wantToChange` "What would you most like to change?" | `satisfiedWith` "What part of your life are you satisfied with?" · `wishMoreTimeFor` "What do you wish you had more time for?" | 1000 |
| achievements | `proudOf` "Something you achieved, got through, or surprised yourself with." | `whatWasHard` "What was difficult about it?" · `learnedAboutSelf` "What did you learn about yourself from it?" | 1000 |
| patterns | `oftenPostpone` "What do you keep postponing or avoiding?" | `lessonFromMistake` "A mistake or regret that taught you something." · `patternToChange` "A habit or pattern you would like to change." | 1000 |
| self-view | `whoIAm` "Describe yourself honestly. Who are you at this point in your life?" | `goodAt` "What are you naturally good at?" · `othersComeToMeFor` "What do other people usually come to you for?" · `stillFiguringOut` "What are you still trying to understand about yourself?" | 3000 for `whoIAm`, 1000 for the rest |

### Screen 6 · Quick check-in

Eight statements in the handoff's exact English wording, each a radio group of five options from 1 (strongly disagree) to 5 (strongly agree). On phones the five options are a row of equal buttons with the two end labels above the row; every option has an accessible name (strongly disagree, disagree, neither, agree, strongly agree). Nothing is computed from the answers and nothing is shown after saving. The why line says so.

### Screen 7 · What matters to you

1. **Values**: ten chips (`LIFE_VALUES`), multi-select, "n of 5 chosen" beside the label. Picking a chip reveals, under the chip row, a short text field for that value: "Why this one matters to you." (optional, ≤300). When five are chosen the unchosen chips are disabled. Fewer than two shows the `arrayMinSize` message on save.
2. `personToBecome` "What kind of person do you want to become?" (required, ≤1000).
3. `wouldRegretNotDoing` "What would you regret not doing?" (optional).
4. `rememberedFor` "What do you want people to remember about you?" (optional).

## 4. Layout

Phone (about 400px):

```
+------------------------------+
| ▮▮▮▮▯▯▯   Step 4 of 7         |
| What gets in the way          |
| Naming what gets in the way   |
| makes it smaller.             |
|                               |
| What do you keep postponing   |
| or avoiding?                  |
| [                           ] |
| [                           ] |
|                               |
| A mistake or regret that      |
| taught you something.         |
| (optional)                    |
| [                           ] |
|                               |
| ...                           |
+-------------------------------+
| [ Back ]  [ Save and continue]|   sticky footer, safe-area padding
+-------------------------------+
```

Laptop (about 1024px): the same single column centred at 640px, the footer not sticky but at the end of the column. No second column. The app shell's navigation is hidden during the wizard; only the brand, the language switch and the theme toggle stay in the header.

States:

- **Loading**: a skeleton with the progress line, a title bar and two text-area blocks in the column.
- **Empty** (section never saved, `profile.screen_not_saved`): the form with empty fields; a draft from this browser is restored if one exists (§6).
- **Saving**: the primary button disabled with the label unchanged; fields stay editable.
- **Field error** (client zod or server `validation.failed`): the sentence under the field named by `field`; for the values list the path `values.0.note` maps to the note of the first chosen value. Focus moves to the first field with an error.
- **Form error** (`network`, `unknown`): an alert above the footer, text kept.
- **401**: the global listener sends the person to login with the return path.
- **Success**: navigate to the next screen; the progress line advances. No toast.

## 5. API integration

| Call | When | On success | Errors handled |
| --- | --- | --- | --- |
| `GET /api/profile/onboarding` | shell load, server-side | fills the progress line | none expected; 401 → login |
| `GET /api/profile/sections/<screen>` | screen load, server-side | prefills the form | 404 `profile.screen_not_saved` → empty form |
| `PUT /api/profile/sections/<screen>` | Save and continue | go to the next screen | 400 `validation.failed` → per field; `network`/`unknown` → form alert |

Data flow: the screen page is a Server Component that fetches the section and the onboarding status with `serverApi` and passes them as initial values to a Client Component form. Saving is a TanStack mutation; on success `router.push(next)` and the next page fetches its own section fresh. No query cache is kept for sections; there is nothing to share between screens.

Payload rules from the handoff: PUT replaces the whole screen, so every field is sent, optional empties as `null`; text is trimmed in the form before sending; never send `updatedAt` or unknown fields.

## 6. Decisions (proposed, to confirm before building)

1. **Unsaved draft per screen in `localStorage`.** Typing is saved under `yg:draft:<screen>` (debounced), restored only into fields the server returned empty, cleared on a successful save. Reason: a long answer lost to a closed tab is the one thing that makes people abandon a wizard. Alternative not taken: autosave to the API on change, because PUT replaces the whole screen and would write half-answers.
2. **Back and Next only on the first pass.** The progress line is not clickable. Reason: the order is the product (values before plans). Jumping between answers comes with the profile page (feature 8), which reuses these screens in an "edit" mode.
3. **Server-side prefill, client-side save.** Reason: no spinner on screen open and no client cache to keep consistent; the URL is the state.
4. **Native select for the country**, names from `Intl.DisplayNames`. Reason: no country list to translate, works well on phones, fully accessible. Alternative not taken: a searchable combobox, more code for a field that is optional.
5. **One shared `TextScreen` component** for screens 2–5, driven by a definition (fields, limits, required). Reason: four screens with the same shape; copy stays in the message files.
6. **Confidence options are five labelled radios per statement.** Visible labels only at the two ends on phones, all five in the accessible names. Reason: the API documents the ends; the middle needs names for screen readers.
7. **Validation mirrors the API limits in zod** (lengths, 2–5 values, each once) so server validation is the safety net.
8. **Keyboard**: Ctrl/Cmd+Enter saves from inside a text area; Enter alone inserts a line.
9. **Arabic wording convention**: questions and why lines are phrased with nominal or neutral forms where the language allows, never a gendered imperative. You review every Arabic question before it ships.

## 7. Tests

- Unit: the zod schemas (limits, required, values 2–5 and unique), the next/previous screen helpers, the server field path mapping (`values.0.note`), the draft helper (restore only into empty fields, clear on save).
- Playwright (needs the API): register → skip basics → fill situation → achievements → patterns → self-view → confidence → values → lands on `/onboarding/goal`; reload mid-way lands on the same screen with the saved text; `/` after that returns to the first missing screen.
- By hand: both languages, RTL layout of chips and the confidence rows, phone and laptop widths, dark mode.

## 8. Build steps (one commit each)

1. Wizard shell: layout, progress line, footer, screen order helpers, the `[screen]` route wired to real pages.
2. Screen 1 Basics: chips, select, occupation; save and skip.
3. Screens 2–5: the shared text screen with the four definitions.
4. Screen 6: the check-in.
5. Screen 7: values with notes and the three questions.
6. Drafts, field-error mapping, unit tests, Playwright path, this doc completed.

## 9. Copy to add (`messages/*.json`, `onboarding` namespace)

Why lines, English first, Arabic proposed for your review:

| Screen | English | Arabic |
| --- | --- | --- |
| basics | A little context helps the advice fit your life. Everything here is optional except the first question. | القليل من السياق يساعد في أن تناسب النصيحة حياتك. كل ما هنا اختياري عدا السؤال الأول. |
| situation | Before any goal, a clear picture of where you are now. | قبل أي هدف، صورة واضحة عن الوضع الحالي. |
| achievements | You have got through hard things before. This is where the app learns that. | هناك أمور صعبة تم تجاوزها من قبل. هنا يتعرّف التطبيق على ذلك. |
| patterns | Naming what gets in the way makes it smaller. | تسمية ما يقف في الطريق تجعله أصغر. |
| selfView | In your own words, with no labels. This shapes the advice you get when it is hard. | بكلماتك أنت، وبلا تصنيفات. هذا ما يشكّل النصيحة عندما يصعب الأمر. |
| confidence | Eight statements, answered honestly. There is no score and no result. | ثماني عبارات تُجاب بصدق. لا توجد نتيجة ولا تقييم. |
| values | What matters to you comes before what you plan. The point is what is truly yours, not what sounds good. | ما يهمّك يأتي قبل ما يُخطَّط له. المهم ما هو لك فعلاً، لا ما يبدو جيداً. |

The questions themselves, the chip labels for the fixed lists, and the scale labels go into the same namespace during build step 2 to 5; the Arabic of each is flagged for your review in the pull of that step.

## 10. Open questions and follow-ups

- None for the backend. `GET /api/profile/onboarding` already reports `basics` separately, which is what the skip needs.
- Follow-up for feature 8: the same screen components in an "edit" mode on `/settings/profile`, with free navigation between screens.
