import React from 'react';
import { Move } from '../engine/caroTypes';

interface CaroHistoryProps {
  history: Move[];
  stats: {
    wins: number;
    losses: number;
    draws: number;
  };
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

export const CaroHistory: React.FC<CaroHistoryProps> = ({ history, stats }) => {
  return (
    <div className="border border-black bg-white p-5 space-y-4 text-neutral-900">
      {/* Match Records */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
          THỐNG KÊ THÀNH TÍCH
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
          <div className="border border-neutral-300 p-2.5 bg-neutral-50">
            <div className="text-xl font-mono font-bold text-black">{stats.wins}</div>
            <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">THẮNG</div>
          </div>
          <div className="border border-neutral-300 p-2.5 bg-neutral-50">
            <div className="text-xl font-mono font-bold text-black">{stats.draws}</div>
            <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">HÒA</div>
          </div>
          <div className="border border-neutral-300 p-2.5 bg-neutral-50">
            <div className="text-xl font-mono font-bold text-black">{stats.losses}</div>
            <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">THUA</div>
          </div>
        </div>
      </div>

      {/* Move History Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-neutral-600">
          <span>Lịch sử nước đi:</span>
          <span className="text-neutral-700 bg-neutral-100 border border-neutral-300 px-2 py-0.5 text-[10px] font-bold">
            {history.length} NƯỚC
          </span>
        </div>

        <div className="border border-neutral-300 p-3 max-h-56 overflow-y-auto bg-neutral-50 text-xs font-mono">
          {history.length === 0 ? (
            <div className="text-neutral-400 text-center py-6 font-sans">Chưa có nước đi nào</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {history.map((mv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1 border-b border-neutral-200"
                >
                  <span className="text-neutral-400 font-mono">#{idx + 1}</span>
                  <span
                    className={`font-mono font-bold px-1.5 text-[10px] ${
                      mv.player === 'X'
                        ? 'bg-black text-white'
                        : 'bg-white border border-black text-black'
                    }`}
                  >
                    {mv.player}
                  </span>
                  <span className="font-mono font-bold text-black">
                    {COL_LABELS[mv.col]}
                    {mv.row + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
