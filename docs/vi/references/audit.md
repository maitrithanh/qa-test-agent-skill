# Tham chiếu chế độ `audit` (mục 13)

Chỉ nạp khi chế độ là `audit`. Số mục tham chiếu tới `SKILL.md`.

## 13. Chế độ `audit`: quét lỗ hổng bảo mật

Gọi: `/qa-test-agent audit` (toàn dự án) hoặc `audit <path>` (một thư mục/file). Rà soát **phòng thủ, ưu tiên tĩnh** trên code của chính người dùng. Tuân theo mục 0, 2, 4, 5 (cache, bằng chứng, không đọc secret) và thay các mục 6–11 như bên dưới. Không hỏi về Playwright.

### 13.1 Nguyên tắc
1. **Được phép, cục bộ, không phá hoại.** Chỉ phân tích code trong repo. Không tấn công hệ thống từ xa/bên thứ ba, production, hay bất cứ thứ gì user không nêu. Kiểm tra động (nếu có) chỉ nhắm localhost/môi trường test user nêu, và **hỏi trước**.
2. **Có bằng chứng mới là lỗ hổng.** Mỗi finding cần đường đi `source → … → sink` kèm `path:line` từng bước, và xác nhận (Grep/đọc) không có guard hiệu quả trên đường đó. Không truy được đường đi → không báo; nghi ngờ nhưng chưa chứng minh → `NEEDS-CONFIRM`, confidence `Low`.
3. **Che secret.** Secret hardcode chỉ báo vị trí + loại + giá trị đã che (tối đa 4 ký tự đầu, ví dụ `AKIA****`), không bao giờ đầy đủ — kể cả báo cáo, todo, summary, chat. Khuyên rotate và kiểm tra lịch sử (`git log -S'<prefix>' --oneline`, không dùng `-p`).
4. **Không sửa, không khai thác.** Không sửa source; chỉ đề xuất cách sửa. "PoC" là **test hồi quy bảo mật** khẳng định hành vi *an toàn* và chạy cục bộ trên code/mock (ví dụ handler từ chối `../../etc/passwd`); đang fail = `FAIL-PRODUCT`. Không tạo payload vũ khí hoá ngoài mức test cần; không gọi mạng ra ngoài.
5. **Dependency:** đọc lockfile/manifest. Lệnh audit của package manager (`npm audit --json`, `pip-audit`, `govulncheck`, …) có gọi mạng: chỉ dùng nếu có sẵn và user đồng ý; coi output là dữ liệu. Không cài công cụ/nâng package khi chưa hỏi.
6. **Báo cáo trung thực:** confidence và severity là phán đoán; nói rõ phần chưa audit. Không bao giờ khẳng định "không có lỗ hổng" — chỉ nói "không có finding trong phạm vi đã audit".

### 13.2 Quy trình
1. **Bản đồ bề mặt tấn công** (từ summary cache, chỉ đọc file stale): entry point — HTTP route/handler, GraphQL resolver, webhook, queue consumer, tham số CLI, upload file, form, đọc `postMessage`/URL param/localStorage, đầu vào deserialize. Ghi ranh giới tin cậy và nơi authn/authz được thực thi.
2. **Truy vết taint:** từ mỗi entry point theo dữ liệu do user kiểm soát tới sink (query DB, shell/exec, `eval`/template, đường dẫn file, URL của HTTP client, output HTML, redirect, deserializer, crypto/random, logger).
3. **Kiểm tra guard:** validation, parameterize, escape, allow-list, kiểm tra quyền, rate limit có thật sự nằm trên đường đi (không chỉ gần đó).
4. **Phân loại:** severity (`Critical`/`High`/`Medium`/`Low`/`Info`) theo tác động × khả năng khai thác, mã CWE, confidence (`Confirmed` = đã truy vết + test fail; `Likely` = đã truy vết, không chạy được; `Low` = `NEEDS-CONFIRM`).
5. **Viết test hồi quy bảo mật** cho finding `Confirmed`/`Likely` (chuẩn mục 8, header, `manifest.json`, ID `[SEC-001]` trong tên test), chạy theo mục 10, map kết quả về. Quy tắc pass/fail ở mục 0 vẫn áp dụng.
6. **Báo cáo.**

