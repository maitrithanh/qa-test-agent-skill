# Non-functional & data reference (section 7.4)

Loaded only when the scope touches these areas. Section numbers refer to `SKILL.md`.

### 7.4 Non-functional & data (when the scope touches them)

Create cases only with evidence in the code; by default in `full`, and in `default` only when the changed files belong to these areas. No tooling/infrastructure → `BLOCKED`, do not install anything yourself.
- **Basic performance:** nested loops/queries (N+1), large lists (10k items) stay responsive, correct debounce/throttle, no leaked listeners/timers after unmount. Take thresholds from a spec or the user; with no threshold, only record the measurement, do not assert.
- **Load/stress:** never run against a real environment on your own. Only generate scripts (k6/autocannon) and **ask** before running, targeting only localhost/staging the user names.
- **DB migration/schema:** run up from an empty DB and from old data; rollback; violated constraints (unique, FK, NOT NULL) fail correctly; existing data is not lost.
- **API contract:** request/response shape matches types/OpenAPI if present; added/removed fields do not break clients; error codes and messages are consistent.
- **Compatibility:** browsers/viewports (Playwright projects), Node/runtime versions listed in `engines`.
