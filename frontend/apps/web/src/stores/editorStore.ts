import { create } from 'zustand';

export const MAZE_ALGORITHM_TEMPLATES: Record<string, { name: string; code: string }> = {
  turn_astar: {
    name: 'Turn-Optimized Inertial Explorer (A* Quán tính khám phá mù)',
    code: `import { defineMazeSolver } from '@robot-arena/robot-sdk';

/**
 * ==============================================================================
 * THUẬT TOÁN: A* QUÁN TÍNH KHÁM PHÁ MÙ (ZERO-KNOWLEDGE MOMENTUM EXPLORER)
 * ==============================================================================
 * ⚠️ LUẬT THI ĐẤU (KHÁM PHÁ MÙ):
 * Robot HOÀN TOÀN KHÔNG BIẾT VỊ TRÍ ĐÍCH trước!
 * Bạn chỉ nhận được cảm biến tại ô hiện tại (sensor.position, sensor.direction,
 * sensor.adjacentWalls, sensor.availableNeighbors).
 * Robot phải tự mình thám hiểm mê cung, gặp ngõ cụt thì tự quay đầu rút lui!
 *
 * 🎯 CHIẾN THUẬT:
 * - Ưu tiên giữ quán tính đi THẲNG để duy trì vận tốc tối đa trên các hành lang dài.
 * - Tại các ngã ba, chọn các nhánh chưa từng đặt chân đến (unvisited).
 * - Lưu ngã ba vào ngăn xếp (branchStack) để quay lui vật lý (backtrack) khi gặp ngõ cụt.
 * ==============================================================================
 */
export default defineMazeSolver({
  name: 'Khám Phá Quán Tính',
  author: 'NguyenHuuHung',
  color: '#000000',
  description: 'Không biết trước đích, giữ đà đi thẳng và tự quay lui khi gặp ngõ cụt',
}, {
  visited: null,
  branchStack: [],

  init(config) {
    console.log(\`Bước vào mê cung kích thước: \${config.mazeDimensions.rows}x\${config.mazeDimensions.cols}\`);
    this.visited = new Set();
    this.branchStack = [];
  },

  onStep(sensor) {
    const { position, direction, availableNeighbors } = sensor;
    const currentKey = \`\${position.row},\${position.col}\`;
    this.visited.add(currentKey);

    // 1. Lọc ra các ô lân cận chưa từng đi qua
    const unvisited = availableNeighbors.filter(
      (n) => !this.visited.has(\`\${n.row},\${n.col}\`)
    );

    if (unvisited.length > 0) {
      // Lưu lại ngã ba để quay lui nếu sau này gặp ngõ cụt
      if (unvisited.length > 1) {
        this.branchStack.push({ ...position });
      }

      // 2. KHÁM PHÁ QUÁN TÍNH: Ưu tiên tiếp tục đi THẲNG theo hướng nhìn hiện tại
      let straightRow = position.row;
      let straightCol = position.col;
      if (direction === 'NORTH') straightRow -= 1;
      else if (direction === 'SOUTH') straightRow += 1;
      else if (direction === 'EAST') straightCol += 1;
      else if (direction === 'WEST') straightCol -= 1;

      const straightMove = unvisited.find(
        (n) => n.row === straightRow && n.col === straightCol
      );
      if (straightMove) {
        return straightMove; // Giữ đà thẳng mượt mà
      }

      // Nếu không đi thẳng được -> Rẽ vào nhánh chưa khám phá đầu tiên
      return unvisited[0];
    }

    // 3. ĐỤNG NGÕ CỤT: Quay lui vật lý (Backtrack) về ngã ba gần nhất
    if (this.branchStack.length > 0) {
      const backtrackTarget = this.branchStack[this.branchStack.length - 1];
      const hasBranchLeft = availableNeighbors.some(n => !this.visited.has(\`\${n.row},\${n.col}\`));
      if (!hasBranchLeft) {
        this.branchStack.pop();
      }
      return backtrackTarget;
    }

    // Mặc định chọn ô có sẵn để rút lui
    return availableNeighbors[0] || position;
  }
});
`,
  },
  astar: {
    name: 'Frontier Exploration (Khám phá biên mù)',
    code: `import { defineMazeSolver } from '@robot-arena/robot-sdk';

/**
 * ==============================================================================
 * THUẬT TOÁN: KHÁM PHÁ BIÊN MÙ (FRONTIER EXPLORATION)
 * ==============================================================================
 * 💡 NGUYÊN LÝ:
 * Chuột hoàn toàn không biết đích ở đâu. Chuột lập bản đồ các ô đã đi qua
 * và liên tục mở rộng ranh giới (Frontier) bằng cách ghé thăm các ô mới lạ.
 * Khi rơi vào ngõ cụt, chuột lùi từng bước về lối rẽ chưa khám phá gần nhất.
 * ==============================================================================
 */
export default defineMazeSolver({
  name: 'Frontier Explorer',
  author: 'NguyenHuuHung',
  color: '#2563eb',
}, {
  visited: null,
  trail: [],

  init(config) {
    this.visited = new Set();
    this.trail = [];
  },

  onStep(sensor) {
    const { position, availableNeighbors } = sensor;
    const key = \`\${position.row},\${position.col}\`;
    this.visited.add(key);

    // Lọc các ô chưa khám phá
    const freshMoves = availableNeighbors.filter(
      (n) => !this.visited.has(\`\${n.row},\${n.col}\`)
    );

    if (freshMoves.length > 0) {
      this.trail.push({ ...position });
      return freshMoves[0];
    }

    // Nếu vào đường cùng -> Quay lui theo vết chân cũ
    if (this.trail.length > 0) {
      return this.trail.pop();
    }

    return availableNeighbors[0] || position;
  }
});
`,
  },
  floodfill: {
    name: 'Frontier Flood Fill (Thế năng hút ô chưa khám phá)',
    code: `import { defineMazeSolver } from '@robot-arena/robot-sdk';

/**
 * ==============================================================================
 * THUẬT TOÁN: FRONTIER FLOOD FILL (THẾ NĂNG DẬY SÓNG)
 * ==============================================================================
 * 💡 NGUYÊN LÝ:
 * Chuột không biết trước tọa độ đích.
 * Thay vào đó, chuột đo thế năng dựa trên số lần đặt chân:
 * - Ô chưa từng đi qua có thế năng thấp nhất (bị hút mạnh mẽ).
 * - Ô đã đi nhiều lần có thế năng dâng cao (tự động đẩy chuột ra xa khỏi ngõ cụt).
 * ==============================================================================
 */
export default defineMazeSolver({
  name: 'Thế Năng Hút Biên',
  author: 'NguyenHuuHung',
  color: '#7c3aed',
}, {
  visitCounts: null,

  init(config) {
    this.visitCounts = new Map();
  },

  onStep(sensor) {
    const { position, availableNeighbors } = sensor;
    const currentKey = \`\${position.row},\${position.col}\`;
    this.visitCounts.set(currentKey, (this.visitCounts.get(currentKey) || 0) + 1);

    // Tìm ô lân cận có thế năng (số lần ghé thăm) thấp nhất
    let bestMove = availableNeighbors[0] || position;
    let minPotential = Infinity;

    for (const neighbor of availableNeighbors) {
      const nKey = \`\${neighbor.row},\${neighbor.col}\`;
      const potential = this.visitCounts.get(nKey) || 0;

      if (potential < minPotential) {
        minPotential = potential;
        bestMove = neighbor;
      }
    }

    return bestMove;
  }
});
`,
  },
  dfs: {
    name: 'Trémaux DFS (Duyệt sâu & Quay lui vật lý)',
    code: `import { defineMazeSolver } from '@robot-arena/robot-sdk';

/**
 * ==============================================================================
 * THUẬT TOÁN: TRÉMAUX DFS BACKTRACKING (THẾ KỶ 19)
 * ==============================================================================
 * 💡 NGUYÊN LÝ:
 * Dựa trên thuật toán giải mê cung bằng cách để lại vết chân của Charles Trémaux.
 * - Robot cắm đầu đi sâu vào một nhánh cho tới khi chạm đáy ngõ cụt.
 * - Khi không còn ô nào chưa đi, robot lùi ngược lại chính xác từng bước theo vết chân
 *   (stack quay lui) cho tới khi gặp một ngã ba còn lối rẽ mới.
 * ==============================================================================
 */
export default defineMazeSolver({
  name: 'Trémaux Explorer',
  author: 'NguyenHuuHung',
  color: '#d97706',
}, {
  visited: null,
  trailStack: [],

  init(config) {
    this.visited = new Set();
    this.trailStack = [];
  },

  onStep(sensor) {
    const { position, availableNeighbors } = sensor;
    const key = \`\${position.row},\${position.col}\`;
    this.visited.add(key);

    // Tìm các lối rẽ chưa từng đặt chân đến
    const unvisited = availableNeighbors.filter(
      (n) => !this.visited.has(\`\${n.row},\${n.col}\`)
    );

    if (unvisited.length > 0) {
      // Ghi nhớ bước chân vào stack để sau này quay lui
      this.trailStack.push({ ...position });
      // Đi vào nhánh chưa khám phá đầu tiên
      return unvisited[0];
    }

    // ĐỤNG NGÕ CỤT! Quay lui từng bước theo dấu chân cũ
    if (this.trailStack.length > 0) {
      return this.trailStack.pop();
    }

    return availableNeighbors[0] || position;
  }
});
`,
  },
  wallfollower: {
    name: 'Wall Follower (Bám tường phản xạ tay phải)',
    code: `import { defineMazeSolver } from '@robot-arena/robot-sdk';

/**
 * ==============================================================================
 * THUẬT TOÁN: BÁM TƯỜNG BÀN TAY PHẢI (RIGHT-HAND RULE)
 * ==============================================================================
 * 💡 NGUYÊN LÝ:
 * Chiến lược sinh tồn cơ bản nhất của robot: luôn giữ tay phải chạm vào tường.
 * Hoạt động 100% bằng phản xạ cảm biến va chạm cục bộ:
 * 1. Nếu bên PHẢI thông thoáng: Rẽ phải và bước tới.
 * 2. Nếu ĐẰNG TRƯỚC không có tường: Đi thẳng.
 * 3. Nếu đằng trước bị chặn: Rẽ trái.
 * 4. Nếu 3 mặt đều bị bịt: Quay đầu 180° lùi ra.
 * ==============================================================================
 */
export default defineMazeSolver({
  name: 'Chuột Bám Tường',
  author: 'NguyenHuuHung',
  color: '#e11d48',
}, {
  onStep(sensor) {
    const { adjacentWalls } = sensor;

    // Ưu tiên 1: Nếu bên phải mở -> Rẽ phải
    if (!adjacentWalls.right) {
      return { type: 'turn_right' };
    }

    // Ưu tiên 2: Nếu phía trước không có tường -> Đi thẳng
    if (!adjacentWalls.front) {
      return { type: 'move_forward' };
    }

    // Ưu tiên 3: Nếu bên phải và trước đều vướng tường -> Rẽ trái
    return { type: 'turn_left' };
  }
});
`,
  },
};

