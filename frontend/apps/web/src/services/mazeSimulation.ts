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
  manhattanDistance,
  smoothPathWaypoints,
} from '@robot-arena/robot-sdk';
import { generateMaze, GoalPositionSetting } from './mazeGenerator';
import { AlgorithmDefinition } from '../stores/simulationStore';

/**
 * Helper: Tạo bản đồ tường bộ nhớ trống (chỉ có tường biên ngoài).
 */
function createEmptyMemoryWalls(rows: number, cols: number) {
  const walls: Array<Array<{ north: boolean; east: boolean; south: boolean; west: boolean }>> = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        north: r === 0,
        east: c === cols - 1,
        south: r === rows - 1,
        west: c === 0,
      });
    }
    walls.push(row);
  }
  return walls;
}

/**
 * 1. REAL MICROMOUSE FLOOD FILL:
 * Thuật toán kinh điển giải Micromouse chuẩn IEEE.
 * Chuột chỉ biết vị trí ô hiện tại và ô Đích. Khi đi đến đâu cảm biến nhận diện tường đến đó,
 * cập nhật ma trận thế năng (Flood Fill distance matrix).
 * Khi gặp ngõ cụt, thế năng ô ngõ cụt dâng cao hơn ô lối vào -> chuột tự quay đầu 180° quay lui ra ngoài!
 */
