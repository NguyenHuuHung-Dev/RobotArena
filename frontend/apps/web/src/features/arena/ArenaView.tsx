import React, { useEffect, useRef, useState } from 'react';
import { SimulationCanvas } from './SimulationCanvas';
import { MatchControls } from '../match/MatchControls';
import { MatchScoreboard } from '../match/MatchScoreboard';
import { AddAlgorithmModal } from '../editor/AddAlgorithmModal';
import { useSimulationStore } from '../../stores/simulationStore';
import { MazeSimulationEngine } from '../../services/mazeSimulation';
import { manhattanDistance } from '@robot-arena/robot-sdk';

export const ArenaView: React.FC = () => {
  const {
    status,
    playbackSpeed,
    tickData,
    selectedRobotId,
    mazeSize,
    goalPosition,
    braidFactor,
    smoothCorners,
    fogOfWar,
    activeAlgorithms,
    algorithmsList,
    setTickData,
    setSelectedRobotId,
    setFogOfWar,
    resetRace,
  } = useSimulationStore();

  const selectedRobot =
    tickData && selectedRobotId
      ? tickData.robots.find((r) => r.id === selectedRobotId)
      : undefined;
  const optimalPath = tickData?.optimalShortestPath ?? [];

  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isAddAlgoOpen, setIsAddAlgoOpen] = useState(false);

  const engineRef = useRef<MazeSimulationEngine | null>(null);

  // Initialize or re-create simulation engine
  const initEngine = () => {
    engineRef.current = new MazeSimulationEngine({
      rows: mazeSize,
      cols: mazeSize,
      goalPosition,
      braidFactor,
      activeAlgorithms,
      algorithmsList,
      smoothCorners,
    });
    setTickData(engineRef.current.getCurrentTick(smoothCorners));
  };

  useEffect(() => {
    initEngine();
  }, [mazeSize, goalPosition, braidFactor, activeAlgorithms, algorithmsList]);

  // Discrete Step Simulation Timer: Controls how often a logical step happens
  useEffect(() => {
    if (status !== 'running') return;

    // Readable pace:
    // 0.5x: 520ms, 1x: 260ms, 2x: 130ms, 4x: 65ms
    const baseInterval = 260;
    const stepInterval = Math.max(40, Math.floor(baseInterval / playbackSpeed));

    const timer = setInterval(() => {
      if (engineRef.current) {
        const next = engineRef.current.nextTick(smoothCorners);
        setTickData(next);

        const allFinished = next.robots.every((r) => r.hasReachedGoal);
        if (allFinished) {
          useSimulationStore.getState().setStatus('paused');
        }
      }
    }, stepInterval);

    return () => clearInterval(timer);
  }, [status, playbackSpeed, smoothCorners, setTickData]);

  const handleStepTick = () => {
    if (engineRef.current) {
      const next = engineRef.current.nextTick(smoothCorners);
      setTickData(next);
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset({
        rows: mazeSize,
        cols: mazeSize,
        goalPosition,
        braidFactor,
        activeAlgorithms,
        algorithmsList,
        smoothCorners,
      }, false);
      setTickData(engineRef.current.getCurrentTick(smoothCorners));
    }
    resetRace();
  };

  const distToGoal =
    selectedRobot && tickData
      ? manhattanDistance(selectedRobot.position, tickData.maze.goal)
      : null;

  return (
    <div className="space-y-4">
      {/* Editorial Hero Banner - Inspired by OmniMail Reference Photo */}
      <div className="border border-black bg-white p-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[11px] font-mono tracking-widest uppercase text-neutral-500">
            <span>MÔ PHỎNG THI ĐẤU</span>
            <span>·</span>
            <span>TÌM ĐƯỜNG TỐI ƯU</span>
            <span>·</span>
            <span>GIẢM THIỂU GÓC CUA</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black font-sans">
            Đấu trường Mê cung.
            <span className="block text-neutral-400 font-serif italic font-normal">Một đường đi ngắn nhất.</span>
          </h1>
        </div>

        <button
          onClick={() => setIsAddAlgoOpen(true)}
          className="px-6 py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold tracking-wider uppercase transition shadow-xs"
        >
          + THÊM THUẬT TOÁN TỰ VIẾT →
        </button>
      </div>

      {/* Primary Action Controls */}
      <MatchControls
        onStepTick={handleStepTick}
        onReset={handleReset}
        onGenerateNewMaze={initEngine}
        onOpenAddAlgo={() => setIsAddAlgoOpen(true)}
      />

      {/* Main Grid: Maze Visualizer + Scoreboard/Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Maze Canvas Frame */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center p-4 bg-white border border-black">
          <SimulationCanvas
            tickData={tickData}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
            showExploredHeatmap={showHeatmap}
            smoothCorners={smoothCorners}
            fogOfWar={fogOfWar}
            width={720}
            height={720}
          />

          {/* Minimalist Visual Toggles */}
          <div className="flex flex-wrap items-center justify-between w-full max-w-[720px] mt-3 pt-3 border-t border-neutral-200 text-xs font-mono gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-700 hover:text-black">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded-none border-black text-black focus:ring-0"
                />
                <span>VÙNG ĐÃ DUYỆT (HEATMAP)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-700 hover:text-black">
                <input
                  type="checkbox"
                  checked={fogOfWar}
                  onChange={(e) => setFogOfWar(e.target.checked)}
                  className="rounded-none border-black text-black focus:ring-0"
                />
                <span>SƯƠNG MÙ KHÁM PHÁ (FOG OF WAR)</span>
              </label>
            </div>

            <div className="text-neutral-500">
              LÀM MƯỢT GÓC CUA: <strong className="text-black">{smoothCorners ? 'BẬT' : 'TẮT'}</strong>
            </div>
          </div>
        </div>

        {/* Right: Tournament Scoreboard & Telemetry */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Scoreboard */}
          <div className="flex-1 min-h-[380px]">
            <MatchScoreboard
              robots={tickData?.robots || []}
              selectedRobotId={selectedRobotId}
              onSelectRobot={setSelectedRobotId}
              optimalPath={optimalPath}
            />
          </div>

          {/* Algorithmic Telemetry Inspector */}
          <div className="border border-black bg-white p-4 font-sans">
            <div className="flex items-center justify-between border-b border-black pb-2 mb-3">
              <h4 className="font-extrabold text-xs uppercase tracking-widest text-black">
                THÔNG SỐ CHI TIẾT ROBOT
              </h4>
              <span className="text-[10px] font-mono text-neutral-500">TRỰC TIẾP</span>
            </div>

            {selectedRobot ? (
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                  <span className="text-neutral-500 uppercase">ĐANG THEO DÕI:</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 border border-black"
                      style={{ backgroundColor: selectedRobot.color }}
                    />
                    <span className="font-bold text-black font-sans">{selectedRobot.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] text-neutral-500 uppercase">TỌA ĐỘ LƯỚI</div>
                    <div className="text-black font-bold">
                      HÀNG {selectedRobot.position.row}, CỘT {selectedRobot.position.col}
                    </div>
                  </div>

                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] text-neutral-500 uppercase">HƯỚNG NHÌN</div>
                    <div className="text-black font-bold">{selectedRobot.direction}</div>
                  </div>

                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] text-neutral-500 uppercase">CÁCH ĐÍCH (MANHATTAN)</div>
                    <div className="text-black font-bold">{distToGoal} Ô</div>
                  </div>

                  <div className="p-2 border border-neutral-200 bg-neutral-50">
                    <div className="text-[9px] text-neutral-500 uppercase">TRẠNG THÁI</div>
                    <div
                      className={
                        selectedRobot.hasReachedGoal ? 'text-green-700 font-bold' : 'text-neutral-700 font-bold'
                      }
                    >
                      {selectedRobot.hasReachedGoal ? 'ĐÃ VỀ ĐÍCH' : 'ĐANG TÌM KIẾM'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-neutral-400 text-xs font-mono">
                Nhấp chuột vào một robot trên bảng điểm để xem thông số chi tiết.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Algorithm Modal */}
      <AddAlgorithmModal isOpen={isAddAlgoOpen} onClose={() => setIsAddAlgoOpen(false)} />
    </div>
  );
};
