# YUKI CINE STUDIO — phát hành PWA + iOS

## Phạm vi hiện tại
Bộ mã này là starter để phát hành cùng một giao diện web dưới hai hình thức:
1. PWA cài từ Safari (phát hành web).
2. Ứng dụng iOS đóng gói bằng Capacitor (chuẩn bị đưa lên App Store).

Không có thao tác nào trong gói này tự tạo tài khoản Apple Developer, ký ứng dụng, gửi duyệt App Store hoặc triển khai máy chủ. Những bước đó cần tài khoản/quyền truy cập của chủ sở hữu và môi trường macOS/Xcode.

## A. Phát hành PWA
1. Tạo GitHub repository riêng.
2. Upload các tệp ứng dụng ở thư mục gốc.
3. Bật GitHub Pages: Settings → Pages → Deploy from a branch → main → /(root).
4. Mở URL HTTPS trên Safari iPhone.
5. Chọn Share → Add to Home Screen.

## B. Đóng gói iOS bằng Capacitor
Yêu cầu: máy Mac, Node.js LTS, Xcode tương thích, Apple ID.
1. Cài dependencies: `npm install`
2. Tạo thư mục web build: `npm run copy:web`
3. Thêm nền tảng iOS lần đầu: `npx cap add ios`
4. Đồng bộ thay đổi: `npx cap sync ios`
5. Mở dự án: `npx cap open ios`
6. Trong Xcode, cấu hình Team / Bundle Identifier / Signing.
7. Chạy thử trên iPhone thật.
8. Khi đã kiểm thử, Archive → Distribute App → App Store Connect.
9. Hoàn thiện App Store Connect metadata, privacy details, screenshots, age rating và gửi Apple Review.

## C. Trước khi phát hành công khai
- Thay localStorage bằng backend có xác thực và đồng bộ dữ liệu nếu cần đa thiết bị.
- Lưu ảnh/video trong object storage; không nhúng file media lớn vào localStorage.
- API key của nhà cung cấp AI chỉ lưu ở server, không lưu trong app.
- Thêm chính sách quyền riêng tư, điều khoản sử dụng, cơ chế xóa tài khoản/dữ liệu nếu có tài khoản.
- Kiểm tra quyền truy cập ảnh, video, microphone, notification trước khi xin quyền.
- Kiểm thử offline, mạng yếu, upload lớn, khôi phục dữ liệu và lỗi render.
- Tạo backend job queue + worker riêng cho CineCode/FFmpeg. iPhone chỉ là client điều khiển, không phải môi trường render.

## D. Trạng thái tính năng
- Đã có trong MVP: quản lý dự án cục bộ, storyboard, prompt VI/EN, hồ sơ nhân vật dạng metadata, Face Lock prompt rules, camera angle/motion prompt add-ons, xuất JSON/TXT.
- Chưa có: AI sinh video thật, CineCode cloud worker, đồng bộ cloud, đăng nhập, thanh toán, push notification.
- Ảnh tham chiếu được chọn hiện chỉ lưu tên tệp; chưa upload hoặc lưu ảnh gốc vào cloud.
