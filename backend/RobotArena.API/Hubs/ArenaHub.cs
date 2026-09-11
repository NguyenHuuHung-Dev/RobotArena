using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RobotArena.Application.DTOs;
using RobotArena.Application.Services;
using RobotArena.Domain.Entities;
using RobotArena.Infrastructure.Data;

namespace RobotArena.API.Hubs;

public class ArenaHub : Hub
{
    private readonly IRoomManager _roomManager;
    private readonly RobotArenaDbContext _db;
    private readonly ILogger<ArenaHub> _logger;

    public ArenaHub(IRoomManager roomManager, RobotArenaDbContext db, ILogger<ArenaHub> logger)
    {
        _roomManager = roomManager;
        _db = db;
        _logger = logger;
    }

    public async Task JoinRoom(string maPhong, int nguoiChoiId, string tenHienThi, string mauSac, string thuatToan)
    {
        maPhong = maPhong.Trim().ToUpper();
        await Groups.AddToGroupAsync(Context.ConnectionId, maPhong);

        var playerSlot = new PlayerSlotDto
        {
            NguoiChoiId = nguoiChoiId,
            TenHienThi = tenHienThi,
            MauSac = mauSac,
            ThuatToan = thuatToan,
            IsReady = false,
            IsHost = false,
            ConnectionId = Context.ConnectionId
        };

        var room = _roomManager.GetRoom(maPhong);
        if (room == null)
        {
            // Create new room if not found
            room = _roomManager.CreateRoom(maPhong, 21, "CENTER", 5, playerSlot);
        }
        else
        {
            _roomManager.JoinRoom(maPhong, playerSlot);
            room = _roomManager.GetRoom(maPhong);
        }

        await Clients.Group(maPhong).SendAsync("RoomUpdated", room);
    }

    public async Task LeaveRoom(string maPhong)
    {
        maPhong = maPhong.Trim().ToUpper();
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, maPhong);
        if (_roomManager.LeaveRoom(maPhong, Context.ConnectionId, out var updatedRoom))
        {
            if (updatedRoom != null)
            {
                await Clients.Group(maPhong).SendAsync("RoomUpdated", updatedRoom);
            }
        }
    }

    public async Task SetReady(string maPhong, int nguoiChoiId, bool isReady, string? thuatToan)
    {
        maPhong = maPhong.Trim().ToUpper();
        if (_roomManager.SetPlayerReady(maPhong, nguoiChoiId, isReady, thuatToan))
        {
            var room = _roomManager.GetRoom(maPhong);
            await Clients.Group(maPhong).SendAsync("RoomUpdated", room);
        }
    }

    public async Task StartMatch(string maPhong)
    {
        maPhong = maPhong.Trim().ToUpper();
        var room = _roomManager.GetRoom(maPhong);
        if (room == null) return;

        if (_roomManager.StartRace(maPhong))
        {
            // Record match into SQL Server
            try
            {
                var hostPlayer = room.NguoiChois.FirstOrDefault(p => p.IsHost);
                var tranDau = new TranDau
                {
                    MaPhong = room.MaPhong,
                    KichThuocMeCung = room.KichThuocMeCung,
                    ViTriDich = room.ViTriDich,
                    SoLuongNguoiChoiMax = room.SoLuongNguoiChoiMax,
                    TrangThai = "RACING",
                    SeedMeCung = room.SeedMeCung,
                    NguoiTaoId = hostPlayer?.NguoiChoiId,
                    NgayBatDau = DateTime.UtcNow
                };
                _db.TranDaus.Add(tranDau);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lưu trận đấu vào SQL Server");
            }

            await Clients.Group(maPhong).SendAsync("MatchStarting", new
            {
                countdown = 3,
                seed = room.SeedMeCung,
                size = room.KichThuocMeCung,
                goal = room.ViTriDich,
                players = room.NguoiChois
            });
        }
    }

    public async Task SendProgress(string maPhong, int nguoiChoiId, double x, double y, double heading, int steps, bool reachedGoal)
    {
        maPhong = maPhong.Trim().ToUpper();
        await Clients.OthersInGroup(maPhong).SendAsync("PlayerProgressUpdated", new
        {
            nguoiChoiId,
            x,
            y,
            heading,
            steps,
            reachedGoal
        });
    }

    public async Task SubmitFinish(string maPhong, int nguoiChoiId, string thuatToan, int thoiGianMs, int soBuocDi)
    {
        maPhong = maPhong.Trim().ToUpper();
        var room = _roomManager.GetRoom(maPhong);
        if (room == null) return;

        _roomManager.RecordFinish(maPhong, nguoiChoiId, thoiGianMs, soBuocDi);

        // Count rank among finished players in this room
        int rank = room.NguoiChois.Count(p => p.HasFinished);

        // Save result to SQL Server thanhtich table
        try
        {
            var tranDau = await _db.TranDaus.OrderByDescending(t => t.Id).FirstOrDefaultAsync(t => t.MaPhong == maPhong);
            if (tranDau != null)
            {
                var record = new ThanhTich
                {
                    TranDauId = tranDau.Id,
                    NguoiChoiId = nguoiChoiId,
                    ThuatToanSuDung = thuatToan,
                    ThoiGianHoanThanhMs = thoiGianMs,
                    SoBuocDi = soBuocDi,
                    XepHang = rank,
                    TrangThai = "FINISHED",
                    NgayGhiNhan = DateTime.UtcNow
                };
                _db.ThanhTichs.Add(record);

                // Update player stats
                var player = await _db.NguoiChois.FindAsync(nguoiChoiId);
                if (player != null)
                {
                    player.SoTranDaChoi += 1;
                    if (rank == 1)
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
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lưu kết quả vào SQL Server");
        }

        await Clients.Group(maPhong).SendAsync("PlayerFinished", new
        {
            nguoiChoiId,
            rank,
            thoiGianMs,
            soBuocDi
        });

        // If all finished, broadcast MatchEnded
        if (room.NguoiChois.All(p => p.HasFinished))
        {
            await Clients.Group(maPhong).SendAsync("MatchEnded", room.NguoiChois);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Try to locate and remove player from room
        var rooms = _roomManager.GetAvailableRooms();
        foreach (var r in rooms)
        {
            if (_roomManager.LeaveRoom(r.MaPhong, Context.ConnectionId, out var updatedRoom))
            {
                if (updatedRoom != null)
                {
                    await Clients.Group(r.MaPhong).SendAsync("RoomUpdated", updatedRoom);
                }
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
