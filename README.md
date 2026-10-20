# Chúc Mai Phương 20/10

Trang chúc mừng 20/10 gồm 2 cảnh nối tiếp nhau:

1. **Cảnh sóc**: sóc chạy vào, giương cung bắn 3 mũi tên (2 phát trượt, phát thứ 3 trúng bức thư).
   Thư mở ra hiện câu hỏi, có 2 nút YES / NO. Bấm NO thì nút NO chạy trốn (tối đa 5 lần rồi biến mất).
   Bấm YES thì hiện thư cảm ơn, mưa tim, rồi màn hình mờ dần sang cảnh 2.
2. **Cảnh vườn hoa**: hoa phát sáng nhiều màu nở dần, lời chúc "Chúc Mai Phương 20/10 vui vẻ",
   tim hồng bay lên. Chạm hoặc click vào màn hình để bắn thêm một chùm tim.

## Cách dùng
Giải nén, để cả thư mục chung với nhau rồi mở `index.html` bằng trình duyệt
(Chrome, Edge, Safari, Firefox; điện thoại cũng được). Không cần cài gì thêm.

## Các file
- `index.html`  : cấu trúc trang, lời chúc nằm trong khối `.greeting`
- `squirrel.js` : cảnh sóc bắn thư (chuyển từ bản pygame sang canvas)
- `main.js`     : khi cảnh sóc xong thì bắt đầu cảnh hoa
- `hearts.js`   : tim bay lên ở cảnh hoa
- `main.css`    : hoa, cỏ, nền (gốc)
- `extra.css`   : 4 bông hoa mới, lời chúc, lớp tim, hiệu ứng mờ chuyển cảnh

## Tuỳ chỉnh nhanh
- Đổi câu hỏi trong thư: `squirrel.js`, hàm `buildPaper()` ("Will you be" / "my Valentine?")
- Đổi chữ thư cảm ơn: `squirrel.js`, hàm `buildThanks()`
- Đổi lời chúc ở cảnh hoa: `index.html`, khối `.greeting`
- Đổi màu hoa: `extra.css`, các biến `--petal`, `--petal2` của `.flower--4` đến `.flower--7`
- Đổi màu tim bay: `hearts.js`, mảng `PINKS`
- Bỏ cảnh sóc, vào thẳng hoa: xoá dòng `<canvas id="squirrel-scene">` và `<script src="squirrel.js">` trong `index.html`

Lưu ý: font chữ viết tay của lời chúc tải từ Google Fonts nên cần có mạng.
Nếu không có mạng, chữ sẽ dùng font có sẵn trong máy.
