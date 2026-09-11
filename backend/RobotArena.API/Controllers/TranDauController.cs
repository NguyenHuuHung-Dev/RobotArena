using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RobotArena.Domain.Entities;
using RobotArena.Infrastructure.Data;

namespace RobotArena.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TranDauController : ControllerBase
{
    private readonly RobotArenaDbContext _db;

    public TranDauController(RobotArenaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.TranDaus
            .Include(t => t.NguoiTao)
            .OrderByDescending(t => t.Id)
            .Take(50)
            .Select(t => new
            {
                t.Id,
                t.MaPhong,
                t.KichThuocMeCung,
                t.ViTriDich,
                t.SoLuongNguoiChoiMax,
                t.TrangThai,
                t.SeedMeCung,
                t.NguoiTaoId,
                TenNguoiTao = t.NguoiTao != null ? t.NguoiTao.TenHienThi : null,
                t.NgayTao,
                t.NgayBatDau,
                t.NgayKetThuc,
                SoNguoiHoanThanh = t.ThanhTichs.Count
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _db.TranDaus
            .Include(t => t.NguoiTao)
            .Include(t => t.ThanhTichs)
                .ThenInclude(th => th.NguoiChoi)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (item == null) return NotFound(new { message = "Không tìm thấy trận đấu" });

        return Ok(new
        {
            item.Id,
            item.MaPhong,
            item.KichThuocMeCung,
            item.ViTriDich,
            item.SoLuongNguoiChoiMax,
            item.TrangThai,
            item.SeedMeCung,
            item.NguoiTaoId,
            TenNguoiTao = item.NguoiTao?.TenHienThi,
            item.NgayTao,
            item.NgayBatDau,
            item.NgayKetThuc,
            BangXepHang = item.ThanhTichs.OrderBy(x => x.XepHang).Select(x => new
            {
                x.Id,
                x.NguoiChoiId,
                TenHienThi = x.NguoiChoi?.TenHienThi,
                MauSac = x.NguoiChoi?.MauSac,
                x.ThuatToanSuDung,
                x.ThoiGianHoanThanhMs,
                x.SoBuocDi,
                x.XepHang
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTranDauDto dto)
    {
        var item = new TranDau
        {
            MaPhong = dto.MaPhong.Trim().ToUpper(),
            KichThuocMeCung = dto.KichThuocMeCung,
            ViTriDich = dto.ViTriDich ?? "CENTER",
            SoLuongNguoiChoiMax = dto.SoLuongNguoiChoiMax,
            TrangThai = "WAITING",
            SeedMeCung = dto.SeedMeCung ?? new Random().Next(10000, 99999),
            NguoiTaoId = dto.NguoiTaoId,
            NgayTao = DateTime.UtcNow
        };

        _db.TranDaus.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTranDauDto dto)
    {
        var item = await _db.TranDaus.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy trận đấu" });

        if (!string.IsNullOrWhiteSpace(dto.TrangThai)) item.TrangThai = dto.TrangThai;
        if (dto.NgayBatDau.HasValue) item.NgayBatDau = dto.NgayBatDau;
        if (dto.NgayKetThuc.HasValue) item.NgayKetThuc = dto.NgayKetThuc;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật trận đấu thành công" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.TranDaus.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy trận đấu" });

        _db.TranDaus.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã xóa trận đấu" });
    }
}

public record CreateTranDauDto(string MaPhong, int KichThuocMeCung, string? ViTriDich, int SoLuongNguoiChoiMax, int? SeedMeCung, int? NguoiTaoId);
public record UpdateTranDauDto(string? TrangThai, DateTime? NgayBatDau, DateTime? NgayKetThuc);
