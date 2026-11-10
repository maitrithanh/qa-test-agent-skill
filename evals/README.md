# Evals: does the skill actually find bugs?

`buggy-app/` is a tiny JS app with **9 planted bugs** (boundaries, missing guards, authz, rounding, empty input). The expected behavior is written in the JSDoc of each function (the oracle). `answer-key.json` lists the bugs and is **not** inside `buggy-app/`, so the agent never sees it.

## Run

```bash
# 1. fresh copy, so the agent cannot see the answer key
rm -rf /tmp/qa-eval && cp -r evals/buggy-app /tmp/qa-eval && cd /tmp/qa-eval && git init -q && git add -A && git commit -qm base

# 2. in that folder, run the skill in the mode you want to measure, e.g.
#    /qa-test-agent lite     |   /qa-test-agent full
#    answer the first-run questions; tell it to put tests in tests/ using node:test

# 3. score (from the skill repo)
node evals/score.mjs /tmp/qa-eval/tests
```

## Reading the score

| Field | Meaning |
|---|---|
| `score` | bugs caught / 9. Caught = a test fails on the buggy app **and** passes once only that bug is fixed |
| `falsePositives` | tests that fail even on the fully fixed app = wrong expectations (noise a dev has to clean up) |
| `missed` | bugs no test caught |

Also record by hand per run: tokens used, wall time, runner calls, number of tests. Compare modes (`lite` / `default` / `full`) and skill versions on the same app. A change to the skill is an improvement only if the score goes up, false positives go down, or cost drops at the same score.

## Sanity check of the scorer

```bash
node evals/score.mjs evals/reference-tests   # expect 9/9 and no false positives
```
