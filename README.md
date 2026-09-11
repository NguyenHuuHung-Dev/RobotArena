<div align="center">

# 🤖 RobotArena
### Real-Time Algorithmic Maze Arena & Multi-Agent Tournament Platform

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![C#](https://img.shields.io/badge/C%23-13.0-239120?style=for-the-badge&logo=c-sharp&logoColor=white)](https://docs.microsoft.com/dotnet/csharp/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC292B?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![SignalR](https://img.shields.io/badge/SignalR-Realtime-512BD4?style=for-the-badge&logo=signalr&logoColor=white)](https://dotnet.microsoft.com/apps/aspnet/signalr)

<p align="center">
  <b>Hệ thống thi đấu giải thuật Robot Mê Cung (Micromouse) trực tuyến thời gian thực</b><br/>
  <i>Mô phỏng vật lý thực tế • Sương mù chiến thuật (Fog of War) • Chống gian lận Sandbox • Đấu Online 2-5 người</i>
</p>

[Tính Năng Nổi Bật](#-tính-năng-nổi-bật) •
[Cài Đặt & Chạy](#-cài-đặt--khởi-chạy-nhanh) •
[Tài Khoản Dùng Thử](#-tài-khoản-dùng-thử) •
[Kiến Trúc](#-kiến-trúc-hệ-thống) •
[Tác Giả](#-tác-giả-author)

</div>

---

## 🌟 Tính Năng Nổi Bật

| Tính Năng | Mô Tả Kỹ Thuật |
| :--- | :--- |
| 🏁 **Đấu Online 2 - 5 Người** | Kết nối thời gian thực qua **SignalR Hub**, sảnh chờ tự động, đồng hồ 10s khóa thuật toán và bảng xếp hạng live. |
| 🧠 **8 Thuật Toán Đỉnh Cao** | A* Phạt Cua, A* Chuẩn Manhattan, Micromouse Flood Fill IEEE, Dijkstra OSPF, Tham Lam GBFS, Trémaux DFS Backtracking, Bám Tường Trái/Phải. |
| 🛡️ **Anti-Cheat & Sương Mù** | Cơ chế **Fog of War** che khuất mê cung. Triệt tiêu `fullMazeMap`, buộc robot phải tự vẽ bản đồ trong não và khám phá mù vật lý. |
| 💻 **Monaco Code Studio** | Lập trình giải thuật trực tiếp trên web bằng TypeScript, kiểm tra cú pháp AST tĩnh, lưu và xóa thuật toán cá nhân qua `localStorage`. |
| 🏆 **Lưu Trữ Thành Tích** | Tích hợp **Microsoft SQL Server**, lưu giữ vĩnh viễn lịch sử thi đấu, số bước đi, thời gian hoàn thành (ms) và bảng xếp hạng ELO. |

---

## 📋 Yêu Cầu Hệ Thống (Prerequisites)

* **.NET SDK 10** (hoặc .NET 8+) &bull; [Tải về](https://dotnet.microsoft.com/download)
* **Node.js >= 18** (Khuyên dùng Node 20+) &bull; [Tải về](https://nodejs.org/)
* **pnpm >= 9** (Bắt buộc dùng pnpm cho monorepo workspace):
  ```bash
  npm install -g pnpm
  ```
* **Microsoft SQL Server** (LocalDB hoặc SQL Server Express / Developer) đang chạy ở `localhost`.

---

## 🚀 Cài Đặt & Khởi Chạy Nhanh

Khởi động hệ thống chỉ với **2 cửa sổ Terminal**:

### 🔹 Terminal 1: Chạy Backend API (.NET 10 & SignalR Hub)
```bash
# Di chuyển vào thư mục backend và chạy
cd backend/RobotArena.API
dotnet run
```
* 🌐 **API Server:** `http://localhost:5200`
* 📑 **Swagger UI:** `http://localhost:5200/swagger`
* ⚡ **SignalR Hub:** `http://localhost:5200/hub/arena`
> *Lưu ý: Database `RobotArenaDB` sẽ được tự động khởi tạo trên SQL Server khi backend chạy lần đầu tiên.*

### 🔹 Terminal 2: Chạy Frontend (React + Vite App)
```bash
# Di chuyển vào thư mục frontend và cài đặt dependencies
cd frontend
pnpm install

# Khởi chạy giao diện Web
pnpm dev
```
* 🖥️ **Web Application:** `http://localhost:3000`

---

## 🔑 Tài Khoản Dùng Thử

Bạn có thể tạo tài khoản mới ngay trên giao diện hoặc đăng nhập với các tài khoản test sau:

| Tên Đăng Nhập | Mật Khẩu | Tên Hiển Thị (Racer Name) | Màu Robot |
| :---: | :---: | :--- | :---: |
| `player1` | `123456` | Chuột Bão Tố | ⚫ Đen Tuyển |
| `player2` | `123456` | Thần Tốc Độ | 🔴 Đỏ Huyết |

---

## 🛠️ Lệnh Kiểm Thử & Đóng Gói (Build & Test)

```bash
# Build kiểm tra lỗi toàn bộ Backend
dotnet build

# Build kiểm tra toàn bộ Frontend (Web + Shared Packages)
cd frontend
pnpm build

# Kiểm tra cú pháp TypeScript & Lint
pnpm --filter web lint
```

---

## 📁 Kiến Trúc Hệ Thống

Dự án được phân tầng rõ ràng theo chuẩn **Clean Architecture** và **Monorepo pnpm Workspace**:

```text
RobotArena/
│
├── backend/                       # .NET 10 Clean Architecture Solution
│   ├── RobotArena.API/            # Controllers, SignalR ArenaHub, Swagger Docs
│   ├── RobotArena.Application/    # DTOs, RoomManager, Business Services
│   ├── RobotArena.Domain/         # Domain Models (TaiKhoan, NguoiChoi, TranDau, ThanhTich)
│   ├── RobotArena.Infrastructure/ # EF Core DbContext, SQL Server Configuration
│   ├── RobotArena.Simulation/     # Physics & deterministic tick engine
│   └── RobotArena.Sandbox/        # Isolated script execution environment
│
├── frontend/                      # Monorepo pnpm Workspace
│   ├── apps/
│   │   └── web/                   # React 18 + Vite SPA, Monaco Editor, Tailwind
│   │
│   ├── packages/
│   │   ├── shared-types/          # Shared Models giữa Frontend & Backend
│   │   ├── simulation-types/      # Định nghĩa Sensors, Actions, Match Events
│   │   └── robot-sdk/             # Thư viện lập trình thuật toán (@robot-arena/robot-sdk)
│   │
│   ├── package.json               # Root Workspace Scripts
│   └── pnpm-workspace.yaml        # Workspace Package Mapping
│
└── README.md
```

---

## 🛡️ Hệ Thống Chống Gian Lận (Anti-Cheat)

Trong các giải đấu thuật toán mê cung quốc tế (như *IEEE Micromouse*), mọi robot đều phải khám phá ẩn số:

1. **Zero-Knowledge Sensor Sandbox**: Payload truyền vào robot chỉ gồm các cảm biến cục bộ (`adjacentWalls`, `availableNeighbors`, `goal`). Trường bản đồ toàn cảnh `fullMazeMap` đã bị vô hiệu hóa hoàn toàn.
2. **Static Code Guard**: Monaco Editor tự động phân tích mã nguồn người chơi trước khi biên dịch, chặn đứng các hành vi đọc lén bản đồ hay chèn mã độc hại (`eval`, `window`, `document`, `fullMazeMap`).
3. **Internal Memory Navigation**: Robot phải tự lưu nhớ các bức tường và ô đã khám phá vào bộ nhớ nội tại để đưa ra quyết định di chuyển chính xác và công bằng.

---

## 👤 Tác Giả (Author)

<div align="center">

**NguyenHuuHung**  
🔗 GitHub: [@NguyenHuuHung-Dev](https://github.com/NguyenHuuHung-Dev)  
📦 Repository: [https://github.com/NguyenHuuHung-Dev/RobotArena](https://github.com/NguyenHuuHung-Dev/RobotArena)

</div>


