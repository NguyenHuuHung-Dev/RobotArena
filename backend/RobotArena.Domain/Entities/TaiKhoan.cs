namespace RobotArena.Domain.Entities;

public class TaiKhoan
{
    public int Id { get; set; }
    public string TenDangNhap { get; set; } = string.Empty;
    public string MatKhauHash { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
    public string TrangThai { get; set; } = "ACTIVE";

    public virtual NguoiChoi? NguoiChoi { get; set; }
}
