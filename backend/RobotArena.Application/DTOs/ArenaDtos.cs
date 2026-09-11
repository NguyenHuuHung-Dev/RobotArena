namespace RobotArena.Application.DTOs;

public record LoginRequest(string TenDangNhap, string MatKhau);

public record RegisterRequest(string TenDangNhap, string MatKhau, string TenHienThi, string? Email, string MauSac);

public record AuthResponse(
    int TaiKhoanId,
    int NguoiChoiId,
    string TenDangNhap,
    string TenHienThi,
    int CapDo,
    int DiemKinhNghiem,
    int SoTranDaChoi,
    int SoTranThang,
    string MauSac,
    string Token
);

public record CreateRoomRequest(
    string MaPhong,
    int KichThuocMeCung,
    string ViTriDich,
    int SoLuongNguoiChoiMax
);

public class PlayerSlotDto
{
    public int NguoiChoiId { get; set; }
    public string TenHienThi { get; set; } = string.Empty;
    public string MauSac { get; set; } = "#000000";
    public string ThuatToan { get; set; } = "floodfill";
    public bool IsReady { get; set; }
    public bool IsHost { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public int? ThoiGianMs { get; set; }
    public int? SoBuocDi { get; set; }
    public bool HasFinished { get; set; }
}

public class RoomDto
{
    public string MaPhong { get; set; } = string.Empty;
    public int KichThuocMeCung { get; set; } = 21;
    public string ViTriDich { get; set; } = "CENTER";
    public int SoLuongNguoiChoiMax { get; set; } = 5;
    public string TrangThai { get; set; } = "WAITING"; // WAITING, COUNTDOWN, RACING, FINISHED
    public int SeedMeCung { get; set; }
    public List<PlayerSlotDto> NguoiChois { get; set; } = new();
}

public record SubmitResultRequest(
    string MaPhong,
    int NguoiChoiId,
    string ThuatToan,
    int ThoiGianMs,
    int SoBuocDi,
    int XepHang
);

public record LeaderboardEntryDto(
    int NguoiChoiId,
    string TenHienThi,
    int CapDo,
    int SoTranDaChoi,
    int SoTranThang,
    string MauSac,
    double TyLeThang
);
