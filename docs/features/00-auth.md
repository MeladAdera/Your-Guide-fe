# 00 · Sign in, sign up, sign out

Status: done 2026-10-28 · checked against the local API in both languages, on phone and laptop.

Design: the approved sign-in screen, which is the design reference for the whole app. See [DESIGN.md](../DESIGN.md) for screenshots, colours, type and motion.

## 1. Job

Let a person create an account, sign in and sign out, in English or Arabic, on a phone or a laptop. The screens are honest about what comes next and what the device keeps, and they never make a mistake permanent without a chance to see it (email and timezone cannot be changed later).

## 2. Pages and routes

| Route | What it shows | Reached from |
| --- | --- | --- |
| `/sign-in` | Sign in; a notice when the person was signed out by an expired session | the proxy (no cookie), the 401 listener, `/signed-out`, links |
| `/sign-up` | Create an account | `/sign-in`, links |
| `/signed-out` | Confirmation after signing out, in its own simple frame | the Log out button |

`/sign-in` and `/sign-up` share one mounted shell (`src/features/auth/components/auth-shell.tsx`) in the `(auth)` layout. The pages only set titles and render nothing, so switching is a CSS movement and Back reverses it. The mode comes from the pathname; any other path throws. The inactive form is `inert`.

## 3. What is on the screen

**Laptop:** the logo and name at the start, EN / AR at the end, the year at the bottom. In the middle a large rounded card on the sage ground holds both forms side by side. An inset mint photo tile carries a message for the other form and glides over the inactive one. Each form ends with the link to the other.

**Phone:** a hero with the photo, the logo row and a headline; the form in a sheet over it. The first focus on a field collapses the hero to the logo row, shows the form heading and moves the photo to the bottom. The two forms slide sideways.

**Sign in** (`auth.login.*`)
1. A notice "You were signed out. Sign in to continue where you were." only when sent here by an expired session.
2. "Welcome back." and "Ready for your next step?".
3. Email (mail icon, placeholder); password (lock icon, show/hide eye, Caps Lock warning).
4. **Sign in** with an arrow. After a 429 it is disabled and reads "Try again in 0:42", counting down from 60 seconds, under "Let's take a short pause."
5. "Don't have an account? Sign up".

**Sign up** (`auth.register.*`)
1. "Start your journey." and "Create your account in a minute.".
2. Email; when the domain looks mistyped, "Did you mean name@gmail.com?" with a button that applies it.
3. Password with the eye button, a live "At least 8 characters" line that turns into a check, the Caps Lock warning.
4. "The app will speak": English or العربية; the account is created in that language.
5. "Your days follow Damascus time. Change": the detected timezone; Change opens every zone. It cannot be changed after sign-up.
6. **Create account**, the privacy line, "Already have an account? Sign in".

**Signed out** (`auth.signedOut.*`): "You're signed out.", what is kept, what left the device, **Log in again**.

## 4. Sizes and motion

- Card up to 1320px wide; scales to 92% on windows up to 820px tall and 82% under 700px, so the sign-up form always fits (checked at 1366×657, 1280×720, 1440×800, 1920×960).
- The tile glides in 700ms with `cubic-bezier(0.77, 0, 0.18, 1)`; the picture inside moves 8% the other way; the tile's message crossfades. Phones slide in 500ms. Reduced motion switches instantly. Arabic mirrors everything.

## 5. API integration

| Call | When | On success | Errors handled |
| --- | --- | --- | --- |
| `POST /api/auth/register` | Create account | language cookie from the user, go to `next` or `/` | `validation.failed` per field, `auth.email_taken` under email with a Sign in link, `rate_limited` countdown, `network`/`unknown` form alert |
| `POST /api/auth/login` | Sign in | same | `auth.invalid_credentials` form alert, `rate_limited` countdown, `network`/`unknown` form alert |
| `POST /api/auth/logout` | Log out | always: clear device data and the query cache, go to `/signed-out` | none (204 always) |

Sign-up sends `timezone` (detected or chosen) and `locale` (the language showing).

## 6. Decisions

1. **The forms call the real API** with react-hook-form and zod (owner's choice); field ids carry `signin-` / `signup-` prefixes because both forms are in the page.
2. **Hidden until the backend supports them** (owner's choice): Continue with Google, Forgot password, Remember me (sessions already last 30 days), Full name.
3. **Only focusing a field starts the phone's filling phase.** A tapped button or link also takes focus, and moving the layout under the finger would make the tap miss.
4. **The picture downloads once per screen:** each image stays lazy with `fetchPriority="high"` (the Next 16 docs' advice when several images exist per breakpoint).
5. **Timezone is visible and changeable at sign-up only**, because the API cannot change it later. It is read once after loading so the card keeps one height.
6. **The typo hint is local:** common domains and an edit distance where swapping two letters counts once; one edit for normal domains, two for long ones, so real domains such as "acme.com" are never "corrected".
7. **A rate limit is a 60-second pause,** not an error (the API allows 5 attempts a minute and sends no wait time).
8. **The expired-session notice appears only when the 401 listener sent the person** (`?reason=expired`).
9. **Signing out clears every `yg:` key** from local and session storage, then the query cache. No confirmation. The signed-out page clears again when it opens.
10. **Passwords and emails stay left to right in Arabic**; labels and hints follow the page direction.
11. **The EN / AR control switches the language for real**; the theme switch stays in Settings.

## 7. Tests

- Unit (Vitest): email suggestion and edit distance, timezone helpers, the countdown, clearing device data.
- Playwright, laptop and phone: sign-in in both languages; sign up → onboarding → log out → `/signed-out` with a draft removed (against the local API); the tile's glide and Back; loading `/sign-up` directly; Arabic mirroring; reduced motion; Tab never reaching the hidden form; the phone phases; language and timezone; the typo fix; the expired notice and the countdown (429 faked); the signed-out page.

## 8. Open questions and follow-ups

- In the sign-up state the flag can leave the tile's picture; in dark mode the tile shows an edge where the dimmed picture meets the plain area (owner to approve fixes).
- Backend: a password reset flow, then "Forgot password"; `Retry-After` with 429.
- Someone still signed in who types `/signed-out` sees "You're signed out" while the session is valid.
- The phone keyboard behaviour needs a check on a real iPhone.
