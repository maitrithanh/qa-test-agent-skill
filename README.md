# qa-test-agent

A [Claude Code](https://claude.com/claude-code) skill that acts as a **Senior QC Automation Engineer**: designs, writes and runs real tests for your codebase.

- **No invented test cases** – every case must cite evidence (`path:line`) from real code.
- **No fake passes** – PASS is only recorded after a real test runner reports it.
- **No cheating to go green** – no weakened assertions, `.skip`, blind snapshot updates, etc.
- **Not just happy paths**: a 9-group checklist per unit (input, auth/state, dependency failures, concurrency, data integrity, time/locale, security, UX/a11y, happy), gap cases for missing guards, a coverage matrix, and a check that P0 tests can actually fail.
- Todo file is the source of truth; source-tree cache (`scripts/scan.mjs`) avoids re-reading unchanged files.
- Asks before using Playwright for frontend.

Modes: `default`, `lite`, `full`.

## Install

Via plugin marketplace (recommended), inside Claude Code:

```
/plugin marketplace add maitrithanh/qa-test-agent-skill
/plugin install qa-test-agent@qa-test-agent-skill
```

Update: `/plugin marketplace update qa-test-agent-skill`

### Other agents

The skill is the open `SKILL.md` format, so the same `skills/qa-test-agent/` folder works everywhere.

**Gemini CLI** (extension):
```bash
gemini extensions install https://github.com/maitrithanh/qa-test-agent-skill
```

**Codex** (plugin marketplace):
```bash
codex plugin marketplace add maitrithanh/qa-test-agent-skill
```
then install `qa-test-agent` from the Plugins directory. Or no plugin: copy the folder to `.agents/skills/` (repo) or `~/.agents/skills/` (user).

**GitHub Copilot** (no marketplace; copy the skill, works in VS Code agent mode, Copilot CLI and cloud agent):
```bash
git clone https://github.com/maitrithanh/qa-test-agent-skill /tmp/qta
cp -r /tmp/qta/skills/qa-test-agent .github/skills/        # per repo
cp -r /tmp/qta/skills/qa-test-agent ~/.copilot/skills/     # personal
```

> The Gemini/Codex/Copilot manifests follow their public docs but are less tested than the Claude Code one. Open an issue if an install fails.

Manual (no plugin): copy the skill folder.

```bash
git clone https://github.com/maitrithanh/qa-test-agent-skill /tmp/qta
cp -r /tmp/qta/skills/qa-test-agent ~/.claude/skills/
```

Requires Node ≥ 18 (for the cache scanner).

## Use

In Claude Code:

```
/qa-test-agent          # default (as a plugin: /qa-test-agent:qa-test-agent)
/qa-test-agent lite
/qa-test-agent full
```

See [SKILL.md](skills/qa-test-agent/SKILL.md) for the full workflow and rules.

## Contributing

Issues and PRs welcome. Keep SKILL.md concise; rules must stay verifiable.

## License

MIT

---

## Tiếng Việt

Skill cho Claude Code đóng vai Senior QC Automation: thiết kế, viết, chạy test thật; không bịa case, không tự cho pass.

Cài: `/plugin marketplace add maitrithanh/qa-test-agent-skill` rồi `/plugin install qa-test-agent@qa-test-agent-skill`, sau đó gõ `/qa-test-agent` (hoặc `lite` / `full`) trong Claude Code.
