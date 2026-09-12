import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CaroBoard } from './components/CaroBoard';
import { CaroControls } from './components/CaroControls';
import { CaroHistory } from './components/CaroHistory';
import {
  AIDifficulty,
  Board,
  BOARD_SIZE,
  GameMode,
  Move,
  Player,
  WinLine,
} from './engine/caroTypes';
import { checkWin } from './engine/caroHeuristics';
import { getBestMove } from './engine/caroAI';
import { CaroWorkerRequest, CaroWorkerResponse } from './engine/caroWorker';

const createEmptyBoard = (): Board =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

const STATS_KEY = 'robot_arena_caro_stats';

export const CaroView: React.FC = () => {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [history, setHistory] = useState<Move[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winLine, setWinLine] = useState<WinLine | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [playerRole, setPlayerRole] = useState<Player>('X');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [hintMove, setHintMove] = useState<[number, number] | null>(null);

  const [stats, setStats] = useState<{ wins: number; losses: number; draws: number }>(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { wins: 0, losses: 0, draws: 0 };
  });

  const saveStats = (newStats: { wins: number; losses: number; draws: number }) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch {
      // ignore
    }
  };

  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('X');
    setHistory([]);
    setWinner(null);
    setWinLine(null);
    setIsDraw(false);
    setIsThinking(false);
    setHintMove(null);
  }, []);

  // Thực hiện nước đi của một người chơi
  const makeMove = useCallback(
    (row: number, col: number, player: Player) => {
      if (board[row][col] !== null || winner || isDraw) return false;

      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = player;
      setBoard(newBoard);

      const newMove: Move = { row, col, player, timestamp: Date.now() };
      const newHistory = [...history, newMove];
      setHistory(newHistory);
      setHintMove(null);

      // Kiểm tra thắng thua
      const win = checkWin(newBoard, row, col);
      if (win) {
        setWinner(win.winner);
        setWinLine(win);

        if (gameMode === 'pve') {
          if (win.winner === playerRole) {
            saveStats({ ...stats, wins: stats.wins + 1 });
          } else {
            saveStats({ ...stats, losses: stats.losses + 1 });
          }
        }
        return true;
      }

      // Kiểm tra hòa cờ
      if (newHistory.length === BOARD_SIZE * BOARD_SIZE) {
        setIsDraw(true);
        if (gameMode === 'pve') {
          saveStats({ ...stats, draws: stats.draws + 1 });
        }
        return true;
      }

      const nextPlayer: Player = player === 'X' ? 'O' : 'X';
      setCurrentPlayer(nextPlayer);
      return true;
    },
    [board, winner, isDraw, history, gameMode, playerRole, stats]
  );

  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef<number>(0);

  // Khởi tạo Web Worker chạy ngầm riêng biệt
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('./engine/caroWorker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
    } catch (err) {
      console.warn('Web Worker không khả dụng, sử dụng fallback', err);
    }

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  // Xử lý khi AI đánh (tính toán ngầm trong Web Worker - không làm giật lag giao diện)
  useEffect(() => {
    if (
      gameMode === 'pve' &&
      currentPlayer !== playerRole &&
      !winner &&
      !isDraw
    ) {
      setIsThinking(true);
      const reqId = ++reqIdRef.current;

      const worker = workerRef.current;
      if (worker) {
        worker.onmessage = (e: MessageEvent<CaroWorkerResponse>) => {
          if (e.data.id === reqId) {
            makeMove(e.data.row, e.data.col, currentPlayer);
            setIsThinking(false);
          }
        };

        const payload: CaroWorkerRequest = {
          id: reqId,
          board,
          aiPlayer: currentPlayer,
          difficulty: aiDifficulty,
        };
        worker.postMessage(payload);
      } else {
        // Fallback tức thì nếu trình duyệt không hỗ trợ module worker
        const timer = setTimeout(() => {
          const [aiRow, aiCol] = getBestMove(board, currentPlayer, aiDifficulty);
          makeMove(aiRow, aiCol, currentPlayer);
          setIsThinking(false);
        }, 10);
        return () => clearTimeout(timer);
      }
    }
  }, [gameMode, currentPlayer, playerRole, winner, isDraw, board, aiDifficulty, makeMove]);

  // Click vào ô trên bàn cờ
  const handleCellClick = (row: number, col: number) => {
    if (isThinking || winner || isDraw) return;
    if (gameMode === 'pve' && currentPlayer !== playerRole) return;

    makeMove(row, col, currentPlayer);
  };

  // Nút Đi Lại (Undo)
  const handleUndo = () => {
    if (history.length === 0 || isThinking) return;

    // Trong chế độ PvE thì lùi 2 nước (của AI và người chơi), trừ khi AI chưa đi
    const stepsToUndo = gameMode === 'pve' && history.length >= 2 ? 2 : 1;
    const remainingHistory = history.slice(0, history.length - stepsToUndo);

    const newBoard = createEmptyBoard();
    for (const mv of remainingHistory) {
      newBoard[mv.row][mv.col] = mv.player;
    }

    setBoard(newBoard);
    setHistory(remainingHistory);
    setWinner(null);
    setWinLine(null);
    setIsDraw(false);
    setHintMove(null);

    if (remainingHistory.length === 0) {
      setCurrentPlayer('X');
    } else {
      const last = remainingHistory[remainingHistory.length - 1];
      setCurrentPlayer(last.player === 'X' ? 'O' : 'X');
    }
  };

  // Nút Gợi Ý Nước Đi (Hint)
  const handleHint = () => {
    if (isThinking || winner || isDraw) return;
    const best = getBestMove(board, currentPlayer, 'hard');
    setHintMove(best);
  };

  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="space-y-8 font-sans text-black">
      {/* Header Banner */}
      <div className="border border-black bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider">
              GOMOKU ARENA
            </span>
            <span className="text-xs font-mono text-neutral-500 uppercase">
              BÀN CỜ 15x15 · LUẬT 5 QUÂN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black">
            Cờ Caro
          </h1>
          <p className="text-sm text-neutral-600 font-sans max-w-2xl leading-relaxed">
            Đấu trí cờ caro trên bàn cờ tiêu chuẩn 15x15. So tài cùng thuật toán bot AI hoặc chơi đối kháng hai người.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 border border-neutral-300 bg-neutral-50 font-bold uppercase text-neutral-700">
            15x15
          </span>
          <span className="text-xs font-mono px-3 py-1.5 bg-black text-white font-bold uppercase">
            5 Quân Thắng
          </span>
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center Column: Interactive Board */}
        <div className="lg:col-span-8 flex justify-center overflow-x-auto pb-4">
          <CaroBoard
            board={board}
            onCellClick={handleCellClick}
            disabled={isThinking || !!winner || isDraw || (gameMode === 'pve' && currentPlayer !== playerRole)}
            currentPlayer={currentPlayer}
            lastMove={lastMove}
            winLine={winLine}
            hintMove={hintMove}
          />
        </div>

        {/* Right Column: Controls & History */}
        <div className="lg:col-span-4 space-y-6">
          <CaroControls
            gameMode={gameMode}
            onGameModeChange={(m) => {
              setGameMode(m);
              handleReset();
            }}
            aiDifficulty={aiDifficulty}
            onDifficultyChange={setAiDifficulty}
            playerRole={playerRole}
            onPlayerRoleChange={(r) => {
              setPlayerRole(r);
              handleReset();
            }}
            onReset={handleReset}
            onUndo={handleUndo}
            onHint={handleHint}
            canUndo={history.length > 0}
            isThinking={isThinking}
            winner={winner}
            isDraw={isDraw}
            currentPlayer={currentPlayer}
          />

          <CaroHistory history={history} stats={stats} />
        </div>
      </div>
    </div>
  );
};
