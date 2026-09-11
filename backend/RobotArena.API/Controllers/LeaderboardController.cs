using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RobotArena.Application.DTOs;
using RobotArena.Infrastructure.Data;

namespace RobotArena.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly RobotArenaDbContext _db;

    public LeaderboardController(RobotArenaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeaderboard()
    {
        var players = await _db.NguoiChois
            .OrderByDescending(p => p.SoTranThang)
            .ThenByDescending(p => p.DiemKinhNghiem)
            .Take(20)
            .Select(p => new LeaderboardEntryDto(
                p.Id,
                p.TenHienThi,
                p.CapDo,
                p.SoTranDaChoi,
                p.SoTranThang,
                p.MauSac,
                p.SoTranDaChoi > 0 ? Math.Round((double)p.SoTranThang / p.SoTranDaChoi * 100, 1) : 0
            ))
            .ToListAsync();

        return Ok(players);
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecentMatches()
    {
        var matches = await _db.ThanhTichs
            .Include(t => t.NguoiChoi)
            .Include(t => t.TranDau)
            .OrderByDescending(t => t.NgayGhiNhan)
            .Take(15)
            .Select(t => new
            {
                t.Id,
                MaPhong = t.TranDau != null ? t.TranDau.MaPhong : "ARENA",
                TenHienThi = t.NguoiChoi != null ? t.NguoiChoi.TenHienThi : "Ẩn danh",
                MauSac = t.NguoiChoi != null ? t.NguoiChoi.MauSac : "#000000",
                t.ThuatToanSuDung,
                t.ThoiGianHoanThanhMs,
                t.SoBuocDi,
                t.XepHang,
                t.NgayGhiNhan
            })
            .ToListAsync();

        return Ok(matches);
    }
}
