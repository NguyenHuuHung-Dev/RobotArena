using System.Collections.Concurrent;
using RobotArena.Application.DTOs;

namespace RobotArena.Application.Services;

public interface IRoomManager
{
    RoomDto CreateRoom(string maPhong, int kichThuoc, string viTriDich, int maxPlayers, PlayerSlotDto host);
    RoomDto? GetRoom(string maPhong);
    bool JoinRoom(string maPhong, PlayerSlotDto player);
    bool LeaveRoom(string maPhong, string connectionId, out RoomDto? updatedRoom);
    bool SetPlayerReady(string maPhong, int nguoiChoiId, bool isReady, string? thuatToan);
    bool StartRace(string maPhong);
    bool RecordFinish(string maPhong, int nguoiChoiId, int thoiGianMs, int soBuocDi);
    List<RoomDto> GetAvailableRooms();
}

public class RoomManager : IRoomManager
{
    private readonly ConcurrentDictionary<string, RoomDto> _rooms = new();
    private static readonly Random _rng = new();

    public RoomDto CreateRoom(string maPhong, int kichThuoc, string viTriDich, int maxPlayers, PlayerSlotDto host)
    {
        host.IsHost = true;
        host.IsReady = true;

        var room = new RoomDto
        {
            MaPhong = maPhong.ToUpper(),
            KichThuocMeCung = kichThuoc,
            ViTriDich = viTriDich,
            SoLuongNguoiChoiMax = Math.Clamp(maxPlayers, 2, 5),
            TrangThai = "WAITING",
            SeedMeCung = _rng.Next(10000, 99999),
            NguoiChois = new List<PlayerSlotDto> { host }
        };

        _rooms[room.MaPhong] = room;
        return room;
    }

    public RoomDto? GetRoom(string maPhong)
    {
        _rooms.TryGetValue(maPhong.ToUpper(), out var room);
        return room;
    }

    public bool JoinRoom(string maPhong, PlayerSlotDto player)
    {
        maPhong = maPhong.ToUpper();
        if (!_rooms.TryGetValue(maPhong, out var room)) return false;

        lock (room)
        {
            if (room.TrangThai != "WAITING") return false;
            if (room.NguoiChois.Count >= room.SoLuongNguoiChoiMax) return false;
            if (room.NguoiChois.Any(p => p.NguoiChoiId == player.NguoiChoiId))
            {
                // Update connection ID if already in room
                var existing = room.NguoiChois.First(p => p.NguoiChoiId == player.NguoiChoiId);
                existing.ConnectionId = player.ConnectionId;
                return true;
            }

            room.NguoiChois.Add(player);
            return true;
        }
    }

    public bool LeaveRoom(string maPhong, string connectionId, out RoomDto? updatedRoom)
    {
        maPhong = maPhong.ToUpper();
        updatedRoom = null;
        if (!_rooms.TryGetValue(maPhong, out var room)) return false;

        lock (room)
        {
            var p = room.NguoiChois.FirstOrDefault(x => x.ConnectionId == connectionId);
            if (p != null)
            {
                room.NguoiChois.Remove(p);
                if (room.NguoiChois.Count == 0)
                {
                    _rooms.TryRemove(maPhong, out _);
                    return true;
                }
                else if (p.IsHost)
                {
                    // Pass host to next player
                    room.NguoiChois[0].IsHost = true;
                }
            }
            updatedRoom = room;
            return true;
        }
    }

    public bool SetPlayerReady(string maPhong, int nguoiChoiId, bool isReady, string? thuatToan)
    {
        if (!_rooms.TryGetValue(maPhong.ToUpper(), out var room)) return false;

        lock (room)
        {
            var p = room.NguoiChois.FirstOrDefault(x => x.NguoiChoiId == nguoiChoiId);
            if (p == null) return false;

            p.IsReady = isReady;
            if (!string.IsNullOrEmpty(thuatToan))
            {
                p.ThuatToan = thuatToan;
            }
            return true;
        }
    }

    public bool StartRace(string maPhong)
    {
        if (!_rooms.TryGetValue(maPhong.ToUpper(), out var room)) return false;

        lock (room)
        {
            if (room.NguoiChois.Count < 2) return false;
            if (!room.NguoiChois.All(p => p.IsReady)) return false;

            room.TrangThai = "RACING";
            foreach (var p in room.NguoiChois)
            {
                p.HasFinished = false;
                p.ThoiGianMs = null;
                p.SoBuocDi = null;
            }
            return true;
        }
    }

    public bool RecordFinish(string maPhong, int nguoiChoiId, int thoiGianMs, int soBuocDi)
    {
        if (!_rooms.TryGetValue(maPhong.ToUpper(), out var room)) return false;

        lock (room)
        {
            var p = room.NguoiChois.FirstOrDefault(x => x.NguoiChoiId == nguoiChoiId);
            if (p == null) return false;

            p.HasFinished = true;
            p.ThoiGianMs = thoiGianMs;
            p.SoBuocDi = soBuocDi;

            if (room.NguoiChois.All(x => x.HasFinished))
            {
                room.TrangThai = "FINISHED";
            }
            return true;
        }
    }

    public List<RoomDto> GetAvailableRooms()
    {
        return _rooms.Values.Where(r => r.TrangThai == "WAITING" && r.NguoiChois.Count < r.SoLuongNguoiChoiMax).ToList();
    }
}
