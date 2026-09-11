import type { MazeGrid, MazeCell, GridPosition, Direction } from '@robot-arena/shared-types';

export type GoalPositionSetting = 'center' | 'bottom-right' | 'top-right' | 'bottom-left' | 'random' | 'corner';

export interface MazeGeneratorOptions {
  rows: number;
  cols: number;
  braidFactor?: number; // 0.0 (strict tree/perfect maze) to 0.6 (many loops/alternative paths)
  goalPosition?: GoalPositionSetting;
  guaranteeEarlyBranching?: boolean; // Mở 2 nhánh xuất phát độc lập ngay tại (0, 0)
}

/**
 * Procedurally generates a solvable maze using the Recursive Backtracker algorithm.
 * Guarantees a fully connected maze with early branching and versatile goal locations.
 */
export function generateMaze(options: MazeGeneratorOptions): MazeGrid {
  const rows = Math.max(7, options.rows % 2 === 0 ? options.rows + 1 : options.rows);
  const cols = Math.max(7, options.cols % 2 === 0 ? options.cols + 1 : options.cols);
  const braidFactor = options.braidFactor ?? 0.3;
  const guaranteeEarlyBranching = options.guaranteeEarlyBranching ?? true;

  // Initialize cells with all walls closed
  const cells: MazeCell[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = {
        row: r,
        col: c,
        walls: { north: true, east: true, south: true, west: true },
      };
    }
  }

  // Recursive backtracker maze generation
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack: GridPosition[] = [{ row: 0, col: 0 }];
  visited[0][0] = true;

  const getUnvisitedNeighbors = (pos: GridPosition): Array<{ pos: GridPosition; dir: Direction }> => {
    const list: Array<{ pos: GridPosition; dir: Direction }> = [];
    const { row, col } = pos;

    if (row > 0 && !visited[row - 1][col]) list.push({ pos: { row: row - 1, col }, dir: 'NORTH' });
    if (col < cols - 1 && !visited[row][col + 1]) list.push({ pos: { row, col: col + 1 }, dir: 'EAST' });
    if (row < rows - 1 && !visited[row + 1][col]) list.push({ pos: { row: row + 1, col }, dir: 'SOUTH' });
    if (col > 0 && !visited[row][col - 1]) list.push({ pos: { row, col: col - 1 }, dir: 'WEST' });

    return list;
  };

  const removeWallBetween = (current: GridPosition, next: GridPosition, dir: Direction) => {
    if (dir === 'NORTH') {
      cells[current.row][current.col].walls.north = false;
      cells[next.row][next.col].walls.south = false;
    } else if (dir === 'EAST') {
      cells[current.row][current.col].walls.east = false;
      cells[next.row][next.col].walls.west = false;
    } else if (dir === 'SOUTH') {
      cells[current.row][current.col].walls.south = false;
      cells[next.row][next.col].walls.north = false;
    } else if (dir === 'WEST') {
      cells[current.row][current.col].walls.west = false;
      cells[next.row][next.col].walls.east = false;
    }
  };

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current);

    if (neighbors.length > 0) {
      // Pick random neighbor
      const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWallBetween(current, chosen.pos, chosen.dir);
      visited[chosen.pos.row][chosen.pos.col] = true;
      stack.push(chosen.pos);
    } else {
      stack.pop();
    }
  }

  // 1. TẠO NGÃ RẼ SỚM NGAY TẠI VẠCH XUẤT PHÁT (0, 0)
  // Mở đồng thời cả hướng ĐÔNG (0, 1) và NAM (1, 0) để các thuật toán tách đàn ngay từ tick 1!
  if (guaranteeEarlyBranching && rows > 2 && cols > 2) {
    cells[0][0].walls.east = false;
    cells[0][1].walls.west = false;

    cells[0][0].walls.south = false;
    cells[1][0].walls.north = false;

    // Đảm bảo (0, 1) có lối rẽ thông tiếp sang Đông hoặc Nam
    if (cells[0][1].walls.east && cells[0][1].walls.south) {
      if (cols > 2) {
        cells[0][1].walls.east = false;
        cells[0][2].walls.west = false;
      } else {
        cells[0][1].walls.south = false;
        cells[1][1].walls.north = false;
      }
    }

    // Đảm bảo (1, 0) có lối rẽ thông tiếp xuống Nam hoặc sang Đông
    if (cells[1][0].walls.south && cells[1][0].walls.east) {
      if (rows > 2) {
        cells[1][0].walls.south = false;
        cells[2][0].walls.north = false;
      } else {
        cells[1][0].walls.east = false;
        cells[1][1].walls.west = false;
      }
    }
  }

  // 2. TẠO VÒNG LẶP & ĐƯỜNG ĐI SONG SONG (BRAIDING)
  if (braidFactor > 0) {
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const cell = cells[r][c];
        const wallCount =
          (cell.walls.north ? 1 : 0) +
          (cell.walls.east ? 1 : 0) +
          (cell.walls.south ? 1 : 0) +
          (cell.walls.west ? 1 : 0);

        // Đục ngõ cụt tạo vòng lặp
        if (wallCount === 3 && Math.random() < braidFactor) {
          const removable: Direction[] = [];
          if (cell.walls.north && r > 0) removable.push('NORTH');
          if (cell.walls.east && c < cols - 1) removable.push('EAST');
          if (cell.walls.south && r < rows - 1) removable.push('SOUTH');
          if (cell.walls.west && c > 0) removable.push('WEST');

          if (removable.length > 0) {
            const dir = removable[Math.floor(Math.random() * removable.length)];
            const dr = dir === 'NORTH' ? -1 : dir === 'SOUTH' ? 1 : 0;
            const dc = dir === 'EAST' ? 1 : dir === 'WEST' ? -1 : 0;
            removeWallBetween({ row: r, col: c }, { row: r + dr, col: c + dc }, dir);
          }
        } else if (wallCount === 2 && Math.random() < braidFactor * 0.25) {
          // Thỉnh thoảng mở tường giữa 2 hành lang song song để tạo đường tắt (shortcut)
          if (cell.walls.east && c < cols - 1) {
            removeWallBetween({ row: r, col: c }, { row: r, col: c + 1 }, 'EAST');
          } else if (cell.walls.south && r < rows - 1) {
            removeWallBetween({ row: r, col: c }, { row: r + 1, col: c }, 'SOUTH');
          }
        }
      }
    }
  }

  const start: GridPosition = { row: 0, col: 0 };
  let goal: GridPosition;

  const goalType = options.goalPosition || 'center';

  if (goalType === 'center') {
    goal = { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
  } else if (goalType === 'bottom-right' || goalType === 'corner') {
    goal = { row: rows - 1, col: cols - 1 };
  } else if (goalType === 'top-right') {
    goal = { row: 0, col: cols - 1 };
  } else if (goalType === 'bottom-left') {
    goal = { row: rows - 1, col: 0 };
  } else if (goalType === 'random') {
    // Lấy các ô có khoảng cách Manhattan đủ xa điểm xuất phát (>= 45% tổng đường kính)
    const minDistance = Math.floor((rows + cols) * 0.45);
    const candidates: GridPosition[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r + c >= minDistance) {
          candidates.push({ row: r, col: c });
        }
      }
    }
    if (candidates.length > 0) {
      goal = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      goal = { row: rows - 1, col: cols - 1 };
    }
  } else {
    goal = { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
  }

  cells[start.row][start.col].isStart = true;
  cells[goal.row][goal.col].isGoal = true;

  return {
    rows,
    cols,
    cells,
    start,
    goal,
  };
}
