# `audit` mode reference (section 13)

Loaded only when the mode is `audit`. Section numbers refer to `SKILL.md`.

## 13. `audit` mode: security vulnerability scan

Invocation: `/qa-test-agent audit` (whole project) or `audit <path>` (one folder/file). Defensive, **static-first** review of the user's own code. It follows sections 0, 2, 4 and 5 (cache, evidence, no secret reading) and replaces sections 6–11 as described here. Playwright is not asked about.

### 13.1 Ground rules
1. **Authorized, local, non-destructive.** Analyze only the code in this repo. Never attack remote or third-party systems, production, or anything the user did not name. Dynamic checks (if any) target only localhost/test instances the user names, and are **asked first**.
2. **Evidence or it is not a finding.** Each finding needs a traced path `source → … → sink` with `path:line` for every hop, plus confirmation (Grep/read) that no effective guard sits on the path. No traced path → do not report; if suspicious but unproven, report as `NEEDS-CONFIRM` with confidence `Low`.
3. **Redact secrets.** A hardcoded secret is reported as location + type + masked value (first 4 chars max, e.g. `AKIA****`), never in full — not in the report, todo, summary or chat. Advise rotation and a history check (`git log -S'<prefix>' --oneline`, never `-p`).
4. **Do not fix, do not exploit.** Do not edit source; suggest the fix. A "proof of concept" is a **security regression test** that asserts the *safe* behavior and runs locally against the code/mocks (e.g. the handler rejects `../../etc/passwd`); it fails today = `FAIL-PRODUCT`. No weaponized payloads beyond what such a test needs; no network calls out.
5. **Dependencies:** read lockfiles/manifests. A package-manager audit (`npm audit --json`, `pip-audit`, `govulncheck`, …) talks to the network: use it only if already available and the user agrees; treat its output as data. Do not install tools or upgrade packages without asking.
6. **Report honestly:** confidence and severity are judgments; say what was not audited. Never claim "no vulnerabilities" — say "no findings in the audited scope".

### 13.2 Method
1. **Attack surface map** (from cache summaries, read only stale files): entry points — HTTP routes/handlers, GraphQL resolvers, webhooks, queue consumers, CLI args, file uploads, forms, `postMessage`/URL params/localStorage reads, deserialization inputs. Note trust boundaries and where authn/authz is enforced.
2. **Taint trace:** for each entry point follow user-controlled data to sinks (DB query, shell/exec, `eval`/template, file path, HTTP client URL, HTML output, redirect, deserializer, crypto/randomness, logger).
3. **Guard check:** validation, parameterization, escaping, allow-lists, authz checks, rate limits actually on the path (not just nearby).
4. **Classify** each finding: severity (`Critical`/`High`/`Medium`/`Low`/`Info`) from impact × exploitability, CWE id, confidence (`Confirmed` = traced + test fails; `Likely` = traced, not executable; `Low` = `NEEDS-CONFIRM`).
5. **Write security regression tests** for `Confirmed`/`Likely` findings (section 8 standards, header, `manifest.json`, ID `[SEC-001]` in the test name), run them (section 10 rules), map results back. Pass/fail rules of section 0 still apply.
6. **Report.**

