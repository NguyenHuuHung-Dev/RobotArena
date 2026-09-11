# 🤖 RobotArena

Hệ thống mô phỏng và thi đấu giải thuật Robot Mê Cung thời gian thực (MicroMouse Algorithm Arena) với kiến trúc Fullstack: **.NET 10 + SignalR + Microsoft SQL Server + React (Vite) + Tailwind CSS + Monaco Editor**.

---

## 📋 Yêu Cầu Môi Trường (Prerequisites)

Trước khi khởi chạy dự án, hãy đảm bảo máy tính đã cài đặt:
1. **.NET SDK 10** (hoặc .NET 8 trở lên) - [Tải tại dotnet.microsoft.com](https://dotnet.microsoft.com/download)
2. **Node.js >= 18** (Khuyên dùng Node 20+) - [Tải tại nodejs.org](https://nodejs.org/)
3. **pnpm >= 9** (Bắt buộc dùng pnpm cho monorepo, không dùng npm/yarn):
   ```bash
   npm install -g pnpm
   ```
4. **Microsoft SQL Server** (SQL Server Express / Developer hoặc LocalDB) đang chạy trên máy (`localhost`). Database `RobotArenaDB` sẽ được tự động tạo khi chạy backend lần đầu tiên.

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án (Quick Start)

Để chạy hoàn chỉnh cả hệ thống, mở **2 cửa sổ Terminal** riêng biệt:

### 🔹 Cửa sổ 1: Chạy Backend (.NET 10 Web API & SignalR Hub)

Từ thư mục gốc của dự án (`robotwar/`):

```bash
# Cách 1: Chạy trực tiếp từ thư mục gốc
dotnet run --project backend/RobotArena.API/RobotArena.API.csproj --launch-profile http

# Hoặc Cách 2: Di chuyển vào thư mục API rồi chạy
cd backend/RobotArena.API
dotnet run
```

* 🌐 **Địa chỉ Backend API:** `http://localhost:5200`
* 📑 **Tài liệu Swagger RESTful API:** `http://localhost:5200/swagger`
* ⚡ **SignalR Real-time Hub:** `http://localhost:5200/hub/arena`

---

### 🔹 Cửa sổ 2: Chạy Frontend (React + Vite Web App)

Từ thư mục gốc của dự án (`robotwar/`):

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt toàn bộ thư viện (chỉ cần chạy lần đầu tiên)
pnpm install

# 3. Khởi động Web App ở chế độ Development
pnpm dev
```

* 🖥️ **Địa chỉ Web App:** `http://localhost:3000`

---

## 🔑 Tài Khoản Dùng Thử (Demo Accounts)

Bạn có thể tự đăng ký tài khoản mới trực tiếp trên giao diện Web hoặc sử dụng các tài khoản có sẵn sau:

| Tên Đăng Nhập | Mật Khẩu | Tên Hiển Thị (Racer Name) | Màu Đại Diện |
| :--- | :--- | :--- | :--- |
| `player1` | `123456` | Chuột Bão Tố | Đen Tuyển (`#000000`) |
| `player2` | `123456` | Thần Tốc Độ | Đỏ Huyết (`#dc2626`) |

---

## 🛠️ Các Lệnh Thường Dùng Khác (Useful Commands)

### 1. Build Kiểm Tra Lỗi (Production Build)

```bash
# Build Backend
dotnet build

# Build Frontend (gồm packages và web)
cd frontend
pnpm build
```

### 2. Kiểm Tra Cú Pháp & Kiểu Dữ Liệu (Lint & TypeScript Check)

```bash
cd frontend
pnpm --filter web lint
```

### 3. Cấu Hình Chuỗi Kết Nối CSDL (Database Connection)

Chuỗi kết nối SQL Server được đặt tại file `backend/RobotArena.API/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=RobotArenaDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```
> **Ghi chú:** Backend đã tích hợp cơ chế `db.Database.EnsureCreated()`, hệ thống sẽ tự động khởi tạo cơ sở dữ liệu và các bảng cần thiết (`TaiKhoan`, `NguoiChoi`, `TranDau`, `ThanhTich`) ngay khi bạn chạy backend lần đầu tiên.

---

## 📁 Cấu Trúc Dự Án (Project Architecture)

```text
robotwar/
│
├── backend/                       # .NET 10 Solution (Clean Architecture)
│   ├── RobotArena.API/            # Web API Controllers, SignalR Hub, Swagger
│   ├── RobotArena.Application/    # Services logic, DTOs, RoomManager
│   ├── RobotArena.Domain/         # Thực thể Domain (TaiKhoan, NguoiChoi, TranDau...)
│   ├── RobotArena.Infrastructure/ # EF Core DbContext, Migration, SQL Server
│   ├── RobotArena.Simulation/     # Physics & deterministic tick engine
│   └── RobotArena.Sandbox/        # Môi trường cách ly chạy mã người chơi
│
├── frontend/                      # Monorepo pnpm Workspace
│   ├── apps/
│   │   └── web/                   # Ứng dụng React 18 + Vite + Tailwind + Monaco Editor
│   │
│   ├── packages/
│   │   ├── shared-types/          # Kiểu dữ liệu chia sẻ giữa Frontend và Backend
│   │   ├── simulation-types/      # Định nghĩa cảm biến (Sensors), hành động (Actions)
│   │   └── robot-sdk/             # Bộ SDK viết thuật toán (@robot-arena/robot-sdk)
│   │
│   ├── package.json               # Cấu hình scripts pnpm workspace
│   └── pnpm-workspace.yaml        # Định nghĩa các package trong workspace
│
└── README.md
```

---

## 🛡️ Hệ Thống Chống Gian Lận (Anti-Cheat & Fair Play)

* Mê cung áp dụng cơ chế **Sương Mù (Fog of War)**: Robot chỉ nhận diện được ô hiện tại và tường lân cận (`adjacentWalls`, `availableNeighbors`).
* Thuộc tính bản đồ toàn cảnh `fullMazeMap` đã bị **vô hiệu hóa hoàn toàn**.
* Trình soạn thảo và cửa sổ thêm code được bảo vệ bởi **Static Code Guard**, tự động chặn đứng các lệnh can thiệp bộ nhớ hoặc truy cập bản đồ trước khi cho phép tham gia thi đấu.

---

## 👤 Tác Giả (Author)

* **NguyenHuuHung** - [GitHub Profile](https://github.com/NguyenHuuHung-Dev)
* Repository: [https://github.com/NguyenHuuHung-Dev/RobotArena](https://github.com/NguyenHuuHung-Dev/RobotArena)

