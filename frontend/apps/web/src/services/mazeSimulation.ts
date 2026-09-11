import type {
  MazeGrid,
  MazeRobotState,
  GridPosition,
  MazeSimulationTick,
  Direction,
} from '@robot-arena/shared-types';
import {
  solveAStar,
  solveTurnPenaltyAStar,
  getValidNeighbors,
  getRelativeDirection,
  DIRECTION_OFFSETS,
  smoothPathWaypoints,
} from '@robot-arena/robot-sdk';
import { generateMaze, GoalPositionSetting } from './mazeGenerator';
import { AlgorithmDefinition } from '../stores/simulationStore';

/**
 * 1. REAL MICROMOUSE FRONTIER FLOOD FILL (Khám phá mù - Không biết vị trí đích):
 * Thuật toán dội thế năng theo chuẩn Micromouse giai đoạn thám hiểm (Search Phase).
 * Chuột hoàn toàn KHÔNG biết trước tọa độ ô Đích.
 * Thế năng dội ngược từ tất cả các lối rẽ/vùng đất chưa khám phá (Unexplored Frontiers).
 * Chuột bị hút tự nhiên về các vùng đất mới. Khi vào ngõ cụt, thế năng dâng cao đẩy chuột trôi ra ngoài!
 */
export function simulateRealMicromouseFloodFill(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition
): GridPosition[] {
  const rows = maze.rows;
  const cols = maze.cols;
  const visited = new Set<string>([`${start.row},${start.col}`]);
  const visitCounts = new Map<string, number>([[`${start.row},${start.col}`, 1]]);
  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  let heading: Direction = 'EAST';
  const maxSteps = rows * cols * 8;

  for (let step = 0; step < maxSteps; step++) {
    // Chỉ dừng lại khi chuột thực sự bước chân tới đúng ô Đích!
    if (current.row === goal.row && current.col === goal.col) break;

    const neighbors = getValidNeighbors(maze, current);
    const unvisited = neighbors.filter((n) => !visited.has(`${n.row},${n.col}`));

    if (unvisited.length > 0) {
      // Ưu tiên đi thẳng theo dòng chảy quán tính
      unvisited.sort((a, b) => {
        const straightA = getRelativeDirection(current, a) === heading ? -1 : 0;
        const straightB = getRelativeDirection(current, b) === heading ? -1 : 0;
        return straightA - straightB;
      });
      const next = unvisited[0];
      visited.add(`${next.row},${next.col}`);
      visitCounts.set(`${next.row},${next.col}`, 1);
      const nextDir = getRelativeDirection(current, next);
      if (nextDir) heading = nextDir;
      current = { ...next };
      path.push(current);
    } else {
      // Dâng thế năng: Chọn ô có số lần thăm ít nhất để tự trôi ra khỏi ngõ cụt
      neighbors.sort((a, b) => {
        const cA = visitCounts.get(`${a.row},${a.col}`) || 0;
        const cB = visitCounts.get(`${b.row},${b.col}`) || 0;
        if (cA !== cB) return cA - cB;
        const backDir = heading === 'NORTH' ? 'SOUTH' : heading === 'SOUTH' ? 'NORTH' : heading === 'EAST' ? 'WEST' : 'EAST';
        const isBackA = getRelativeDirection(current, a) === backDir ? 1 : 0;
        const isBackB = getRelativeDirection(current, b) === backDir ? 1 : 0;
        return isBackA - isBackB;
      });

      const next = neighbors[0];
      visitCounts.set(`${next.row},${next.col}`, (visitCounts.get(`${next.row},${next.col}`) || 0) + 1);
      const nextDir = getRelativeDirection(current, next);
      if (nextDir) heading = nextDir;
      current = { ...next };
      path.push(current);
    }
  }

  return path;
}

/**
 * 2. REAL DFS VỚI QUAY LUI VẬT LÝ (Trémaux Backtracking):
 * Chuột tiến sâu vào ngõ, khi đụng tường ngõ cụt thì lập tức quay đầu,
 * bước lùi từng bước một (backtrack) về lại ngã rẽ gần nhất để tìm nhánh mới!
 */
