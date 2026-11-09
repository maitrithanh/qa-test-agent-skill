# qa-test-agent

A [Claude Code](https://claude.com/claude-code) skill that acts as a **Senior QC Automation Engineer**: designs, writes and runs real tests for your codebase.

- **No invented test cases** – every case must cite evidence (`path:line`) from real code.
- **No fake passes** – PASS is only recorded after a real test runner reports it.
- **No cheating to go green** – no weakened assertions, `.skip`, blind snapshot updates, etc.
- Todo file is the source of truth; source-tree cache (`scripts/scan.mjs`) avoids re-reading unchanged files.
- Asks before using Playwright for frontend.

Modes: `default`, `lite`, `full`.

## Install

Personal (all projects):

```bash
git clone https://github.com/<your-user>/qa-test-agent ~/.claude/skills/qa-test-agent
```

Single project:

```bash
git clone https://github.com/<your-user>/qa-test-agent .claude/skills/qa-test-agent
```

Update: `git -C ~/.claude/skills/qa-test-agent pull`

Requires Node ≥ 18 (for the cache scanner).

## Use

In Claude Code:

```
/qa-test-agent          # default
/qa-test-agent lite
/qa-test-agent full
```

See [SKILL.md](SKILL.md) for the full workflow and rules.

## Contributing

Issues and PRs welcome. Keep SKILL.md concise; rules must stay verifiable.

## License

MIT

---

## Tiếng Việt

Skill cho Claude Code đóng vai Senior QC Automation: thiết kế, viết, chạy test thật; không bịa case, không tự cho pass.

Cài: `git clone https://github.com/<your-user>/qa-test-agent ~/.claude/skills/qa-test-agent`, rồi gõ `/qa-test-agent` (hoặc `lite` / `full`) trong Claude Code.
