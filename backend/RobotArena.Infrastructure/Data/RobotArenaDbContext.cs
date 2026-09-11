using Microsoft.EntityFrameworkCore;
using RobotArena.Domain.Entities;

namespace RobotArena.Infrastructure.Data;

public class RobotArenaDbContext : DbContext
{
    public RobotArenaDbContext(DbContextOptions<RobotArenaDbContext> options) : base(options)
    {
    }

    public DbSet<TaiKhoan> TaiKhoans => Set<TaiKhoan>();
    public DbSet<NguoiChoi> NguoiChois => Set<NguoiChoi>();
    public DbSet<TranDau> TranDaus => Set<TranDau>();
    public DbSet<ThanhTich> ThanhTichs => Set<ThanhTich>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TaiKhoan>(entity =>
        {
            entity.ToTable("taikhoan");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TenDangNhap).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.TenDangNhap).IsUnique();
            entity.Property(e => e.MatKhauHash).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.TrangThai).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<NguoiChoi>(entity =>
        {
            entity.ToTable("nguoichoi");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TenHienThi).IsRequired().HasMaxLength(50);
            entity.Property(e => e.MauSac).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.TaiKhoan)
                  .WithOne(t => t.NguoiChoi)
                  .HasForeignKey<NguoiChoi>(e => e.TaiKhoanId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TranDau>(entity =>
        {
            entity.ToTable("trandau");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaPhong).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.MaPhong).IsUnique();
            entity.Property(e => e.ViTriDich).IsRequired().HasMaxLength(20);
            entity.Property(e => e.TrangThai).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.NguoiTao)
                  .WithMany(p => p.TranDaus)
                  .HasForeignKey(e => e.NguoiTaoId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ThanhTich>(entity =>
        {
            entity.ToTable("thanhtich");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ThuatToanSuDung).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TrangThai).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.TranDau)
                  .WithMany(t => t.ThanhTichs)
                  .HasForeignKey(e => e.TranDauId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.NguoiChoi)
                  .WithMany(p => p.ThanhTichs)
                  .HasForeignKey(e => e.NguoiChoiId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