interface EditorState {
  code: string;
  robotName: string;
  selectedTemplate: string;
  isCompiling: boolean;
  statusMessage: string | null;
  setCode: (code: string) => void;
  setRobotName: (name: string) => void;
  setSelectedTemplate: (templateKey: string) => void;
  setIsCompiling: (compiling: boolean) => void;
  setStatusMessage: (msg: string | null) => void;
  resetToDefault: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: MAZE_ALGORITHM_TEMPLATES.turn_astar.code,
  robotName: MAZE_ALGORITHM_TEMPLATES.turn_astar.name,
  selectedTemplate: 'turn_astar',
  isCompiling: false,
  statusMessage: null,
  setCode: (code) => set({ code }),
  setRobotName: (robotName) => set({ robotName }),
  setSelectedTemplate: (key) => {
    const tpl = MAZE_ALGORITHM_TEMPLATES[key];
    if (tpl) {
      set({
        selectedTemplate: key,
        code: tpl.code,
        robotName: tpl.name,
      });
    }
  },
  setIsCompiling: (isCompiling) => set({ isCompiling }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  resetToDefault: () =>
    set({
      code: MAZE_ALGORITHM_TEMPLATES.turn_astar.code,
      robotName: MAZE_ALGORITHM_TEMPLATES.turn_astar.name,
      selectedTemplate: 'turn_astar',
      statusMessage: null,
    }),
}));

