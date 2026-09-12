import React, { useState } from 'react';
import { Board, BOARD_SIZE, Move, Player, WinLine } from '../engine/caroTypes';

interface CaroBoardProps {
  board: Board;
  onCellClick: (row: number, col: number) => void;
  disabled: boolean;
  currentPlayer: Player;
  lastMove: Move | null;
  winLine: WinLine | null;
  hintMove: [number, number] | null;
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

export const CaroBoard: React.FC<CaroBoardProps> = ({
  board,
  onCellClick,
  disabled,
  currentPlayer,
  lastMove,
  winLine,
  hintMove,
}) => {
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);

  const isWinCell = (r: number, c: number) => {
    if (!winLine) return false;
    return winLine.cells.some(([wr, wc]) => wr === r && wc === c);
  };

  const isLastMove = (r: number, c: number) => {
    return lastMove?.row === r && lastMove?.col === c;
  };

  const isHint = (r: number, c: number) => {
    return hintMove?.[0] === r && hintMove?.[1] === c;
  };

  return (
    <div className="inline-block p-4 sm:p-6 bg-white border-2 border-black select-none">
      {/* Top Column Labels */}
      <div className="flex pl-6 sm:pl-7 mb-1.5 text-[10px] sm:text-xs font-mono font-bold text-neutral-500">
        {COL_LABELS.map((col) => (
          <div key={col} className="w-6 h-4 sm:w-8 sm:h-5 flex items-center justify-center">
            {col}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Left Row Labels */}
        <div className="flex flex-col pr-1.5 sm:pr-2.5 text-[10px] sm:text-xs font-mono font-bold text-neutral-500">
          {Array.from({ length: BOARD_SIZE }, (_, i) => (
            <div key={i} className="w-5 h-6 sm:w-6 sm:h-8 flex items-center justify-end">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Board Grid */}
        <div
          className="relative grid border-t border-l border-black bg-[#faf8f5]"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          }}
          onMouseLeave={() => setHoveredCell(null)}
        >
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const winning = isWinCell(rIdx, cIdx);
              const last = isLastMove(rIdx, cIdx);
              const hinted = isHint(rIdx, cIdx);
              const isHovered =
                hoveredCell?.[0] === rIdx && hoveredCell?.[1] === cIdx && !cell && !disabled;

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  type="button"
                  onClick={() => onCellClick(rIdx, cIdx)}
                  onMouseEnter={() => setHoveredCell([rIdx, cIdx])}
                  disabled={disabled || cell !== null}
                  className={`relative w-6 h-6 sm:w-8 sm:h-8 border-b border-r border-neutral-300 flex items-center justify-center transition-colors focus:outline-none ${
                    winning
                      ? 'bg-amber-100 font-extrabold'
                      : hinted
                      ? 'bg-neutral-200'
                      : 'hover:bg-neutral-100'
                  }`}
                  title={`[${COL_LABELS[cIdx]}${rIdx + 1}]`}
                >
                  {/* Grid Lines intersection marker for key star points (Tian Yuan, etc.) */}
                  {(rIdx === 3 || rIdx === 7 || rIdx === 11) &&
                    (cIdx === 3 || cIdx === 7 || cIdx === 11) &&
                    !cell && (
                      <div className="absolute w-1.5 h-1.5 bg-neutral-400 pointer-events-none" />
                    )}

                  {/* Clean Stone Piece */}
                  {cell && (
                    <div
                      className={`relative z-10 w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs sm:text-sm ${
                        cell === 'X'
                          ? 'bg-black text-white'
                          : 'bg-white border-2 border-black text-black'
                      } ${
                        winning
                          ? 'ring-2 ring-amber-500 font-black'
                          : last
                          ? 'ring-2 ring-neutral-400'
                          : ''
                      }`}
                    >
                      {cell}
                      {/* Last move indicator dot */}
                      {last && (
                        <div
                          className={`absolute w-1.5 h-1.5 ${
                            cell === 'X' ? 'bg-amber-400' : 'bg-black'
                          }`}
                        />
                      )}
                    </div>
                  )}

                  {/* Hover Ghost Stone */}
                  {isHovered && (
                    <div
                      className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-mono text-xs sm:text-sm opacity-30 ${
                        currentPlayer === 'X'
                          ? 'bg-black text-white'
                          : 'bg-white border-2 border-black text-black'
                      }`}
                    >
                      {currentPlayer}
                    </div>
                  )}

                  {/* Hint indicator */}
                  {hinted && !cell && (
                    <div className="absolute inset-1 border border-black bg-neutral-200/60 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-black">•</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
