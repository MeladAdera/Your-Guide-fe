# 01 · Onboarding wizard

Status: **spec** (2026-10-22, design approved 2026-10-28) · building · verified · done

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

**Design approved by the owner on 2026-10-28** (drawn in a temporary preview, compared against a one-question-at-a-time look and a plain column). Every screen shares one frame, the **wizard shell**, built from the sign-in screen (`docs/DESIGN.md`):

1. **No app navigation.** Above the card only the logo and EN / AR, as on sign-in.
2. **Laptop: the sign-in layout.** The card holds the questions on the start side and a mint tile (38% wide, 12px inset, sticky while the questions scroll) on the end side. The tile shows "Why we ask" and the screen's why line in large type (`onboarding.why.*`, §9), a drawn path of seven points (saved screens filled, the current one ringed, the rest faint) ending at a flag that stands for the first goal, and "n of 7 saved · your first goal waits at the flag".
3. **Phone: no tile.** A thin seven-segment line with `Step n of 7` at the top, the title, the why line under it in muted text, then the questions.
4. **Title** of the screen (`onboarding.screens.*`): 48px on a laptop with `Step n of 7` above it, 30px on a phone.
5. **The questions:** only the required ones show at first. The optional ones sit in a collapsed row **"Add more, if you like · n optional questions"** that opens in place, so every screen looks short. Optional labels carry a small "optional".
6. **Footer**, fixed at the bottom on phones: **Back** (ghost) and **Save and continue** (primary, arrow). On screen 1 **Skip for now** takes Back's place. On screen 7 the primary button reads **Save and write my first goal**.

The one primary action per screen is Save and continue.

### Screen 1 · Basics

Large rounded tap chips (44px tall, full radius); a chosen chip turns action green with a tick. Shown at first: the situation chips, the occupation field and the age chips. Education, years of experience and country sit under "Add more, if you like".

| Element | Field | Control | Limit |
| --- | --- | --- | --- |
| "What is your situation right now?" | `employmentStatus` | 7 chips, single choice (radio group): student, employed, self-employed, between jobs, caregiver, retired, other | required if saved |
| "What do you do now, in your words?" | `occupation` | single-line text, `dir="auto"` | ≤120 |
| "Age range" | `ageRange` | 6 chips | optional |
| "Education" | `educationLevel` | 6 chips, under "Add more" | optional |
| "Years of experience" | `yearsExperience` | 5 chips, under "Add more" | optional |
| "Country" | `country` | native select, names from `Intl.DisplayNames` in the current language, sorted, under "Add more" | optional, ISO alpha-2 |

### Screens 2–5 · Text screens

One shared component, `TextScreen`, fed by a per-screen definition. Each question is a multi-line text area (rounded 12px, on `bg-card`) that grows with its content, `dir="auto"`, with a character count that appears once the text passes 80% of the limit. Under each required question a small mint **starter** chip ("Start with: “I keep putting off…”") puts its phrase into an empty field and places the cursor after it, for the moment the page feels blank (§9 lists the phrases).

| Screen | Required | Optional | Limit |
| --- | --- | --- | --- |
| situation | `typicalDay` "What does your typical day look like?" · `wantToChange` "What would you most like to change?" | `satisfiedWith` "What part of your life are you satisfied with?" · `wishMoreTimeFor` "What do you wish you had more time for?" | 1000 |
| achievements | `proudOf` "Something you achieved, got through, or surprised yourself with." | `whatWasHard` "What was difficult about it?" · `learnedAboutSelf` "What did you learn about yourself from it?" | 1000 |
| patterns | `oftenPostpone` "What do you keep postponing or avoiding?" | `lessonFromMistake` "A mistake or regret that taught you something." · `patternToChange` "A habit or pattern you would like to change." | 1000 |
| self-view | `whoIAm` "Describe yourself honestly. Who are you at this point in your life?" | `goodAt` "What are you naturally good at?" · `othersComeToMeFor` "What do other people usually come to you for?" · `stillFiguringOut` "What are you still trying to understand about yourself?" | 3000 for `whoIAm`, 1000 for the rest |

### Screen 6 · Quick check-in

**One statement at a time.** Eight statements in the handoff's exact English wording. Above the statement a small eight-segment line with "3 of 8"; the statement in large type (30px laptop, 24px phone); below it five full-width answers stacked as a radio group: Strongly disagree, Disagree, Not sure, Agree, Strongly agree (1 to 5). Tapping an answer marks it (green with a tick) and moves to the next statement after a short pause; Back goes to the previous statement before it leaves the screen. Save and continue is enabled once all eight have an answer. The statement index is component state, not the URL; on return the screen opens at the first unanswered statement. Nothing is computed from the answers and nothing is shown after saving. The why line says so. (Not taken: circles growing in size, chips per statement, a five-box bar.)

### Screen 7 · What matters to you

1. **Values**: ten chips (`LIFE_VALUES`), multi-select, "n of 5 chosen" beside the label "Your values". A tapped chip **rises** into a "Your values" list above the remaining chips: a soft accent panel per value with the green chip and a short field "Why this one matters to you (optional)" (≤300). Tapping the chip in the list puts it back. When five are chosen the remaining chips are disabled. Fewer than two shows the `arrayMinSize` message on save.
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

(The sketch above predates the approved design: the phone now has no mint strip and the optional questions are tucked, §3.)

Laptop: the sign-in card, questions on the start side (up to 600px), the mint "Why we ask" tile with the path on the end side; the footer at the end of the questions, not fixed. The app shell's navigation is hidden during the wizard; only the logo and EN / AR stay above the card.

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
6. **Check-in one statement at a time, five worded answers** (owner's choice, 2026-10-28). Reason: eight agree/disagree rows are the most tiring part of the wizard; one at a time with big targets feels quick and invites an honest answer. Every answer is a visible word, so the accessible name is the label itself.
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

Starter phrases (one per required text question; English first, Arabic proposed):

| Field | English | Arabic |
| --- | --- | --- |
| `typicalDay` | Most days I… | في معظم الأيام… |
| `wantToChange` | I'd like to change… | أودّ أن يتغيّر… |
| `proudOf` | Once, I managed to… | مرّةً، استطعتُ أن… |
| `oftenPostpone` | I keep putting off… | ما زلتُ أؤجّل… |
| `whoIAm` | Right now, I am someone who… | الآن، أنا شخص… |
| `personToBecome` | I want to become someone who… | أريد أن أصبح شخصاً… |

The questions themselves, the chip labels for the fixed lists, and the scale labels go into the same namespace during build step 2 to 5; the Arabic of each is flagged for your review in the pull of that step.

## 10. Open questions and follow-ups

- None for the backend. `GET /api/profile/onboarding` already reports `basics` separately, which is what the skip needs.
- Follow-up for feature 8: the same screen components in an "edit" mode on `/settings/profile`, with free navigation between screens.
