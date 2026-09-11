import React, { useState } from 'react';
import { useSimulationStore, AlgorithmDefinition } from '../../stores/simulationStore';
import { AlgorithmInfoModal } from './AlgorithmInfoModal';

interface MatchControlsProps {
  onStepTick: () => void;
  onReset: () => void;
  onGenerateNewMaze: () => void;
  onOpenAddAlgo: () => void;
}

export const MatchControls: React.FC<MatchControlsProps> = ({
  onStepTick,
  onReset,
  onGenerateNewMaze,
  onOpenAddAlgo,
}) => {
  const {
    status,
    playbackSpeed,
    currentTick,
    mazeCols,
    mazeRows,
    goalPosition,
    smoothCorners,
    algorithmsList,
    activeAlgorithms,
    setStatus,
    setPlaybackSpeed,
    setMazeDimensions,
    setGoalPosition,
    setSmoothCorners,
    toggleAlgorithm,
    removeAlgorithm,
  } = useSimulationStore();

  const [showAlgoPicker, setShowAlgoPicker] = useState(false);
  const [inspectingAlgo, setInspectingAlgo] = useState<AlgorithmDefinition | null>(null);

  const togglePlay = () => {
    setStatus(status === 'running' ? 'paused' : 'running');
  };

  const speeds = [0.5, 1, 2, 4];
  const mazePresets = [
    { label: '29×17 RỘNG', cols: 29, rows: 17 },
    { label: '35×21 LỚN', cols: 35, rows: 21 },
    { label: '23×13 GỌN', cols: 23, rows: 13 },
    { label: '21×21 VUÔNG', cols: 21, rows: 21 },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* Primary Action Row - Sharp Square Minimalist Styling */}
      <div className="border border-black bg-white p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className={`px-5 py-2 font-mono font-bold uppercase tracking-wider transition-colors duration-150 border border-black ${
              status === 'running'
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            {status === 'running' ? 'TẠM DỪNG ||' : 'BẮT ĐẦU ĐUA ▶'}
          </button>

          <button
            onClick={onStepTick}
            disabled={status === 'running'}
            title="Đi tiếp 1 bước"
            className="px-3 py-2 font-mono font-bold border border-black bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            TIẾP 1 BƯỚC →
          </button>

          <button
            onClick={onReset}
            title="Khôi phục vị trí ban đầu"
            className="px-3 py-2 font-mono font-bold border border-black bg-white hover:bg-neutral-100"
          >
            ĐẶT LẠI
          </button>

          <button
            onClick={onGenerateNewMaze}
            className="px-3 py-2 font-mono font-bold border border-black bg-white hover:bg-neutral-100"
          >
            TẠO MÊ CUNG MỚI
          </button>

          {/* Prominent Add Algorithm Button */}
          <button
            onClick={onOpenAddAlgo}
            className="px-3.5 py-2 font-mono font-bold border-2 border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white transition tracking-wide"
          >
            + THÊM THUẬT TOÁN
          </button>
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono">
          {/* Maze Grid Size / Preset */}
          <div className="flex items-center border border-black">
            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 border-r border-black font-semibold text-[11px]">
              KÍCH THƯỚC:
            </span>
            {mazePresets.map((preset) => {
              const isSelected = mazeCols === preset.cols && mazeRows === preset.rows;
              return (
                <button
                  key={preset.label}
                  onClick={() => setMazeDimensions(preset.cols, preset.rows)}
                  className={`px-2 py-1 text-xs transition-colors ${
                    isSelected
                      ? 'bg-black text-white font-bold'
                      : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Goal Position Selector */}
          <div className="flex flex-wrap items-center border border-black">
            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 border-r border-black font-semibold text-[11px]">
              ĐÍCH ĐẾN:
            </span>
            <button
              onClick={() => setGoalPosition('center')}
              className={`px-2 py-1 text-xs transition-colors ${
                goalPosition === 'center'
                  ? 'bg-black text-white font-bold'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              Ở GIỮA
            </button>
            <button
              onClick={() => setGoalPosition('bottom-right')}
              className={`px-2 py-1 text-xs transition-colors border-l border-black ${
                goalPosition === 'bottom-right' || goalPosition === 'corner'
                  ? 'bg-black text-white font-bold'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              GÓC DƯỚI
            </button>
            <button
              onClick={() => setGoalPosition('top-right')}
              className={`px-2 py-1 text-xs transition-colors border-l border-black ${
                goalPosition === 'top-right'
                  ? 'bg-black text-white font-bold'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              GÓC TRÊN
            </button>
            <button
              onClick={() => setGoalPosition('bottom-left')}
              className={`px-2 py-1 text-xs transition-colors border-l border-black ${
                goalPosition === 'bottom-left'
                  ? 'bg-black text-white font-bold'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              GÓC TRÁI
            </button>
            <button
              onClick={() => setGoalPosition('random')}
              className={`px-2 py-1 text-xs transition-colors border-l border-black ${
                goalPosition === 'random'
                  ? 'bg-black text-white font-bold'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
              title="Vị trí đích ngẫu nhiên bất kỳ trên mê cung"
            >
              NGẪU NHIÊN ⚄
            </button>
          </div>

          {/* Smooth Corners Toggle */}
          <button
            onClick={() => setSmoothCorners(!smoothCorners)}
            className={`px-2.5 py-1 border border-black text-xs font-semibold ${
              smoothCorners ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            LÀM MƯỢT GÓC: {smoothCorners ? 'BẬT' : 'TẮT'}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center border border-black">
            <span className="px-2 py-1 bg-neutral-100 text-neutral-600 border-r border-black font-semibold text-[11px]">
              TỐC ĐỘ:
            </span>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-1 text-xs transition-colors ${
                  playbackSpeed === s
                    ? 'bg-black text-white font-bold'
                    : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Algorithm Roster Toggle */}
          <button
            onClick={() => setShowAlgoPicker(!showAlgoPicker)}
            className={`px-3 py-1 border border-black text-xs font-semibold ${
              showAlgoPicker ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            THUẬT TOÁN ĐUA ({activeAlgorithms.length})
          </button>

          {/* Step Counter */}
          <div className="border border-black px-3 py-1 bg-neutral-50 text-xs font-bold">
            BƯỚC: <span className="text-black">{currentTick}</span>
          </div>
        </div>
      </div>

      {/* Algorithm Selection Row - Minimalist, Sharp */}
      {showAlgoPicker && (
        <div className="border border-black bg-white p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
          {algorithmsList.map((algo) => {
            const isSelected = activeAlgorithms.includes(algo.id);
            return (
              <div
                key={algo.id}
                onClick={() => toggleAlgorithm(algo.id)}
                className={`p-2.5 border flex items-start justify-between gap-2 cursor-pointer transition ${
                  isSelected
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 bg-white opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 mt-0.5 border border-black shrink-0"
                    style={{ backgroundColor: algo.color }}
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-black font-sans">{algo.name}</span>
                      {algo.isCustom && (
                        <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 text-[9px] border border-rose-300 font-mono font-bold uppercase">
                          Cá nhân
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setInspectingAlgo(algo);
                        }}
                        className="w-4 h-4 rounded-none border border-neutral-400 hover:border-black hover:bg-black hover:text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 transition"
                        title="Xem chi tiết nguyên lý thuật toán"
                      >
                        ?
                      </button>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-sans leading-tight mt-0.5">
                      {algo.shortDesc}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  {algo.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm(`Bạn có chắc muốn xóa thuật toán "${algo.name}"?`)) {
                          removeAlgorithm(algo.id);
                        }
                      }}
                      className="w-4 h-4 border border-rose-300 hover:border-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-mono font-bold flex items-center justify-center transition text-rose-600"
                      title="Xóa thuật toán cá nhân này"
                    >
                      ✕
                    </button>
                  )}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleAlgorithm(algo.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-none border-black text-black focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Algorithm Info Modal */}
      <AlgorithmInfoModal
        algorithm={inspectingAlgo}
        onClose={() => setInspectingAlgo(null)}
        onDelete={removeAlgorithm}
      />
    </div>
  );
};
