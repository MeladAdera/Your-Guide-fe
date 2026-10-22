# Your Guide · web app

The web frontend of Your Guide, a work and study manager for the moment someone is alone with a hard task and wants to give up. The API contract and the product rules are in [docs/handoff.md](docs/handoff.md); frontend decisions are in [docs/DECISIONS.md](docs/DECISIONS.md).

## Run it

You need Node.js 24+, pnpm, and the API running on port 3001 (see the backend repo).

```bash
cp .env.example .env.local   # API_URL=http://localhost:3001
pnpm install
pnpm dev                     # http://localhost:3000
```

The web app rewrites `/api/*` to `API_URL`, so the browser sees one origin and the session cookie just works.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit and component tests (Vitest) |
| `pnpm e2e` | Playwright against the dev server; the register flow needs the API |

## Layout

```
src/app              routes: (auth) login/register · (app) everything signed in · page.tsx = start-up router
src/components/ui    shadcn/ui components (Radix, RTL-aware)
src/components       app components (shell, forms, settings, auth)
src/lib/api          API client, types, error codes, server-side helper
src/i18n             locale config, next-intl request config, cookie helper
messages             en.json and ar.json, the only place app text lives
e2e                  Playwright tests
docs                 handoff and decisions
```

## Conventions worth knowing

- **Translate by code, never by message.** API errors are `ApiError` with a `code`; the sentence comes from `messages/*.json` (`errors.<code>`, nested by the dots).
- **User and AI text always gets `dir="auto"`.** App text follows the document direction.
- **Only one hue.** Cobalt is for actions; the struggle button is solid ink; red is destructive only.
- **Server Components call the API by `API_URL`** and forward the cookie (`src/lib/api/server.ts`); the browser uses relative `/api/...` paths.