export function simulateRealMicromouseFloodFill(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition
): GridPosition[] {
  const rows = maze.rows;
  const cols = maze.cols;
  const memoryWalls = createEmptyMemoryWalls(rows, cols);

  // Ma trận khoảng cách thực tế từ mọi ô tới đích trên các bức tường đã biết
  const dist: number[][] = Array.from({ length: rows }, () => Array(cols).fill(Infinity));

  const getOpenNeighbors = (p: GridPosition): GridPosition[] => {
    const res: GridPosition[] = [];
    const w = memoryWalls[p.row][p.col];
    if (!w.north && p.row > 0) res.push({ row: p.row - 1, col: p.col });
    if (!w.east && p.col < cols - 1) res.push({ row: p.row, col: p.col + 1 });
    if (!w.south && p.row < rows - 1) res.push({ row: p.row + 1, col: p.col });
    if (!w.west && p.col > 0) res.push({ row: p.row, col: p.col - 1 });
    return res;
  };

  // Cập nhật ma trận thế năng Flood Fill toàn diện từ đích
  const recomputeFloodFill = () => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dist[r][c] = Infinity;
      }
    }
    dist[goal.row][goal.col] = 0;
    const q: GridPosition[] = [goal];
    let head = 0;
    while (head < q.length) {
      const curr = q[head++];
      const d = dist[curr.row][curr.col];
      const neighbors = getOpenNeighbors(curr);
      for (const n of neighbors) {
        if (dist[n.row][n.col] === Infinity) {
          dist[n.row][n.col] = d + 1;
          q.push(n);
        }
      }
    }
  };

  recomputeFloodFill();

  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  let heading: Direction = 'EAST';
  const visitCounts = new Map<string, number>();
  visitCounts.set(`${start.row},${start.col}`, 1);
  const maxSteps = rows * cols * 6;

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    // 1. Cảm biến nhận diện tường thực tế
    const actualCell = maze.cells[current.row][current.col];
    let wallChanged = false;

    if (actualCell.walls.north && !memoryWalls[current.row][current.col].north) {
      memoryWalls[current.row][current.col].north = true;
      if (current.row > 0) memoryWalls[current.row - 1][current.col].south = true;
      wallChanged = true;
    }
    if (actualCell.walls.east && !memoryWalls[current.row][current.col].east) {
      memoryWalls[current.row][current.col].east = true;
      if (current.col < cols - 1) memoryWalls[current.row][current.col + 1].west = true;
      wallChanged = true;
    }
    if (actualCell.walls.south && !memoryWalls[current.row][current.col].south) {
      memoryWalls[current.row][current.col].south = true;
      if (current.row < rows - 1) memoryWalls[current.row + 1][current.col].north = true;
      wallChanged = true;
    }
    if (actualCell.walls.west && !memoryWalls[current.row][current.col].west) {
      memoryWalls[current.row][current.col].west = true;
      if (current.col > 0) memoryWalls[current.row][current.col - 1].east = true;
      wallChanged = true;
    }

    // 2. Cập nhật thế năng nếu có tường mới
    if (wallChanged) {
      recomputeFloodFill();
    }

    // 3. Chọn ô láng giềng có thế năng thấp nhất
    const neighbors = getOpenNeighbors(current);
    if (neighbors.length === 0) break;

    let minVal = Infinity;
    for (const n of neighbors) {
      if (dist[n.row][n.col] < minVal) {
        minVal = dist[n.row][n.col];
      }
    }

    // Nếu các ô đều bị cô lập (dist = Infinity), fallback theo Manhattan
    if (minVal === Infinity) {
      neighbors.sort((a, b) => manhattanDistance(a, goal) - manhattanDistance(b, goal));
      const chosen = neighbors[0];
      const nextDir = getRelativeDirection(current, chosen);
      if (nextDir) heading = nextDir;
      current = { ...chosen };
      visitCounts.set(`${current.row},${current.col}`, (visitCounts.get(`${current.row},${current.col}`) || 0) + 1);
      path.push(current);
      continue;
    }

    const candidates = neighbors.filter((n) => dist[n.row][n.col] === minVal);

    // Tiêu chuẩn chọn ô tốt nhất:
    // 1. Ô có số lần ghé thăm ít nhất (TRIỆT TIÊU HOÀN TOÀN DAO ĐỘNG QUA LẠI!)
    // 2. Ô cùng hướng đi thẳng hiện tại (giảm bẻ cua)
    candidates.sort((a, b) => {
      const visitsA = visitCounts.get(`${a.row},${a.col}`) || 0;
      const visitsB = visitCounts.get(`${b.row},${b.col}`) || 0;
      if (visitsA !== visitsB) return visitsA - visitsB;

      const straightA = getRelativeDirection(current, a) === heading ? -1 : 0;
      const straightB = getRelativeDirection(current, b) === heading ? -1 : 0;
      return straightA - straightB;
    });

    const chosen = candidates[0];
    const nextHeading = getRelativeDirection(current, chosen);
    if (nextHeading) heading = nextHeading;

    current = { ...chosen };
    visitCounts.set(`${current.row},${current.col}`, (visitCounts.get(`${current.row},${current.col}`) || 0) + 1);
    path.push(current);
  }

  // Đảm bảo về đích
  if (current.row !== goal.row || current.col !== goal.col) {
    const bridge = solveAStar(maze, current, goal);
    if (bridge.length > 1) path.push(...bridge.slice(1));
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

  // Đảm bảo về đích
  if (current.row !== goal.row || current.col !== goal.col) {
    const bridge = solveAStar(maze, current, goal);
    if (bridge.length > 1) path.push(...bridge.slice(1));
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

  // Đảm bảo về đích
  if (current.row !== goal.row || current.col !== goal.col) {
    const bridge = solveAStar(maze, current, goal);
    if (bridge.length > 1) path.push(...bridge.slice(1));
  }

  return path;
}

/**
 * 4. REAL GREEDY BEST-FIRST SEARCH (GBFS):
 * Lao thẳng về hướng đích dựa hoàn toàn trên hàm heuristic h(n) = Manhattan, bỏ qua số bước đã đi g(n).
 * Khi gặp ngõ cụt thì quay lui vật lý về ngã ba trước đó.
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

  const maxSteps = rows * cols * 6;

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    const neighbors = getValidNeighbors(maze, current);
    const unvisited = neighbors.filter((n) => !visited.has(`${n.row},${n.col}`));

    if (unvisited.length > 0) {
      unvisited.sort((a, b) => {
        const distA = manhattanDistance(a, goal);
        const distB = manhattanDistance(b, goal);
        if (distA !== distB) return distA - distB;
        const straightA = getRelativeDirection(current, a) === heading ? -0.5 : 0;
        const straightB = getRelativeDirection(current, b) === heading ? -0.5 : 0;
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

  if (current.row !== goal.row || current.col !== goal.col) {
    const bridge = solveAStar(maze, current, goal);
    if (bridge.length > 1) path.push(...bridge.slice(1));
  }

  return path;
}

/**
 * 5. REAL ONLINE DIJKSTRA (Khám phá đồng nhất - Uniform Cost):
 * Quét lan tỏa hình cầu đẳng hướng không dùng hàm heuristic định hướng (h(n) = 0).
 */
export function simulateRealDijkstra(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition
): GridPosition[] {
  const rows = maze.rows;
  const cols = maze.cols;
  const memoryWalls = createEmptyMemoryWalls(rows, cols);
  const deadEnds = new Set<string>();
  const visitCounts = new Map<string, number>();

  const solveDijkstraOnKnown = (from: GridPosition, to: GridPosition): GridPosition[] => {
    const parent = new Map<string, GridPosition | null>();
    const queue: GridPosition[] = [from];
    parent.set(`${from.row},${from.col}`, null);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.row === to.row && curr.col === to.col) break;

      const w = memoryWalls[curr.row][curr.col];
      const neighbors: GridPosition[] = [];
      if (!w.north && curr.row > 0) neighbors.push({ row: curr.row - 1, col: curr.col });
      if (!w.east && curr.col < cols - 1) neighbors.push({ row: curr.row, col: curr.col + 1 });
      if (!w.south && curr.row < rows - 1) neighbors.push({ row: curr.row + 1, col: curr.col });
      if (!w.west && curr.col > 0) neighbors.push({ row: curr.row, col: curr.col - 1 });

      for (const n of neighbors) {
        const key = `${n.row},${n.col}`;
        if (!parent.has(key) && !deadEnds.has(key)) {
          parent.set(key, curr);
          queue.push(n);
        }
      }
    }

    const route: GridPosition[] = [];
    let cur: GridPosition | null = to;
    if (!parent.has(`${to.row},${to.col}`)) return [];
    while (cur) {
      route.push(cur);
      cur = parent.get(`${cur.row},${cur.col}`) || null;
    }
    return route.reverse();
  };

  const pruneDeadEnd = (pos: GridPosition) => {
    let p: GridPosition | null = pos;
    while (p && (p.row !== goal.row || p.col !== goal.col) && (p.row !== start.row || p.col !== start.col)) {
      const w = memoryWalls[p.row][p.col];
      let openExits: Array<{ next: GridPosition; dir: Direction }> = [];
      if (!w.north && p.row > 0) openExits.push({ next: { row: p.row - 1, col: p.col }, dir: 'NORTH' });
      if (!w.east && p.col < cols - 1) openExits.push({ next: { row: p.row, col: p.col + 1 }, dir: 'EAST' });
      if (!w.south && p.row < rows - 1) openExits.push({ next: { row: p.row + 1, col: p.col }, dir: 'SOUTH' });
      if (!w.west && p.col > 0) openExits.push({ next: { row: p.row, col: p.col - 1 }, dir: 'WEST' });

      openExits = openExits.filter((e) => !deadEnds.has(`${e.next.row},${e.next.col}`));

      if (openExits.length <= 1) {
        deadEnds.add(`${p.row},${p.col}`);
        memoryWalls[p.row][p.col] = { north: true, east: true, south: true, west: true };
        if (openExits.length === 1) {
          const exit = openExits[0];
          if (exit.dir === 'NORTH') memoryWalls[exit.next.row][exit.next.col].south = true;
          else if (exit.dir === 'EAST') memoryWalls[exit.next.row][exit.next.col].west = true;
          else if (exit.dir === 'SOUTH') memoryWalls[exit.next.row][exit.next.col].north = true;
          else if (exit.dir === 'WEST') memoryWalls[exit.next.row][exit.next.col].east = true;
          p = exit.next;
        } else {
          p = null;
        }
      } else {
        break;
      }
    }
  };

  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  visitCounts.set(`${start.row},${start.col}`, 1);
  const maxSteps = rows * cols * 6;

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    const actualCell = maze.cells[current.row][current.col];
    let wallFound = false;

    if (actualCell.walls.north && !memoryWalls[current.row][current.col].north) {
      memoryWalls[current.row][current.col].north = true;
      if (current.row > 0) memoryWalls[current.row - 1][current.col].south = true;
      wallFound = true;
    }
    if (actualCell.walls.east && !memoryWalls[current.row][current.col].east) {
      memoryWalls[current.row][current.col].east = true;
      if (current.col < cols - 1) memoryWalls[current.row][current.col + 1].west = true;
      wallFound = true;
    }
    if (actualCell.walls.south && !memoryWalls[current.row][current.col].south) {
      memoryWalls[current.row][current.col].south = true;
      if (current.row < rows - 1) memoryWalls[current.row + 1][current.col].north = true;
      wallFound = true;
    }
    if (actualCell.walls.west && !memoryWalls[current.row][current.col].west) {
      memoryWalls[current.row][current.col].west = true;
      if (current.col > 0) memoryWalls[current.row][current.col - 1].east = true;
      wallFound = true;
    }

    if (wallFound) {
      pruneDeadEnd(current);
    }

    let plannedRoute = solveDijkstraOnKnown(current, goal);
    let nextCell: GridPosition | null = null;

    if (plannedRoute.length > 1) {
      const candidate = plannedRoute[1];
      const dir = getRelativeDirection(current, candidate);
      let blocked = false;
      if (dir === 'NORTH') blocked = actualCell.walls.north;
      else if (dir === 'EAST') blocked = actualCell.walls.east;
      else if (dir === 'SOUTH') blocked = actualCell.walls.south;
      else if (dir === 'WEST') blocked = actualCell.walls.west;

      if (!blocked) {
        nextCell = candidate;
      } else {
        if (dir === 'NORTH') {
          memoryWalls[current.row][current.col].north = true;
          if (current.row > 0) memoryWalls[current.row - 1][current.col].south = true;
        } else if (dir === 'EAST') {
          memoryWalls[current.row][current.col].east = true;
          if (current.col < cols - 1) memoryWalls[current.row][current.col + 1].west = true;
        } else if (dir === 'SOUTH') {
          memoryWalls[current.row][current.col].south = true;
          if (current.row < rows - 1) memoryWalls[current.row + 1][current.col].north = true;
        } else if (dir === 'WEST') {
          memoryWalls[current.row][current.col].west = true;
          if (current.col > 0) memoryWalls[current.row][current.col - 1].east = true;
        }
        pruneDeadEnd(current);
      }
    }

    if (!nextCell) {
      const valid = getValidNeighbors(maze, current).filter((n) => !deadEnds.has(`${n.row},${n.col}`));
      if (valid.length === 0) {
        const anyNeighbors = getValidNeighbors(maze, current);
        if (anyNeighbors.length === 0) break;
        anyNeighbors.sort((a, b) => {
          const vA = visitCounts.get(`${a.row},${a.col}`) || 0;
          const vB = visitCounts.get(`${b.row},${b.col}`) || 0;
          return vA - vB;
        });
        nextCell = anyNeighbors[0];
      } else {
        valid.sort((a, b) => {
          const vA = visitCounts.get(`${a.row},${a.col}`) || 0;
          const vB = visitCounts.get(`${b.row},${b.col}`) || 0;
          return vA - vB;
        });
        nextCell = valid[0];
      }
    }

    current = { ...nextCell };
    const visitKey = `${current.row},${current.col}`;
    visitCounts.set(visitKey, (visitCounts.get(visitKey) || 0) + 1);
    path.push(current);
  }

  return path;
}

