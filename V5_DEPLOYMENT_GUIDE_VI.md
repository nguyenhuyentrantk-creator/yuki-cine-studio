# YUKI CINE STUDIO V5 – HƯỚNG DẪN TRIỂN KHAI

## Có gì mới
- Phân tích video thật bằng cách trích xuất frame với FFmpeg.
- Adapter nhiều nhà cung cấp: Google Gemini, OpenAI và OpenAI-compatible.
- Tạo JSON storyboard: timecode, cảnh, hành động, góc máy, camera, ánh sáng, palette, image prompt VI/EN, video prompt VI/EN, master style và negative prompt.
- Tải video trực tiếp từ iPhone; hỗ trợ link MP4 trực tiếp.
- Link chia sẻ YouTube/TikTok/Facebook/Xiaohongshu: nếu nền tảng không cấp tệp trực tiếp, tải video có quyền sử dụng về iPhone rồi upload.

## A. Cập nhật giao diện GitHub Pages
Tải 4 file ở thư mục gốc lên repository và ghi đè: `index.html`, `app.js`, `style.css`, `sw.js`. Commit vào main.

## B. Backend bắt buộc
GitHub Pages chỉ host frontend tĩnh, không chạy FFmpeg và không giữ bí mật API key. Cần triển khai thư mục `backend/` thành Docker web service có HTTPS. Xem `backend/README.md`.

1. Deploy Dockerfile trong `backend/`.
2. Cấu hình biến môi trường `AI_PROVIDER`, `GEMINI_API_KEY` hoặc `OPENAI_API_KEY`, `CORS_ORIGIN`.
3. CORS_ORIGIN phải là `https://nguyenhuyentrantk-creator.github.io`.
4. Đặt URL backend vào frontend: mở `app.js`, thay giá trị rỗng ở `localStorage.getItem('yuki_v5_api_url')`? Cách đơn giản: lần đầu bấm Phân tích, app hỏi URL backend và lưu trên thiết bị.
5. Mở website, vào Phân tích link, chọn video, tick quyền sử dụng, bấm Phân tích video thật.

## Bảo mật & giới hạn
- Không đưa API key vào app.js, GitHub hoặc chat. Chỉ cấu hình ở dashboard host backend.
- Không dùng link social để vượt đăng nhập/DRM hoặc điều khoản nền tảng.
- Bản V5.0 lấy frame mỗi 4 giây mặc định, tối đa 60 frame. Đây là phân tích mẫu theo thời gian, không bảo đảm mọi chuyển động nhỏ đều được nhận ra.
- Âm thanh chưa được phiên âm tự động trong V5.0.
- Nên giới hạn dung lượng video và dùng server riêng có FFmpeg.
