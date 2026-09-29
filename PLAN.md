# 📋 MASTER PLAN: XÂY DỰNG ỨNG DỤNG LAIXEHO24H

> **Tên dự án:** Laixeho24h  
> **Công nghệ:** Node.js (Express.js) + React.js (Vite)  
> **Màu sắc chủ đạo:** Đỏ `#D32F2F` (Primary), Nền `#F8F9FA` / `#FFFFFF`, Xanh `#4CAF50` (Success/Verified)  
> **Phí đăng ký tài xế:** 300.000đ (Thanh toán qua VietQR - VIB)  

---

## 🏛️ 1. KIẾN TRÚC TỔNG THỂ & PHÂN CHIA LAYOUT

Hệ thống được thiết kế tách biệt hoàn toàn thành **2 Layouts riêng biệt**:

```
                                  HỆ THỐNG LAIXEHO24H
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌─────────────────────────────────┐                       ┌─────────────────────────────────┐
│     📱 DRIVER APP LAYOUT        │                       │       💻 ADMIN PORTAL LAYOUT     │
│  (Mô phỏng Mobile iPhone /      │                       │  (Giao diện máy tính / Desktop   │
│   Responsive trên điện thoại)   │                       │   Sidebar, Quản trị, Bảng số)   │
├─────────────────────────────────┤                       ├─────────────────────────────────┤
│ • Màn 1: Đăng ký tài xế (300k)  │                       │ • Tổng quan số liệu hệ thống    │
│ • Màn 2: Thông tin hồ sơ & chỉ số│                       │ • Duyệt tài xế & Quản lý User   │
│ • Màn 3: Nhận cuốc xe & Thu nhập│                       │ • Can thiệp số liệu ảo & Review │
│                                 │                       │ • Tạo cuốc xe thật & Cuốc ảo    │
└─────────────────────────────────┘                       └─────────────────────────────────┘
                                           │
                                           ▼
                       ┌──────────────────────────────────────┐
                       │      ⚙️ BACKEND API (Express.js)      │
                       │   SQLite Persistent Database Engine   │
                       └──────────────────────────────────────┘
```

---

## 📱 2. THIẾT KẾ CHI TIẾT 3 MÀN HÌNH TÀI XẾ

### 🔹 Màn 1: Đăng ký tài xế (`/driver/register`)
* **Header & Banner:**
  - Nền đỏ gradient thương hiệu `#B71C1C` ➔ `#D32F2F`.
  - Hình ảnh đại diện tài xế tươi cười, thân thiện.
  - Slogan 3 dòng: *"Tham gia ngay"*, *"Nhận cuốc xe liên tục"*, *"Tăng thu nhập mỗi ngày"*.
* **Stepper quy trình 3 bước:**
  - `Bước 1`: Thông tin cá nhân (Đang hoạt động)
  - `Bước 2`: Thông tin phương tiện
  - `Bước 3`: Xác minh giấy tờ & Đóng phí kích hoạt
* **Form thông tin cá nhân:**
  - Họ và tên (Mặc định: *Nguyễn Văn Nam*)
  - Số điện thoại (Mặc định: *0987 654 321*)
  - Khu vực hoạt động (Dropdown: Thanh Hoá, Hà Nội, TP.HCM, Nghệ An, Hải Phòng,...)
* **Chọn loại hình dịch vụ đăng ký:**
  - 🚗 **Lái xe hộ**: *Lái xe thay khi khách hàng cần* (Mặc định chọn).
  - 🚙 **Xe ghép / Tiện chuyến**: *Đi cùng tuyến - chia sẻ chi phí*.
  - 🚘 **Bao xe**: *Thuê xe theo thời gian / theo ngày*.
* **Xác nhận phí thành viên 300.000đ:**
  - Hiển thị pop-up / modal mã **VietQR** chuẩn theo ảnh đính kèm:
    - Ngân hàng: **VIB**
    - Chủ tài khoản: **ĐINH THẾ DUY**
    - Số tài khoản: **095241233**
    - Số tiền: **300.000 đ**
    - Nội dung: **Đăng ký làm tài xế laixeho24h**
  - Nút upload ảnh hóa đơn / bill chuyển tiền thành công.
* **Footer:**
  - Nút CTA lớn: **ĐĂNG KÝ THÀNH VIÊN >**
  - Điều khoản dịch vụ và chính sách bảo mật.

---

