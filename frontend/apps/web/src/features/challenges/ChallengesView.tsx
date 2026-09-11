import React from 'react';
import { Challenge } from '@robot-arena/simulation-types';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../stores/editorStore';
import { useSimulationStore } from '../../stores/simulationStore';

const MAZE_CHALLENGES: Challenge[] = [
  {
    id: 'ch-maze-1',
    title: 'Mê cung Uốn lượn (15×15)',
    description: 'Giải mê cung chuẩn 15×15 với một đường đi khả dĩ duy nhất. Tối ưu số bước và vượt qua thuật toán Loang theo chiều rộng (BFS).',
    difficulty: 'beginner',
    category: 'navigation',
    opponentRobotIds: ['bfs', 'wall_follower'],
    objectives: [
      { id: 'o1', description: 'Về đích dưới 120 bước', requiredMetric: 'steps', targetValue: 120, completed: true },
      { id: 'o2', description: 'Tỷ lệ tối ưu đạt 100% đường ngắn nhất', requiredMetric: 'optimality', targetValue: 100, completed: false },
    ],
    starterCode: '// Thuật toán A*',
    maxTicks: 250,
    rewardPoints: 300,
  },
  {
    id: 'ch-maze-2',
    title: 'Hành lang Tốc độ Cao (21×21)',
    description: 'Mê cung 21×21 với nhiều nhánh rẽ đan xen. Giảm thiểu các khúc cua vuông 90° để chuột giữ tốc độ thẳng tối đa.',
    difficulty: 'intermediate',
    category: 'targeting',
    opponentRobotIds: ['turn_astar', 'floodfill'],
    objectives: [
      { id: 'o3', description: 'Tổng số lần bẻ cua ít hơn 20 lần', requiredMetric: 'turns', targetValue: 20, completed: false },
      { id: 'o4', description: 'Duyệt ít hơn 30% diện tích ô toàn mê cung', requiredMetric: 'explorationPercent', targetValue: 30, completed: false },
    ],
    starterCode: '// Heuristic search',
    maxTicks: 400,
    rewardPoints: 600,
  },
  {
    id: 'ch-maze-3',
    title: 'Giải Đấu Lớn Micromouse (31×31)',
    description: 'Mê cung tiêu chuẩn các giải thi đấu quốc tế. Cạnh tranh trực tiếp với tất cả các thuật toán mẫu trên quy mô 31×31.',
    difficulty: 'master',
    category: 'efficiency',
    opponentRobotIds: ['turn_astar', 'standard_astar', 'bfs', 'floodfill'],
    objectives: [
      { id: 'o5', description: 'Đoạt vị trí Quán quân (#1)', requiredMetric: 'rank', targetValue: 1, completed: false },
      { id: 'o6', description: 'Về đích với độ mượt tối ưu cao nhất', requiredMetric: 'smoothness', targetValue: 90, completed: false },
    ],
    starterCode: '// Grand prix solver',
    maxTicks: 600,
    rewardPoints: 1500,
  },
];

export const ChallengesView: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedTemplate } = useEditorStore();
  const { setMazeSize } = useSimulationStore();

  const handleStartChallenge = (ch: Challenge) => {
    if (ch.id === 'ch-maze-1') setMazeSize(15);
    else if (ch.id === 'ch-maze-2') setMazeSize(21);
    else setMazeSize(31);

    setSelectedTemplate('turn_astar');
    navigate('/');
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-black pb-4">
        <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1">
          THỬ THÁCH · NHIỆM VỤ THUẬT TOÁN
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-black font-sans uppercase">
          Thử Thách Tìm Đường
        </h2>
        <p className="text-sm text-neutral-600 font-serif italic mt-1">
          Các bài toán mê cung được thiết kế để rèn luyện và kiểm nghiệm độ tối ưu của thuật toán.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MAZE_CHALLENGES.map((ch) => (
          <div
            key={ch.id}
            className="flex flex-col justify-between border-2 border-black bg-white p-5 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-3 font-mono text-xs">
                <span className="font-bold uppercase tracking-wider text-black bg-neutral-100 px-2 py-0.5 border border-neutral-300">
                  {ch.difficulty === 'beginner' ? 'CƠ BẢN' : ch.difficulty === 'intermediate' ? 'TRUNG CẤP' : 'CAO CẤP'}
                </span>
                <span className="font-bold text-rose-600">
                  +{ch.rewardPoints} ĐIỂM
                </span>
              </div>

              <h3 className="font-bold text-base text-black mb-2 uppercase">{ch.title}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">{ch.description}</p>

              <div className="space-y-2 border-t border-neutral-200 pt-3 mb-6 font-mono text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  MỤC TIÊU CẦN ĐẠT
                </span>
                {ch.objectives.map((obj) => (
                  <div key={obj.id} className="flex items-start gap-2 text-neutral-800">
                    <span className="font-bold text-black">{obj.completed ? '[✓]' : '[ ]'}</span>
                    <span>{obj.description}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleStartChallenge(ch)}
              className="w-full py-2.5 px-3 text-xs font-mono font-bold tracking-wider uppercase border border-black bg-white hover:bg-black hover:text-white transition-colors"
            >
              CHẤP NHẬN THỬ THÁCH →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
