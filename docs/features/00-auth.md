# 00 · Register, log in, log out

Status: spec 2026-10-27 · building 2026-10-27 · verified 2026-10-27 (local API, both languages, phone and laptop) · done 2026-10-27

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
- The **path picture**: a static image of a winding grey track with a cobalt ball resting on it, one file for light and one for dark. Nothing moves. Decorative (`aria-hidden`, empty alt).

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

Laptop (1024px and up): two equal columns. Start side: header, centred form, footer. End side: the picture, full height, cropped to fill. In Arabic the panel moves to the left and the picture mirrors, so the track runs in reading direction.

Phone: one column. Header, then a 160px band of the same picture cropped around the ball, then the form, then the footer.

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

1. **The picture is a plain static image, no animation and no 3D** (owner's choice, 2026-10-27). Two SVG files in `public/images/auth/`, light and dark, swapped by the theme class. A designer can replace them with a finished illustration without touching code. Alternatives not taken: an animated ball on a CSS motion path (tried, dropped for simplicity), a rendered 3D image.
2. **Colours come from the palette.** The track uses the neutral greys, only the ball is cobalt, so the one-hue rule holds; the dark file uses the dark tokens' values.
3. **The picture loads with priority only on phones**, where it sits above the form; on a laptop it is beside the form and never blocks it.
4. **No "Remember me", no "Forgot password".** Sessions already last 30 days; the backend has no reset flow yet, so a link would lead nowhere.
5. **Timezone is visible and changeable at register only.** The API cannot change it later.
6. **Email typo hint is local.** A small list of common domains and an edit distance of at most 2; nothing is sent anywhere.
7. **Rate limit counts down 60 seconds** from the 429 (the API allows 5 attempts a minute and sends no wait time).
8. **The expired-session notice only appears when the 401 listener sent the person** (`?reason=expired`), not for a first visit.
9. **Logging out clears every `yg:` key** from local and session storage (drafts, struggle follow-ups), then the query cache. No confirmation: logging back in undoes it. The signed-out page clears again when it opens, so its promise holds however the person arrived.
10. **Passwords stay left to right in Arabic**, with Show/Hide at the field's right edge, because passwords are typed in Latin characters; the label and the rule line follow the page direction.
11. **The typo hint uses an edit distance where swapping two letters counts once** ("gmial"), one edit for normal domains and two for long ones, so real domains such as "acme.com" are never "corrected".
12. **The theme switch moved to the footer of the sign-in frame** so the phone header (brand and language) stays on one line.

## 7. Tests

- Unit (Vitest): email suggestion and edit distance, timezone city, offset and list, the countdown hook and formatting, clearing device data.
- Playwright, laptop and phone: login in both languages; register → onboarding → log out → `/signed-out` with a draft removed (against the local API); register shows the road, language and timezone; the typo fix; the expired notice and the countdown (429 faked in the browser); the signed-out page opens without an account and clears data.
- Checked in the browser against the local API on 2026-10-27: register, wrong password ("That email and password don't match."), right password → onboarding, log out. Screens checked in English and Arabic, light and dark, at 390px and 1280px.
- Not checked against the real rate limit: the countdown was tested with a faked 429.

## 8. Open questions and follow-ups

- Backend: a password reset flow, then add "Forgot password" to the login page.
- Backend: send `Retry-After` with 429 so the countdown can be exact.
- Someone still signed in who opens `/signed-out` by typing the address sees "You're signed out" while the session is still valid. Options: log out on that page too, or redirect signed-in visitors to `/`. Small; decide with the settings page.
- The picture files can be replaced by a designer's illustration at the same paths (`public/images/auth/path-light.svg`, `path-dark.svg`).
