namespace RobotArena.Domain.Entities;

public class TranDau
{
    public int Id { get; set; }
    public string MaPhong { get; set; } = string.Empty;
    public int KichThuocMeCung { get; set; } = 21;
    public string ViTriDich { get; set; } = "CENTER";
    public int SoLuongNguoiChoiMax { get; set; } = 5;
    public string TrangThai { get; set; } = "WAITING";
    public int SeedMeCung { get; set; } = 12345;
    public int? NguoiTaoId { get; set; }
    public DateTime NgayTao { get; set; } = DateTime.UtcNow;
    public DateTime? NgayBatDau { get; set; }
    public DateTime? NgayKetThuc { get; set; }

    public virtual NguoiChoi? NguoiTao { get; set; }
    public virtual ICollection<ThanhTich> ThanhTichs { get; set; } = new List<ThanhTich>();
}
