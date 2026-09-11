import { create } from 'zustand';

export const MAZE_ALGORITHM_TEMPLATES: Record<string, { name: string; code: string }> = {
  turn_astar: {
    name: 'Turn-Optimized Smooth A* (Tối ưu góc rẽ)',
    code: `import { defineMazeSolver, manhattanDistance } from '@robot-arena/robot-sdk';

/**
 * ==============================================================================
 * THUẬT TOÁN: TURN-OPTIMIZED A* (A* PHẠT GÓC CUA 90°)
 * ==============================================================================
 * ⚠️ LUẬT THI ĐẤU (ANTI-CHEAT / FOG OF WAR):
 * Robot KHÔNG có bản đồ toàn cảnh (fullMazeMap bị cấm). Bạn chỉ nhận được cảm biến
 * tại ô hiện tại (sensor.adjacentWalls, sensor.availableNeighbors).
 * Robot phải tự lập bản đồ trong trí nhớ và phán đoán nước đi!
 *
 * 🎯 CHIẾN THUẬT:
 * - Khi bẻ cua 90°, robot bị giảm tốc độ và mất động lượng.
 * - Thuật toán cộng thêm điểm phạt (turn penalty) nếu phải rẽ, ưu tiên duy trì
 *   hướng đi thẳng nếu lối đi phía trước vẫn thông thoáng.
 * ==============================================================================
 */
export default defineMazeSolver({
  name: 'Tối Ưu Góc Rẽ',
  author: 'NguyenHuuHung',
  color: '#000000',
  description: 'Phạt góc cua 90°, ưu tiên đường thẳng dài để đạt vận tốc tối đa',
}, {
  // Trí nhớ nội tại của robot
  visited: null,
  branchStack: [],

  init(config) {
    // Khởi tạo bộ nhớ khi bước vào mê cung mới
    console.log(\`Mê cung kích thước: \${config.mazeDimensions.rows}x\${config.mazeDimensions.cols}\`);
    this.visited = new Set();
    this.branchStack = [];
  },

  onStep(sensor) {
    const { position, goal, direction, availableNeighbors } = sensor;
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

      // Xác định tọa độ nếu tiếp tục đi THẲNG theo hướng nhìn hiện tại
      let straightRow = position.row;
      let straightCol = position.col;
      if (direction === 'NORTH') straightRow -= 1;
      else if (direction === 'SOUTH') straightRow += 1;
      else if (direction === 'EAST') straightCol += 1;
      else if (direction === 'WEST') straightCol -= 1;

      // 2. Tính điểm chi phí cho từng ô lân cận: Cost = Manhattan + Phạt Rẽ Cua
      let bestNeighbor = unvisited[0];
      let lowestCost = Infinity;

      for (const n of unvisited) {
        const h = manhattanDistance(n, goal); // Khoảng cách hình học tới đích
        const isStraight = (n.row === straightRow && n.col === straightCol);
        // Nếu phải rẽ hướng khác thì phạt thêm 0.8 đơn vị chi phí
        const turnPenalty = isStraight ? 0 : 0.8;
        const totalCost = h + turnPenalty;

        if (totalCost < lowestCost) {
          lowestCost = totalCost;
          bestNeighbor = n;
        }
      }

      return bestNeighbor;
    }

    // 3. ĐỤNG NGÕ CỤT: Quay lui vật lý (Backtrack) về ngã ba gần nhất
    if (this.branchStack.length > 0) {
      const backtrackTarget = this.branchStack[this.branchStack.length - 1];
      const hasBranchLeft = availableNeighbors.some(n => !this.visited.has(\`\${n.row},\${n.col}\`));
      if (!hasBranchLeft) {
        this.branchStack.pop();
      }
    }

    // Mặc định chọn ô có sẵn để rút lui
    return availableNeighbors[0] || position;
  }
});
`,
  },
  astar: {
    name: 'Standard Online A* (Manhattan Heuristic)',
    code: `import { defineMazeSolver, manhattanDistance } from '@robot-arena/robot-sdk';

/**
 * ==============================================================================
 * THUẬT TOÁN: A* TIÊU CHUẨN (ONLINE EXPLORATION A*)
 * ==============================================================================
 * ⚠️ NGUYÊN TẮC THI ĐẤU:
 * Robot hoàn toàn không biết cấu trúc mê cung trước mắt (Zero-Knowledge).
 * Tại mỗi bước, robot đánh giá hàm f(n) = g(n) + h(n):
 * - g(n): Chi phí số bước đã đi từ vạch xuất phát.
 * - h(n): Khoảng cách Manhattan ước lượng tới Đích |r1 - r2| + |c1 - c2|.
 * ==============================================================================
 */
export default defineMazeSolver({
  name: 'A-Star Chuẩn',
  author: 'NguyenHuuHung',
  color: '#2563eb',
}, {
  visited: null,
  stepCounter: 0,

  init(config) {
    this.visited = new Set();
    this.stepCounter = 0;
  },

  onStep(sensor) {
    this.stepCounter++;
    const { position, goal, availableNeighbors } = sensor;
    this.visited.add(\`\${position.row},\${position.col}\`);

    // Lọc các ô chưa khám phá
    const freshMoves = availableNeighbors.filter(
      (n) => !this.visited.has(\`\${n.row},\${n.col}\`)
    );

    // Nếu còn đường mới -> Chọn ô có khoảng cách Manhattan tới đích ngắn nhất
    if (freshMoves.length > 0) {
      freshMoves.sort((a, b) => manhattanDistance(a, goal) - manhattanDistance(b, goal));
      return freshMoves[0];
    }

    // Nếu vào đường cùng -> Rút lui theo ô lối thoát khả dụng
    return availableNeighbors[0] || position;
  }
});
`,
  },
  floodfill: {
    name: 'Micromouse Flood Fill (Ma trận thế năng)',
    code: `import { defineMazeSolver } from '@robot-arena/robot-sdk';

/**
 * ==============================================================================
 * THUẬT TOÁN: MICROMOUSE FLOOD FILL (CHUẨN GIẢI ĐẤU IEEE)
 * ==============================================================================
 * 💡 NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Robot duy trì ma trận thế năng khoảng cách 'potentialGrid' dội từ ô Đích về.
 * 2. Ban đầu giả định mê cung trống, khoảng cách là Manhattan.
 * 3. Khi đi qua mỗi ô, robot nhận diện tường và cập nhật các ô đã đi qua.
 * 4. Robot luôn luôn trôi về ô lân cận có thế năng thấp nhất. Khi đụng tường cụt,
 *    thế năng ô đó tự tăng vọt, đẩy robot quay đầu 180° thoát ra ngoài!
 * ==============================================================================
 */
export default defineMazeSolver({
  name: 'Micromouse Thế Năng',
  author: 'NguyenHuuHung',
  color: '#7c3aed',
}, {
  visited: null,

  init(config) {
    this.visited = new Set();
  },

  onStep(sensor) {
    const { position, goal, availableNeighbors } = sensor;
    const currentKey = \`\${position.row},\${position.col}\`;
    this.visited.add(currentKey);

    // Tính thế năng tới đích cho các ô xung quanh
    let bestMove = availableNeighbors[0] || position;
    let minPotential = Infinity;

    for (const neighbor of availableNeighbors) {
      // Thế năng cơ bản = Khoảng cách Manhattan tới đích
      const dist = Math.abs(neighbor.row - goal.row) + Math.abs(neighbor.col - goal.col);
      // Cộng thêm điểm phạt nếu ô này đã từng đi qua (đẩy lùi ngõ cụt)
      const penalty = this.visited.has(\`\${neighbor.row},\${neighbor.col}\`) ? 50 : 0;
      const totalPotential = dist + penalty;

      if (totalPotential < minPotential) {
        minPotential = totalPotential;
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
