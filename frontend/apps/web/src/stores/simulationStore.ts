import { create } from 'zustand';
import { MazeSimulationTick, MazeRobotState, GridPosition } from '@robot-arena/shared-types';

export interface AlgorithmDefinition {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc?: string;
  category?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  pros?: string[];
  cons?: string[];
  color: string;
  code?: string;
  isCustom?: boolean;
}

export const DEFAULT_ALGORITHMS: AlgorithmDefinition[] = [
  {
    id: 'turn_astar',
    name: 'A* Mượt (Tối ưu góc rẽ)',
    shortDesc: 'Phạt góc 90°, ưu tiên đoạn thẳng dài để chuột chạy tốc độ cao',
    category: 'Heuristic Tối Ưu Vật Lý',
    timeComplexity: 'O(b^d)',
    spaceComplexity: 'O(b^d)',
    color: '#000000',
    fullDesc:
      'Biến thể A* chuyên sâu cho đua robot thực tế: mỗi lần bẻ lái 90° gây giảm tốc và tiêu hao động lượng. Thuật toán bổ sung hệ số phạt góc cua vào hàm chi phí g(n), ưu tiên duy trì quán tính đường thẳng dài để tối đa hóa tốc độ trung bình.',
    pros: ['Đường chạy cực mượt, ít phải phanh gấp', 'Tốc độ về đích thực tế cao nhất', 'Duy trì động lượng tốt'],
    cons: ['Đôi khi chấp nhận đi xa hơn 1-2 ô để đổi lấy đường thẳng'],
  },
  {
    id: 'standard_astar',
    name: 'A* Tiêu chuẩn (Manhattan)',
    shortDesc: 'Cân bằng số bước đã đi và khoảng cách Manhattan tới đích',
    category: 'Heuristic Kinh Điển',
    timeComplexity: 'O(E)',
    spaceComplexity: 'O(V)',
    color: '#2563eb',
    fullDesc:
      'Thuật toán đồ thị kinh điển nhất khoa học máy tính. Cân bằng hoàn hảo giữa chi phí bước đã đi g(n) và khoảng cách ước lượng Manhattan h(n) = |x1-x2| + |y1-y2| đến ô đích, đảm bảo tìm được đường đi ít ô nhất.',
    pros: ['Đảm bảo số bước đi ít nhất tuyệt đối', 'Tốc độ tìm đường rất nhanh', 'Thuật toán tiêu chuẩn vàng'],
    cons: ['Thường xuyên tạo ra các góc cua zíc-zắc 90° liên tục'],
  },
  {
    id: 'floodfill',
    name: 'Micromouse Flood Fill',
    shortDesc: 'Lan tỏa ma trận thế năng dội từ Đích chuẩn IEEE quốc tế',
    category: 'Quy Hoạch Động Thời Gian Thực',
    timeComplexity: 'O(V · K)',
    spaceComplexity: 'O(N²)',
    color: '#7c3aed',
    fullDesc:
      'Tiêu chuẩn vàng trong giải đấu Robot Micromouse toàn cầu (All Japan Micromouse). Robot ban đầu giả định mê cung không tường, tính ma trận độ dốc thế năng dội từ Đích. Khi gặp tường chắn, thế năng cục bộ dâng cao đẩy robot tự động quay đầu 180° trôi ra ngoài.',
    pros: ['Cực kỳ thông minh và bền bỉ trong mê cung chưa biết trước', 'Tự động thoát ngõ cụt mượt mà', 'Chuẩn thi đấu thực tế'],
    cons: ['Cần tính toán cập nhật lại ma trận thế năng khi gặp tường mới'],
  },
  {
    id: 'dijkstra',
    name: 'Thuật toán Dijkstra',
    shortDesc: 'Quét sóng tròn đồng nhất đẳng hướng, không dùng hàm heuristic',
    category: 'Đồ Thị Đồng Nhất (Uniform-Cost)',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    color: '#0d9488',
    fullDesc:
      'Thuật toán nền tảng của định tuyến mạng Internet (OSPF). Dijkstra hoàn toàn "mù" về vị trí của Đích, thăm dò đều khắp mọi nhánh theo nguyên tắc chi phí đường đi tích lũy nhỏ nhất trước. Tìm đường ngắn nhất tuyệt đối trên mọi đồ thị.',
    pros: ['Tuyệt đối chính xác và tối ưu 100%', 'Không bao giờ bị đánh lừa bởi bẫy heuristic', 'Độ tin cậy toán học tối cao'],
    cons: ['Thăm dò nhiều ô thừa ở hướng ngược lại với đích', 'Tốc độ tìm thấy đích chậm hơn A*'],
  },
  {
    id: 'greedy_bfs',
    name: 'Tham Lam (Greedy Best-First)',
    shortDesc: 'Lao thẳng về đích chỉ dựa trên khoảng cách Manhattan',
    category: 'Heuristic Tham Lam',
    timeComplexity: 'O(b^m)',
    spaceComplexity: 'O(b^m)',
    color: '#ea580c',
    fullDesc:
      'Thuật toán có tư duy cực đoan: luôn luôn chọn ô kế tiếp có khoảng cách hình học gần đích nhất, bỏ qua hoàn toàn số bước đã đi. Robot bị hút mạnh mẽ về phía đích như nam châm.',
    pros: ['Lao về đích cực kỳ thần tốc trong mê cung thưa', 'Phản hồi bước đi chớp nhoáng', 'Lối chơi mạo hiểm hấp dẫn'],
    cons: ['Rất dễ bị lừa sập bẫy ngõ cụt hình chữ U hoặc tường bao quanh đích'],
  },
  {
    id: 'dfs',
    name: 'Dò Nhánh Sâu (Trémaux DFS)',
    shortDesc: 'Đâm sâu vào tận cùng ngõ cụt, quay lui vật lý từng bước',
    category: 'Duyệt Nhánh Sâu & Quay Lui',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    color: '#d97706',
    fullDesc:
      'Dựa trên nguyên lý giải mê cung kinh điển của Charles Pierre Trémaux (thế kỷ 19). Robot chọn một nhánh và tiến sâu đến cùng. Khi đụng tường cụt, nó quay đầu lùi bước (backtrack) chính xác theo vết chân cũ về ngã ba để khám phá lối rẽ khác.',
    pros: ['Chiếm ít bộ nhớ nhất', 'Tạo ra các pha quay lui vật lý kịch tính', 'Tách đàn khám phá nhánh độc lập ngay từ vạch xuất phát'],
    cons: ['Có thể đi lạc qua nhiều ngõ cụt trước khi tình cờ chạm đích'],
  },
  {
    id: 'wall_follower',
    name: 'Bám Tường (Tay Phải)',
    shortDesc: 'Quy tắc phản xạ: luôn áp sát mép tường bên tay phải',
    category: 'Phản Xạ Quy Tắc Tường',
    timeComplexity: 'O(V)',
    spaceComplexity: 'O(1)',
    color: '#dc2626',
    fullDesc:
      'Chiến lược sinh tồn phản xạ kinh điển nhất: robot luôn giữ tay phải chạm vào tường. Thứ tự ưu tiên phản xạ: Rẽ Phải → Đi Thẳng → Rẽ Trái → Quay đầu 180°. Không cần biết bản đồ hay vị trí của đích.',
    pros: ['Không cần CPU xử lý hay tính toán phức tạp', 'Hoạt động bền bỉ chỉ với cảm biến chạm cơ học', 'Chắc chắn thoát mê cung liên thông đơn'],
    cons: ['Quãng đường chạy rất dài', 'Bị vòng lặp nếu đích nằm trên đảo tường cô lập giữa mê cung'],
  },
  {
    id: 'wall_left',
    name: 'Bám Tường (Tay Trái)',
    shortDesc: 'Phiên bản đối xứng: luôn áp sát mép tường bên tay trái',
    category: 'Phản Xạ Quy Tắc Tường',
    timeComplexity: 'O(V)',
    spaceComplexity: 'O(1)',
    color: '#e11d48',
    fullDesc:
      'Phiên bản đối xứng gương của thuật toán bám tường phải. Chuột ưu tiên: Rẽ Trái → Đi Thẳng → Rẽ Phải → Quay đầu. Trong các mê cung bất đối xứng, chuột tay trái sẽ chạy theo lộ trình hoàn toàn đối lập với chuột tay phải.',
    pros: ['Tạo đối trọng cạnh tranh ngoạn mục với chuột bám tường phải', 'Dễ hiểu, đơn giản, phản xạ tức thì'],
    cons: ['Đường đi dài hơn các thuật toán có trí nhớ bản đồ'],
  },
];