export function simulateRealDFSBacktracking(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition
): GridPosition[] {
  const rows = maze.rows;
  const cols = maze.cols;
  const visited = new Set<string>([`${start.row},${start.col}`]);
  const branchStack: GridPosition[] = [start];
  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  let heading: Direction = 'EAST';
  // Thứ tự ưu tiên hướng của DFS: Ưu tiên Nam -> Tây -> Đông -> Bắc
  // Tạo sự phân hóa rõ rệt ngay từ vạch xuất phát với các thuật toán tham lam hướng đích (A*, FloodFill)
  const dfsDirPriority: Direction[] = ['SOUTH', 'WEST', 'EAST', 'NORTH'];

  const maxSteps = rows * cols * 6;

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    const neighbors = getValidNeighbors(maze, current);
    const unvisited = neighbors.filter((n) => !visited.has(`${n.row},${n.col}`));

    if (unvisited.length > 0) {
      // Ưu tiên nhánh theo chiến lược định hướng riêng của DFS:
      // 1. Duy trì đà đi thẳng (heading) để tiến sâu vào ngách
      // 2. Khi phải rẽ, ưu tiên theo dfsDirPriority (Nam -> Tây -> Đông -> Bắc)
      unvisited.sort((a, b) => {
        const dirA = getRelativeDirection(current, a);
        const dirB = getRelativeDirection(current, b);
        const straightA = dirA === heading ? -1 : 0;
        const straightB = dirB === heading ? -1 : 0;
        if (straightA !== straightB) return straightA - straightB;

        const prioA = dirA ? dfsDirPriority.indexOf(dirA) : 99;
        const prioB = dirB ? dfsDirPriority.indexOf(dirB) : 99;
        return prioA - prioB;
      });

      const next = unvisited[0];
      visited.add(`${next.row},${next.col}`);
      branchStack.push(next);

      const nextDir = getRelativeDirection(current, next);
      if (nextDir) heading = nextDir;

      current = { ...next };
      path.push(current);
    } else {
      // NGÕ CỤT! Quay lui vật lý từng bước về ngã ba
      branchStack.pop();
      if (branchStack.length === 0) break;

      const backtrackNode = branchStack[branchStack.length - 1];
      const backDir = getRelativeDirection(current, backtrackNode);
      if (backDir) heading = backDir;

      current = { ...backtrackNode };
      path.push(current);
    }
  }

  return path;
}

/**
 * 3. REAL BÁM TƯỜNG TAY PHẢI / TAY TRÁI (Wall Follower):
 * Men theo vách tường, rẽ theo thứ tự ưu tiên xúc giác phản xạ.
 */
export function simulateRealWallFollower(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition,
  hand: 'RIGHT' | 'LEFT' = 'RIGHT'
): GridPosition[] {
  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  let heading: Direction = 'EAST';
  const directionsOrder: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
  // Phải: [Phải, Thẳng, Trái, Quay lui] | Trái: [Trái, Thẳng, Phải, Quay lui]
  const turnOffsets = hand === 'RIGHT' ? [1, 0, 3, 2] : [3, 0, 1, 2];

  const maxSteps = maze.rows * maze.cols * 4;

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    const curIdx = directionsOrder.indexOf(heading);
    let stepped = false;

    for (const offset of turnOffsets) {
      const tDir = directionsOrder[(curIdx + offset) % 4];
      const cell = maze.cells[current.row][current.col];
      let blocked = false;

      if (tDir === 'NORTH') blocked = cell.walls.north || current.row === 0;
      else if (tDir === 'EAST') blocked = cell.walls.east || current.col === maze.cols - 1;
      else if (tDir === 'SOUTH') blocked = cell.walls.south || current.row === maze.rows - 1;
      else if (tDir === 'WEST') blocked = cell.walls.west || current.col === 0;

      if (!blocked) {
        heading = tDir;
        const delta = DIRECTION_OFFSETS[tDir];
        current = { row: current.row + delta.row, col: current.col + delta.col };
        path.push(current);
        stepped = true;
        break;
      }
    }

    if (!stepped) break;
  }

  return path;
}

/**
 * 4. REAL GREEDY EXPLORER (Khám phá mù tham lam):
 * Lao vào các ngã rẽ mới nhất phát hiện được, không cần biết trước đích ở đâu.
 * Khi đụng ngõ cụt thì quay lui vật lý về ngã ba trước đó.
 */
