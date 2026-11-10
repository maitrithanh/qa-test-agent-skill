# Tham chiếu chế độ `repro`

Chỉ nạp cho `/qa-test-agent repro <mô tả bug | số issue | URL>`. Mục tiêu: một test fail chứng minh bug, để sau này kiểm chứng bản sửa. Số mục tham chiếu tới `SKILL.md`.

1. **Hiểu báo cáo.** Lấy triệu chứng, expected vs actual, các bước. Đọc nội dung issue/PR nếu có `gh` (chỉ đọc). Thiếu expected hoặc bước → hỏi một câu ngắn, không đoán.
2. **Định vị** code bằng Grep/summary cache (quy tắc 9); chỉ đọc phần liên quan. Ghi lại `path:line` nghi ngờ.
3. **Chọn tầng rẻ nhất** tái hiện được: unit > integration > e2e (e2e chỉ khi bug cần trình duyệt thật; khi đó theo `references/playwright.md`).
4. **Viết một test** `[REPRO-1]` khẳng định hành vi **đúng** (quy tắc 7), theo `references/writing.md`. Thêm header và mục trong `manifest.json`.
5. **Chạy nó. Phải FAIL, và đúng lý do được báo** (thông báo lỗi khớp triệu chứng). Fail vì lý do khác (import, setup) → `FAIL-TEST`, sửa tối đa 2 lần. Pass → chưa tái hiện được bug: nói rõ đã thử gì, không ép.
6. **Dừng.** Không sửa source trừ khi user yêu cầu. Báo cáo tối đa 8 dòng: file test, lệnh chạy, thông báo lỗi, `path:line` và nguyên nhân nghi ngờ.
7. Nếu user sửa code (hoặc nhờ bạn sửa), chạy lại đúng test đó: phải pass, rồi chạy test liên quan sẵn có để kiểm hồi quy (`vitest related`, `jest --findRelatedTests`).
8. Tùy chọn, hỏi trước: thêm 2–3 case lân cận quanh cùng đơn vị (biên, null) qua cổng bằng chứng thông thường.

Bỏ qua mục 3 (Q2), 7.1–7.4, 11 (báo cáo đầy đủ) và 12; vẫn tuân thủ mục 0, 10 và 14.
