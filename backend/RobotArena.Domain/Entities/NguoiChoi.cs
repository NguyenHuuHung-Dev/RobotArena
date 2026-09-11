namespace RobotArena.Domain.Entities;

public class NguoiChoi
{
    public int Id { get; set; }
    public int TaiKhoanId { get; set; }
    public string TenHienThi { get; set; } = string.Empty;
    public int CapDo { get; set; } = 1;
    public int DiemKinhNghiem { get; set; } = 0;
    public int SoTranDaChoi { get; set; } = 0;
    public int SoTranThang { get; set; } = 0;
    public string MauSac { get; set; } = "#000000";
    public string? Avatar { get; set; }

    public virtual TaiKhoan? TaiKhoan { get; set; }
    public virtual ICollection<TranDau> TranDaus { get; set; } = new List<TranDau>();
    public virtual ICollection<ThanhTich> ThanhTichs { get; set; } = new List<ThanhTich>();
}