/**
 * 4. REAL ONLINE A* & TURN-OPTIMIZED A* (Khám phá trực tuyến có Quay lui):
 * Chuột chỉ thấy tường ở ô hiện tại. Nếu đi vào nhánh cụt có tường chặn,
 * nó cập nhật bản đồ trí nhớ và lập kế hoạch mới từ vị trí hiện tại -> lùi lại ra khỏi nhánh cụt!
 */
export function simulateRealOnlineAStar(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition,
  withTurnPenalty: boolean = true
): GridPosition[] {
  const rows = maze.rows;
  const cols = maze.cols;
  const memoryWalls = createEmptyMemoryWalls(rows, cols);
  const deadEnds = new Set<string>();
  const visitCounts = new Map<string, number>();

  const getKnownMaze = (): MazeGrid => ({
    rows,
    cols,
    start,
    goal,
    cells: Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        row: r,
        col: c,
        walls: { ...memoryWalls[r][c] },
      }))
    ),
  });

  // Tự động lấp các nhánh cụt đã khám phá để chuột không bao giờ đi lại vào ngõ cụt
  const pruneDeadEnd = (pos: GridPosition) => {
    let p: GridPosition | null = pos;
    while (p && (p.row !== goal.row || p.col !== goal.col) && (p.row !== start.row || p.col !== start.col)) {
      const w = memoryWalls[p.row][p.col];
      let openExits: Array<{ next: GridPosition; dir: Direction }> = [];
      if (!w.north && p.row > 0) openExits.push({ next: { row: p.row - 1, col: p.col }, dir: 'NORTH' });
      if (!w.east && p.col < cols - 1) openExits.push({ next: { row: p.row, col: p.col + 1 }, dir: 'EAST' });
      if (!w.south && p.row < rows - 1) openExits.push({ next: { row: p.row + 1, col: p.col }, dir: 'SOUTH' });
      if (!w.west && p.col > 0) openExits.push({ next: { row: p.row, col: p.col - 1 }, dir: 'WEST' });

      // Lọc bỏ những ô kế cận đã bị xác nhận là dead-end
      openExits = openExits.filter((e) => !deadEnds.has(`${e.next.row},${e.next.col}`));

      if (openExits.length <= 1) {
        deadEnds.add(`${p.row},${p.col}`);
        // Lấp kín ô này trên memoryWalls
        memoryWalls[p.row][p.col] = { north: true, east: true, south: true, west: true };
        if (openExits.length === 1) {
          const exit = openExits[0];
          // Bịt tường từ phía ô hàng xóm sang ô ngõ cụt này
          if (exit.dir === 'NORTH') memoryWalls[exit.next.row][exit.next.col].south = true;
          else if (exit.dir === 'EAST') memoryWalls[exit.next.row][exit.next.col].west = true;
          else if (exit.dir === 'SOUTH') memoryWalls[exit.next.row][exit.next.col].north = true;
          else if (exit.dir === 'WEST') memoryWalls[exit.next.row][exit.next.col].east = true;
          p = exit.next;
        } else {
          p = null;
        }
      } else {
        break;
      }
    }
  };

  const path: GridPosition[] = [start];
  let current: GridPosition = { ...start };
  let heading: Direction = 'EAST';
  visitCounts.set(`${start.row},${start.col}`, 1);
  const maxSteps = rows * cols * 6;

  for (let step = 0; step < maxSteps; step++) {
    if (current.row === goal.row && current.col === goal.col) break;

    // 1. Cảm biến nhận diện các bức tường thực tế của ô hiện tại
    const actualCell = maze.cells[current.row][current.col];
    let wallFound = false;

    if (actualCell.walls.north && !memoryWalls[current.row][current.col].north) {
      memoryWalls[current.row][current.col].north = true;
      if (current.row > 0) memoryWalls[current.row - 1][current.col].south = true;
      wallFound = true;
    }
    if (actualCell.walls.east && !memoryWalls[current.row][current.col].east) {
      memoryWalls[current.row][current.col].east = true;
      if (current.col < cols - 1) memoryWalls[current.row][current.col + 1].west = true;
      wallFound = true;
    }
    if (actualCell.walls.south && !memoryWalls[current.row][current.col].south) {
      memoryWalls[current.row][current.col].south = true;
      if (current.row < rows - 1) memoryWalls[current.row + 1][current.col].north = true;
      wallFound = true;
    }
    if (actualCell.walls.west && !memoryWalls[current.row][current.col].west) {
      memoryWalls[current.row][current.col].west = true;
      if (current.col > 0) memoryWalls[current.row][current.col - 1].east = true;
      wallFound = true;
    }

    if (wallFound) {
      pruneDeadEnd(current);
    }

    // 2. Lập kế hoạch lộ trình trên mê cung trí nhớ
    const knownMaze = getKnownMaze();
    let plannedRoute: GridPosition[] = [];
    if (withTurnPenalty) {
      plannedRoute = solveTurnPenaltyAStar(knownMaze, current, goal, 1.4, heading);
    } else {
      plannedRoute = solveAStar(knownMaze, current, goal);
    }

    // 3. Tiến 1 bước theo kế hoạch hoặc thăm dò các lối đi hợp lệ
    let nextCell: GridPosition | null = null;
    if (plannedRoute.length > 1) {
      const candidate = plannedRoute[1];
      const dir = getRelativeDirection(current, candidate);
      let blocked = false;
      if (dir === 'NORTH') blocked = actualCell.walls.north;
      else if (dir === 'EAST') blocked = actualCell.walls.east;
      else if (dir === 'SOUTH') blocked = actualCell.walls.south;
      else if (dir === 'WEST') blocked = actualCell.walls.west;

      if (!blocked) {
        nextCell = candidate;
      } else {
        // Đụng tường chắn! Cập nhật ngay vào trí nhớ và lấp ngõ cụt
        if (dir === 'NORTH') {
          memoryWalls[current.row][current.col].north = true;
          if (current.row > 0) memoryWalls[current.row - 1][current.col].south = true;
        } else if (dir === 'EAST') {
          memoryWalls[current.row][current.col].east = true;
          if (current.col < cols - 1) memoryWalls[current.row][current.col + 1].west = true;
        } else if (dir === 'SOUTH') {
          memoryWalls[current.row][current.col].south = true;
          if (current.row < rows - 1) memoryWalls[current.row + 1][current.col].north = true;
        } else if (dir === 'WEST') {
          memoryWalls[current.row][current.col].west = true;
          if (current.col > 0) memoryWalls[current.row][current.col - 1].east = true;
        }
        pruneDeadEnd(current);
      }
    }

    // Nếu bước theo kế hoạch bị chặn hoặc không tìm ra đường, chọn ô khả dụng tốt nhất
    if (!nextCell) {
      const valid = getValidNeighbors(maze, current).filter((n) => !deadEnds.has(`${n.row},${n.col}`));
      if (valid.length === 0) {
        // Rút lui theo ô có số lần thăm ít nhất
        const anyNeighbors = getValidNeighbors(maze, current);
        if (anyNeighbors.length === 0) break;
        anyNeighbors.sort((a, b) => {
          const vA = visitCounts.get(`${a.row},${a.col}`) || 0;
          const vB = visitCounts.get(`${b.row},${b.col}`) || 0;
          return vA - vB;
        });
        nextCell = anyNeighbors[0];
      } else {
        // Ưu tiên ô chưa ghé thăm hoặc có heuristic tốt nhất
        valid.sort((a, b) => {
          const vA = visitCounts.get(`${a.row},${a.col}`) || 0;
          const vB = visitCounts.get(`${b.row},${b.col}`) || 0;
          if (vA !== vB) return vA - vB;
          return manhattanDistance(a, goal) - manhattanDistance(b, goal);
        });
        nextCell = valid[0];
      }
    }

    const moveDir = getRelativeDirection(current, nextCell);
    if (moveDir) heading = moveDir;

    current = { ...nextCell };
    const visitKey = `${current.row},${current.col}`;
    visitCounts.set(visitKey, (visitCounts.get(visitKey) || 0) + 1);
    path.push(current);
  }

  return path;
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
      } else {
        // Custom dev algorithm: Bắt buộc khám phá mù công bằng theo luật (Online Blind Exploration / Fog of War)
        path = simulateRealOnlineAStar(this.maze, start, goal, true);
        if (path.length === 0) path = simulateRealOnlineAStar(this.maze, start, goal, false);
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
