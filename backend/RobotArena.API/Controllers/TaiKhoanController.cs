using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RobotArena.Domain.Entities;
using RobotArena.Infrastructure.Data;

namespace RobotArena.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TaiKhoanController : ControllerBase
{
    private readonly RobotArenaDbContext _db;

    public TaiKhoanController(RobotArenaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.TaiKhoans
            .Include(t => t.NguoiChoi)
            .Select(t => new
            {
                t.Id,
                t.TenDangNhap,
                t.Email,
                t.NgayTao,
                t.TrangThai,
                NguoiChoi = t.NguoiChoi != null ? new
                {
                    t.NguoiChoi.Id,
                    t.NguoiChoi.TenHienThi,
                    t.NguoiChoi.CapDo,
                    t.NguoiChoi.MauSac
                } : null
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _db.TaiKhoans
            .Include(t => t.NguoiChoi)
            .Where(t => t.Id == id)
            .Select(t => new
            {
                t.Id,
                t.TenDangNhap,
                t.Email,
                t.NgayTao,
                t.TrangThai,
                NguoiChoi = t.NguoiChoi != null ? new
                {
                    t.NguoiChoi.Id,
                    t.NguoiChoi.TenHienThi,
                    t.NguoiChoi.CapDo,
                    t.NguoiChoi.MauSac,
                    t.NguoiChoi.SoTranDaChoi,
                    t.NguoiChoi.SoTranThang
                } : null
            })
            .FirstOrDefaultAsync();

        if (item == null) return NotFound(new { message = "Không tìm thấy tài khoản" });
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaiKhoanDto dto)
    {
        if (await _db.TaiKhoans.AnyAsync(x => x.TenDangNhap == dto.TenDangNhap))
        {
            return BadRequest(new { message = "Tên đăng nhập đã tồn tại" });
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.MatKhau);
        var item = new TaiKhoan
        {
            TenDangNhap = dto.TenDangNhap,
            MatKhauHash = hash,
            Email = dto.Email,
            NgayTao = DateTime.UtcNow,
            TrangThai = "ACTIVE"
        };

        _db.TaiKhoans.Add(item);
        await _db.SaveChangesAsync();

        var player = new NguoiChoi
        {
            TaiKhoanId = item.Id,
            TenHienThi = string.IsNullOrWhiteSpace(dto.TenHienThi) ? dto.TenDangNhap : dto.TenHienThi,
            MauSac = "#000000"
        };
        _db.NguoiChois.Add(player);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, new { item.Id, item.TenDangNhap, item.Email });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaiKhoanDto dto)
    {
        var item = await _db.TaiKhoans.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy tài khoản" });

        if (!string.IsNullOrWhiteSpace(dto.Email)) item.Email = dto.Email;
        if (!string.IsNullOrWhiteSpace(dto.TrangThai)) item.TrangThai = dto.TrangThai;
        if (!string.IsNullOrWhiteSpace(dto.MatKhauMoi))
        {
            item.MatKhauHash = BCrypt.Net.BCrypt.HashPassword(dto.MatKhauMoi);
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật tài khoản thành công" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.TaiKhoans.FindAsync(id);
        if (item == null) return NotFound(new { message = "Không tìm thấy tài khoản" });

        _db.TaiKhoans.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã xóa tài khoản" });
    }
}

public record CreateTaiKhoanDto(string TenDangNhap, string MatKhau, string? TenHienThi, string? Email);
public record UpdateTaiKhoanDto(string? Email, string? TrangThai, string? MatKhauMoi);
