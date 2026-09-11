using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RobotArena.Domain.Entities;
using RobotArena.Infrastructure.Data;

namespace RobotArena.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NguoiChoiController : ControllerBase
{
    private readonly RobotArenaDbContext _db;

    public NguoiChoiController(RobotArenaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.NguoiChois
            .Include(p => p.TaiKhoan)
            .Select(p => new
            {
                p.Id,
                p.TaiKhoanId,
                TenDangNhap = p.TaiKhoan != null ? p.TaiKhoan.TenDangNhap : "",
                p.TenHienThi,
                p.CapDo,
                p.DiemKinhNghiem,
                p.SoTranDaChoi,
                p.SoTranThang,
                p.MauSac,
                p.Avatar
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _db.NguoiChois
            .Include(p => p.TaiKhoan)
            .Include(p => p.ThanhTichs)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (item == null) return NotFound(new { message = "Không tìm thấy người chơi" });

        return Ok(new
        {
            item.Id,
            item.TaiKhoanId,
            TenDangNhap = item.TaiKhoan?.TenDangNhap,
            item.TenHienThi,
            item.CapDo,
            item.DiemKinhNghiem,
            item.SoTranDaChoi,
            item.SoTranThang,
            item.MauSac,
            item.Avatar,
            LichSuThanhTich = item.ThanhTichs.OrderByDescending(t => t.NgayGhiNhan).Take(10).Select(t => new
            {
                t.Id,
                t.TranDauId,
                t.ThuatToanSuDung,
                t.ThoiGianHoanThanhMs,
                t.SoBuocDi,
                t.XepHang,
                t.NgayGhiNhan
            })
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateNguoiChoiDto dto)
    {
        var item = await _db.NguoiChois.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy người chơi" });

        if (!string.IsNullOrWhiteSpace(dto.TenHienThi)) item.TenHienThi = dto.TenHienThi;
        if (!string.IsNullOrWhiteSpace(dto.MauSac)) item.MauSac = dto.MauSac;
        if (dto.Avatar != null) item.Avatar = dto.Avatar;
        if (dto.CapDo.HasValue) item.CapDo = dto.CapDo.Value;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật hồ sơ người chơi thành công" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.NguoiChois.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy người chơi" });

        _db.NguoiChois.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã xóa người chơi" });
    }
}

public record UpdateNguoiChoiDto(string? TenHienThi, string? MauSac, string? Avatar, int? CapDo);
