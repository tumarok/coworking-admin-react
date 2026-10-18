---
name: verify
description: Run the quality gates of this repo in order and read their failures (ESLint boundaries, Steiger, MSW unhandled requests, mock parity, npm 10 lockfile). Use before reporting a change as done, after editing code, tests, mocks or dependencies, and when a gate fails.
---

# Verify

CI runs the same gates (`.github/workflows/ci.yml`). Run them in this order and stop at the first
failure: the cheap static checks come first, so a failure points at the real cause.

```bash
npm run typecheck      # tsc over the app (tsconfig.json) and the tooling (tsconfig.node.json)
npm run lint           # ESLint, including the FSD layer boundaries
npm run fsd:check      # Steiger: slice structure and public APIs
npm run format:check   # fix with: npm run format
npm test               # Vitest: `web` (jsdom, src/) and `server` (node, server/) projects
npm run build
npm run e2e            # see below
```

Narrow runs while iterating: `npm test -- src/pages/locations`, `npm test -- --project server`,
`npx playwright test e2e/navigation.spec.ts -g "not-found"`. The last full run must still be the
whole list above.

## When `npm run e2e` is required

Run it when the change touches any of these; component tests do not cover the real build:

- routes (`src/app/router.tsx`, `src/shared/config/routes.ts`, `nav.ts`) or layouts and the session guard;
- forms and dialogs (`FormDialog`, `FormField`, anything in `features/*-upsert`);
- API behaviour: the contract, `server/core`, `mock/`, seed data (e2e relies on seeded rooms and
  bookings), `src/shared/api`, error handling;
- list state in the URL (`useListParams`) or what `e2e/*.spec.ts` already asserts.

It needs Chromium once (`npx playwright install chromium`). It builds the app, starts the mock and
resets the mock before every test. Outside CI it reuses servers already listening on `4010` and
`4173`, so a stale `npm run preview` makes it test an old build: stop it first. A build error shows
up as a web-server timeout; run `npm run build` to see the message. Failure traces and screenshots
land in `test-results/`.

## Reading failures

**ESLint `boundaries/dependencies`** (`npm run lint`)

- `Import a slice through its public API (index.ts).`: import from `@/entities/location`, not from
  `@/entities/location/api/location-api`. Add the export to the slice's `index.ts` if it is missing.
- A layer imports upward, or two slices of one layer import each other (feature to feature, page
  to page): move the shared piece down into `entities` or `shared`, or compose both slices in a
  layer above them (a page or a widget).
- `Crossing a slice boundary: import through the @/ alias instead.`: replace `../../x` with `@/...`.

**Steiger** (`npm run fsd:check`) names a rule per finding:

- `insignificant-slice`: a slice that one other slice uses (or nobody does); merge it into its only
  user or remove it.
- `public-api` / `no-public-api-sidestep`: missing `index.ts`, or an import that skips it.
- `forbidden-imports`: same cause as the ESLint layer errors above.
- `segments-by-purpose`, `no-segmentless-slices`: name segments by purpose (`api/`, `model/`,
  `ui/`), not `components/`, `hooks/` or `utils/`, and give every slice at least one segment.

**MSW: unhandled request in a component test** (`onUnhandledFrame: 'error'` in `test/setup.ts`)

The test sent a request nobody answers. Call `installMockApi()` before rendering (and `signIn()`
for authenticated screens). The handler covers `*/api/v1/*`, so a request elsewhere (a wrong base
URL, a hard-coded host) is still unhandled. A route missing from `server/core/api.ts` is a
different failure: the mock answers `404 No route for ...`.

**`server/parity.test.ts` fails** (the two mocks drifted apart)

The suite name in the output tells which implementation broke: `TypeScript mock (server/)` or
`zero-dependency mock (mock/)`. The other one is the reference. Fix the contract first, then bring
`server/core/api.ts` and `mock/server.mjs` (its `*_RULES`, routes and `mock/fixtures.mjs`) to the
same status codes, field names and error bodies. Do not loosen the parity test to make it pass. Some
differences are intended and untested (seed 42 against 7, wording of validation messages); only the
shared subset is compared.

**Lockfile and npm 10** (`npm ci` fails in CI, or `package-lock.json` shows a surprising diff)

CI installs with `npm ci` on Node 22 and npm 10; npm 11 writes a lockfile that npm 10 rejects.
After any dependency change, do not run a local `npm install`. Refresh the lockfile with npm 10
instead (command in `.claude/CLAUDE.md`, section "Versions and the reasons behind them"), then
re-run the gates.

## Report

State which gates ran and their result. Name any gate you skipped and why. Do not call the work done
with a failing gate.