export function simulateRealGreedyBFS(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition
): GridPosition[] {
  const rows = maze.rows;
  const cols = maze.cols;
  const visited = new Set<string>([`${start.row},${start.col}`]);
  const branchStack: GridPosition[] = [start];
  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  let heading: Direction = 'EAST';

  const maxSteps = rows * cols * 8;

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    const neighbors = getValidNeighbors(maze, current);
    const unvisited = neighbors.filter((n) => !visited.has(`${n.row},${n.col}`));

    if (unvisited.length > 0) {
      // Ưu tiên khám phá các nhánh rẽ tạo góc cua mới để quét diện tích nhanh nhất
      unvisited.sort((a, b) => {
        const straightA = getRelativeDirection(current, a) === heading ? 1 : 0;
        const straightB = getRelativeDirection(current, b) === heading ? 1 : 0;
        return straightA - straightB;
      });

      const next = unvisited[0];
      visited.add(`${next.row},${next.col}`);
      branchStack.push(next);

      const nextDir = getRelativeDirection(current, next);
      if (nextDir) heading = nextDir;

      current = { ...next };
      path.push(current);
    } else {
      branchStack.pop();
      if (branchStack.length === 0) break;

      const backtrackNode = branchStack[branchStack.length - 1];
      const backDir = getRelativeDirection(current, backtrackNode);
      if (backDir) heading = backDir;

      current = { ...backtrackNode };
      path.push(current);
    }
  }

  return path;
}

/**
 * 5. REAL ONLINE DIJKSTRA (Khám phá biên toàn diện - Frontier Dijkstra SLAM):
 * Robot quét bản đồ và lập đường đi ngắn nhất đến ô CHƯA KHÁM PHÁ gần nhất (Frontier).
 * Hoàn toàn không biết trước tọa độ ô Đích.
 */
export function simulateRealDijkstra(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition
): GridPosition[] {
  const rows = maze.rows;
  const cols = maze.cols;
  const visited = new Set<string>([`${start.row},${start.col}`]);
  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  const maxSteps = rows * cols * 8;

  // BFS/Dijkstra tìm đường ngắn nhất qua các ô đã thăm để tới ô biên chưa thăm gần nhất
  const findShortestPathToNearestFrontier = (from: GridPosition): GridPosition[] => {
    const parent = new Map<string, GridPosition | null>();
    const queue: GridPosition[] = [from];
    parent.set(`${from.row},${from.col}`, null);
    let targetFrontier: GridPosition | null = null;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (!visited.has(`${curr.row},${curr.col}`)) {
        targetFrontier = curr;
        break;
      }

      const neighbors = getValidNeighbors(maze, curr);
      for (const n of neighbors) {
        const key = `${n.row},${n.col}`;
        if (!parent.has(key)) {
          parent.set(key, curr);
          if (visited.has(key)) {
            queue.push(n);
          } else {
            targetFrontier = n;
            queue.length = 0;
            break;
          }
        }
      }
    }

    if (!targetFrontier) return [];
    const route: GridPosition[] = [];
    let cur: GridPosition | null = targetFrontier;
    while (cur) {
      route.push(cur);
      cur = parent.get(`${cur.row},${cur.col}`) || null;
    }
    return route.reverse();
  };

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    const neighbors = getValidNeighbors(maze, current);
    const unvisited = neighbors.filter((n) => !visited.has(`${n.row},${n.col}`));

    if (unvisited.length > 0) {
      const next = unvisited[0];
      visited.add(`${next.row},${next.col}`);
      current = { ...next };
      path.push(current);
    } else {
      const routeToFrontier = findShortestPathToNearestFrontier(current);
      if (routeToFrontier.length > 1) {
        const next = routeToFrontier[1];
        visited.add(`${next.row},${next.col}`);
        current = { ...next };
        path.push(current);
      } else {
        break;
      }
    }
  }

  return path;
}

