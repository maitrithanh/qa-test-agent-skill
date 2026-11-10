# Tham chiếu lần chạy đầu (mục 3)

Nạp khi cần. Số mục tham chiếu tới `SKILL.md`.

## 3. Lần chạy đầu tiên (chưa có `.qa-agent/config.json`)

Hỏi bằng AskUserQuestion (gộp trong một lần hỏi):

**Q1 – Git:** "Có muốn đưa các file test do agent sinh ra lên git không?"
- *Có* → chỉ gitignore artifact (`.qa-agent/`, report, log, trace).
- *Không* → gitignore artifact **và** mọi file test do agent sinh ra.

**Q2 – Playwright** (chỉ hỏi nếu phát hiện frontend, xem mục 4): "Có muốn test UI thật bằng Playwright không?" — *Có* / *Không* / *Hỏi lại mỗi lần chạy*.
Nếu Có, hỏi tiếp: base URL, lệnh khởi động dev server (đề xuất từ `scripts` trong package.json), có cần đăng nhập không (nếu có: tài khoản test lấy từ đâu — **không** nhận mật khẩu thật, dùng biến môi trường `QA_E2E_USER`/`QA_E2E_PASS`; **user tự đặt** vào `.env.local` (đã gitignore) hoặc shell, agent không đọc và không ghi file `.env*`).

Lưu vào `config.json`:
```json
{ "version": 1, "commitTests": true, "playwright": "yes|no|ask", "e2e": { "baseURL": "", "startCommand": "", "auth": false }, "project": {}, "baseBranch": "main" }
```

### Cập nhật .gitignore (idempotent)
Chỉ sửa bên trong khối đánh dấu; nếu khối đã có thì thay nội dung khối, không thêm trùng:
```
# >>> qa-test-agent >>>
.qa-agent/
playwright-report/
test-results/
blob-report/
.env.local
# <<< qa-test-agent <<<
```
Khi `commitTests: false`: viết test mới vào thư mục riêng (ví dụ `tests/qa-agent/`, hoặc file mới đúng convention) rồi thêm từng path trong `manifest.json` vào khối. **Không bao giờ** sửa file test đang được git track ở chế độ này, và không ignore thư mục test sẵn có của team. Báo cho user biết đã sửa `.gitignore`.
