# `repro` mode reference

Loaded only for `/qa-test-agent repro <bug description | issue number | URL>`. Goal: one failing test that proves the bug, so the fix can be verified. Sections refer to `SKILL.md`.

1. **Understand the report.** Get symptom, expected vs actual, steps. Read the issue/PR text if `gh` is available (read-only). Missing expected behavior or steps → ask one short question; do not guess.
2. **Locate** the code with Grep/cache summaries (rule 9); read only the relevant part. Write down the suspected `path:line`.
3. **Pick the cheapest layer** that reproduces it: unit > integration > e2e (e2e only if the bug needs the real browser; then follow `references/playwright.md`).
4. **Write one test** `[REPRO-1]` asserting the **correct** behavior (rule 7), following `references/writing.md`. Add the header and `manifest.json` entry.
5. **Run it. It must FAIL, and for the reported reason** (check the message matches the symptom). Fails for another reason (import, setup) → `FAIL-TEST`, fix at most 2 times. Passes → the bug is not reproduced: say so with what you tried, do not force it.
6. **Stop.** Do not edit source unless the user asks. Report in ≤ 8 lines: the test file, the run command, the failure message, the suspected `path:line` and cause.
7. If the user then fixes the code (or asks you to), rerun the same test: it must pass, then run the related existing tests for regression (`vitest related`, `jest --findRelatedTests`).
8. Optional, ask first: also add 2–3 neighbour cases around the same unit (boundary, null) with the normal evidence gate.

Skips sections 3 (Q2), 7.1–7.4, 11 (full report) and 12; still obeys sections 0, 10 and 14.
