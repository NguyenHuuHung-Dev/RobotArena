import { Vector2D, GridPosition, Direction, MazeGrid } from '@robot-arena/shared-types';

/**
 * Normalizes an angle in degrees to the [0, 360) range.
 */
export function normalizeAngle(degrees: number): number {
  let angle = degrees % 360;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

/**
 * Calculates the shortest angular difference from current to target angle (-180 to 180 degrees).
 */
export function angleDifference(targetDeg: number, currentDeg: number): number {
  let diff = (targetDeg - currentDeg) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Calculates Euclidean distance between two 2D points.
 */
export function distance(p1: Vector2D, p2: Vector2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates bearing angle in degrees from point A to point B.
 */
export function angleTo(from: Vector2D, to: Vector2D): number {
  const radians = Math.atan2(to.y - from.y, to.x - from.x);
  const degrees = (radians * 180) / Math.PI;
  return normalizeAngle(degrees);
}

/**
 * Clamps a number between min and max bounds.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ---------------------------------------------------------------------------
// Maze & Graph Pathfinding Math
// ---------------------------------------------------------------------------

/**
 * Calculates Manhattan distance (L1 norm) between two grid positions.
 */
export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

/**
 * Calculates Euclidean distance (L2 norm) between two grid positions.
 */
export function euclideanDistance(a: GridPosition, b: GridPosition): number {
  const dr = a.row - b.row;
  const dc = a.col - b.col;
  return Math.sqrt(dr * dr + dc * dc);
}

/**
 * Direction coordinate offsets.
 */
export const DIRECTION_OFFSETS: Record<Direction, { row: number; col: number }> = {
  NORTH: { row: -1, col: 0 },
  EAST: { row: 0, col: 1 },
  SOUTH: { row: 1, col: 0 },
  WEST: { row: 0, col: -1 },
};

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  NORTH: 'SOUTH',
  EAST: 'WEST',
  SOUTH: 'NORTH',
  WEST: 'EAST',
};

/**
 * Determines cardinal direction from position A to adjacent position B.
 */
export function getRelativeDirection(from: GridPosition, to: GridPosition): Direction | null {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (dr === -1 && dc === 0) return 'NORTH';
  if (dr === 1 && dc === 0) return 'SOUTH';
  if (dr === 0 && dc === 1) return 'EAST';
  if (dr === 0 && dc === -1) return 'WEST';
  return null;
}

/**
 * Returns accessible neighboring cells in the maze without wall collisions.
 */
export function getValidNeighbors(maze: MazeGrid, pos: GridPosition): GridPosition[] {
  const neighbors: GridPosition[] = [];
  const cell = maze.cells[pos.row]?.[pos.col];
  if (!cell) return neighbors;

  // North
  if (!cell.walls.north && pos.row > 0) {
    neighbors.push({ row: pos.row - 1, col: pos.col });
  }
  // East
  if (!cell.walls.east && pos.col < maze.cols - 1) {
    neighbors.push({ row: pos.row, col: pos.col + 1 });
  }
  // South
  if (!cell.walls.south && pos.row < maze.rows - 1) {
    neighbors.push({ row: pos.row + 1, col: pos.col });
  }
  // West
  if (!cell.walls.west && pos.col > 0) {
    neighbors.push({ row: pos.row, col: pos.col - 1 });
  }

  return neighbors;
}

/**
 * Counts the number of direction changes (90-degree turns) along a grid path.
 */
export function calculatePathTurns(path: GridPosition[]): number {
  if (path.length < 3) return 0;
  let turns = 0;
  let prevDir = getRelativeDirection(path[0], path[1]);

  for (let i = 1; i < path.length - 1; i++) {
    const curDir = getRelativeDirection(path[i], path[i + 1]);
    if (prevDir && curDir && prevDir !== curDir) {
      turns++;
    }
    prevDir = curDir;
  }
  return turns;
}

/**
 * Generates smoothed path waypoints that cut and round sharp 90-degree corners.
 * Produces curved, continuous points for fluid rendering and navigation.
 */
export function smoothPathWaypoints(path: GridPosition[], pointsPerTurn: number = 4): Vector2D[] {
  if (path.length <= 1) {
    return path.map((p) => ({ x: p.col, y: p.row }));
  }

  const result: Vector2D[] = [{ x: path[0].col, y: path[0].row }];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    const dirIn = getRelativeDirection(prev, curr);
    const dirOut = getRelativeDirection(curr, next);

    const isUTurn =
      (dirIn === 'NORTH' && dirOut === 'SOUTH') ||
      (dirIn === 'SOUTH' && dirOut === 'NORTH') ||
      (dirIn === 'EAST' && dirOut === 'WEST') ||
      (dirIn === 'WEST' && dirOut === 'EAST');

    if (isUTurn || dirIn === dirOut) {
      // Reached dead end or going straight - keep cell center point
      result.push({ x: curr.col, y: curr.row });
    } else {
      // 90-degree corner turn! Subdivide to create a rounded Bezier transition
      const enterX = curr.col - (curr.col - prev.col) * 0.4;
      const enterY = curr.row - (curr.row - prev.row) * 0.4;

      const exitX = curr.col + (next.col - curr.col) * 0.4;
      const exitY = curr.row + (next.row - curr.row) * 0.4;

      // Quadratic Bezier interpolation around the corner
      for (let step = 0; step <= pointsPerTurn; step++) {
        const t = step / pointsPerTurn;
        const omt = 1 - t;
        // B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
        const bx = omt * omt * enterX + 2 * omt * t * curr.col + t * t * exitX;
        const by = omt * omt * enterY + 2 * omt * t * curr.row + t * t * exitY;
        result.push({ x: bx, y: by });
      }
    }
  }

  // Add final point
  const last = path[path.length - 1];
  result.push({ x: last.col, y: last.row });

  return result;
}

/**
 * Minimum binary heap Priority Queue for Dijkstra & A* pathfinders.
 */
export class PriorityQueue<T> {
  private elements: Array<{ item: T; priority: number }> = [];

  push(item: T, priority: number): void {
    this.elements.push({ item, priority });
    this.bubbleUp(this.elements.length - 1);
  }

  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    const top = this.elements[0].item;
    const bottom = this.elements.pop()!;
    if (this.elements.length > 0) {
      this.elements[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }

  get size(): number {
    return this.elements.length;
  }

  private bubbleUp(index: number): void {
    const element = this.elements[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.elements[parentIndex];
      if (element.priority >= parent.priority) break;
      this.elements[index] = parent;
      this.elements[parentIndex] = element;
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.elements.length;
    const element = this.elements[index];
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swapIndex: number | null = null;

      if (leftChildIndex < length) {
        if (this.elements[leftChildIndex].priority < element.priority) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const compareWith = swapIndex === null ? element.priority : this.elements[leftChildIndex].priority;
        if (this.elements[rightChildIndex].priority < compareWith) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;
      this.elements[index] = this.elements[swapIndex];
      this.elements[swapIndex] = element;
      index = swapIndex;
    }
  }
}

/**
 * Standard A* search algorithm with Manhattan heuristic.
 */
export function solveAStar(maze: MazeGrid, start: GridPosition, goal: GridPosition): GridPosition[] {
  const pq = new PriorityQueue<GridPosition>();
  const toKey = (p: GridPosition) => `${p.row},${p.col}`;

  const gScore = new Map<string, number>();
  const parentMap = new Map<string, GridPosition>();

  gScore.set(toKey(start), 0);
  pq.push(start, manhattanDistance(start, goal));

  while (!pq.isEmpty()) {
    const current = pq.pop()!;
    if (current.row === goal.row && current.col === goal.col) {
      const path: GridPosition[] = [];
      let curr: GridPosition | undefined = current;
      while (curr) {
        path.unshift(curr);
        curr = parentMap.get(toKey(curr));
      }
      return path;
    }

    const currentKey = toKey(current);
    const currentG = gScore.get(currentKey) ?? Infinity;
    const neighbors = getValidNeighbors(maze, current);

    for (const neighbor of neighbors) {
      const neighborKey = toKey(neighbor);
      const tentativeG = currentG + 1;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        parentMap.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        const fScore = tentativeG + manhattanDistance(neighbor, goal);
        pq.push(neighbor, fScore);
      }
    }
  }

  return [];
}

/**
 * Turn-Penalty A* Search:
 * Penalizes direction changes (90-degree turns).
 * Actively chooses long straight corridors over zig-zags, yielding significantly faster and smoother real-world mouse motion!
 */
export function solveTurnPenaltyAStar(
  maze: MazeGrid,
  start: GridPosition,
  goal: GridPosition,
  turnPenalty: number = 0.6,
  initialHeading: Direction | null = null
): GridPosition[] {
  interface NodeState {
    pos: GridPosition;
    heading: Direction | null;
  }

  const pq = new PriorityQueue<NodeState>();
  const toKey = (pos: GridPosition, heading: Direction | null) => `${pos.row},${pos.col},${heading ?? 'NONE'}`;

  const gScore = new Map<string, number>();
  const parentMap = new Map<string, NodeState>();

  const startState: NodeState = { pos: start, heading: initialHeading };
  gScore.set(toKey(start, initialHeading), 0);
  pq.push(startState, manhattanDistance(start, goal));

  let bestGoalNode: NodeState | null = null;
  let minGoalCost = Infinity;

  while (!pq.isEmpty()) {
    const current = pq.pop()!;
    const currentKey = toKey(current.pos, current.heading);
    const currentG = gScore.get(currentKey) ?? Infinity;

    if (current.pos.row === goal.row && current.pos.col === goal.col) {
      if (currentG < minGoalCost) {
        minGoalCost = currentG;
        bestGoalNode = current;
      }
      break;
    }

    const neighbors = getValidNeighbors(maze, current.pos);

    for (const neighbor of neighbors) {
      const moveDir = getRelativeDirection(current.pos, neighbor);
      if (!moveDir) continue;

      // Turn penalty applies if changing from an existing heading
      const isTurn = current.heading !== null && current.heading !== moveDir;
      const stepCost = 1.0 + (isTurn ? turnPenalty : 0);
      const tentativeG = currentG + stepCost;

      const neighborState: NodeState = { pos: neighbor, heading: moveDir };
      const neighborKey = toKey(neighbor, moveDir);

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        parentMap.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        const fScore = tentativeG + manhattanDistance(neighbor, goal);
        pq.push(neighborState, fScore);
      }
    }
  }

  if (!bestGoalNode) return [];

  // Reconstruct path
  const path: GridPosition[] = [];
  let curr: NodeState | undefined = bestGoalNode;
  while (curr) {
    path.unshift(curr.pos);
    curr = parentMap.get(toKey(curr.pos, curr.heading));
  }
  return path;
}

/**
 * Solves the shortest path using Breadth-First Search (BFS).
 */
export function solveBFS(maze: MazeGrid, start: GridPosition, goal: GridPosition): GridPosition[] {
  const queue: GridPosition[] = [start];
  const visited = new Set<string>();
  const parentMap = new Map<string, GridPosition>();

  const toKey = (p: GridPosition) => `${p.row},${p.col}`;
  visited.add(toKey(start));

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.row === goal.row && current.col === goal.col) {
      const path: GridPosition[] = [];
      let curr: GridPosition | undefined = current;
      while (curr) {
        path.unshift(curr);
        curr = parentMap.get(toKey(curr));
      }
      return path;
    }

    const neighbors = getValidNeighbors(maze, current);
    for (const neighbor of neighbors) {
      const key = toKey(neighbor);
      if (!visited.has(key)) {
        visited.add(key);
        parentMap.set(key, current);
        queue.push(neighbor);
      }
    }
  }

  return [];
}

/**
 * Computes a standard Micromouse Flood Fill distance transform matrix.
 */
export function computeFloodFillMatrix(maze: MazeGrid, goal: GridPosition): number[][] {
  const dist: number[][] = Array.from({ length: maze.rows }, () =>
    Array(maze.cols).fill(Infinity)
  );

  const queue: GridPosition[] = [goal];
  dist[goal.row][goal.col] = 0;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currentDist = dist[curr.row][curr.col];
    const neighbors = getValidNeighbors(maze, curr);

    for (const n of neighbors) {
      if (dist[n.row][n.col] === Infinity) {
        dist[n.row][n.col] = currentDist + 1;
        queue.push(n);
      }
    }
  }

  return dist;
}
