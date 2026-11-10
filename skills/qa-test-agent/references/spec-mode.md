# Spec source reference (section 6.1)

Loaded when the user points at requirement docs, or picks "use a doc" at the section 6.1 question. Goal: tests whose expectations come from the **document**, so they catch code that drifts from it (tests derived from code can only mirror the code).

## 1. Ask, never guess

Never crawl `docs/` or assume a file is the spec. Ask once (question tool if available) and **propose concrete options** the agent can actually read:

- **A. A path in the repo** (`docs/feature-x.md`, `openapi.yaml`, `*.feature`, user stories / acceptance criteria). If you find likely candidates with Glob (`docs/**`, `*.md`, `openapi.*`, `**/*.feature`), list them by name only (do not read) and let the user pick.
- **B. Paste the text** straight into the chat (best for a few rules or acceptance criteria).
- **C. A file outside the repo**: ask for a path under the working directory, or to copy it in. PDF/DOCX → use the matching file skill/tool if present; otherwise ask for an export to `.md`/`.txt`.
- **D. A link** (Confluence, Notion, Google Doc, Jira/GitHub issue): read it only if a connector/tool for that service is available (`gh issue view` read-only for GitHub); otherwise ask the user to paste or export it. Never send the content anywhere.
- **E. No doc** → fall back to rule 7 as before (PR/commit text, types, code). Say in the report that expectations were not doc-based.

Also ask which part of the doc applies (section/feature) and whether the doc is **current** (stale docs produce false `FAIL-PRODUCT`).

## 2. Requirement list

Read the doc **before** the code. Split it into atomic requirements, written to the top of the todo:

```
REQ-004 | docs/checkout.md:42-45 | "Coupon cannot be combined with another coupon" | testable
REQ-005 | docs/checkout.md:50    | "Fast delivery" | UNTESTABLE (no threshold given) → ask
```

Each REQ carries a quote and `file:line` (or `pasted:#n`). Vague wording → `UNTESTABLE`/`NEEDS-CONFIRM`, never a guessed number. Doc contradicting itself → ask.

## 3. Cases from requirements

- Every testable REQ gets ≥1 case; case `Evidence` = the REQ id + quote, plus the code location it targets (`path:line`, found by Grep, rule 1 still applies). Expectation source = the doc.
- Design the case from the REQ **without copying the code's logic**; read the code only to find where to call it.
- Still walk the 9-group matrix (`case-design.md`) for the units involved: the doc rarely lists edge cases; those keep code/type evidence.
- Test name: `[TC-012][REQ-004] ...`.

## 4. Failures = drift

A failing doc-based case is not auto "product bug". Mark `FAIL-PRODUCT` with label `SPEC-DRIFT` and ask the user which side is right (code wrong / doc outdated). Never edit source or doc to settle it (rule 3).

## 5. Report additions

- **Traceability table**: REQ → TC ids → status. A REQ with no passing case is listed as uncovered with the reason.
- **Undocumented behavior**: code paths in scope with no REQ (candidate dead code or missing doc), listed, not tested as doc-based.
- **SPEC-DRIFT** list with quote vs actual behavior.
