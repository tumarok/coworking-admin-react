# Mock API

Two interchangeable implementations of the same REST contract (`/api/v1`). Pick whichever fits.

|          | `mock/` — zero-dependency                            | `server/` — TypeScript                             |
| -------- | ---------------------------------------------------- | -------------------------------------------------- |
| Run      | `npm run mock:simple` or just `node mock/server.mjs` | `npm run mock`                                     |
| Needs    | Node.js only, no `npm install`                       | project dependencies (tsx, zod, faker)             |
| Contract | hand-written checks                                  | the Zod schemas in `src/shared/api/contract`       |
| Extras   | —                                                    | MSW handlers (`server/msw.ts`) for component tests |
| Good for | copying into another frontend, demos, Docker image   | this repo's component tests and e2e                |

Both listen on `http://localhost:4010/api/v1` by default, keep data in memory and reset on restart
(or `POST /api/v1/__reset`). Sign in with `admin@coworking.test` / `demo1234`.

`server/parity.test.ts` runs the same scenarios against both and parses every response with the
contract schemas, so a change to one implementation without the other fails the test suite.

## Environment

| Variable          | Default                  | Meaning                                                      |
| ----------------- | ------------------------ | ------------------------------------------------------------ |
| `PORT`            | `4010`                   | listen port                                                  |
| `MOCK_LATENCY_MS` | `250`                    | artificial delay per request, to make loading states visible |
| `MOCK_SEED`       | `42` (TS) / `7` (simple) | seed of the generated data                                   |
| `MOCK_LOG`        | —                        | `1` logs each request (TS mock)                              |

## What is simulated

- Paging (`page`, `limit`), search (`q`) and per-entity filters, `{ items, total, page, limit }`.
- 401 without a token; 404 for unknown ids; 422 with `fieldErrors` for invalid input.
- Bookings: at most 8 hours, inside the location's opening hours in its own time zone, within room
  capacity, only for available rooms and active members; overlaps → 409 with `conflicts`.
- Status transitions (`pending → confirmed → checked_in → completed`, cancel, no-show) and bulk
  confirm/cancel with per-booking failure reasons.
- Deleting a location with rooms, or a room/member with upcoming bookings → 409.

What it does not do: persistence, concurrency, real authentication. Before relying on a behaviour
in production, check it against the real backend.
