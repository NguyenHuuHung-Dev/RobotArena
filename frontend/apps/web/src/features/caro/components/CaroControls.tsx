import React from 'react';
import { AIDifficulty, GameMode, Player } from '../engine/caroTypes';

interface CaroControlsProps {
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  aiDifficulty: AIDifficulty;
  onDifficultyChange: (diff: AIDifficulty) => void;
  playerRole: Player;
  onPlayerRoleChange: (role: Player) => void;
  onReset: () => void;
  onUndo: () => void;
  onHint: () => void;
  canUndo: boolean;
  isThinking: boolean;
  winner: Player | null;
  isDraw: boolean;
  currentPlayer: Player;
}

export const CaroControls: React.FC<CaroControlsProps> = ({
  gameMode,
  onGameModeChange,
  aiDifficulty,
  onDifficultyChange,
  playerRole,
  onPlayerRoleChange,
  onReset,
  onUndo,
  onHint,
  canUndo,
  isThinking,
  winner,
  isDraw,
  currentPlayer,
}) => {
  return (
    <div className="border border-black bg-white p-5 space-y-5 text-neutral-900">
      {/* Game Status Banner */}
      <div className="p-3.5 bg-neutral-50 border border-neutral-300 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
            TRẠNG THÁI BÀN CỜ
          </div>
          <div className="font-bold text-sm font-sans mt-1 flex items-center gap-2">
            {winner ? (
              <span className="text-black flex items-center gap-1.5 uppercase font-mono">
                <span>NGƯỜI CHƠI</span>
                <span className="font-bold underline">{winner}</span>
                <span>CHIẾN THẮNG!</span>
              </span>
            ) : isDraw ? (
              <span className="text-neutral-700 font-mono uppercase">HÒA CỜ</span>
            ) : isThinking ? (
              <span className="text-neutral-900 flex items-center gap-2 font-mono text-xs">
                <span className="inline-block w-2 h-2 bg-black animate-pulse" />
                AI ĐANG TÍNH NƯỚC ĐI...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-neutral-600">LƯỢT:</span>
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 text-xs font-mono font-bold ${
                    currentPlayer === 'X'
                      ? 'bg-black text-white'
                      : 'bg-white border border-black text-black'
                  }`}
                >
                  {currentPlayer}
                </span>
                <span className="text-xs text-neutral-500 font-normal">
                  {gameMode === 'pve' && currentPlayer === playerRole
                    ? '(Bạn)'
                    : gameMode === 'pve'
                    ? '(AI)'
                    : ''}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold uppercase text-neutral-600">
          Chế độ thi đấu:
        </label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 border border-neutral-300 text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => onGameModeChange('pve')}
            className={`py-2 px-3 transition-colors ${
              gameMode === 'pve'
                ? 'bg-black text-white font-bold'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            ĐẤU VỚI AI
          </button>
          <button
            type="button"
            onClick={() => onGameModeChange('pvp')}
            className={`py-2 px-3 transition-colors ${
              gameMode === 'pvp'
                ? 'bg-black text-white font-bold'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            2 NGƯỜI (PVP)
          </button>
        </div>
      </div>

      {/* AI Difficulty Selector (When in PvE) */}
      {gameMode === 'pve' && (
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase text-neutral-600">
            Cấp độ AI:
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 border border-neutral-300 text-xs font-mono font-bold">
            {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => onDifficultyChange(diff)}
                className={`py-2 transition-colors uppercase ${
                  aiDifficulty === diff
                    ? 'bg-black text-white font-bold'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {diff === 'easy' ? 'Dễ' : diff === 'medium' ? 'Trung bình' : 'Cao thủ'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Side selection (When in PvE) */}
      {gameMode === 'pve' && (
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase text-neutral-600">
            Chọn quân cờ (X đi trước):
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => onPlayerRoleChange('X')}
              className={`py-2 px-3 border transition-colors ${
                playerRole === 'X'
                  ? 'border-black bg-black text-white font-bold'
                  : 'border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              QUÂN X (ĐI TRƯỚC)
            </button>
            <button
              type="button"
              onClick={() => onPlayerRoleChange('O')}
              className={`py-2 px-3 border transition-colors ${
                playerRole === 'O'
                  ? 'border-black bg-black text-white font-bold'
                  : 'border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700'
              }`}
            >
              QUÂN O (ĐI SAU)
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-3 border-t border-neutral-200 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo || isThinking}
            className="py-2.5 px-3 border border-black bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold uppercase transition"
          >
            ĐI LẠI (UNDO)
          </button>
          <button
            type="button"
            onClick={onHint}
            disabled={isThinking || !!winner || isDraw}
            className="py-2.5 px-3 border border-black bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold uppercase transition"
          >
            GỢI Ý NƯỚC ĐI
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-mono font-bold uppercase tracking-wider transition"
        >
          VÁN MỚI
        </button>
      </div>
    </div>
  );
};
