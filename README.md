# qa-test-agent

A [Claude Code](https://claude.com/claude-code) skill that acts as a **Senior QC Automation Engineer**: designs, writes and runs real tests for your codebase.

- **No invented test cases** – every case must cite evidence (`path:line`) from real code.
- **No fake passes** – PASS is only recorded after a real test runner reports it.
- **No cheating to go green** – no weakened assertions, `.skip`, blind snapshot updates, etc.
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
