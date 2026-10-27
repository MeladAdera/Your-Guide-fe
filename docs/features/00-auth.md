# 00 · Register, log in, log out

Status: spec 2026-10-27 · building 2026-10-27 · verified · done

Design: option 4 on the sign-in canvas (the owner's reference, redrawn in ink and cobalt): https://claude.ai/artifact/EiiHptVzGuE948hWdJwEp4

## 1. Job

Let a person create an account, log in, and log out, in English or Arabic, on a phone or a laptop. The pages are honest about what comes next and what the device keeps, and they never make a mistake permanent without a chance to see it (email and timezone cannot be changed later).

## 2. Pages and routes

| Route | What it shows | Reached from |
| --- | --- | --- |
| `/register` | Create an account | `/login`, links |
| `/login` | Log in; a notice when the person was signed out by an expired session | the proxy (no cookie), the 401 listener, `/signed-out`, links |
| `/signed-out` | Confirmation after logging out | the Log out button |

All three share the **auth frame**: the form on one side, the path track on the other.

## 3. What is on the page

**Auth frame**
- Header: brand (path mark + "Your Guide"), language switch, theme switch.
- The page content, centred, about 360px wide.
- Footer: "© Your Guide" and the year.
- The **path track**: a winding grey track drawn in SVG with a cobalt ball. The ball rolls one segment, pauses about three seconds, rolls the next, then fades and starts again. Decorative (`aria-hidden`).

**Register** (`auth.register.*`)
1. Title "Start with you" and the intro.
2. The road ahead: "1 Account · 2 About you · 3 First goal", the first marked current.
3. Email. Under it, when the domain looks mistyped, "Did you mean name@gmail.com?" with a button that applies it.
4. Password with a Show/Hide button, and a live rule line "At least 8 characters" that turns into a check when met. Caps Lock warning when on.
5. "The app will speak": English or العربية. Choosing switches the page at once; the account is created in that language.
6. "Your days follow Dubai time. Change": the detected timezone. Change reveals a list of all timezones. Timezone cannot be changed after registration, so this is the one chance.
7. **Create account** (primary).
8. The privacy line, then "Already have an account? Log in".

**Log in** (`auth.login.*`)
1. A notice "You were signed out. Log in to continue where you were." only when sent here by an expired session.
2. Title "Welcome back" and the intro.
3. Email; password with Show/Hide and the Caps Lock warning.
4. **Log in** (primary). After a 429 it is disabled and reads "Try again in 0:42", counting down from 60 seconds.
5. "New here? Create an account".

**Signed out** (`auth.signedOut.*`)
1. "You're signed out."
2. "Your goals and progress are saved in your account."
3. Two confirmations: drafts of answers were removed from this device; nothing personal is left in this browser.
4. **Log in again** (primary).

## 4. Layout

Laptop (1024px and up): two equal columns. Start side: header, centred form, footer. End side: the track panel, full height. In Arabic the panel moves to the left and the track mirrors, so the ball still rolls in reading direction.

Phone: one column. Header, then a 160px band of the track, then the form, then the footer.

```
laptop                                   phone
+------------------+-----------------+   +----------------------+
| brand   lang  ◐  |                 |   | brand      lang  ◐   |
|                  |    ~~~~o~~~~    |   | ~~~~~~~o~~~~~~ band  |
|   Welcome back   |  ~~~~      ~~~  |   | Welcome back         |
|   [email      ]  |                 |   | [email            ]  |
|   [password   ]  |                 |   | [password         ]  |
|   [  Log in   ]  |                 |   | [     Log in      ]  |
| © Your Guide     |                 |   | © Your Guide         |
+------------------+-----------------+   +----------------------+
```

States: submitting (button disabled, label kept), field error under the field, form error above the fields, rate limited (countdown), expired session (notice).

## 5. API integration

| Call | When | On success | Errors handled |
| --- | --- | --- | --- |
| `POST /api/auth/register` | Create account | language cookie from the user, go to `next` or `/` | `validation.failed` per field, `auth.email_taken` under email with a Log in link, `rate_limited` countdown, `network`/`unknown` form alert |
| `POST /api/auth/login` | Log in | same | `auth.invalid_credentials` form alert, `rate_limited` countdown, `network`/`unknown` form alert |
| `POST /api/auth/logout` | Log out | always: clear device data and the query cache, go to `/signed-out` | none (204 always) |

Register sends `timezone` (detected or chosen) and `locale` (the language showing).

## 6. Decisions

1. **The track is flat SVG, the motion plain CSS.** Depth comes from six stacked strokes; the ball moves with `offset-path`. A few kilobytes, themeable through tokens, no 3D library and no image files. Browsers without `offset-path` show the ball standing still. Alternative not taken: a rendered 3D image (heavy, a second file for dark mode).
2. **Track colours are tokens** (`--track-*`): greys from the neutrals and a cobalt ball, redefined for dark. The track stays grey; only the ball carries the accent, so the one-hue rule holds.
3. **Motion is slow and stops.** One step every four seconds; `prefers-reduced-motion` keeps the ball still.
4. **No "Remember me", no "Forgot password".** Sessions already last 30 days; the backend has no reset flow yet, so a link would lead nowhere.
5. **Timezone is visible and changeable at register only.** The API cannot change it later.
6. **Email typo hint is local.** A small list of common domains and an edit distance of at most 2; nothing is sent anywhere.
7. **Rate limit counts down 60 seconds** from the 429 (the API allows 5 attempts a minute and sends no wait time).
8. **The expired-session notice only appears when the 401 listener sent the person** (`?reason=expired`), not for a first visit.
9. **Logging out clears every `yg:` key** from local and session storage (drafts, struggle follow-ups), then the query cache. No confirmation: logging back in undoes it.

## 7. Tests

- Unit: email suggestion, password rule, timezone label, clearing device data, the countdown formatting.
- Playwright: the login page in both languages (existing), log out lands on `/signed-out`, the register page shows the road ahead and the timezone line.
- By hand against the API: register, log in, wrong password, six quick attempts, log out; English and Arabic; phone and laptop; light and dark.

## 8. Open questions and follow-ups

- Backend: a password reset flow, then add "Forgot password" to the login page.
- Backend: send `Retry-After` with 429 so the countdown can be exact.
