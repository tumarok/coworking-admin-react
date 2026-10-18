---
name: add-feature
description: Recipe for adding a new entity or a CRUD feature (contract, both mocks, parity, RTK Query endpoints, form dialog, list and details pages, route, navigation, tests, e2e), modelled on locations. Use when asked to add an entity, a screen, an endpoint or a form to the app.
---

# Add an entity or feature

Locations is the reference implementation; open its files next to the ones you create. Below,
`<name>` is the singular (`location`), `<names>` the plural (`locations`), `<Name>` the type name.
Work in this order: each step builds on the previous one, and the mocks must agree before the UI
depends on them. Layer rules are in `.claude/CLAUDE.md`.

## 1. Contract (Zod, first)

`src/shared/api/contract/<name>.ts`, then `export * from './<name>'` in `contract/index.ts`.
Model it on `location.ts`:

- value lists as `as const` arrays plus `z.enum` (`LOCATION_STATUSES`, `locationStatusSchema`);
- `<name>Schema`: the response, with `id: idSchema` and any derived field (`roomCount`);
- `<name>InputSchema`: the request body, with messages as `{ error: '...' }`. Cross-field rules use
  `.refine(..., { error, path })` on the field the user must fix (`closesAt`);
- `<name>ListQuerySchema = pageQuerySchema.extend({ ...filters })` for `page`, `limit`, `q` and
  the filters; types `<Name>`, `<Name>Input`, `<Name>ListQuery = z.input<...>`.
- Money is integer cents (`z.number().int()`). Wall-clock times are `timeOfDaySchema` ("HH:mm"),
  instants are `isoDateTimeSchema` in UTC, calendar dates are `isoDateSchema`.

## 2. Both mocks and parity

Add the same behaviour twice, then prove it with one test.

- `server/core/db.ts`: a `<Name>Record` type (the schema minus derived fields), a collection on
  `Db`, seed rows in `createDb`, ids from `nextId(db, 'prefix')`.
- `server/core/api.ts`: routes in the style of the `// --- locations` block: list with
  `parse(<name>ListQuerySchema, cleanQuery(query))`, `matches` for `q`, `paginate`, `findOr404`,
  `created`/`noContent`, `conflict(...)` (409) for a delete that has dependants, `invalid({ field:
'message' })` (422) for a cross-entity check. Register specific paths before `/:id`.
  Add a `<name>View` when the response carries derived fields.
- `mock/server.mjs`: a `<NAME>_RULES` object with the plain validators (`text`, `oneOf`, `int`,
  `time`, `id`), the same routes in the route table, a view function, and seed data in
  `mock/fixtures.mjs`. No dependencies and no imports from `src/`.
- `server/parity.test.ts`: add the scenario to the shared `describe.each` block and parse each
  response with `pageOf(<name>Schema)` or `<name>Schema`. Rules that only the TypeScript mock
  implements go in `server/core/api.test.ts` or `rules.test.ts` instead.
- If a rule is new, add it to "What is simulated" in `mock/README.md`.

## 3. Entity: `src/entities/<name>/`

- `api/<name>-api.ts`: follow `location-api.ts`.
  `baseApi.enhanceEndpoints({ addTagTypes: [TAG] }).injectEndpoints(...)`; queries use
  `transformResponse: validated(pageOf(schema), 'GET /<names>')`; the list provides
  `{ type, id: LIST_ID }` plus a tag per item, the detail query provides `{ type, id }`.
- Mutations: create invalidates the list tag; update invalidates `{ type, id }` and the list;
  delete invalidates the list only (invalidating the deleted id would refetch it into a 404).
  Create and update pass `extraOptions: { silent: true }` because the form shows the error; delete
  and queries stay loud (the global toast).
- Other entities that show this one's data need its tags too. Rooms invalidate `Location` because
  locations show `roomCount`; bookings invalidate `Dashboard`. Declare the foreign tag in
  `addTagTypes` and invalidate it in the mutation.
- `ui/<Name>StatusTag.tsx` on top of `StatusTag` from `@/shared/ui` if the entity has a status.
- `index.ts` exports the endpoints' hooks, the `<name>Api` object and the UI. Segments are `api/`,
  `model/`, `ui/` only.

## 4. Upsert feature: `src/features/<name>-upsert/`

Model it on `ui/LocationFormDialog.tsx`; it exports only `<Name>FormDialog` from `index.ts`.

- `useForm` with `zodResolver(schema)`, `mode: 'onTouched'`, `defaultValues` from a `toValues`
  function. Reset only in an effect keyed on `[visible, <name>?.id, reset]`, never on a refetch.
- Each field is a `Controller` rendering `FormField` (`label`, `htmlFor`, `error`, `required`) around
  the PrimeReact control with the same `id`. Dropdowns take `inputId`.