### 🔹 Màn 2: Thông tin tài xế (`/driver/profile`)
* **Header:** Tiêu đề "Thông tin tài xế", nút quay lại, nút cài đặt bánh răng.
* **Profile Card:**
  - Ảnh đại diện tài xế kèm nút chụp ảnh/đổi avatar.
  - Tên hiển thị kèm **Tích xanh xác minh chính chủ**.
  - Đánh giá sao: ⭐ `4.9` *(320 đánh giá)*.
  - Badge trạng thái: 🟢 `Đang hoạt động`.
* **Bộ 3 chỉ số quan trọng (Được khoanh tròn đỏ ở ảnh 2):**
  > *Ghi chú: Toàn bộ 3 chỉ số này Admin đều có quyền can thiệp & buff số ảo tùy ý.*
  1. 👤 **Tổng số cuốc:** `320`
  2. ⏱️ **Tỷ lệ hoàn thành:** `98%`
  3. 🛡️ **Kinh nghiệm:** `2 năm`
* **Danh sách thông tin chi tiết:**
  - 📞 Số điện thoại: `0987 654 321` (kèm nút bấm **Gọi ngay** nền đỏ nổi bật).
  - 📍 Khu vực: `Thanh Hoá và khu vực lân cận`.
  - 🚗 Phương tiện: `Toyota Vios - 30K 123.45`.
  - 🎖️ Tiêu chuẩn: `Tài xế chuyên nghiệp, thân thiện, đúng giờ`.
* **Giấy tờ đã xác minh:**
  - CCCD/CMND ➔ `Đã xác minh` (Tích xanh)
  - Giấy phép lái xe ➔ `Đã xác minh` (Tích xanh)
  - Đăng kiểm xe ➔ `Đã xác minh` (Tích xanh)
  - Bảo hiểm xe ➔ `Đã xác minh` (Tích xanh)
* **Thao tác cuối trang:**
  - Nút/Link: ✏️ *Chỉnh sửa hồ sơ*.
  - Công tắc gạt to (Toggle Switch): **Bật nhận cuốc xe** - *Sẵn sàng nhận cuốc mới*.

---

### 🔹 Màn 3: Nhận cuốc xe (`/driver/jobs`)
* **Header:** Tiêu đề "Nhận cuốc xe", chuông thông báo đỏ (có chấm báo cuốc mới).
* **Khối tóm tắt thu nhập & năng suất hôm nay (Khoanh tròn đỏ ở ảnh 3):**
  > *Ghi chú: Admin có thể buff hoặc can thiệp các số liệu này.*
  1. 💼 **Thu nhập hôm nay:** `1.250.000đ`
  2. 🚗 **Số cuốc xe hôm nay:** `5 Cuốc xe`
  3. ⭐ **Đánh giá:** `4.9`
* **Thanh Navigation chuyển Tab:**
  - `[Cuốc xe mới (3)]` *(Đang chọn)*
  - `[Đang thực hiện (1)]`
  - `[Lịch sử]`
* **Job Feed (Danh sách cuốc xe đang tìm tài xế):**
  - Mỗi đơn cuốc xe hiển thị dạng card bo góc viền bóng:
    - Badge trạng thái `Mới`, thời gian đăng (VD: *2 phút trước*, *5 phút trước*).
    - 🔴 **Điểm đón:** Ví dụ `432 Lê Lai, Thanh Hoá`.
    - ⚫ **Điểm trả:** Ví dụ `Sân bay Thọ Xuân`.
    - 📏 Lộ trình: `28 km` - `~ 35 phút`.
    - 🏷️ Tags dịch vụ: `#Lái xe hộ`, `#Đường dài`, `#Xe tiện chuyến`.
    - 💰 **Giá cước màu đỏ đậm:** `180.000đ`, `120.000đ`,...
    - Nút bấm:
      - Nút phụ: *Xem chi tiết*
      - Nút chính màu đỏ: **Nhận cuốc >**

---

## 🛠️ 3. TÍNH NĂNG ADMIN PORTAL (7 YÊU CẦU QUẢN TRỊ VIÊN)

Giao diện Admin thiết kế theo chuẩn Dashboard hiện đại: Thanh menu bên trái (Sidebar), Thanh điều hướng trên (Topbar) và Khu vực làm việc chính (Content Workspace).