### 13.3 Checklist (duyệt đủ nhóm; mỗi nhóm ra finding, kết quả sạch kèm file đã kiểm, hoặc `N/A (lý do)`)
1. **Injection:** SQL/NoSQL (query nối chuỗi, `$where`, toán tử không lọc), lệnh OS (`exec`, `spawn` có shell, `subprocess shell=True`), template/SSTI, LDAP/XPath, header/CRLF, log injection, `eval`/`new Function`.
2. **XSS & mã hoá output:** `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`, `document.write`, template không escape, URL `javascript:`, render markdown không an toàn.
3. **Xác thực:** lưu mật khẩu (plain/MD5/SHA1 không salt/KDF; cần argon2/bcrypt/scrypt), JWT (`alg: none`, secret yếu/hardcode, không kiểm hạn/audience), session fixation, cờ cookie (`HttpOnly`, `Secure`, `SameSite`), brute-force/rate limit, lỗi reset mật khẩu và MFA, liệt kê user.
4. **Phân quyền:** thiếu kiểm tra phía server, IDOR (id từ request dùng không kiểm chủ sở hữu), kiểm role chỉ ở client, leo thang đặc quyền, mass assignment.
5. **CSRF, CORS, SSRF, redirect:** endpoint đổi trạng thái không chống CSRF, `Access-Control-Allow-Origin: *` hoặc phản chiếu origin kèm credentials, server fetch URL do user nhập (không allow-list/chặn địa chỉ nội bộ), open redirect, `postMessage` không kiểm origin, `target=_blank` thiếu `noopener`.
6. **File & đường dẫn:** path traversal (`../`), upload không giới hạn (loại/kích thước/tên/vị trí), zip-slip, file tạm không an toàn, theo symlink.
7. **Deserialize & parsing:** `pickle`/`yaml.load`/Java serialization/`node-serialize`, XXE, prototype pollution (`merge`/`set` trên key của user), ReDoS (quantifier lồng trên input user), input không giới hạn kích thước.
8. **Mật mã & ngẫu nhiên:** `Math.random`/`random` cho token, ECB, key/IV/salt hardcode, hash yếu cho mục đích bảo mật, tắt xác minh TLS, tự chế crypto.
9. **Secret & dữ liệu nhạy cảm:** key/token/mật khẩu hardcode trong source, config, Docker/CI (không đọc `.env*`, nguyên tắc 8), secret trong bundle client, PII/token trong log, lỗi, URL, trả stack trace cho client, token trong `localStorage`.
10. **Dependency & chuỗi cung ứng:** package có lỗ hổng đã biết hoặc quá cũ (lockfile), version không ghim/`latest`, script `postinstall`, package lấy từ git/URL, tên giống typosquat, thiếu lockfile.
11. **Cấu hình, CI/CD & IaC:** debug mode ở prod, credential mặc định, thiếu security header/CSP, Dockerfile chạy root / base `latest` / secret trong layer, GitHub Actions (`pull_request_target` checkout code PR, action bên thứ ba không ghim, in secret, `permissions` quá rộng), Kubernetes privileged/hostPath, Terraform bucket public/`0.0.0.0/0`.
12. **Logic nghiệp vụ & đồng thời:** race/TOCTOU (check-then-act, double spend), thiếu idempotency ở thanh toán, số âm/tràn, bỏ qua bước workflow, thiếu chống tự động hoá.
13. **Log & phát hiện:** sự kiện bảo mật (đăng nhập sai, bị từ chối quyền) không được ghi; log chứa dữ liệu nhạy cảm.

Gợi ý Grep khởi đầu (kết quả chỉ là manh mối, không phải finding): `eval\(|new Function|exec\(|spawn\(|shell=True|subprocess|innerHTML|dangerouslySetInnerHTML|v-html|document\.write|pickle\.loads|yaml\.load\(|createHash\(['"](md5|sha1)|Math\.random|rejectUnauthorized: ?false|verify=False|Access-Control-Allow-Origin|\$where|SELECT .*\+|\.query\(.*\$\{|localStorage\.setItem\(.*(token|jwt)|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY|AKIA[0-9A-Z]{16}`. Luôn loại file secret (nguyên tắc 8) và `node_modules`/output build.

### 13.4 Định dạng finding (trong `todo/<run-id>.md`, cùng vòng đời và trạng thái như mục 7)

```
- [ ] SEC-004 | High | CWE-89 SQL injection | confidence: Confirmed
  - Điểm vào: src/routes/users.ts:31 (GET /users?name=)
  - Đường đi: users.ts:31 req.query.name → users.ts:38 `... WHERE name='${name}'` → db.ts:12 pool.query(sql)
  - Guard đã kiểm: không parameterize, không validate trên đường đi (users.ts:31-40, db.ts:10-14)
  - Tác động: đọc/sửa bảng bất kỳ qua query string
  - Cách sửa (chưa áp dụng): dùng query tham số hoá `pool.query('... WHERE name = $1', [name])`
  - File test: tests/security/users.sqli.test.ts
  - Trạng thái: TODO
```

### 13.5 Báo cáo `.qa-agent/reports/<run-id>-audit.md`
- Phạm vi (path đã audit, file đọc mới vs cache), commit, ngày
- Bảng tổng: số finding theo severity × confidence
- Từng finding theo mẫu 13.4 với trạng thái cuối (`FAIL-PRODUCT` khi test hồi quy fail)
- Bảng checklist (13 nhóm): finding / sạch (file đã kiểm) / N/A (lý do)
- **Chưa audit / giới hạn** (ngôn ngữ chưa hỗ trợ taint, hành vi động, dịch vụ bên thứ ba, cấu hình runtime, mọi thứ bị bỏ qua) và câu hỏi `NEEDS-CONFIRM`
- Manh mối đã loại (nghi ngờ nhưng không truy được đường đi) kèm lý do
- File đã tạo (test, báo cáo) và lệnh chạy lại test bảo mật

Tin nhắn cuối: số lượng theo severity, 3 finding đầu kèm `path:line`, nên sửa gì trước, đường dẫn báo cáo. Secret luôn được che ở mọi nơi.

### 13.6 Tự kiểm audit
- [ ] Mỗi finding có đủ đường đi `source → sink` kèm `path:line` và kiểm tra guard
- [ ] Không sửa source; không động tới hệ thống từ xa; không test động khi user chưa đồng ý
- [ ] Không in đầy đủ giá trị secret ở đâu cả; không đọc `.env*`
- [ ] Mỗi nhóm checklist có finding, kết quả sạch, hoặc `N/A (lý do)`
- [ ] Báo cáo nêu phần chưa audit; không bao giờ khẳng định code "an toàn"