interface MazeRaceStoreState {
  currentTick: number;
  status: 'running' | 'paused' | 'stopped';
  playbackSpeed: number; // 0.5, 1, 2, 4
  tickData: MazeSimulationTick | null;
  selectedRobotId: string | null;
  mazeSize: number; // 15, 21, 31
  goalPosition: 'center' | 'bottom-right' | 'top-right' | 'bottom-left' | 'random' | 'corner';
  braidFactor: number;
  smoothCorners: boolean;
  fogOfWar: boolean; // Chế độ sương mù: che phủ vùng mê cung chưa được khám phá
  
  algorithmsList: AlgorithmDefinition[];
  activeAlgorithms: string[]; // IDs of bots currently in the race

  // Actions
  setTickData: (tick: MazeSimulationTick) => void;
  setStatus: (status: 'running' | 'paused' | 'stopped') => void;
  setPlaybackSpeed: (speed: number) => void;
  setSelectedRobotId: (id: string | null) => void;
  setMazeSize: (size: number) => void;
  setGoalPosition: (pos: 'center' | 'bottom-right' | 'top-right' | 'bottom-left' | 'random' | 'corner') => void;
  setBraidFactor: (factor: number) => void;
  setSmoothCorners: (smooth: boolean) => void;
  setFogOfWar: (fog: boolean) => void;
  toggleAlgorithm: (id: string) => void;
  addCustomAlgorithm: (algo: AlgorithmDefinition) => void;
  removeAlgorithm: (id: string) => void;
  resetRace: () => void;
}