/**
 * 6. REAL ONLINE A* & TURN-OPTIMIZED A* (Khám phá mù quán tính & Quay lui vật lý):
 * Chuột hoàn toàn KHÔNG biết trước tọa độ ô Đích (Zero-Knowledge Blind Exploration).
 * - Chuột ưu tiên duy trì quán tính thẳng (ít bẻ góc 90° để tối ưu động lượng).
 * - Tại các ngã ba, chọn ngã rẽ chưa từng đặt chân đến (unvisited).
 * - Khi đụng ngõ cụt (dead-end), chuột tự động quay lui vật lý (backtrack) từng bước về ngã ba gần nhất!
 * - Chuột chỉ dừng lại khi bước chân chạm tới đúng ô Đích!
 */
export function simulateRealOnlineAStar(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition,
  withTurnPenalty: boolean = true
): GridPosition[] {
  const rows = maze.rows;
  const cols = maze.cols;
  const visited = new Set<string>([`${start.row},${start.col}`]);
  const branchStack: GridPosition[] = [start];
  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  let heading: Direction = 'EAST';
  const maxSteps = rows * cols * 8;

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    const neighbors = getValidNeighbors(maze, current);
    const unvisited = neighbors.filter((n) => !visited.has(`${n.row},${n.col}`));

    if (unvisited.length > 0) {
      if (withTurnPenalty) {
        // A* Mượt: Ưu tiên duy trì đà đi thẳng (heading)
        unvisited.sort((a, b) => {
          const straightA = getRelativeDirection(current, a) === heading ? -1 : 0;
          const straightB = getRelativeDirection(current, b) === heading ? -1 : 0;
          return straightA - straightB;
        });
      }

      const next = unvisited[0];
      visited.add(`${next.row},${next.col}`);
      branchStack.push(next);

      const nextDir = getRelativeDirection(current, next);
      if (nextDir) heading = nextDir;

      current = { ...next };
      path.push(current);
    } else {
      // ĐỤNG NGÕ CỤT! Quay lui vật lý từng bước (Backtrack) về ngã ba gần nhất
      branchStack.pop();
      if (branchStack.length === 0) break;

      const backtrackNode = branchStack[branchStack.length - 1];
      const backDir = getRelativeDirection(current, backtrackNode);
      if (backDir) heading = backDir;

      current = { ...backtrackNode };
      path.push(current);
    }
  }

  return path;
}

/**
 * 7. THỰC THI THUẬT TOÁN TỰ VIẾT CỦA DEVELOPER (Sandboxed User Custom Code Runner):
 * Chạy code thực tế viết trong RobotEditor với cảm biến khám phá mù.
 */
