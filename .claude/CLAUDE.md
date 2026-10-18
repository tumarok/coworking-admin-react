# Coworking Admin

Admin console for coworking spaces: React 19 SPA over a REST API (`/api/v1`) with two mock backends.
`README.md` describes the product, stack and architecture; this file holds the working rules.

## Before every commit

All of these must pass; CI runs the same set (`.github/workflows/ci.yml`).

```bash
npm run typecheck && npm run lint && npm run fsd:check && npm run format:check && npm test && npm run build
npm run e2e   # when routes, forms or API behaviour change
```

## Architecture rules (Feature-Sliced Design)

- Layers: `app → pages → widgets → features → entities → shared`. Import only from layers below;
  slices of one layer never import each other. ESLint (`boundaries`) and Steiger enforce this.
- Enter a slice through its `index.ts` and the `@/` alias, never `../../`. Shared segments may be
  imported by path (`@/shared/api/errors`).
- Slice segments: `api/`, `model/`, `ui/`. Page-only queries live in the page slice
  (`pages/dashboard/api`).

## API

- The contract is the Zod schemas in `src/shared/api/contract`. Change it first, then both mocks:
  `server/core` (TypeScript) and `mock/server.mjs` (plain JS, no dependencies). `server/parity.test.ts`
  fails when they disagree.
- Endpoints: `baseApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)` in
  `entities/<name>/api`. Queries wrap responses in `validated(schema, 'METHOD /path')` and provide
  `{ type, id }` plus `{ type, id: LIST_ID }` tags; mutations invalidate them.
- Failed requests become toasts in `app/model/error-listener.ts`. A call whose UI shows the error
  itself passes `extraOptions: { silent: true }`.
- Lists: `{ items, total, page, limit }`, query `page`, `limit`, `q` and filters. List state lives
  in the URL via `useListParams`.
- Errors: 401 ends the session, 404 unknown id, 409 business conflict (`conflicts` for bookings),
  422 `fieldErrors`. Forms map them with `applyServerErrors` from `@/shared/lib/form`.

## Forms

React Hook Form + `zodResolver`, `mode: 'onTouched'`, fields through `FormField` and dialogs through
`FormDialog` (`@/shared/ui`). Money is integer cents in the API and euros in the form. Times are
wall-clock in the location's time zone (`@/shared/lib/timezone`).

## Tests

- Unit and component tests sit next to the code as `*.test.ts(x)`; mock-server tests in `server/`.
- Component tests: `renderWithProviders` (`@test/render`), real mock API through MSW with
  `installMockApi()` and `signIn()` (`@test/mock-api`). Unhandled requests fail the test.
- E2E (`e2e/`): use the fixtures in `e2e/fixtures.ts`; the mock is reset before each test, arrange
  data through `api`, not by clicking.
- Query by role and accessible name, not by CSS classes, except PrimeReact internals wrapped in a
  helper (`choose` for dropdowns).

## Versions and the reasons behind them

- PrimeReact 10.9.x and PrimeIcons 7: newer majors need a commercial license key.
- TypeScript 6.0.x: typescript-eslint supports TypeScript below 6.1.
- Mocks run on `node:http` and MSW, no Express: the core is framework-agnostic.
- `package-lock.json` must satisfy `npm ci` on npm 10 (Node 22, the minimum and the CI version).
  npm 11 drops an optional peer entry that npm 10 requires. After changing dependencies, refresh
  the lockfile with npm 10:
  `docker run --rm -u node -v "$PWD":/app -w /app node:22-alpine npm install --package-lock-only --ignore-scripts`

## Conventions

- UI text, code, comments and docs in English.
- Commits: Conventional Commits (`feat(bookings): …`, `fix`, `test`, `ci`, `docs`, `chore`), a body
  explaining why, no trailers.
- Demo sign-in: `admin@coworking.test` / `demo1234`.
- Browser checks: the Playwright server in `.mcp.json` writes to `.playwright-mcp/` (git-ignored).

## Claude Code setup

- Skills: `verify` (the gates, when e2e is required, reading failures) and `add-feature` (recipe).
- Agents: `reviewer` (read-only review of the diff) and `feature-builder` (builds, then verifies).
- Hook: `.claude/hooks/format.mjs` runs the local Prettier on every file Claude edits or writes.
- `.claude/settings.json` allows the project scripts and read-only git; keep personal overrides in
  `.claude/settings.local.json` (git-ignored).
