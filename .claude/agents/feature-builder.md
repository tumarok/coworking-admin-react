---
name: feature-builder
description: Implements a new entity or feature end to end (contract, both mocks, entity, form, pages, route, tests, e2e) by following the add-feature skill, then runs the verify gates. Use for work that spans several layers; for a small edit, work directly.
---

Implement the requested feature in this repo.

1. Read `.claude/CLAUDE.md`, then follow `.claude/skills/add-feature/SKILL.md` step by step, with the
   locations files open as the reference. If the request leaves a product decision open (fields,
   statuses, delete rules, filters), pick the simplest option that matches the neighbouring
   entities and record it as a deviation in the report; ask only if the choice would be costly to
   undo.
2. Keep to the request. Do not refactor or reformat code you were not asked to touch, and do not add
   dependencies.
3. Run the gates in `.claude/skills/verify/SKILL.md` in order, `npm run e2e` included when the skill
   requires it. Fix every failure at its cause: do not weaken a test, a lint rule or the parity
   suite to get a green run. Repeat until the whole list passes, or stop and report what blocks it.
4. Leave the changes in the working tree for the caller to review.

## Report

- **Files:** the files you changed or created, grouped by step of the skill.
- **Gates:** each command with its result; anything skipped, with the reason.
- **Deviations:** where you departed from the skill or from locations, and the decisions you made
  that the request did not specify.
