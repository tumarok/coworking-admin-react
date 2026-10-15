# Coworking Admin

Admin console for a network of coworking spaces: locations, rooms, members and bookings, with a
dashboard of the day's occupancy. A React single-page app over a REST API, shipped with two
interchangeable mock backends, so it runs without any real server.

- **Bookings that follow the rules:** at most 8 hours, inside the location's opening hours in its
  own time zone, within room capacity. An overlap is refused with the conflicting bookings listed
  in the form.
- **Status workflow:** `pending → confirmed → checked_in → completed`, plus cancel and no-show,
  one by one or in bulk with a per-booking report of what failed and why.
- **Lists you can share:** paging, search and filters live in the URL, so a filtered list survives
  a reload, a bookmark and the back button.
- **Errors where they belong:** validation errors under their fields, conflicts in the form,
  everything else in a toast; an expired session sends you back to sign in.

## Quick start

### Full demo in Docker

```bash
docker compose up --build
```

Open http://localhost:8080 and sign in with **admin@coworking.test** / **demo1234**. The web image
serves the production build with nginx and proxies `/api` to the mock API container.
`docker compose pull && docker compose up` runs the images published to GHCR instead of building
them.

### Local development

Requires Node.js 22.12 or newer.

```bash
npm ci
npm run mock   # mock API on http://localhost:4010/api/v1
npm run dev    # app on http://localhost:5173, /api proxied to the mock
```

Run the two commands in separate terminals. To point the dev server at another backend, set
`API_TARGET` (default `http://localhost:4010`).

## Stack

| Area          | Choice                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| UI            | React 19, PrimeReact 10, SCSS Modules                                       |
| Routing       | React Router 8, data router with lazy routes                                |
| Server state  | Redux Toolkit 2 and RTK Query                                               |
| Forms         | React Hook Form and Zod                                                     |
| Tooling       | Vite 8, TypeScript 6, ESLint 10, Prettier, Steiger                          |
| Tests         | Vitest, Testing Library, MSW, Playwright                                    |
| Mock backends | plain Node.js (`mock/`) and TypeScript over the shared contract (`server/`) |
| CI/CD         | GitHub Actions, Docker images on GHCR, nginx                                |

## Architecture

The code follows [Feature-Sliced Design](https://feature-sliced.design/). Each layer may import only
from the layers below it, and a slice is entered only through its `index.ts`:

```
src/
  app/       store, router, layout, error toasts, global styles
  pages/     one slice per screen: dashboard, lists, details, login, not found
  widgets/   composite blocks reused across pages (sidebar, room and booking tables)
  features/  user actions: sign in, create and edit forms, status changes, bulk actions
  entities/  session, location, room, member, booking: API endpoints, model, small UI
  shared/    API client and contract, UI kit, list state, formatting, config
```

ESLint (`eslint-plugin-boundaries`) enforces the layer rules on every file, and `npm run fsd:check`
runs Steiger over the slice structure.

**API contract.** Zod schemas in `src/shared/api/contract` describe every request and response.
The frontend checks each response against them without blocking it (a mismatch is logged with the
exact path), and the TypeScript mock is built on the same schemas, so the two cannot drift apart.

**Server state.** Every entity injects its endpoints into one RTK Query API, with list and record
cache tags, so a change refreshes exactly the queries that show it. Signing out resets the cache.

**Errors.** A listener middleware turns every failed request into a toast. Calls whose UI renders
the error itself (the login form, validation and booking conflicts in forms) pass
`extraOptions: { silent: true }` and opt out. A 401 outside the login form ends the session.

**Lists.** `useListParams` keeps page, page size, search and filters in the URL and hands the list
endpoint a query object; RTK Query keys its cache by value, so re-renders do not refetch.

**Forms.** React Hook Form with Zod resolvers, including cross-field rules such as "ends after it
starts". Server 422 field errors land under their fields; a 409 conflict shows a banner and keeps
the dialog open.

## Mock API

Both mocks implement the same `/api/v1` contract, keep data in memory and reset on restart:

- `server/`: TypeScript on the shared contract, served over `node:http` (`npm run mock`) and as
  MSW handlers for component tests. The e2e suite runs against it.
- `mock/`: a single plain Node.js file with no dependencies (`npm run mock:simple`), easy to copy
  next to any other frontend. The Docker API image runs it.

A parity suite runs the same HTTP scenarios against both and parses every response with the
contract. See [mock/README.md](mock/README.md) for the simulated rules and the environment
variables.

## Testing

- **Unit:** booking rules (overlaps, prices, opening hours in the location's time zone, including
  DST switches), the mock API's validation and status transitions, API error parsing, formatting,
  URL list state, the session slice.
- **Component:** Testing Library with MSW over the TypeScript mock: a wrong password shown in the
  login form without a toast, an overlapping booking in a banner with the dialog kept open, server
  field errors under their fields, a bulk action with partial failures, the dashboard and a
  URL-driven list.
- **End-to-end:** Playwright against the production build and the mock: sign-in and sign-out, a
  full flow from a new location to a confirmed booking, an overlapping booking, bulk cancellation,
  URL-kept filters and not-found pages. The mock is reset before each test.

```bash
npm test                          # unit and component tests
npx playwright install chromium   # once
npm run e2e                       # builds the app and starts the mock by itself
```

## Scripts

| Script                            | Description                                         |
| --------------------------------- | --------------------------------------------------- |
| `npm run dev`                     | Vite dev server on http://localhost:5173            |
| `npm run mock` / `mock:watch`     | TypeScript mock API on http://localhost:4010        |
| `npm run mock:simple`             | zero-dependency mock API on http://localhost:4010   |
| `npm run build`                   | production build into `dist/`                       |
| `npm run preview`                 | serve the production build on http://localhost:4173 |
| `npm run typecheck`               | TypeScript, app and tooling configs                 |
| `npm run lint` / `lint:fix`       | ESLint, including the layer boundaries              |
| `npm run fsd:check`               | Steiger, Feature-Sliced Design structure            |
| `npm run format` / `format:check` | Prettier                                            |
| `npm test` / `test:watch`         | Vitest                                              |
| `npm run test:coverage`           | Vitest with a coverage report in `coverage/`        |
| `npm run e2e` / `e2e:ui`          | Playwright                                          |

## CI/CD

[GitHub Actions](.github/workflows/ci.yml) runs on every push and pull request:

1. **checks:** type check, lint, FSD structure, formatting, tests with coverage, build;
2. **e2e:** the Playwright suite; a failed run uploads its report;
3. **images** (pushes to `main` and `v*` tags): builds and publishes to GHCR
   - `ghcr.io/tumarok/coworking-admin`: the app served by nginx, `/api` proxied to `$API_UPSTREAM`;
   - `ghcr.io/tumarok/coworking-admin-api`: the mock API.

   Tags: `latest` for `main`, `sha-<commit>`, and semver tags for releases.

## License

[MIT](LICENSE)
