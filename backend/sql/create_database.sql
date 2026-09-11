-- RobotArena Database Setup Script for Microsoft SQL Server
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'RobotArenaDB')
BEGIN
    CREATE DATABASE RobotArenaDB;
END
GO

USE RobotArenaDB;
GO

-- 1. Bảng Tài Khoản (taikhoan)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'taikhoan')
BEGIN
    CREATE TABLE taikhoan (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TenDangNhap NVARCHAR(50) NOT NULL UNIQUE,
        MatKhauHash NVARCHAR(255) NOT NULL,
        Email NVARCHAR(100) NULL,
        NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
        TrangThai NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    );
END
GO

-- 2. Bảng Người Chơi (nguoichoi)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'nguoichoi')
BEGIN
    CREATE TABLE nguoichoi (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TaiKhoanId INT NOT NULL,
        TenHienThi NVARCHAR(50) NOT NULL,
        CapDo INT NOT NULL DEFAULT 1,
        DiemKinhNghiem INT NOT NULL DEFAULT 0,
        SoTranDaChoi INT NOT NULL DEFAULT 0,
        SoTranThang INT NOT NULL DEFAULT 0,
        MauSac NVARCHAR(20) NOT NULL DEFAULT '#000000',
        Avatar NVARCHAR(255) NULL,
        CONSTRAINT FK_NguoiChoi_TaiKhoan FOREIGN KEY (TaiKhoanId) REFERENCES taikhoan(Id) ON DELETE CASCADE
    );
END
GO

-- 3. Bảng Trận Đấu / Phòng (trandau)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'trandau')
BEGIN
    CREATE TABLE trandau (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MaPhong NVARCHAR(20) NOT NULL UNIQUE,
        KichThuocMeCung INT NOT NULL DEFAULT 21,
        ViTriDich NVARCHAR(20) NOT NULL DEFAULT 'CENTER',
        SoLuongNguoiChoiMax INT NOT NULL DEFAULT 5,
        TrangThai NVARCHAR(20) NOT NULL DEFAULT 'WAITING',
        SeedMeCung INT NOT NULL DEFAULT 12345,
        NguoiTaoId INT NULL,
        NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
        NgayBatDau DATETIME NULL,
        NgayKetThuc DATETIME NULL,
        CONSTRAINT FK_TranDau_NguoiTao FOREIGN KEY (NguoiTaoId) REFERENCES nguoichoi(Id)
    );
END
GO

-- 4. Bảng Thành Tích (thanhtich)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'thanhtich')
BEGIN
    CREATE TABLE thanhtich (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TranDauId INT NOT NULL,
        NguoiChoiId INT NOT NULL,
        ThuatToanSuDung NVARCHAR(50) NOT NULL,
        ThoiGianHoanThanhMs INT NULL,
        SoBuocDi INT NULL,
        XepHang INT NULL,
        TrangThai NVARCHAR(20) NOT NULL DEFAULT 'FINISHED',
        NgayGhiNhan DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ThanhTich_TranDau FOREIGN KEY (TranDauId) REFERENCES trandau(Id) ON DELETE CASCADE,
        CONSTRAINT FK_ThanhTich_NguoiChoi FOREIGN KEY (NguoiChoiId) REFERENCES nguoichoi(Id)
    );
END
GO

-- Seed Tài khoản mẫu
IF NOT EXISTS (SELECT * FROM taikhoan WHERE TenDangNhap = 'admin')
BEGIN
    INSERT INTO taikhoan (TenDangNhap, MatKhauHash, Email)
    VALUES ('admin', '$2a$11$eE0mEv5R1XvS0yMsm.9xreKxOq/Uv.z933r.c7j6O47vF6hKqUf3K', 'admin@robotarena.vn');

    DECLARE @AdminAccId INT = SCOPE_IDENTITY();
    INSERT INTO nguoichoi (TaiKhoanId, TenHienThi, CapDo, MauSac)
    VALUES (@AdminAccId, N'Quản Trị Viên', 99, '#000000');
END
GO

IF NOT EXISTS (SELECT * FROM taikhoan WHERE TenDangNhap = 'player1')
BEGIN
    INSERT INTO taikhoan (TenDangNhap, MatKhauHash, Email)
    VALUES ('player1', '$2a$11$eE0mEv5R1XvS0yMsm.9xreKxOq/Uv.z933r.c7j6O47vF6hKqUf3K', 'player1@robotarena.vn');

    DECLARE @P1Id INT = SCOPE_IDENTITY();
    INSERT INTO nguoichoi (TaiKhoanId, TenHienThi, CapDo, SoTranDaChoi, SoTranThang, MauSac)
    VALUES (@P1Id, N'Kỵ Sĩ Chuột 01', 5, 12, 7, '#0284c7');
END
GO

IF NOT EXISTS (SELECT * FROM taikhoan WHERE TenDangNhap = 'player2')
BEGIN
    INSERT INTO taikhoan (TenDangNhap, MatKhauHash, Email)
    VALUES ('player2', '$2a$11$eE0mEv5R1XvS0yMsm.9xreKxOq/Uv.z933r.c7j6O47vF6hKqUf3K', 'player2@robotarena.vn');

    DECLARE @P2Id INT = SCOPE_IDENTITY();
    INSERT INTO nguoichoi (TaiKhoanId, TenHienThi, CapDo, SoTranDaChoi, SoTranThang, MauSac)
    VALUES (@P2Id, N'Thợ Săn Mê Cung', 3, 8, 4, '#16a34a');
END
GO
