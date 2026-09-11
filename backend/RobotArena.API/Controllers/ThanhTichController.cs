using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RobotArena.Domain.Entities;
using RobotArena.Infrastructure.Data;

namespace RobotArena.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ThanhTichController : ControllerBase
{
    private readonly RobotArenaDbContext _db;

    public ThanhTichController(RobotArenaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.ThanhTichs
            .Include(t => t.NguoiChoi)
            .Include(t => t.TranDau)
            .OrderByDescending(t => t.Id)
            .Take(50)
            .Select(t => new
            {
                t.Id,
                t.TranDauId,
                MaPhong = t.TranDau != null ? t.TranDau.MaPhong : null,
                t.NguoiChoiId,
                TenHienThi = t.NguoiChoi != null ? t.NguoiChoi.TenHienThi : null,
                t.ThuatToanSuDung,
                t.ThoiGianHoanThanhMs,
                t.SoBuocDi,
                t.XepHang,
                t.TrangThai,
                t.NgayGhiNhan
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _db.ThanhTichs
            .Include(t => t.NguoiChoi)
            .Include(t => t.TranDau)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (item == null) return NotFound(new { message = "Không tìm thấy thành tích" });
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateThanhTichDto dto)
    {
        var item = new ThanhTich
        {
            TranDauId = dto.TranDauId,
            NguoiChoiId = dto.NguoiChoiId,
            ThuatToanSuDung = dto.ThuatToanSuDung,
            ThoiGianHoanThanhMs = dto.ThoiGianHoanThanhMs,
            SoBuocDi = dto.SoBuocDi,
            XepHang = dto.XepHang,
            TrangThai = "FINISHED",
            NgayGhiNhan = DateTime.UtcNow
        };

        _db.ThanhTichs.Add(item);

        // Update player stats
        var player = await _db.NguoiChois.FindAsync(dto.NguoiChoiId);
        if (player != null)
        {
            player.SoTranDaChoi += 1;
            if (dto.XepHang == 1)
            {
                player.SoTranThang += 1;
                player.DiemKinhNghiem += 100;
            }
            else
            {
                player.DiemKinhNghiem += 30;
            }
            player.CapDo = 1 + (player.DiemKinhNghiem / 200);
        }

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.ThanhTichs.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy thành tích" });

        _db.ThanhTichs.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã xóa thành tích" });
    }
}

public record CreateThanhTichDto(int TranDauId, int NguoiChoiId, string ThuatToanSuDung, int ThoiGianHoanThanhMs, int SoBuocDi, int XepHang);
