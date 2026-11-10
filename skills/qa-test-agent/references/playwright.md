# Playwright / UI reference (section 9)

Loaded only for e2e work. Section numbers refer to `SKILL.md`.

## 9. Playwright (when `playwright` = yes, or = ask and the user agrees this run)

1. Check whether `@playwright/test` is present; if missing, ask first, then install (`<pm> add -D @playwright/test` and `npx playwright install chromium`).
2. An existing `playwright.config.*` → reuse it. Otherwise create one with: `testDir` pointing at `tests/e2e/specs`, `use.baseURL` from config, `webServer` = startCommand (`reuseExistingServer: true`), `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `outputDir: '.qa-agent/logs/playwright'`, reporter `[['list'], ['json', { outputFile: '.qa-agent/logs/playwright/results.json' }]]`.
3. **Survey the real DOM before writing specs** with the bundled tool: copy `scripts/ui-check.mjs` to `.qa-agent/bin/ui-check.mjs`, then run `node .qa-agent/bin/ui-check.mjs <url...> --viewports desktop,mobile`. For each page/viewport it writes the aria snapshot (`*.aria.txt`) and a full-page screenshot to `.qa-agent/logs/ui-check/` and prints JSON: HTTP status, console/page errors, failed requests, plus leads (images without alt, unlabeled controls, nameless buttons, horizontal overflow, `<h1>` count). Selectors in specs must appear in the aria snapshot or in the source. The findings are **leads, not test results**: turn one into a case only through the evidence gate (section 7), and never record PASS from this tool. It refuses non-local hosts unless `--allow-remote` is passed for a target the user named, never installs anything (exit 3 = Playwright/browser missing → ask the user), uses `--storage <state.json>` for logged-in pages, and falls back to an installed Chrome/Edge if bundled Chromium is absent.
4. Locator priority: `getByRole` > `getByLabel` > `getByPlaceholder` > `getByText` > `getByTestId`. No positional CSS/XPath (`nth-child`, `div > div`).
5. No `waitForTimeout`; use auto-wait, `expect(...).toBeVisible()`, `expect.poll`, `waitForResponse`.
6. A Page Object per page; specs describe only the flow.
7. Auth: use `storageState` created in a global setup from environment variables, stored in `.qa-agent/` (gitignored).
8. Run both desktop and mobile viewports for responsive cases (projects in the config).

If the app cannot start → e2e cases are `BLOCKED` with the log, never marked otherwise.