/**
 * Bộ kiểm tra mã nguồn chống gian lận (Anti-Cheat & Sandbox Validator)
 */
export function validateAlgorithmCode(code: string): { isValid: boolean; error?: string } {
  if (!code || typeof code !== 'string') {
    return { isValid: false, error: 'Mã nguồn thuật toán không được để trống.' };
  }

  // 1. Kiểm tra cấu trúc hàm chuẩn
  if (!code.includes('defineMazeSolver') && !code.includes('onStep')) {
    return {
      isValid: false,
      error: "Cấu trúc không hợp lệ: Cần chứa 'defineMazeSolver' và hàm 'onStep(sensor)' từ @robot-arena/robot-sdk",
    };
  }

  // 2. Chống gian lận: Cấm truy cập bản đồ toàn cảnh
  if (code.includes('fullMazeMap') || code.includes('maze.cells') || code.includes('maze.start') || code.includes('maze.goal')) {
    return {
      isValid: false,
      error: "⛔ VI PHẠM LUẬT THI ĐẤU (ANTI-CHEAT): Thuật toán không được phép truy cập bản đồ toàn cảnh ('fullMazeMap' hoặc 'maze'). Bạn bắt buộc phải khám phá mê cung trong sương mù (Fog of War) bằng cảm biến cục bộ (sensor.adjacentWalls, sensor.availableNeighbors) và tự duy trì bộ nhớ.",
    };
  }

  // 3. An toàn môi trường: Cấm can thiệp trình duyệt / eval
  const securityViolations = ['window', 'document', 'eval(', 'Function(', 'globalThis', 'localStorage', 'sessionStorage', 'fetch(', 'XMLHttpRequest'];
  for (const forbidden of securityViolations) {
    if (code.includes(forbidden)) {
      return {
        isValid: false,
        error: `⛔ VI PHẠM AN TOÀN HỆ THỐNG: Thuật toán không được phép sử dụng lệnh cấm '${forbidden}'.`,
      };
    }
  }

  return { isValid: true };
}
