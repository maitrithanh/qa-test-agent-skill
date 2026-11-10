# Tham chiếu phi chức năng & dữ liệu (mục 7.4)

Chỉ nạp khi phạm vi đụng các mảng này. Số mục tham chiếu tới `SKILL.md`.

### 7.4 Phi chức năng & dữ liệu (khi phạm vi có đụng tới)

Chỉ tạo case khi có bằng chứng trong code; mặc định `full`, còn `default` chỉ khi file đổi thuộc nhóm này. Không có công cụ/hạ tầng thì ghi `BLOCKED`, không tự cài.
- **Hiệu năng cơ bản:** vòng lặp/query lồng (N+1), danh sách lớn (10k phần tử) không đơ, debounce/throttle đúng, không rò listener/timer sau unmount. Đặt ngưỡng từ spec hoặc user; không có ngưỡng thì chỉ ghi nhận số đo, không assert.
- **Tải (load/stress):** không tự chạy vào môi trường thật. Chỉ sinh kịch bản (k6/autocannon) và **hỏi** trước khi chạy, chỉ nhắm localhost/staging user chỉ định.
- **Migration/schema DB:** chạy lên từ DB trống và từ dữ liệu cũ; rollback; ràng buộc (unique, FK, NOT NULL) bị vi phạm thì lỗi đúng; dữ liệu hiện có không mất.
- **Contract API:** shape request/response khớp type/OpenAPI nếu có; field mới/bị bỏ không làm client hỏng; mã lỗi và thông điệp nhất quán.
- **Tương thích:** trình duyệt/viewport (Playwright projects), phiên bản Node/runtime ghi trong `engines`.