- Wrap in `FormDialog` (`formId`, `submitting`, `banner`); the form's `id` matches `formId`.
- Submit: `unwrap()`, then `notify.success(...)`, `onSaved?.(saved)`, `onHide()`. On failure
  `setBanner(applyServerErrors(error, setError, FIELDS, rename))` from `@/shared/lib`: 422 field
  errors land under their fields, anything else becomes the banner. `rename` maps API names to
  form names.
- When the form differs from the API input, add `model/<name>-form.ts` with a form schema and
  `to<Name>FormValues` / `to<Name>Input`. Money: the form edits euros, the API takes cents
  (`room-form.ts`: `hourlyRate / 100` in, `Math.round(euros * 100)` out). Times: the form edits a date
  and "HH:mm" in the location's time zone; convert with `zonedToUtcIso` / `utcToZoned` from
  `@/shared/lib` (`booking-form.ts`), and never with the browser's zone.

## 5. Pages: `src/pages/<names>/` and `src/pages/<name>-details/`

Each has `ui/<X>Page.tsx` and an `index.ts` exporting the page.

- List (`LocationsPage.tsx`): `const list = useListParams(FILTERS)` with a static `FILTERS` array;
  `useGet<Names>Query(list.query as <Name>ListQuery)`; `PageHeader`, `ListToolbar` (`search`,
  `onSearch`, `onReset`, `canReset`) with a labelled `Dropdown` per filter, `EntityTable` with
  `onPage` switching between `setLimit` and `setPage`, and a `Link` to `ROUTES.<name>(id)` in the
  name column. Page, page size, search and filters live in the URL, never in `useState`.
- Details (`LocationDetailsPage.tsx`): `useParams`, `PageLoader` while loading, `EmptyState` with
  the 404 case via `errorStatus(error)`, `DetailsList`, an edit button opening the form dialog, and
  `DeleteButton` that calls the delete mutation, then `notify.success` and
  `navigate(ROUTES.<names>, { replace: true })`. An embedded table uses `useListParams()` with no
  filters and adds the parent id to the query.
- Pages import entities, features and widgets only through their `index.ts`. A table used by two
  pages becomes a widget (`src/widgets/rooms-table`).

## 6. Route and navigation

- `src/shared/config/routes.ts`: `<names>: '/<names>'` and `<name>: (id: string) => ...`.
- `src/app/router.tsx`: two entries with `lazy: lazyPage(() => import('@/pages/<names>'), (m) =>
m.<Names>Page)`, for the list and for `ROUTES.<name>(':id')`, before the `*` route.
- `src/shared/config/nav.ts`: an item in `NAV_ITEMS` with a PrimeIcons class.

## 7. Component tests, next to the code

`*.test.tsx` beside the component, as in `LocationFormDialog.test.tsx` and `LocationsPage.test.tsx`.

- `const api = installMockApi(); signIn();` then `renderWithProviders(<X />, { route, path })`,
  which returns `{ user, router, store }`. Validation that fails before any request needs neither.
- Query by role and accessible name (`getByRole('button', { name: 'Save' })`,
  `getByLabelText(/^Name/)`; labels of required fields end with an asterisk, hence the
  anchored regex). No CSS selectors.
- Cover: a client-side validation message, the happy path (assert `api.db`, the `notify.success`
  spy and `onHide`), a server 422 under its field, a 409 in the banner with the dialog kept open,
  and for lists the URL after searching (`router.state.location.search`).

## 8. End-to-end

`e2e/<name>.spec.ts`, or a step in an existing spec, importing from `./fixtures`:

- `test('...', async ({ signedInPage: page, api }) => ...)`: the page is signed in and the mock is
  reset before each test. Arrange data with `api.post<{ id: string }>('/<names>', {...})`, not by
  clicking.
- Role- and label-based locators; `choose(page, 'input-id', 'text')` for PrimeReact dropdowns.
- Cover one flow through the UI: create, see it in the list, open the details, and the URL-kept
  filter if the list has one.

## Done

- [ ] Contract first, exported from `contract/index.ts`; both mocks implement it; the parity
      scenario passes against both.
- [ ] Endpoints provide and invalidate the right tags (list, id, foreign tags); `silent` on create
      and update only.
- [ ] No deep imports, no slice importing a sibling; every slice has an `index.ts`.
- [ ] Forms: React Hook Form + `zodResolver`, `FormField`, `FormDialog`, `applyServerErrors`; cents
      in the API, euros in the form; times in the location's zone.
- [ ] List state in the URL through `useListParams`.
- [ ] Lazy route in `router.tsx`, `ROUTES` entry, `NAV_ITEMS` entry.
- [ ] Component tests next to the code; an e2e flow; no unhandled requests.
- [ ] README lists (entities, screens) and `mock/README.md` updated if they changed.
- [ ] Gates from the `verify` skill pass, `npm run e2e` included.
