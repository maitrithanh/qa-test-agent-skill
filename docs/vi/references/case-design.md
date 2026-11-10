# Tham chiếu thiết kế case (mục 7.1–7.3)

Nạp khi cần. Số mục tham chiếu tới `SKILL.md`.

### Nguồn kỳ vọng và property test (đọc trước)

Test chỉ tốt bằng nguồn kỳ vọng của nó. Ưu tiên theo thứ tự: lời user → nội dung PR/issue/commit → spec/OpenAPI/type/JSDoc → test sẵn có → hành vi code rõ ràng là chủ ý. Test chỉ lặp lại code hiện tại thì chỉ bắt được hồi quy chứ không bắt được bug: gắn nhãn `characterization` cho các case đó và giữ số lượng ít. Dồn công sức vào chỗ kỳ vọng được định nghĩa bởi nguồn *khác* code.

Với hàm thuần (parser, formatter, tính toán, validator) và chỉ khi `fast-check`/`hypothesis`/tương đương **đã có** trong dependency, thêm 1–2 property test cho mỗi đơn vị: round-trip (`parse(format(x)) == x`), idempotence, bất biến (đã sắp xếp thì vẫn sắp xếp, tổng khớp), "không bao giờ throw với mọi input đúng kiểu". Không cài thư viện chỉ vì việc này.

### 7.1 Lường case: checklist bắt buộc cho mỗi đơn vị (không chỉ happy path)

Với **mỗi** hàm/component/endpoint trong phạm vi, duyệt đủ các nhóm dưới đây. Mỗi nhóm phải ra ≥1 case **hoặc** ghi `N/A (lý do cụ thể)` vào ma trận phủ của todo. Không được bỏ trống nhóm.

1. **Đầu vào** (từng tham số/prop/field): rỗng, `null`/`undefined`, sai kiểu, chỉ khoảng trắng, min/max ±1, rất dài, số âm/0/NaN/Infinity/thập phân, unicode/emoji/tiếng Việt, ký tự đặc biệt, chuỗi dạng injection (`<script>`, `' OR 1=1`, `../`).
2. **Trạng thái & quyền**: chưa đăng nhập, token hết hạn, sai role, truy cập dữ liệu của người khác (IDOR), dữ liệu rỗng / 1 phần tử / rất nhiều, dữ liệu đã bị xoá/đã tồn tại (trùng).
3. **Phụ thuộc ngoài lỗi**: timeout, 4xx, 5xx, mất mạng, response rỗng/sai shape/thiếu field, trả chậm, trả về nhiều lần, retry.
4. **Đồng thời & lặp**: double click/double submit, gọi hai lần liền (idempotency), race giữa hai request, thao tác khi đang loading, huỷ giữa chừng, đổi route khi request chưa xong.
5. **Toàn vẹn dữ liệu**: lỗi giữa chừng có rollback/để lại dữ liệu nửa vời không; kết quả sai thứ tự/phân trang biên (trang 0, trang cuối, ngoài range).
6. **Thời gian & địa phương**: múi giờ, DST, cuối tháng/năm nhuận, định dạng ngày/số/tiền theo locale.
7. **Bảo mật**: XSS (render text không phải HTML), lộ dữ liệu nhạy cảm trong response/log/URL, mass assignment, thiếu kiểm tra quyền phía server, validate chỉ ở client.
8. **UX & a11y** (frontend): back/refresh giữa luồng, mất focus, bàn phím, lỗi hiển thị cho người dùng (không im lặng), trạng thái loading/empty/error đều có.
9. **Happy path**: luồng đúng chính.

Ở `lite`, chỉ bắt buộc nhóm 1, 3 và 9; các nhóm còn lại ghi `N/A (lite)`. Quy tắc cân bằng: với đơn vị P0/P1 ở `default`/`full`, số case không-happy phải ≥ số case happy. Chỉ có happy path = chưa đạt.

### 7.2 Case "thiếu xử lý" (gap case)

Lỗi hay nằm ở chỗ code **không** làm gì. Nguyên tắc 1 vẫn giữ, nhưng bằng chứng của gap case là: (a) nơi đầu vào độc hại/bất thường *có thể đi vào* hàm (call site, route, input field, response API) với `path:line`, và (b) Grep/đọc xác nhận **không có** guard tương ứng. Kỳ vọng lấy từ type/spec/chuẩn chung (ví dụ "không crash với null", "server phải kiểm tra quyền"); nếu không có spec → `NEEDS-CONFIRM`. Test khẳng định hành vi **đúng** (không khẳng định hành vi sai hiện tại); nếu fail thì là `FAIL-PRODUCT`.

### 7.3 Ma trận phủ trong todo

Đầu `todo/<run-id>.md` thêm bảng: hàng = đơn vị (file → hàm), cột = 9 nhóm ở 7.1, ô = danh sách TC hoặc `N/A (lý do)`. Dùng ma trận này khi báo cáo "rủi ro chưa phủ".
