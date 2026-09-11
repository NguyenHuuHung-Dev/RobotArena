using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RobotArena.Application.DTOs;
using RobotArena.Domain.Entities;
using RobotArena.Infrastructure.Data;

namespace RobotArena.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly RobotArenaDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(RobotArenaDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenDangNhap) || string.IsNullOrWhiteSpace(request.MatKhau))
        {
            return BadRequest(new { message = "Tên đăng nhập và mật khẩu không được để trống" });
        }

        var exists = await _db.TaiKhoans.AnyAsync(x => x.TenDangNhap == request.TenDangNhap.Trim());
        if (exists)
        {
            return BadRequest(new { message = "Tên đăng nhập đã tồn tại" });
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(request.MatKhau);
        var taiKhoan = new TaiKhoan
        {
            TenDangNhap = request.TenDangNhap.Trim(),
            MatKhauHash = hash,
            Email = request.Email?.Trim(),
            NgayTao = DateTime.UtcNow,
            TrangThai = "ACTIVE"
        };

        _db.TaiKhoans.Add(taiKhoan);
        await _db.SaveChangesAsync();

        var nguoiChoi = new NguoiChoi
        {
            TaiKhoanId = taiKhoan.Id,
            TenHienThi = string.IsNullOrWhiteSpace(request.TenHienThi) ? request.TenDangNhap : request.TenHienThi.Trim(),
            CapDo = 1,
            DiemKinhNghiem = 0,
            SoTranDaChoi = 0,
            SoTranThang = 0,
            MauSac = string.IsNullOrWhiteSpace(request.MauSac) ? "#000000" : request.MauSac
        };

        _db.NguoiChois.Add(nguoiChoi);
        await _db.SaveChangesAsync();

        var token = GenerateToken(taiKhoan, nguoiChoi);
        return Ok(new AuthResponse(
            taiKhoan.Id,
            nguoiChoi.Id,
            taiKhoan.TenDangNhap,
            nguoiChoi.TenHienThi,
            nguoiChoi.CapDo,
            nguoiChoi.DiemKinhNghiem,
            nguoiChoi.SoTranDaChoi,
            nguoiChoi.SoTranThang,
            nguoiChoi.MauSac,
            token
        ));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var taiKhoan = await _db.TaiKhoans
            .Include(t => t.NguoiChoi)
            .FirstOrDefaultAsync(x => x.TenDangNhap == request.TenDangNhap.Trim());

        if (taiKhoan == null || !BCrypt.Net.BCrypt.Verify(request.MatKhau, taiKhoan.MatKhauHash))
        {
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không chính xác" });
        }

        var nguoiChoi = taiKhoan.NguoiChoi;
        if (nguoiChoi == null)
        {
            nguoiChoi = new NguoiChoi
            {
                TaiKhoanId = taiKhoan.Id,
                TenHienThi = taiKhoan.TenDangNhap,
                MauSac = "#000000"
            };
            _db.NguoiChois.Add(nguoiChoi);
            await _db.SaveChangesAsync();
        }

        var token = GenerateToken(taiKhoan, nguoiChoi);
        return Ok(new AuthResponse(
            taiKhoan.Id,
            nguoiChoi.Id,
            taiKhoan.TenDangNhap,
            nguoiChoi.TenHienThi,
            nguoiChoi.CapDo,
            nguoiChoi.DiemKinhNghiem,
            nguoiChoi.SoTranDaChoi,
            nguoiChoi.SoTranThang,
            nguoiChoi.MauSac,
            token
        ));
    }

    private string GenerateToken(TaiKhoan acc, NguoiChoi player)
    {
        var keyStr = _config["Jwt:Key"] ?? "SuperSecretRobotArenaSecretKey_MinLength32Chars!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, acc.Id.ToString()),
            new Claim("NguoiChoiId", player.Id.ToString()),
            new Claim(ClaimTypes.Name, player.TenHienThi)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "RobotArena",
            audience: _config["Jwt:Audience"] ?? "RobotArenaClients",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
