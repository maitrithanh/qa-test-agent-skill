# Tham chiếu cache source tree (mục 5)

Nạp khi cần. Số mục tham chiếu tới `SKILL.md`.

## 5. Cache source tree

Lần đầu, copy `scripts/scan.mjs` của skill này vào `.qa-agent/bin/scan.mjs` của dự án (cần Node ≥ 18; nếu dự án không có Node thì viết bản Python tương đương). Chạy: `node .qa-agent/bin/scan.mjs`. Script in ra JSON: `added`, `changed`, `removed`, `staleSummary`, `unchanged`, `total`, `impacted`, `impactedTests`. `impacted`/`impactedTests` = file nguồn/file test import (kể cả gián tiếp) file vừa thêm/đổi, dựa trên đồ thị import (JS/TS/Vue/Svelte, hỗ trợ import tương đối và alias `@/`, `~/`, `#/`). Ngôn ngữ khác hoặc alias lạ: fallback Grep. Script tự xoá summary của file đã bị xoá, ghi cache nguyên tử, và dùng `scan.lock` để chặn chạy song song (lock cũ >5 phút bị coi là hỏng).

Cách dùng cache:
- Chạy script ở đầu mỗi lần. **Dựa vào `staleSummary`, không dựa vào `changed`** (cache được ghi ngay khi quét, lần chạy dở dang sẽ làm mất `changed`). Summary của file trong `impacted` có thể lỗi thời dù hash không đổi (file nó import đã đổi): đọc lại phần import/export liên quan trước khi tin summary. Chỉ đọc file nằm trong `staleSummary` **và** thuộc phạm vi của chế độ.
- Sau khi đọc một file nguồn, ghi summary vào `cache/summaries/<path thay / bằng __>.json`:
```json
{ "path": "src/components/LoginForm.vue", "hash": "<sha1 từ source-tree.json>", "kind": "component|page|hook|composable|store|util|service|api|route|other",
  "exports": ["LoginForm"], "inputs": ["props: redirectTo?: string"], "outputs": ["emit: success"],
  "branches": ["L42 if !email -> error 'required'"], "sideEffects": ["POST /api/auth/login (L58)"],
  "selectors": ["role=button name=Đăng nhập", "data-testid=login-email"], "deps": ["@/services/auth"], "hasTests": ["src/components/__tests__/LoginForm.spec.ts"] }
```
- Summary chỉ ghi điều **có trong code**, kèm số dòng. Không suy đoán.
- Chỉ cập nhật `lastRunCommit` (= `git rev-parse HEAD`) vào `source-tree.json` khi lần chạy hoàn tất bước 11.
