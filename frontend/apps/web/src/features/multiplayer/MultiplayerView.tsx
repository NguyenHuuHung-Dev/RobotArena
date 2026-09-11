import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { signalRService, SignalRRoom, SignalRPlayerSlot } from '../../services/signalrService';
import { apiClient } from '../../services/api';
import { MazeSimulationEngine } from '../../services/mazeSimulation';
import { SimulationCanvas } from '../arena/SimulationCanvas';
import { MazeSimulationTick } from '@robot-arena/shared-types';

import { DEFAULT_ALGORITHMS, AlgorithmDefinition } from '../../stores/simulationStore';
import { AlgorithmInfoModal } from '../match/AlgorithmInfoModal';

const AVAILABLE_ALGORITHMS: AlgorithmDefinition[] = [
  ...DEFAULT_ALGORITHMS,
  {
    id: 'custom',
    name: 'Thuật Toán Tự Viết',
    shortDesc: 'Chạy mã JavaScript do bạn tự viết trong Monaco Editor',
    color: '#000000',
    fullDesc:
      'Cho phép bạn tự do lập trình logic đưa ra quyết định di chuyển của chuột (TURN_LEFT, TURN_RIGHT, MOVE_FORWARD, TURN_BACK) dựa trên dữ liệu cảm biến (walls, position) và bộ nhớ trạng thái.',
    category: 'Tự Lập Trình',
    pros: ['Tự do sáng tạo chiến thuật riêng', 'Tùy biến linh hoạt theo phong cách thi đấu'],
    cons: ['Hiệu quả phụ thuộc hoàn toàn vào code do người chơi viết'],
  },
];

