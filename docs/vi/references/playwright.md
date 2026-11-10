# Tham chiếu Playwright / UI (mục 9)

Chỉ nạp khi làm e2e. Số mục tham chiếu tới `SKILL.md`.

## 9. Playwright (khi `playwright` = yes, hoặc = ask và user đồng ý ở lần chạy này)

1. Kiểm tra `@playwright/test` đã có chưa; thiếu → hỏi rồi mới cài (`<pm> add -D @playwright/test` và `npx playwright install chromium`).
2. Có `playwright.config.*` sẵn → dùng lại. Chưa có → tạo với: `testDir` trỏ vào `tests/e2e/specs`, `use.baseURL` từ config, `webServer` = startCommand (`reuseExistingServer: true`), `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `outputDir: '.qa-agent/logs/playwright'`, reporter `[['list'], ['json', { outputFile: '.qa-agent/logs/playwright/results.json' }]]`.
3. **Khảo sát DOM thật trước khi viết spec** bằng tool đi kèm: copy `scripts/ui-check.mjs` vào `.qa-agent/bin/ui-check.mjs`, rồi chạy `node .qa-agent/bin/ui-check.mjs <url...> --viewports desktop,mobile`. Với mỗi trang/viewport, tool ghi aria snapshot (`*.aria.txt`) và ảnh chụp toàn trang vào `.qa-agent/logs/ui-check/`, in JSON gồm: HTTP status, lỗi console/page, request thất bại, cùng các gợi ý (ảnh thiếu alt, control không nhãn, nút không tên, tràn ngang, số `<h1>`). Selector trong spec phải xuất hiện trong aria snapshot hoặc trong source. Kết quả của tool là **gợi ý, không phải kết quả test**: chỉ biến thành case qua cổng bằng chứng (mục 7), và không bao giờ ghi PASS từ tool này. Tool từ chối host không phải local trừ khi có `--allow-remote` cho đích user đã nêu, không tự cài gì (exit 3 = thiếu Playwright/trình duyệt → hỏi user), dùng `--storage <state.json>` cho trang cần đăng nhập, và tự chuyển sang Chrome/Edge đã cài nếu không có Chromium đi kèm.
4. Ưu tiên locator: `getByRole` > `getByLabel` > `getByPlaceholder` > `getByText` > `getByTestId`. Cấm CSS/XPath theo vị trí (`nth-child`, `div > div`).
5. Không `waitForTimeout`; dùng auto-wait, `expect(...).toBeVisible()`, `expect.poll`, `waitForResponse`.
6. Page Object cho mỗi trang; spec chỉ mô tả luồng.
7. Auth: dùng `storageState` tạo trong global setup từ biến môi trường, lưu ở `.qa-agent/` (đã gitignore).
8. Chạy cả viewport desktop và mobile cho case responsive (projects trong config).

Nếu app không khởi động được → các case e2e là `BLOCKED` kèm log, không đánh dấu khác.
