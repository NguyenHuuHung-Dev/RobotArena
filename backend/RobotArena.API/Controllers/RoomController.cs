using Microsoft.AspNetCore.Mvc;
using RobotArena.Application.DTOs;
using RobotArena.Application.Services;

namespace RobotArena.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomController : ControllerBase
{
    private readonly IRoomManager _roomManager;

    public RoomController(IRoomManager roomManager)
    {
        _roomManager = roomManager;
    }

    [HttpGet]
    public IActionResult GetRooms()
    {
        var rooms = _roomManager.GetAvailableRooms();
        return Ok(rooms);
    }

    [HttpGet("{maPhong}")]
    public IActionResult GetRoom(string maPhong)
    {
        var room = _roomManager.GetRoom(maPhong);
        if (room == null) return NotFound(new { message = "Không tìm thấy phòng" });
        return Ok(room);
    }

    [HttpPost]
    public IActionResult CreateRoom([FromBody] CreateRoomRequest request)
    {
        var host = new PlayerSlotDto
        {
            NguoiChoiId = 1,
            TenHienThi = "Chủ Phòng",
            MauSac = "#000000",
            IsHost = true,
            IsReady = true
        };

        var room = _roomManager.CreateRoom(
            request.MaPhong,
            request.KichThuocMeCung,
            request.ViTriDich,
            request.SoLuongNguoiChoiMax,
            host
        );

        return Ok(room);
    }
}