export const MultiplayerView: React.FC = () => {
  const { user, setAuthModalOpen } = useAuthStore();

  const [currentRoom, setCurrentRoom] = useState<SignalRRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<SignalRRoom[]>([]);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [maxPlayersInput, setMaxPlayersInput] = useState<number>(3);
  const [mazeSizeInput, setMazeSizeInput] = useState<number>(21);
  const [goalPosInput, setGoalPosInput] = useState<'CENTER' | 'CORNER'>('CENTER');
  const [selectedAlgo, setSelectedAlgo] = useState<string>('floodfill');
  const [isReady, setIsReady] = useState(false);
  const [inspectingAlgo, setInspectingAlgo] = useState<AlgorithmDefinition | null>(null);

  // 10s Ready Timer
  const [readyCountdown, setReadyCountdown] = useState<number | null>(null);
  const readyTimerRef = useRef<any>(null);

  // Custom Algorithm Modal
  const [isCustomCodeModalOpen, setIsCustomCodeModalOpen] = useState(false);
  const [customCode, setCustomCode] = useState<string>(
`// Thuật toán tìm đường trong mê cung
function decideNextMove(sensors, memory) {
  if (!sensors.hasWallRight) return 'TURN_RIGHT';
  if (!sensors.hasWallFront) return 'MOVE_FORWARD';
  if (!sensors.hasWallLeft) return 'TURN_LEFT';
  return 'TURN_BACK';
}`
  );

  // Match state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [tickData, setTickData] = useState<MazeSimulationTick | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);

  const engineRef = useRef<MazeSimulationEngine | null>(null);
  const raceIntervalRef = useRef<any>(null);
  const finishReportedRef = useRef<Set<string>>(new Set());

  // Fetch open rooms on mount
  const fetchRooms = async () => {
    try {
      const res = await apiClient.get<SignalRRoom[]>('/room');
      setAvailableRooms(res.data);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  // Setup SignalR event listeners
  useEffect(() => {
    signalRService.connect().catch(console.error);

    signalRService.onRoomUpdated((room) => {
      setCurrentRoom(room);
      if (user) {
        const slot = room.nguoiChois.find((p) => p.nguoiChoiId === user.nguoiChoiId);
        if (slot) {
          setIsReady(slot.isReady);
        }
      }
    });

    signalRService.onMatchStarting((event) => {
      if (readyTimerRef.current) clearInterval(readyTimerRef.current);
      setReadyCountdown(null);
      setCountdown(event.countdown);
      finishReportedRef.current.clear();

      let currentCount = event.countdown;
      const countTimer = setInterval(() => {
        currentCount -= 1;
        if (currentCount > 0) {
          setCountdown(currentCount);
        } else {
          clearInterval(countTimer);
          setCountdown(null);
          startLocalRace(event);
        }
      }, 1000);
    });

    signalRService.onPlayerFinished((_finish) => {});

    signalRService.onMatchEnded(() => {
      setIsRacing(false);
      if (raceIntervalRef.current) {
        clearInterval(raceIntervalRef.current);
      }
    });

    return () => {
      signalRService.removeAllListeners();
      if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
      if (readyTimerRef.current) clearInterval(readyTimerRef.current);
    };
  }, [user]);

  // Exclusive algorithm detection
  const takenAlgos = new Set(
    currentRoom?.nguoiChois
      .filter((p) => p.nguoiChoiId !== user?.nguoiChoiId)
      .map((p) => p.thuatToan) || []
  );

  // Auto-switch algorithm if current selection is taken by someone else
  useEffect(() => {
    if (currentRoom && takenAlgos.has(selectedAlgo)) {
      const firstFree = AVAILABLE_ALGORITHMS.find((a) => !takenAlgos.has(a.id));
      if (firstFree) {
        setSelectedAlgo(firstFree.id);
        if (user && isReady) {
          signalRService.setReady(currentRoom.maPhong, user.nguoiChoiId, true, firstFree.id);
        }
      }
    }
  }, [currentRoom, takenAlgos, selectedAlgo, isReady, user]);

  // 10s Ready Timer Logic: active when >= 2 players in room and waiting
  useEffect(() => {
    if (
      currentRoom &&
      currentRoom.trangThai === 'WAITING' &&
      currentRoom.nguoiChois.length >= 2 &&
      !isRacing &&
      countdown === null
    ) {
      const allReady = currentRoom.nguoiChois.every((p) => p.isReady);
      if (allReady) {
        if (readyTimerRef.current) clearInterval(readyTimerRef.current);
        setReadyCountdown(null);
        return;
      }

      if (readyCountdown === null) {
        setReadyCountdown(10);
      }

      if (readyTimerRef.current) clearInterval(readyTimerRef.current);
      readyTimerRef.current = setInterval(() => {
        setReadyCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(readyTimerRef.current);
            // Auto ready when timer expires
            if (user && !isReady) {
              const freeAlgo = AVAILABLE_ALGORITHMS.find((a) => !takenAlgos.has(a.id))?.id || selectedAlgo;
              setIsReady(true);
              signalRService.setReady(currentRoom.maPhong, user.nguoiChoiId, true, freeAlgo);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (readyTimerRef.current) clearInterval(readyTimerRef.current);
      };
    } else {
      if (readyTimerRef.current) clearInterval(readyTimerRef.current);
      setReadyCountdown(null);
    }
  }, [currentRoom, isRacing, countdown, isReady, user, takenAlgos, selectedAlgo]);

  const startLocalRace = (event: any) => {
    setIsRacing(true);

    const customAlgorithms = event.players.map((p: SignalRPlayerSlot) => ({
      id: `player_${p.nguoiChoiId}`,
      name: p.tenHienThi, // Directly displays player's name above mouse every 5s!
      algorithmType: p.thuatToan,
      code: p.thuatToan === 'custom' ? customCode : '',
      color: p.mauSac || '#000000',
    }));

    const engine = new MazeSimulationEngine({
      rows: event.size,
      cols: event.size,
      goalPosition: event.goal === 'CENTER' ? 'center' : 'corner',
      braidFactor: 0.1,
      activeAlgorithms: customAlgorithms.map((a: any) => a.id),
      algorithmsList: customAlgorithms,
      smoothCorners: true,
    });

    engineRef.current = engine;
    const initialTick = engine.getCurrentTick(true);
    setTickData(initialTick);
    if (initialTick.robots.length > 0) {
      setSelectedRobotId(initialTick.robots[0].id);
    }

    // Run race ticks
    const startTime = Date.now();
    raceIntervalRef.current = setInterval(() => {
      if (!engineRef.current) return;

      const next = engineRef.current.nextTick(true);
      setTickData(next);

      // Check if any player's robot reached goal
      next.robots.forEach((robot, idx) => {
        if (robot.hasReachedGoal && !finishReportedRef.current.has(robot.id)) {
          finishReportedRef.current.add(robot.id);
          const playerSlot = event.players[idx];
          if (playerSlot && user && playerSlot.nguoiChoiId === user.nguoiChoiId) {
            const timeElapsed = Date.now() - startTime;
            signalRService.submitFinish(
              currentRoom?.maPhong || '',
              user.nguoiChoiId,
              playerSlot.thuatToan || 'floodfill',
              timeElapsed,
              robot.stepsCount
            );
          }
        }
      });

      if (next.robots.every((r) => r.hasReachedGoal)) {
        clearInterval(raceIntervalRef.current);
      }
    }, 180);
  };

  const handleCreateRoom = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const code = roomCodeInput.trim().toUpperCase() || `ROOM${Math.floor(1000 + Math.random() * 9000)}`;
    await signalRService.joinRoom(code, user.nguoiChoiId, user.tenHienThi, user.mauSac, selectedAlgo);
  };

  const handleJoinRoom = async (code: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!code) return;
    await signalRService.joinRoom(code.toUpperCase(), user.nguoiChoiId, user.tenHienThi, user.mauSac, selectedAlgo);
  };

  const handleToggleReady = async () => {
    if (!currentRoom || !user) return;
    const nextState = !isReady;
    setIsReady(nextState);
    await signalRService.setReady(currentRoom.maPhong, user.nguoiChoiId, nextState, selectedAlgo);
  };

  const handleStartMatch = async () => {
    if (!currentRoom) return;
    await signalRService.startMatch(currentRoom.maPhong);
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    if (raceIntervalRef.current) clearInterval(raceIntervalRef.current);
    await signalRService.leaveRoom(currentRoom.maPhong);
    setCurrentRoom(null);
    setIsRacing(false);
    setTickData(null);
    fetchRooms();
  };

  // 1. If not logged in banner
  if (!user) {
    return (
      <div className="space-y-6 font-sans">
        <div className="border border-black bg-white p-6">
          <div className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 mb-1">
            ĐẤU ONLINE NHIỀU NGƯỜI CHƠI (2 - 5 NGƯỜI) · SQL SERVER
          </div>
          <h2 className="text-3xl font-extrabold uppercase text-black">
            Đấu Trường Mạng Trực Tuyến
          </h2>
          <p className="text-sm text-neutral-600 font-serif italic mt-1">
            Thi đấu giải thuật toán mê cung thời gian thực giữa 2 đến 5 đấu thủ, lưu thành tích vào cơ sở dữ liệu.
          </p>
        </div>

        <div className="border-2 border-black p-8 text-center bg-white space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 bg-black mx-auto" />
          <h3 className="text-lg font-extrabold uppercase font-sans">Yêu Cầu Đăng Nhập Để Thi Đấu</h3>
          <p className="text-xs font-mono text-neutral-600">
            Vui lòng đăng nhập hoặc tạo tài khoản để hệ thống lưu điểm xếp hạng, cấp độ và lịch sử các trận đấu vào SQL Server.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-6 py-3 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition"
          >
            ĐĂNG NHẬP / TẠO TÀI KHOẢN NGAY →
          </button>
        </div>
      </div>
    );
  }

  // 2. In-Match / Racing View
  if (isRacing || countdown !== null || (tickData && tickData.robots.length > 0)) {
    return (
      <div className="space-y-4 font-sans">
        {/* Match Header */}
        <div className="border border-black bg-white p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
              TRẬN ĐẤU ĐANG DIỄN RA · PHÒNG: <span className="text-black font-bold font-mono">{currentRoom?.maPhong}</span>
            </div>
            <h2 className="text-xl font-extrabold uppercase text-black">
              Đua Mê Cung {currentRoom?.nguoiChois.length} Người Chơi
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 border border-black text-xs font-mono font-bold uppercase hover:bg-neutral-100 transition"
            >
              ← VỀ PHÒNG CHỜ
            </button>
          </div>
        </div>

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="border-2 border-black bg-white p-8 text-center">
            <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
              CHUẨN BỊ XUẤT PHÁT SAU
            </div>
            <div className="text-6xl font-black font-mono text-black">{countdown}</div>
          </div>
        )}

        {/* Canvas & Live Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 flex flex-col items-center justify-center p-4 bg-white border border-black">
            <SimulationCanvas
              tickData={tickData}
              selectedRobotId={selectedRobotId}
              onSelectRobot={setSelectedRobotId}
              showExploredHeatmap={true}
              smoothCorners={true}
              width={700}
              height={700}
            />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="border border-black bg-white p-4">
              <div className="border-b border-black pb-2 mb-3">
                <h4 className="font-extrabold text-xs uppercase tracking-widest text-black">
                  BẢNG THÀNH TÍCH TRỰC TIẾP
                </h4>
              </div>

              <div className="space-y-2">
                {currentRoom?.nguoiChois.map((player, idx) => {
                  const robot = tickData?.robots[idx];
                  const hasFinished = robot?.hasReachedGoal;

                  return (
                    <div
                      key={player.nguoiChoiId}
                      className={`p-3 border text-xs font-mono transition-all ${
                        hasFinished
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 border border-black"
                            style={{ backgroundColor: player.mauSac }}
                          />
                          <span className="font-bold text-black font-sans">{player.tenHienThi}</span>
                          {player.isHost && (
                            <span className="text-[9px] px-1 bg-black text-white">CHỦ</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                            hasFinished
                              ? 'border-emerald-700 bg-emerald-700 text-white'
                              : 'border-neutral-400 text-neutral-600'
                          }`}
                        >
                          {hasFinished ? 'ĐÃ VỀ ĐÍCH' : 'ĐANG TÌM ĐƯỜNG'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-200 text-[11px] text-neutral-600">
                        <div>Thuật toán: <strong className="text-black">{player.thuatToan}</strong></div>
                        <div>Số bước: <strong className="text-black">{robot?.stepsCount || 0}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Match Finished Banner */}
            {tickData?.robots.every((r) => r.hasReachedGoal) && (
              <div className="border-2 border-black bg-neutral-900 text-white p-4 text-center space-y-3">
                <div className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                  ★ TRẬN ĐẤU ĐÃ KẾT THÚC ★
                </div>
                <div className="text-sm font-sans font-bold">
                  Thành tích đã được lưu trữ vào SQL Server!
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className="w-full py-2 bg-white text-black font-mono font-bold text-xs uppercase hover:bg-neutral-200 transition"
                >
                  QUAY LẠI PHÒNG CHỜ →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Waiting Room Lobby (When in a room)
  if (currentRoom) {
    const isHost = currentRoom.nguoiChois.find((p) => p.nguoiChoiId === user.nguoiChoiId)?.isHost;
    const canStart =
      isHost &&
      currentRoom.nguoiChois.length >= 2 &&
      currentRoom.nguoiChois.every((p) => p.isReady);

    const totalSlots = currentRoom.soLuongNguoiChoiMax || 5;
    const slots = Array.from({ length: totalSlots }).map((_, i) => currentRoom.nguoiChois[i] || null);

    return (
      <div className="space-y-6 font-sans">
        <div className="border border-black bg-white p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 mb-1">
              PHÒNG ĐẤU TRỰC TUYẾN · {currentRoom.nguoiChois.length}/{currentRoom.soLuongNguoiChoiMax} ĐẤU THỦ
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold uppercase text-black font-mono">
                {currentRoom.maPhong}
              </h2>
              <span className="text-xs font-mono bg-neutral-100 border border-neutral-300 px-2 py-1">
                LƯỚI {currentRoom.kichThuocMeCung}x{currentRoom.kichThuocMeCung} · ĐÍCH {currentRoom.viTriDich === 'CENTER' ? 'Ở GIỮA' : 'GÓC'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleReady}
              className={`px-6 py-2.5 text-xs font-mono font-bold uppercase transition border border-black ${
                isReady
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              {isReady ? '✓ ĐÃ SẴN SÀNG (BẤM ĐỂ HỦY)' : 'XÁC NHẬN SẴN SÀNG'}
            </button>

            {isHost && (
              <button
                onClick={handleStartMatch}
                disabled={!canStart}
                className="px-6 py-2.5 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              >
                BẮT ĐẦU ĐUA (2-5 NGƯỜI) →
              </button>
            )}

            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2.5 border border-black text-xs font-mono font-bold uppercase hover:bg-neutral-100 transition"
            >
              RỜI PHÒNG
            </button>
          </div>
        </div>

        {/* 10-Second Ready Countdown Banner */}
        {readyCountdown !== null && (
          <div className="border-2 border-black bg-neutral-900 text-white p-3 px-4 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-rose-600 text-white font-black text-[10px]">ĐẾM NGƯỢC</span>
              <span>
                THỜI GIAN LỰA CHỌN THUẬT TOÁN & SẴN SÀNG: <strong className="text-yellow-300 text-sm">{readyCountdown} GIÂY</strong>
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">
              (Hết 10s hệ thống sẽ tự động gán thuật toán còn trống và khóa sẵn sàng)
            </span>
          </div>
        )}

        {/* Exclusive Algorithm Selection Section - No Duplicates Allowed */}
        <div className="border border-black bg-neutral-50 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
            <span className="text-xs font-mono font-bold text-black uppercase">
              CHỌN THUẬT TOÁN (MỖI ĐẤU THỦ PHẢI CHỌN 1 THUẬT TOÁN KHÁC NHAU):
            </span>
            <button
              type="button"
              onClick={() => setIsCustomCodeModalOpen(true)}
              className="px-3 py-1 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition"
            >
              ✎ VIẾT THUẬT TOÁN RIÊNG (MONACO CODE)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {AVAILABLE_ALGORITHMS.map((a) => {
              const isTaken = takenAlgos.has(a.id);
              const isSelected = selectedAlgo === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={isTaken}
                  onClick={() => {
                    if (isTaken) return;
                    setSelectedAlgo(a.id);
                    if (isReady) {
                      signalRService.setReady(currentRoom.maPhong, user.nguoiChoiId, true, a.id);
                    }
                  }}
                  className={`p-3 border text-left text-xs font-mono transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-black bg-black text-white shadow-xs font-bold'
                      : isTaken
                      ? 'border-neutral-200 bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'border-neutral-300 bg-white text-black hover:border-black'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 w-full">
                    <div className="font-bold leading-tight">{a.name}</div>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingAlgo(a);
                      }}
                      className={`w-4 h-4 rounded-none border text-[10px] font-mono font-bold flex items-center justify-center shrink-0 transition cursor-pointer ${
                        isSelected
                          ? 'border-neutral-500 bg-neutral-800 text-white hover:bg-white hover:text-black'
                          : 'border-neutral-400 hover:border-black hover:bg-black hover:text-white text-black'
                      }`}
                      title="Xem chi tiết nguyên lý thuật toán"
                    >
                      ?
                    </span>
                  </div>
                  <div className="text-[10px] mt-2 opacity-80">
                    {isSelected
                      ? '✓ Đang chọn'
                      : isTaken
                      ? '✕ Đã có người chọn'
                      : 'Khả dụng'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2 to 5 Player Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {slots.map((player, idx) => {
            if (player) {
              const isMe = player.nguoiChoiId === user.nguoiChoiId;
              return (
                <div
                  key={player.nguoiChoiId}
                  className={`border-2 p-4 bg-white flex flex-col justify-between min-h-[190px] transition-all ${
                    isMe ? 'border-black shadow-md ring-1 ring-black' : 'border-neutral-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 text-[10px] font-mono">
                      <span className="text-neutral-400">VỊ TRÍ #{idx + 1}</span>
                      {player.isHost && (
                        <span className="bg-black text-white px-1 font-bold">CHỦ PHÒNG</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 mt-3">
                      <div
                        className="w-4 h-4 border border-black shrink-0"
                        style={{ backgroundColor: player.mauSac }}
                      />
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm font-sans truncate text-black">
                          {player.tenHienThi} {isMe && '(Bạn)'}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500">
                          {player.thuatToan}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <div
                      className={`text-center py-1.5 text-xs font-mono font-bold uppercase border ${
                        player.isReady
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-neutral-300 bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {player.isReady ? '✓ SẴN SÀNG' : 'CHỜ...'}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`empty-${idx}`}
                className="border-2 border-dashed border-neutral-300 p-4 bg-neutral-50/50 flex flex-col items-center justify-center min-h-[190px] text-center"
              >
                <div className="text-neutral-400 text-xs font-mono uppercase tracking-wider mb-1">
                  VỊ TRÍ #{idx + 1}
                </div>
                <div className="text-[11px] font-mono text-neutral-400">ĐANG CHỜ NGƯỜI CHƠI...</div>
              </div>
            );
          })}
        </div>

        {/* Custom Code Modal */}
        {isCustomCodeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-white border-2 border-black p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <h3 className="font-black text-sm uppercase">VIẾT THUẬT TOÁN TÙY BIẾN CHO PHÒNG ĐẤU</h3>
                <button
                  type="button"
                  onClick={() => setIsCustomCodeModalOpen(false)}
                  className="px-2 py-1 border border-black font-mono text-xs hover:bg-black hover:text-white transition"
                >
                  ✕ ĐÓNG
                </button>
              </div>

              <p className="text-xs font-mono text-neutral-600">
                Nhập mã nguồn quyết định bước đi của robot. Thuật toán này sẽ đại diện cho bạn trong phòng thi đấu:
              </p>

              <textarea
                rows={10}
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-black bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-black"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomCodeModalOpen(false)}
                  className="px-4 py-2 border border-black text-xs font-mono font-bold uppercase"
                >
                  HỦY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAlgo('custom');
                    if (isReady && currentRoom) {
                      signalRService.setReady(currentRoom.maPhong, user.nguoiChoiId, true, 'custom');
                    }
                    setIsCustomCodeModalOpen(false);
                  }}
                  className="px-5 py-2 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800"
                >
                  ÁP DỤNG THUẬT TOÁN NÀY →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Main Lobby (Create / Join Rooms)
  return (
    <div className="space-y-6 font-sans">
      <div className="border border-black bg-white p-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 mb-1">
            ĐẤU ONLINE 2 - 5 NGƯỜI THỜI GIAN THỰC · MICROSOFT SQL SERVER
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold uppercase text-black">
            Phòng Đấu Trực Tuyến
          </h2>
          <p className="text-sm text-neutral-600 font-serif italic mt-1">
            Thiết lập phòng đấu từ 2 đến 5 người, chọn kích thước mê cung và so tài thuật toán trực tiếp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs font-mono">
            <div className="text-neutral-500">ĐANG ĐĂNG NHẬP:</div>
            <div className="font-bold text-black flex items-center gap-1.5 justify-end">
              <span className="w-2.5 h-2.5 border border-black" style={{ backgroundColor: user.mauSac }} />
              {user.tenHienThi} (Cấp {user.capDo})
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Create Room Form */}
        <div className="md:col-span-6 border-2 border-black bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-black pb-2">
            <span className="w-2.5 h-2.5 bg-black" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">TẠO PHÒNG ĐẤU MỚI</h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-1">Mã Phòng (Tùy Chọn)</label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="VD: ARENA01 (để trống sẽ tạo ngẫu nhiên)"
                className="w-full px-3 py-2 border border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-1">
                Số Lượng Đấu Thủ Tối Đa (2 đến 5 Người)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setMaxPlayersInput(count)}
                    className={`py-2 text-center border border-black font-bold uppercase transition ${
                      maxPlayersInput === count
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                  >
                    {count} Người
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-1">Kích Thước Mê Cung</label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 21, 31].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setMazeSizeInput(size)}
                    className={`py-2 text-center border border-black font-bold uppercase transition ${
                      mazeSizeInput === size
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block uppercase font-bold text-neutral-600 mb-1">Vị Trí Đích</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGoalPosInput('CENTER')}
                  className={`py-2 text-center border border-black font-bold uppercase transition ${
                    goalPosInput === 'CENTER'
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                >
                  Ở Giữa (Center)
                </button>
                <button
                  type="button"
                  onClick={() => setGoalPosInput('CORNER')}
                  className={`py-2 text-center border border-black font-bold uppercase transition ${
                    goalPosInput === 'CORNER'
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                >
                  Góc Đối Diện
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreateRoom}
                className="w-full py-3 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition tracking-wider"
              >
                + TẠO PHÒNG VÀ VÀO SẢNH →
              </button>
            </div>
          </div>
        </div>

        {/* Right: Join Room & Room List */}
        <div className="md:col-span-6 space-y-4">
          <div className="border-2 border-black bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 border-b border-black pb-2">
              <span className="w-2.5 h-2.5 bg-black" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider">VÀO PHÒNG CÓ SẴN</h3>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="NHẬP MÃ PHÒNG (VD: ARENA01)"
                className="flex-1 px-3 py-2 border border-black font-mono text-xs uppercase focus:outline-none"
              />
              <button
                onClick={() => handleJoinRoom(roomCodeInput)}
                className="px-5 py-2 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition"
              >
                VÀO PHÒNG →
              </button>
            </div>
          </div>

          {/* List of open rooms */}
          <div className="border border-black bg-white p-4">
            <div className="flex items-center justify-between border-b border-black pb-2 mb-3">
              <h4 className="font-extrabold text-xs uppercase tracking-widest text-black">
                DANH SÁCH PHÒNG ĐANG CHỜ ({availableRooms.length})
              </h4>
              <button
                onClick={fetchRooms}
                className="text-[10px] font-mono text-neutral-500 hover:text-black uppercase"
              >
                [LÀM MỚI]
              </button>
            </div>

            {availableRooms.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs font-mono">
                Hiện chưa có phòng nào đang mở. Hãy tạo một phòng mới ở bên trái!
              </div>
            ) : (
              <div className="space-y-2">
                {availableRooms.map((r: SignalRRoom) => (
                  <div
                    key={r.maPhong}
                    className="flex items-center justify-between p-3 border border-neutral-200 hover:border-black transition"
                  >
                    <div>
                      <div className="font-mono font-bold text-sm text-black">{r.maPhong}</div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        Lưới {r.kichThuocMeCung}x{r.kichThuocMeCung} · {r.nguoiChois.length}/{r.soLuongNguoiChoiMax} người
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinRoom(r.maPhong)}
                      className="px-4 py-1.5 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition"
                    >
                      THAM GIA →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Algorithm Info Modal */}
      <AlgorithmInfoModal algorithm={inspectingAlgo} onClose={() => setInspectingAlgo(null)} />
    </div>
  );
};