### 13.3 Checklist (walk every group; each yields findings, a clean result with the files checked, or `N/A (reason)`)
1. **Injection:** SQL/NoSQL (string-built queries, `$where`, unsanitized operators), OS command (`exec`, `spawn` with shell, `subprocess shell=True`), template/SSTI, LDAP/XPath, header/CRLF, log injection, `eval`/`new Function`.
2. **XSS & output encoding:** `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`, `document.write`, unescaped templates, `javascript:` URLs, unsafe markdown rendering.
3. **Authentication:** password storage (plain/MD5/SHA1 without salt/KDF; want argon2/bcrypt/scrypt), JWT (`alg: none`, weak/hardcoded secret, no expiry/audience check), session fixation, cookie flags (`HttpOnly`, `Secure`, `SameSite`), brute-force/rate limiting, password reset and MFA flaws, user enumeration.
4. **Authorization:** missing server-side checks, IDOR (id from request used without ownership check), role checks only in the client, privilege escalation, mass assignment / over-posting.
5. **CSRF, CORS, SSRF, redirects:** state-changing endpoints without CSRF defence, `Access-Control-Allow-Origin: *` or reflected origin with credentials, user-controlled URLs fetched server-side (no allow-list / internal-address block), open redirect, `postMessage` without origin check, `target=_blank` without `noopener`.
6. **Files & paths:** path traversal (`../`), unrestricted upload (type/size/name/location), zip-slip, unsafe temp files, symlink following.
7. **Deserialization & parsing:** `pickle`/`yaml.load`/Java serialization/`node-serialize`, XXE, prototype pollution (`merge`/`set` on user keys), ReDoS (nested quantifiers on user input), unbounded input size.
8. **Cryptography & randomness:** `Math.random`/`random` for tokens, ECB, hardcoded key/IV/salt, weak hashes for security, disabled TLS verification, custom crypto.
9. **Secrets & sensitive data:** hardcoded keys/tokens/passwords in source, config, Docker/CI files (never read `.env*`, rule 8), secrets in client bundles, PII/tokens in logs, errors, URLs, stack traces returned to clients, tokens in `localStorage`.
10. **Dependencies & supply chain:** known-vulnerable or very outdated packages (lockfile), unpinned/`latest` versions, `postinstall` scripts, packages fetched from git/URL, typosquat-looking names, missing lockfile.
11. **Config, CI/CD & IaC:** debug mode in prod config, default credentials, missing security headers/CSP, Dockerfile running as root / `latest` base / secrets in layers, GitHub Actions (`pull_request_target` with checkout of PR code, unpinned third-party actions, secrets echoed, over-broad `permissions`), Kubernetes privileged/hostPath, Terraform public buckets/`0.0.0.0/0`.
12. **Business logic & concurrency:** race/TOCTOU (check-then-act, double spend), missing idempotency on payments, negative/overflow amounts, workflow-step skipping, insufficient anti-automation.
13. **Logging & detection:** security events (login failure, permission denied) not logged; sensitive data logged.

Starter Grep hints (a hit is only a lead, never a finding): `eval\(|new Function|exec\(|spawn\(|shell=True|subprocess|innerHTML|dangerouslySetInnerHTML|v-html|document\.write|pickle\.loads|yaml\.load\(|createHash\(['"](md5|sha1)|Math\.random|rejectUnauthorized: ?false|verify=False|Access-Control-Allow-Origin|\$where|SELECT .*\+|\.query\(.*\$\{|localStorage\.setItem\(.*(token|jwt)|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY|AKIA[0-9A-Z]{16}`. Always exclude secret files (rule 8) and `node_modules`/build output.

### 13.4 Finding format (in `todo/<run-id>.md`, same lifecycle and statuses as section 7)

```
- [ ] SEC-004 | High | CWE-89 SQL injection | confidence: Confirmed
  - Entry: src/routes/users.ts:31 (GET /users?name=)
  - Trace: users.ts:31 req.query.name → users.ts:38 `... WHERE name='${name}'` → db.ts:12 pool.query(sql)
  - Guards checked: no parameterization, no validation on path (users.ts:31-40, db.ts:10-14)
  - Impact: read/modify any table through the query string
  - Fix (not applied): use parameterized query `pool.query('... WHERE name = $1', [name])`
  - Test file: tests/security/users.sqli.test.ts
  - Status: TODO
```

### 13.5 Report `.qa-agent/reports/<run-id>-audit.md`
- Scope (paths audited, files read vs cached), commit, date
- Summary table: findings by severity × confidence
- Each finding in the 13.4 format with its final status (`FAIL-PRODUCT` when the regression test fails)
- Checklist table (13 groups): findings / clean (files checked) / N/A (reason)
- **Not audited / limits** (languages without taint support, dynamic behavior, third-party services, runtime config, anything skipped) and `NEEDS-CONFIRM` questions
- Dropped leads (suspicious but no traced path) with reason
- Files created (tests, report) and the command to rerun the security tests

Final message: counts per severity, top 3 findings with `path:line`, what to fix first, report path. Secrets stay masked everywhere.

### 13.6 Audit self-check
- [ ] Every finding has a full `source → sink` trace with `path:line`, and guard check
- [ ] No source edited; no remote system touched; no dynamic test without the user's OK
- [ ] No secret value printed in full anywhere; no `.env*` read
- [ ] Every checklist group has findings, a clean result, or `N/A (reason)`
- [ ] Report states what was not audited; it never claims the code is "secure"