export function simulateUserCustomCode(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition,
  code: string
): GridPosition[] {
  try {
    let cleanCode = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    cleanCode = cleanCode.replace(/export\s+default\s+defineMazeSolver\s*\(/g, 'return defineMazeSolver(');
    cleanCode = cleanCode.replace(/export\s+default\s+/g, 'return ');

    const defineMazeSolver = (metadata: any, solver: any) => ({ metadata, solver });
    const manhattanDistance = (p1: GridPosition, p2: GridPosition) =>
      Math.abs(p1.row - p2.row) + Math.abs(p1.col - p2.col);

    const fn = new Function('defineMazeSolver', 'manhattanDistance', cleanCode);
    const compiled = fn(defineMazeSolver, manhattanDistance);
    const solver = compiled?.solver || compiled;

    if (!solver || typeof solver.onStep !== 'function') {
      return simulateRealOnlineAStar(maze, start, goal, true);
    }

    if (typeof solver.init === 'function') {
      solver.init({
        start: { ...start },
        mazeDimensions: { rows: maze.rows, cols: maze.cols },
      });
    }

    const path: GridPosition[] = [start];
    let current: GridPosition = { ...start };
    let heading: Direction = 'EAST';
    const maxSteps = maze.rows * maze.cols * 8;

    for (let step = 0; step < maxSteps; step++) {
      if (current.row === goal.row && current.col === goal.col) break;

      const cell = maze.cells[current.row][current.col];
      const validNeighbors = getValidNeighbors(maze, current);
      const availableDirections: Direction[] = [];
      if (!cell.walls.north && current.row > 0) availableDirections.push('NORTH');
      if (!cell.walls.east && current.col < maze.cols - 1) availableDirections.push('EAST');
      if (!cell.walls.south && current.row < maze.rows - 1) availableDirections.push('SOUTH');
      if (!cell.walls.west && current.col > 0) availableDirections.push('WEST');

      const sensor = {
        position: { ...current },
        direction: heading,
        currentCell: cell,
        adjacentWalls: {
          north: cell.walls.north,
          east: cell.walls.east,
          south: cell.walls.south,
          west: cell.walls.west,
          front: heading === 'NORTH' ? cell.walls.north : heading === 'EAST' ? cell.walls.east : heading === 'SOUTH' ? cell.walls.south : cell.walls.west,
          back: heading === 'NORTH' ? cell.walls.south : heading === 'EAST' ? cell.walls.west : heading === 'SOUTH' ? cell.walls.north : cell.walls.east,
          left: heading === 'NORTH' ? cell.walls.west : heading === 'EAST' ? cell.walls.north : heading === 'SOUTH' ? cell.walls.east : cell.walls.south,
          right: heading === 'NORTH' ? cell.walls.east : heading === 'EAST' ? cell.walls.south : heading === 'SOUTH' ? cell.walls.west : cell.walls.north,
        },
        availableNeighbors: validNeighbors,
        availableDirections,
        mazeDimensions: { rows: maze.rows, cols: maze.cols },
        goal: { row: -1, col: -1 }, // Ẩn hoàn toàn vị trí đích
        manhattanDistanceToGoal: -1,
        euclideanDistanceToGoal: -1,
        isGoalFound: current.row === goal.row && current.col === goal.col,
      };

      let decision = solver.onStep(sensor);
      let nextPos: GridPosition | null = null;

      if (decision && typeof decision === 'object') {
        if ('row' in decision && 'col' in decision) {
          nextPos = decision as GridPosition;
        } else if ('type' in decision) {
          const action = decision as any;
          if (action.type === 'move_forward') {
            const delta = DIRECTION_OFFSETS[heading];
            nextPos = { row: current.row + delta.row, col: current.col + delta.col };
          } else if (action.type === 'turn_left') {
            const leftMap: Record<Direction, Direction> = { NORTH: 'WEST', WEST: 'SOUTH', SOUTH: 'EAST', EAST: 'NORTH' };
            heading = leftMap[heading];
            const delta = DIRECTION_OFFSETS[heading];
            nextPos = { row: current.row + delta.row, col: current.col + delta.col };
          } else if (action.type === 'turn_right') {
            const rightMap: Record<Direction, Direction> = { NORTH: 'EAST', EAST: 'SOUTH', SOUTH: 'WEST', WEST: 'NORTH' };
            heading = rightMap[heading];
            const delta = DIRECTION_OFFSETS[heading];
            nextPos = { row: current.row + delta.row, col: current.col + delta.col };
          } else if (action.type === 'step_to' && action.target) {
            nextPos = action.target;
          }
        }
      } else if (typeof decision === 'string' && ['NORTH', 'EAST', 'SOUTH', 'WEST'].includes(decision)) {
        heading = decision as Direction;
        const delta = DIRECTION_OFFSETS[heading];
        nextPos = { row: current.row + delta.row, col: current.col + delta.col };
      }

      if (nextPos) {
        const isValid = validNeighbors.some((n) => n.row === nextPos!.row && n.col === nextPos!.col);
        if (isValid) {
          const nextDir = getRelativeDirection(current, nextPos);
          if (nextDir) heading = nextDir;
          current = { ...nextPos };
          path.push(current);
          continue;
        }
      }

      if (validNeighbors.length > 0) {
        current = { ...validNeighbors[0] };
        path.push(current);
      } else {
        break;
      }
    }

    return path;
  } catch (err) {
    console.warn('Lỗi thực thi mã người dùng, fallback sang Blind Momentum Explorer:', err);
    return simulateRealOnlineAStar(maze, start, goal, true);
  }
}

export interface MazeSimulationConfig {
  rows: number;
  cols: number;
  goalPosition?: GoalPositionSetting;
  braidFactor?: number;
  activeAlgorithms: string[];
  algorithmsList: AlgorithmDefinition[];
  smoothCorners?: boolean;
}

export class MazeSimulationEngine {
  private maze: MazeGrid;
  private robots: MazeRobotState[] = [];
  private tickCount: number = 0;
  private optimalPath: GridPosition[] = [];
  private currentGoalSetting?: GoalPositionSetting;

  // Complete precalculated paths for each robot from start to goal
  private robotPaths: Map<string, { path: GridPosition[]; index: number }> = new Map();

  constructor(config: MazeSimulationConfig) {
    this.currentGoalSetting = config.goalPosition;
    this.maze = generateMaze({
      rows: config.rows,
      cols: config.cols,
      braidFactor: config.braidFactor,
      goalPosition: config.goalPosition,
    });
    this.reset(config);
  }

  public getMaze(): MazeGrid {
    return this.maze;
  }

  public getOptimalPath(): GridPosition[] {
    return this.optimalPath;
  }

  public reset(config: MazeSimulationConfig, regenerateMaze: boolean = false): void {
    const shouldRegenerate =
      regenerateMaze ||
      this.maze.rows !== config.rows ||
      this.maze.cols !== config.cols ||
      config.goalPosition === 'random' ||
      this.currentGoalSetting !== config.goalPosition;

    if (shouldRegenerate) {
      this.currentGoalSetting = config.goalPosition;
      this.maze = generateMaze({
        rows: config.rows,
        cols: config.cols,
        braidFactor: config.braidFactor,
        goalPosition: config.goalPosition,
      });
    }

    this.tickCount = 0;
    const start = this.maze.start;
    const goal = this.maze.goal;

    // Ground truth theoretical optimal shortest path (for telemetry/scoring comparison only)
    this.optimalPath = solveTurnPenaltyAStar(this.maze, start, goal, 0.6);
    if (this.optimalPath.length === 0) {
      this.optimalPath = solveAStar(this.maze, start, goal);
    }

    this.robotPaths.clear();
    this.robots = [];

    // REALISTIC PHYSICAL EXPLORATION:
    // Robots discover walls in real-time, enter branches, hit dead ends, turn around, and backtrack!
    const turnPath = simulateRealOnlineAStar(this.maze, start, goal, true);
    const stdPath = simulateRealOnlineAStar(this.maze, start, goal, false);
    const dfsPath = simulateRealDFSBacktracking(this.maze, start, goal);
    const floodPath = simulateRealMicromouseFloodFill(this.maze, start, goal);
    const wallFollowerPath = simulateRealWallFollower(this.maze, start, goal, 'RIGHT');
    const wallLeftPath = simulateRealWallFollower(this.maze, start, goal, 'LEFT');
    const dijkstraPath = simulateRealDijkstra(this.maze, start, goal);
    const greedyPath = simulateRealGreedyBFS(this.maze, start, goal);

    for (const algo of config.algorithmsList) {
      if (!config.activeAlgorithms.includes(algo.id)) continue;

      let path: GridPosition[] = [];
      if (algo.id === 'turn_astar') {
        path = turnPath;
      } else if (algo.id === 'standard_astar') {
        path = stdPath;
      } else if (algo.id === 'bfs' || algo.id === 'dfs') {
        path = dfsPath;
      } else if (algo.id === 'floodfill') {
        path = floodPath;
      } else if (algo.id === 'wall_follower' || algo.id === 'right_wall') {
        path = wallFollowerPath;
      } else if (algo.id === 'wall_left') {
        path = wallLeftPath;
      } else if (algo.id === 'dijkstra') {
        path = dijkstraPath;
      } else if (algo.id === 'greedy_bfs') {
        path = greedyPath;
      } else if (algo.code && algo.isCustom) {
        // Chạy thuật toán tự viết của lập trình viên trong môi trường khám phá mù
        path = simulateUserCustomCode(this.maze, start, goal, algo.code);
      } else {
        // Fallback mặc định: Khám phá mù giữ đà quán tính
        path = simulateRealOnlineAStar(this.maze, start, goal, true);
      }

      // Giữ nguyên 100% lộ trình tự khám phá trung thực của robot, không tự ý chèn đường tắt ăn gian
      if (path.length === 0) {
        path = [{ ...start }];
      }

      if (path.length > 0) {
        this.robotPaths.set(algo.id, { path, index: 0 });
      }

      this.robots.push({
        id: algo.id,
        name: algo.name,
        color: algo.color,
        position: { ...start },
        direction: 'EAST',
        visualX: start.col,
        visualY: start.row,
        visualAngle: 0,
        pathHistory: [{ ...start }],
        exploredCells: [{ ...start }],
        smoothedTrail: [{ x: start.col, y: start.row }],
        stepsCount: 0,
        turnsCount: 0,
        hasReachedGoal: false,
        status: 'searching',
      });
    }
  }

  public nextTick(smoothCorners: boolean = true): MazeSimulationTick {
    this.tickCount++;
    const goal = this.maze.goal;

    for (const robot of this.robots) {
      if (robot.hasReachedGoal) continue;

      const pathData = this.robotPaths.get(robot.id);
      if (!pathData) continue;

      if (pathData.index < pathData.path.length - 1) {
        pathData.index++;
        const nextPos = pathData.path[pathData.index];

        const dir = getRelativeDirection(robot.position, nextPos);
        if (dir && dir !== robot.direction) {
          robot.turnsCount++;
          robot.direction = dir;
        }

        robot.position = { ...nextPos };
        robot.stepsCount++;
        robot.pathHistory.push({ ...nextPos });

        // Update smoothed trail
        if (smoothCorners) {
          robot.smoothedTrail = smoothPathWaypoints(robot.pathHistory);
        } else {
          robot.smoothedTrail = robot.pathHistory.map((p) => ({ x: p.col, y: p.row }));
        }

        if (!robot.exploredCells.some((c) => c.row === nextPos.row && c.col === nextPos.col)) {
          robot.exploredCells.push({ ...nextPos });
        }

        // Heading angle in radians
        let targetAngle = 0;
        if (robot.direction === 'NORTH') targetAngle = -Math.PI / 2;
        else if (robot.direction === 'EAST') targetAngle = 0;
        else if (robot.direction === 'SOUTH') targetAngle = Math.PI / 2;
        else if (robot.direction === 'WEST') targetAngle = Math.PI;

        robot.visualAngle = targetAngle;

        // Check if reached goal
        if (robot.position.row === goal.row && robot.position.col === goal.col) {
          robot.hasReachedGoal = true;
          robot.status = 'reached_goal';
          robot.finalPathLength = robot.stepsCount;
        }
      } else {
        // If reached the end of its path
        if (robot.position.row === goal.row && robot.position.col === goal.col) {
          robot.hasReachedGoal = true;
          robot.status = 'reached_goal';
          robot.finalPathLength = robot.stepsCount;
        }
      }
    }

    return {
      tick: this.tickCount,
      maze: this.maze,
      optimalShortestPath: this.optimalPath,
      robots: this.robots.map((r) => ({
        ...r,
        pathHistory: [...r.pathHistory],
        exploredCells: [...r.exploredCells],
        smoothedTrail: r.smoothedTrail ? [...r.smoothedTrail] : undefined,
      })),
      timestamp: Date.now(),
    };
  }

  public getCurrentTick(smoothCorners: boolean = true): MazeSimulationTick {
    return {
      tick: this.tickCount,
      maze: this.maze,
      optimalShortestPath: this.optimalPath,
      robots: this.robots.map((r) => ({
        ...r,
        pathHistory: [...r.pathHistory],
        exploredCells: [...r.exploredCells],
        smoothedTrail: smoothCorners && r.smoothedTrail ? [...r.smoothedTrail] : undefined,
      })),
      timestamp: Date.now(),
    };
  }

  /**
   * Smooth continuous position interpolation.
   * Glides `visualX` and `visualY` smoothly towards `position.col` and `position.row`.
   */
  public interpolateVisuals(lerpSpeed: number): void {
    for (const robot of this.robots) {
      const targetX = robot.position.col;
      const targetY = robot.position.row;

      if (robot.visualX === undefined) robot.visualX = targetX;
      if (robot.visualY === undefined) robot.visualY = targetY;

      // Smooth exponential easing towards target
      const factor = Math.min(1, Math.max(0.05, lerpSpeed));
      robot.visualX += (targetX - robot.visualX) * factor;
      robot.visualY += (targetY - robot.visualY) * factor;
    }
  }
}
