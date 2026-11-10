# Test case design reference (sections 7.1–7.3)

Loaded on demand. Section numbers refer to `SKILL.md`.

### Oracle and property tests (read first)

A test is only as good as its oracle. Prefer, in order: user statement → PR/issue/commit text → spec/OpenAPI/types/JSDoc → existing tests → code behavior that is clearly intentional. A test that merely mirrors the current code can only catch regressions, not bugs: label such cases `characterization` and keep them few. Put effort where a *different* source than the code defines the expectation.

For pure functions (parsers, formatters, calculators, validators) and only if `fast-check`/`hypothesis`/equivalent is **already** a dependency, add 1–2 property tests per unit: round-trip (`parse(format(x)) == x`), idempotence, invariants (sorted output stays sorted, totals add up), "never throws on any input of the declared type". Do not install a library for this.

### 7.1 Anticipating cases: mandatory checklist per unit (not just the happy path)

For **each** function/component/endpoint in scope, walk through every group below. Each group must yield ≥1 case **or** an `N/A (specific reason)` in the todo's coverage matrix. No group may be left blank.

1. **Input** (each parameter/prop/field): empty, `null`/`undefined`, wrong type, whitespace only, min/max ±1, very long, negative/0/NaN/Infinity/decimal, unicode/emoji/accented text, special characters, injection-like strings (`<script>`, `' OR 1=1`, `../`).
2. **State & permissions**: not logged in, expired token, wrong role, access to another user's data (IDOR), empty data / one item / very many, data already deleted / already existing (duplicate).
3. **Dependency failures**: timeout, 4xx, 5xx, offline, empty/wrong-shape/missing-field response, slow response, response delivered multiple times, retry.
4. **Concurrency & repetition**: double click/double submit, same call twice in a row (idempotency), race between two requests, action while loading, cancel midway, route change while a request is in flight.
5. **Data integrity**: failure midway — does it roll back or leave half-written data; wrong ordering / pagination edges (page 0, last page, out of range).
6. **Time & locale**: time zones, DST, month end / leap year, date/number/currency formats per locale.
7. **Security**: XSS (render text, not HTML), sensitive data in responses/logs/URLs, mass assignment, missing server-side permission checks, client-only validation.
8. **UX & a11y** (frontend): back/refresh mid-flow, lost focus, keyboard, errors shown to the user (not silent), loading/empty/error states all exist.
9. **Happy path**: the main correct flow.

In `lite`, only groups 1, 3 and 9 are required; mark the others `N/A (lite)`. Balance rule: for P0/P1 units in `default`/`full`, non-happy cases must be ≥ happy cases. Happy path only = not done.

### 7.2 "Missing handling" cases (gap cases)

Bugs often live where the code does **nothing**. Rule 1 still holds, but the evidence of a gap case is: (a) the place where malicious/unusual input *can reach* the function (call site, route, input field, API response) with `path:line`, and (b) Grep/reading confirms the matching guard is **absent**. Expectations come from types/spec/common standards (e.g. "must not crash on null", "server must check permissions"); with no spec → `NEEDS-CONFIRM`. The test asserts the **correct** behavior (never the current wrong behavior); if it fails it is `FAIL-PRODUCT`.

### 7.3 Coverage matrix in the todo

At the top of `todo/<run-id>.md` add a table: rows = units (file → function), columns = the 9 groups of 7.1, cells = list of TCs or `N/A (reason)`. Use this matrix when reporting "uncovered risks".
