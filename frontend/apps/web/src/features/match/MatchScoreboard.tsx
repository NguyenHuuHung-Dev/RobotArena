import React from 'react';
import { MazeRobotState, GridPosition } from '@robot-arena/shared-types';

interface MatchScoreboardProps {
  robots: MazeRobotState[];
  selectedRobotId: string | null;
  onSelectRobot: (id: string) => void;
  optimalPath: GridPosition[];
}

export const MatchScoreboard: React.FC<MatchScoreboardProps> = ({
  robots,
  selectedRobotId,
  onSelectRobot,
  optimalPath,
}) => {
  const optimalLength = optimalPath.length > 0 ? optimalPath.length - 1 : 0;

  // Sắp xếp:
  // 1. Đã về đích trước
  // 2. Ít bước hơn + ít góc cua hơn
  const sortedRobots = [...robots].sort((a, b) => {
    if (a.hasReachedGoal && !b.hasReachedGoal) return -1;
    if (!a.hasReachedGoal && b.hasReachedGoal) return 1;
    if (a.hasReachedGoal && b.hasReachedGoal) {
      const scoreA = a.stepsCount + a.turnsCount * 0.5;
      const scoreB = b.stepsCount + b.turnsCount * 0.5;
      return scoreA - scoreB;
    }
    return b.exploredCells.length - a.exploredCells.length;
  });

  return (
    <div className="border border-black bg-white p-4 flex flex-col h-full font-sans">
      <div className="flex items-center justify-between border-b border-black pb-2.5 mb-3">
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-black">
          BẢNG XẾP HẠNG THI ĐẤU
        </h3>
        <div className="text-[11px] font-mono font-bold bg-neutral-100 border border-black px-2 py-0.5">
          ĐƯỜNG TỐI ƯU: {optimalLength} Ô
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1">
        {sortedRobots.map((robot, index) => {
          const isSelected = robot.id === selectedRobotId;
          const isWinner = robot.hasReachedGoal && index === 0;
          const optimality =
            robot.hasReachedGoal && robot.stepsCount > 0 && optimalLength > 0
              ? Math.min(100, Math.round((optimalLength / robot.stepsCount) * 100))
              : null;

          return (
            <div
              key={robot.id}
              onClick={() => onSelectRobot(robot.id)}
              className={`p-3 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-black bg-neutral-50 shadow-xs'
                  : 'border-neutral-300 hover:border-black bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-500 w-6">
                    #{index + 1}
                  </span>
                  <div
                    className="w-3 h-3 border border-black shrink-0"
                    style={{ backgroundColor: robot.color }}
                  />
                  <span className="font-bold text-xs text-black truncate max-w-[150px]">
                    {robot.name}
                  </span>
                </div>

                <div>
                  {robot.hasReachedGoal ? (
                    <span className="text-[10px] font-mono font-bold text-green-700 bg-green-50 border border-green-600 px-1.5 py-0.5 uppercase">
                      {isWinner ? 'VỀ ĐÍCH [HẠNG 1]' : 'ĐÃ VỀ ĐÍCH'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5">
                      ĐANG TÌM ĐƯỜNG...
                    </span>
                  )}
                </div>
              </div>

              {/* Số liệu thống kê */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono pt-2 border-t border-neutral-200">
                <div className="bg-neutral-50 border border-neutral-200 p-1.5 text-center">
                  <div className="text-[9px] text-neutral-500 uppercase">SỐ BƯỚC</div>
                  <div className="font-bold text-black">{robot.stepsCount}</div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 p-1.5 text-center">
                  <div className="text-[9px] text-neutral-500 uppercase">GÓC RẼ</div>
                  <div className="font-bold text-neutral-900">{robot.turnsCount}</div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 p-1.5 text-center">
                  <div className="text-[9px] text-neutral-500 uppercase">TỐI ƯU</div>
                  <div
                    className={`font-bold ${
                      optimality === 100
                        ? 'text-green-700'
                        : optimality && optimality > 75
                        ? 'text-amber-700'
                        : 'text-neutral-700'
                    }`}
                  >
                    {optimality !== null ? `${optimality}%` : '—'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
