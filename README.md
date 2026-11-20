# ⚡ Personal Command Center (v2)

> **Trung tâm Chỉ huy Cá nhân** — Ứng dụng web tối ưu hóa chu kỳ sinh học, quản lý nhiệm vụ ưu tiên, theo dõi mục tiêu dài hạn và kỷ luật thói quen hàng ngày theo phong cách **Dark/Light Mode Bento Grid Dashboard**.

![Personal Command Center](https://img.shields.io/badge/Version-2.0-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![LocalStorage](https://img.shields.io/badge/Storage-LocalStorage-success)

---

## ✨ Tính Năng Nổi Bật (Features)

### 1. ⚡ Ma trận Lịch trình Năng lượng (Energy Schedule Matrix)
- **Đo lường năng lượng thực tế**: Thanh trượt 1-10 cùng 3 mức Preset nhanh:
  - ⚡ **Đỉnh cao (Mức 8 - 10)**: Deep Work (tư duy logic, giải quyết bài toán phức tạp).
  - 🔋 **Ổn định (Mức 5 - 7)**: Steady Work (duy trì nhịp độ, học từ vựng, họp nhóm).
  - 🌙 **Thấp điểm (Mức 1 - 4)**: Low Drain (dọn dẹp, nghe podcast, nghỉ ngơi phục hồi).
- **Phát sáng sinh học (Active Glow)**: Tự động phát sáng và làm nổi bật khung giờ khuyến nghị phù hợp với trạng thái năng lượng hiện tại.

### 2. 🎯 Tiêu điểm Hành động "DO NOW" & Đồng hồ Pomodoro v2
- **Tự động đề xuất việc cần làm ngay**: Phân tích mức năng lượng và tự động hiển thị nhiệm vụ ưu tiên nhất cần xử lý lúc này kèm nút bấm hoàn thành nhanh.
- **Đồng hồ Pomodoro tích hợp**:
  - Chế độ **25 phút Tập trung** 🔥 và **5 phút Nghỉ ngơi** ☕.
  - Các nút điều khiển: Bắt đầu / Tạm dừng và Đặt lại (Reset).
  - Thanh tiến trình đếm ngược mượt mà.
  - **Âm thanh chuông báo Web Audio API**: Tự động phát hợp âm chuông thiền thư giãn khi hết giờ mà không cần file MP3 bên ngoài.
  - Bộ đếm phiên hoàn thành `🍅 x N` tự động lưu trữ.

### 3. 📋 Quản lý Nhiệm vụ Ưu tiên & Kéo thả (HTML5 Drag & Drop)
- **3 Cột phân cấp**: 🔴 Ưu tiên Cao, 🟡 Ưu tiên Trung bình, 🟢 Ưu tiên Thấp.
- **Kéo thả mượt mà**:
  - Di chuyển tự do giữa các mức ưu tiên.
  - Kéo thả trực tiếp giữa các khung giờ sinh học (Đỉnh cao ⇄ Ổn định ⇄ Thấp điểm).
  - Biểu tượng tay nắm kéo `⋮⋮` chuyên nghiệp, phản hồi viền sáng khi kéo qua.
- **Chỉnh sửa tại chỗ (Inline Edit)**: Bấm biểu tượng ✏️ hoặc nhấp đúp vào chữ để sửa tên việc ngay lập tức.

### 4. 📊 Bảng điều khiển Tiến độ Mục tiêu Dài hạn (Long-term Goals)
- Phân nhóm mục tiêu rõ ràng: 🎓 **Học thuật**, 🌍 **Ngoại ngữ**, 👤 **Cá nhân**.
- Điều chỉnh tiến độ linh hoạt: nút bấm nhanh `+5%`, `-5%` hoặc gõ trực tiếp số %.
- Chỉnh sửa tên mục tiêu tại chỗ, tự động tính tiến độ trung bình toàn hệ thống.

### 5. 🔗 Thói quen Hàng ngày theo Chuỗi Xếp chồng (Atomic Habits Stacking)
- Cấu trúc chuỗi mắc xích: `Sau khi [Thói quen neo] ➔ Tôi sẽ [Hành động tích cực]`.
- Tương tác 2 bước liên kết, tự động tính % hoàn thành trong ngày.
- **Bộ đếm chuỗi ngày liên tiếp (Streak 🔥)**: Tự động ghi nhận chuỗi kỷ luật và làm mới khi sang ngày mới.

### 6. 🎨 Tùy biến Giao diện & Hệ thống Cài đặt
- **Chế độ Sáng / Tối (☀️ / 🌙)**: Chuyển đổi một chạm giữa Dark Mode vũ trụ và Light Mode phong cách Notion/Linear thanh lịch.
- **Bộ chọn 5 gam màu chủ đạo**: 🔵 Xanh Dương, 🌿 Xanh Ngọc, 🍊 Cam Năng Lượng, 🌸 Hồng San Hô, 🟣 Tím Sáng Tạo hoặc ⚡ Theo Năng lượng Sinh học.
- **Sao lưu & Khôi phục**: Xuất file `JSON` sao lưu và nhập dữ liệu để đồng bộ sang thiết bị khác.

---

## 🚀 Cài Đặt & Sử Dụng

Dự án được xây dựng hoàn toàn bằng **HTML, CSS và JavaScript thuần**, không phụ thuộc vào bất kỳ thư viện hay framework bên thứ ba nào:

1. Clone repository về máy:
   ```bash
   git clone https://github.com/dominhtri2206-create/PERSONAL-COMMAND-CENTER.git
   ```
2. Mở file `index.html` trực tiếp trên trình duyệt web bất kỳ (Chrome, Edge, Firefox, Safari).

---

## 🛠️ Cấu Trúc Dự Án

```
PERSONAL-COMMAND-CENTER/
├── index.html    # Cấu trúc giao diện & Bento Grid layout
├── style.css     # CSS Variables, Dark/Light mode & hiệu ứng
├── script.js     # Logic điều hành, Pomodoro, Drag & Drop, LocalStorage
└── README.md     # Tài liệu hướng dẫn sử dụng
```

---

*Phát triển với mục tiêu tối ưu hóa năng lượng sinh học và nâng cao kỷ luật cá nhân.*