const CUSTOM_ALGOS_KEY = 'robotarena_custom_algorithms';

const loadSavedCustomAlgorithms = (): AlgorithmDefinition[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_ALGOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((algo) => ({ ...algo, isCustom: true }));
      }
    }
  } catch (e) {
    console.error('Lỗi khi đọc thuật toán từ localStorage', e);
  }
  return [];
};

const saveCustomAlgorithms = (algos: AlgorithmDefinition[]) => {
  try {
    const customOnly = algos.filter((a) => a.isCustom);
    localStorage.setItem(CUSTOM_ALGOS_KEY, JSON.stringify(customOnly));
  } catch (e) {
    console.error('Lỗi khi lưu thuật toán vào localStorage', e);
  }
};

const initialCustomAlgos = loadSavedCustomAlgorithms();

export const useSimulationStore = create<MazeRaceStoreState>((set) => ({
  currentTick: 0,
  status: 'paused',
  playbackSpeed: 1, // Standard controlled speed
  tickData: null,
  selectedRobotId: 'turn_astar',
  mazeSize: 21,
  goalPosition: 'center', // Đích ở giữa theo chuẩn Micromouse
  braidFactor: 0.3, // 30% vòng lặp và đường nhánh phong phú
  smoothCorners: true,
  fogOfWar: false,

  algorithmsList: [...initialCustomAlgos, ...DEFAULT_ALGORITHMS],
  activeAlgorithms: ['turn_astar', 'standard_astar', 'floodfill'],

  setTickData: (tick) =>
    set({
      currentTick: tick.tick,
      tickData: tick,
    }),

  setStatus: (status) => set({ status }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setSelectedRobotId: (selectedRobotId) => set({ selectedRobotId }),
  setMazeSize: (mazeSize) => set({ mazeSize }),
  setGoalPosition: (goalPosition) => set({ goalPosition }),
  setBraidFactor: (braidFactor) => set({ braidFactor }),
  setSmoothCorners: (smoothCorners) => set({ smoothCorners }),
  setFogOfWar: (fogOfWar) => set({ fogOfWar }),

  toggleAlgorithm: (id) =>
    set((state) => {
      const exists = state.activeAlgorithms.includes(id);
      if (exists && state.activeAlgorithms.length <= 1) return state;
      return {
        activeAlgorithms: exists
          ? state.activeAlgorithms.filter((a) => a !== id)
          : [...state.activeAlgorithms, id],
      };
    }),

  addCustomAlgorithm: (newAlgo) =>
    set((state) => {
      const cleanNewAlgo: AlgorithmDefinition = { ...newAlgo, isCustom: true };
      const updatedList = [cleanNewAlgo, ...state.algorithmsList.filter((a) => a.id !== cleanNewAlgo.id)];
      saveCustomAlgorithms(updatedList);
      return {
        algorithmsList: updatedList,
        activeAlgorithms: Array.from(new Set([cleanNewAlgo.id, ...state.activeAlgorithms])),
        selectedRobotId: cleanNewAlgo.id,
      };
    }),

  removeAlgorithm: (id) =>
    set((state) => {
      const target = state.algorithmsList.find((a) => a.id === id);
      if (!target || !target.isCustom) return state; // Không xóa thuật toán hệ thống cốt lõi

      const updatedList = state.algorithmsList.filter((a) => a.id !== id);
      saveCustomAlgorithms(updatedList);

      const updatedActive = state.activeAlgorithms.filter((a) => a !== id);
      const safeActive = updatedActive.length > 0 ? updatedActive : [DEFAULT_ALGORITHMS[0].id];
      const newSelected = state.selectedRobotId === id ? safeActive[0] : state.selectedRobotId;

      return {
        algorithmsList: updatedList,
        activeAlgorithms: safeActive,
        selectedRobotId: newSelected,
      };
    }),

  resetRace: () =>
    set({
      currentTick: 0,
      status: 'paused',
    }),
}));

const EMPTY_PATH: GridPosition[] = [];

export const selectSelectedMazeRobot = (state: MazeRaceStoreState): MazeRobotState | undefined => {
  if (!state.tickData || !state.selectedRobotId) return undefined;
  return state.tickData.robots.find((r) => r.id === state.selectedRobotId);
};

export const selectOptimalPath = (state: MazeRaceStoreState): GridPosition[] => {
  return state.tickData?.optimalShortestPath ?? EMPTY_PATH;
};