| STT | Chức năng Admin | Chi tiết triển khai kỹ thuật |
| :---: | :--- | :--- |
| **1** | **Thêm cuốc xe thật** | Form nhập: Điểm đón, điểm trả, khoảng cách (km), thời gian (phút), giá cước (VNĐ), loại dịch vụ (`lai_xe_ho`, `xe_ghep`, `bao_xe`), SĐT khách. Cuốc xe lưu vào DB với cờ `is_virtual = false`. |
| **2** | **Duyệt tài xế (300k)** | Bảng danh sách tài xế đăng ký: Xem ảnh bill VietQR 300k, thông tin CCCD, SĐT. Có 2 nút hành động: **[Duyệt kích hoạt]** (chuyển trạng thái `active`) hoặc **[Từ chối / Hoàn tiền]**. |
| **3** | **Tạo cuốc xe ảo** | Chức năng tạo các cuốc xe mồi hiển thị trên bảng tin Màn 3 của tài xế (`is_virtual = true`). Có nút kích hoạt *"Tự động sinh cuốc ảo"* theo chu kỳ thời gian (ví dụ 10-15 phút có 1 cuốc mới). |
| **4** | **Cộng số cuốc ảo, tỷ lệ & kinh nghiệm** | Module can thiệp trực tiếp vào hồ sơ của bất kỳ tài xế nào (Màn 2):<br>• `Tổng số cuốc`: Cho phép nhập số cố định hoặc cộng thêm (+10, +50 cuốc).<br>• `Tỷ lệ hoàn thành`: Thanh trượt từ 90% đến 100%.<br>• `Kinh nghiệm`: Nhập số năm (1 năm, 2 năm, 5 năm,...). |
| **5** | **Xoá / Tắt user** | • Nút gạt chuyển trạng thái: `Hoạt động` ⇄ `Tạm khóa / Tắt nhận cuốc`.<br>• Nút **Xóa vĩnh viễn** tài khoản tài xế kèm cảnh báo xác nhận. |
| **6** | **Thêm thu nhập & cuốc xe ngày** | Module can thiệp dữ liệu thống kê ngày (Màn 3):<br>• Cộng thêm tiền vào `Thu nhập hôm nay` (VD: cộng thêm 500.000đ).<br>• Cộng thêm vào `Số cuốc hôm nay` (VD: tăng từ 5 lên 8 cuốc). |
| **7** | **Thêm đánh giá tài xế** | • Cho phép sửa điểm rating trung bình (1.0 ➔ 5.0 ⭐).<br>• Chỉnh sửa tổng số lượt đánh giá (VD: từ 320 lên 500 lượt).<br>• Thêm danh sách bình luận/feedback tốt của khách hàng ảo để tăng uy tín tài xế. |

---

## 🗄️ 4. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Dùng **SQLite** thông qua thư viện `better-sqlite3` (lưu file trực tiếp trong `backend/database/laixeho24h.db`, không cần cài thêm DB server cồng kềnh, chạy được ngay lập tức).

