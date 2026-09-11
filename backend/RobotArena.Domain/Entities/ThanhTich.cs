namespace RobotArena.Domain.Entities;

public class ThanhTich
{
    public int Id { get; set; }
    public int TranDauId { get; set; }
    public int NguoiChoiId { get; set; }
    public string ThuatToanSuDung { get; set; } = string.Empty;
    public int? ThoiGianHoanThanhMs { get; set; }
    public int? SoBuocDi { get; set; }
    public int? XepHang { get; set; }
    public string TrangThai { get; set; } = "FINISHED";
    public DateTime NgayGhiNhan { get; set; } = DateTime.UtcNow;

    public virtual TranDau? TranDau { get; set; }
    public virtual NguoiChoi? NguoiChoi { get; set; }
}
