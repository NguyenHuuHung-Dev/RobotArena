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
    name: 'A* Quán Tính (Khám phá mù)',
    shortDesc: 'Không biết trước đích, giữ đà đi thẳng và tự quay lui khi gặp ngõ cụt',
    category: 'Khám Phá Quán Tính & Quay Lui',
    timeComplexity: 'O(V)',
    spaceComplexity: 'O(V)',
    color: '#000000',
    fullDesc:
      'Thuật toán khám phá mù theo quán tính: Chuột hoàn toàn không biết trước vị trí của Đích. Chuột ưu tiên duy trì đà chạy thẳng trên các hành lang dài để tối đa hóa vận tốc, lưu vết các ngã ba và tự động quay lui vật lý (backtrack) 180° khi đụng ngõ cụt cho tới khi tình cờ phát hiện đích!',
    pros: ['Đường chạy cực mượt, không quay đầu vô cớ', 'Thực sự thám hiểm mê cung một cách chân thực', 'Tự động thoát ngõ cụt 100%'],
    cons: ['Cần lưu vết các ngã ba để quay lui'],
  },
  {
    id: 'standard_astar',
    name: 'Khám Phá Biên (Frontier A*)',
    shortDesc: 'Mở rộng ranh giới ô chưa biết, quay lui theo vết chân cũ',
    category: 'Khám Phá Biên (Frontier SLAM)',
    timeComplexity: 'O(V)',
    spaceComplexity: 'O(V)',
    color: '#2563eb',
    fullDesc:
      'Chuột hoàn toàn không biết tọa độ đích. Chuột liên tục mở rộng ranh giới các ô đã đi qua bằng cách tiến vào các ô chưa từng đặt chân đến. Khi vào đường cùng, chuột lùi từng bước theo vết chân cũ về ngã rẽ gần nhất.',
    pros: ['Khám phá bao phủ diện tích đồng đều', 'Đơn giản và trực quan', 'Không bao giờ bị lặp vòng vo'],
    cons: ['Thường xuyên đổi hướng rẽ zíc-zắc'],
  },
  {
    id: 'floodfill',
    name: 'Frontier Flood Fill',
    shortDesc: 'Dội thế năng hút về các vùng đất mới chưa thám hiểm',
    category: 'Quy Hoạch Thế Năng Hút Biên',
    timeComplexity: 'O(V · K)',
    spaceComplexity: 'O(N²)',
    color: '#7c3aed',
    fullDesc:
      'Mô hình thế năng chuẩn giai đoạn thám hiểm (Search Phase): Chuột không biết trước đích. Thế năng dâng cao tại các ô đã đi qua nhiều lần và giảm thấp nhất tại các ô chưa khám phá, tạo lực hút tự nhiên kéo chuột vào các ngách mới và đẩy trôi ra khỏi ngõ cụt.',
    pros: ['Tự động thoát khỏi ngõ cụt mượt mà', 'Cơ chế vật lý thế năng tự nhiên', 'Chuẩn robot Micromouse quốc tế'],
    cons: ['Cần đếm số lần ghé thăm các ô'],
  },
  {
    id: 'dijkstra',
    name: 'Frontier Dijkstra SLAM',
    shortDesc: 'Tìm đường ngắn nhất tới ô biên chưa khám phá gần nhất',
    category: 'Đồ Thị Bản Đồ (SLAM)',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    color: '#0d9488',
    fullDesc:
      'Mô phỏng thuật toán SLAM của robot tự hành thực tế: Chuột không biết vị trí đích. Tại mỗi ngõ cụt, chuột tính toán đường đi ngắn nhất qua các hành lang đã biết để tới ô biên chưa khám phá gần nhất trên toàn bản đồ.',
    pros: ['Tuyệt đối khoa học và tối ưu', 'Không bỏ sót bất kỳ nhánh nào', 'Chuẩn robot tự hành chuyên nghiệp'],
    cons: ['Tính toán đường đi tới biên mỗi khi đụng cụt'],
  },
  {
    id: 'greedy_bfs',
    name: 'Tham Lam Khám Phá',
    shortDesc: 'Lao vào các ngã rẽ mới nhất phát hiện được',
    category: 'Khám Phá Tham Lam',
    timeComplexity: 'O(V)',
    spaceComplexity: 'O(V)',
    color: '#ea580c',
    fullDesc:
      'Chuột có tính cách mạo hiểm: không cần biết đích ở đâu, luôn ưu tiên lao thẳng vào các nhánh rẽ tạo góc ngoặt mới nhất vừa nhìn thấy để quét diện tích nhanh nhất có thể.',
    pros: ['Khám phá các ngách sâu rất nhanh', 'Lối di chuyển biến ảo kịch tính'],
    cons: ['Dễ đi lạc sâu vào các nhánh cụt dài'],
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
  activeAlgorithms: ['turn_astar', 'floodfill', 'dfs'],

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