### Bảng 1: `drivers`
* `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
* `full_name` (TEXT) - Họ tên tài xế
* `phone` (TEXT UNIQUE) - Số điện thoại
* `area` (TEXT) - Khu vực hoạt động
* `service_types` (TEXT) - JSON danh sách dịch vụ đăng ký
* `avatar_url` (TEXT) - Đường dẫn ảnh
* `vehicle_info` (TEXT) - Hãng xe, biển số
* `status` (TEXT) - `pending` (chờ duyệt 300k), `active` (hoạt động), `blocked` (bị khóa)
* `is_online` (BOOLEAN) - Bật/tắt sẵn sàng nhận cuốc
* **Các trường số liệu có thể can thiệp bởi Admin:**
  * `total_trips` (INTEGER) - Tổng số cuốc hiển thị (Màn 2)
  * `completion_rate` (INTEGER) - Tỷ lệ hoàn thành % (Màn 2)
  * `experience` (TEXT) - Kinh nghiệm (Màn 2)
  * `daily_income` (INTEGER) - Thu nhập trong ngày (Màn 3)
  * `daily_trips` (INTEGER) - Số cuốc trong ngày (Màn 3)
  * `rating` (REAL) - Điểm sao đánh giá (VD: 4.9)
  * `rating_count` (INTEGER) - Số lượt đánh giá (VD: 320)
  * `payment_receipt` (TEXT) - Ảnh chứng từ chuyển khoản 300k

### Bảng 2: `trips`
* `id` (TEXT PRIMARY KEY) - Mã cuốc (VD: `job_01`)
* `pickup_location` (TEXT) - Điểm đón
* `dropoff_location` (TEXT) - Điểm trả
* `distance_km` (REAL) - Khoảng cách
* `estimated_minutes` (INTEGER) - Thời gian ước tính
* `price` (INTEGER) - Giá cước (VNĐ)
* `service_tags` (TEXT) - JSON array (VD: `["Lái xe hộ", "Đường dài"]`)
* `is_virtual` (BOOLEAN) - Đánh dấu cuốc xe ảo hay thật
* `status` (TEXT) - `new`, `accepted`, `completed`, `cancelled`
* `driver_id` (INTEGER NULL) - Tài xế nhận cuốc
* `created_at` (DATETIME)

---

## 🔌 5. THIẾT KẾ RESTFUL API

| Method | Endpoint | Mô tả | Phục vụ cho |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/drivers/register` | Đăng ký tài xế mới (lưu trạng thái `pending`) | Màn 1 |
| `GET` | `/api/drivers/:id/profile` | Lấy chi tiết hồ sơ tài xế & bộ 3 chỉ số | Màn 2 |
| `PATCH` | `/api/drivers/:id/status-toggle` | Bật/tắt trạng thái sẵn sàng nhận cuốc | Màn 2 |
| `GET` | `/api/trips/feed` | Lấy danh sách cuốc xe mới theo tab | Màn 3 |
| `POST` | `/api/trips/:id/accept` | Tài xế bấm nhận cuốc | Màn 3 |
| `GET` | `/api/admin/drivers` | Danh sách toàn bộ tài xế (chờ duyệt & đang chạy) | Admin |
| `PATCH` | `/api/admin/drivers/:id/approve` | Duyệt / Kích hoạt tài xế sau khi đóng 300k | Admin (Yêu cầu 2) |
| `PATCH` | `/api/admin/drivers/:id/metrics` | **Can thiệp buff số cuốc ảo, tỷ lệ, kinh nghiệm** | Admin (Yêu cầu 4) |
| `PATCH` | `/api/admin/drivers/:id/income` | **Cộng thêm thu nhập ngày & số cuốc ngày** | Admin (Yêu cầu 6) |
| `PATCH` | `/api/admin/drivers/:id/rating` | **Thêm/sửa số sao và số lượt đánh giá** | Admin (Yêu cầu 7) |
| `PATCH` | `/api/admin/drivers/:id/toggle-block` | Bật / tắt hoạt động của tài xế | Admin (Yêu cầu 5) |
| `DELETE` | `/api/admin/drivers/:id` | Xóa hoàn toàn tài xế khỏi hệ thống | Admin (Yêu cầu 5) |
| `POST` | `/api/admin/trips` | **Thêm cuốc xe thật hoặc cuốc xe ảo** | Admin (Yêu cầu 1 & 3) |

---

## 📅 6. CÁC BƯỚC THỰC HIỆN CỤ THỂ

1. **Khởi tạo dự án & Backend:**
   - Tạo thư mục `backend/`, cài đặt Express, better-sqlite3, cors.
   - Tạo cơ sở dữ liệu và nạp dữ liệu mẫu ban đầu đúng như thông tin trong ảnh mockup (tài xế Nguyễn Văn Nam, 3 cuốc xe mẫu tại Thanh Hóa).
2. **Khởi tạo Frontend & Kiến trúc 2 Layout:**
   - Tạo dự án React + Vite trong thư mục `frontend/`.
   - Cài đặt Lucide React (bộ icon cao cấp), Tailwind CSS hoặc hệ thống CSS tùy biến sắc nét.
   - Xây dựng 2 Layout:
     - `MobileLayout`: Khung điện thoại iPhone viền mỏng cao cấp (có thể chuyển đổi Fullscreen hoặc xem trong khung thiết bị).
     - `AdminLayout`: Giao diện Dashboard Sidebar chuyên nghiệp.
3. **Phát triển 3 Màn hình Driver:**
   - Màn 1: Đăng ký + Tích hợp VietQR 300.000đ chuẩn VIB Đinh Thế Duy.
   - Màn 2: Profile tài xế với 3 chỉ số nổi bật và các giấy tờ tích xanh.
   - Màn 3: Bảng thu nhập ngày + Job Feed với các thẻ cuốc xe đỏ - đen sắc nét.
4. **Phát triển Trang Quản trị Admin:**
   - Trang Duyệt tài xế mới đăng ký 300k.
   - Modal Form can thiệp trực tiếp chỉ số: Tổng cuốc, Tỷ lệ %, Kinh nghiệm, Thu nhập ngày, Rating.
   - Form thêm cuốc xe & Tạo cuốc ảo.
   - Quản lý trạng thái khóa / mở / xóa user.
5. **Kiểm tra liên thông dữ liệu & Hoàn thiện:**
   - Khi Admin điều chỉnh chỉ số ở Dashboard ➔ Màn hình tài xế cập nhật ngay lập tức.
   - Khi Admin tạo cuốc ảo ➔ Màn 3 của tài xế hiển thị cuốc mới tinh.
