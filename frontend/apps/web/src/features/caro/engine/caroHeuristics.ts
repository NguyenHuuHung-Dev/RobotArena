import { Board, BOARD_SIZE, Player, WinLine } from './caroTypes';

export const SCORES = {
  WIN: 100000000,
  OPEN_4: 10000000,
  BLOCKED_4: 100000,
  OPEN_3: 50000,
  BLOCKED_3: 5000,
  OPEN_2: 1000,
  BLOCKED_2: 100,
  OPEN_1: 10,
};

const DIRECTIONS: [number, number][] = [
  [0, 1],   // Ngang
  [1, 0],   // Dọc
  [1, 1],   // Chéo chính
  [1, -1],  // Chéo phụ
];

/**
 * Kiểm tra xem bàn cờ đã có người thắng (5 quân liên tiếp) hay chưa
 */
export function checkWin(board: Board, lastRow?: number, lastCol?: number): WinLine | null {
  const checkCells = (r: number, c: number, dr: number, dc: number): WinLine | null => {
    const player = board[r][c];
    if (!player) return null;

    const cells: [number, number][] = [[r, c]];

    // Đi xuôi theo hướng
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] === player) {
        cells.push([nr, nc]);
        step++;
      } else {
        break;
      }
    }

    // Đi ngược lại
    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] === player) {
        cells.unshift([nr, nc]);
        step++;
      } else {
        break;
      }
    }

    if (cells.length >= 5) {
      return {
        cells,
        winner: player,
      };
    }
    return null;
  };

  if (lastRow !== undefined && lastCol !== undefined) {
    for (const [dr, dc] of DIRECTIONS) {
      const result = checkCells(lastRow, lastCol, dr, dc);
      if (result) return result;
    }
    return null;
  }

  // Quét toàn bộ bàn cờ nếu không truyền vị trí
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c]) {
        for (const [dr, dc] of DIRECTIONS) {
          const result = checkCells(r, c, dr, dc);
          if (result) return result;
        }
      }
    }
  }

  return null;
}

/**
 * Kiểm tra nhanh xem 1 nước đi có tạo thành chuỗi 5 hay không (chạy trong 0.01ms)
 */
export function isWinningMove(board: Board, r: number, c: number, player: Player): boolean {
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let step = 1;
    while (true) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] !== player) break;
      count++;
      step++;
    }
    step = 1;
    while (true) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] !== player) break;
      count++;
      step++;
    }
    if (count >= 5) return true;
  }
  return false;
}

/**
 * Đánh giá điểm cục bộ cực nhanh của một vị trí (r, c) cho một người chơi
 */
export function evaluatePoint(board: Board, r: number, c: number, player: Player): number {
  let totalScore = 0;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    // Chiều xuôi
    let step = 1;
    while (step <= 4) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] === player) {
        count++;
        step++;
      } else if (board[nr][nc] === null) {
        openEnds++;
        break;
      } else {
        break;
      }
    }

    // Chiều ngược
    step = 1;
    while (step <= 4) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr][nc] === player) {
        count++;
        step++;
      } else if (board[nr][nc] === null) {
        openEnds++;
        break;
      } else {
        break;
      }
    }

    if (count >= 5) {
      totalScore += SCORES.WIN;
    } else if (count === 4) {
      if (openEnds === 2) totalScore += SCORES.OPEN_4;
      else if (openEnds === 1) totalScore += SCORES.BLOCKED_4;
    } else if (count === 3) {
      if (openEnds === 2) totalScore += SCORES.OPEN_3;
      else if (openEnds === 1) totalScore += SCORES.BLOCKED_3;
    } else if (count === 2) {
      if (openEnds === 2) totalScore += SCORES.OPEN_2;
      else if (openEnds === 1) totalScore += SCORES.BLOCKED_2;
    } else if (count === 1 && openEnds === 2) {
      totalScore += SCORES.OPEN_1;
    }
  }

  // Ưu tiên kiểm soát vùng trung tâm
  const centerDist = Math.abs(r - 7) + Math.abs(c - 7);
  totalScore += Math.max(0, 14 - centerDist);

  return totalScore;
}

/**
 * Tìm các ô lân cận các quân cờ đã đánh (Candidate Moves)
 * Tối ưu hóa cực đại: không dùng Set chuỗi, không cấp phát bộ nhớ thừa
 */
export function getCandidateMoves(board: Board): [number, number][] {
  const candidates: [number, number][] = [];
  let hasPieces = false;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        hasPieces = true;
        continue;
      }

      // Kiểm tra xem ô rỗng này có quân cờ ở 8 ô xung quanh không
      let hasNeighbor = false;
      for (let dr = -1; dr <= 1 && !hasNeighbor; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (
            nr >= 0 &&
            nr < BOARD_SIZE &&
            nc >= 0 &&
            nc < BOARD_SIZE &&
            board[nr][nc] !== null
          ) {
            hasNeighbor = true;
            break;
          }
        }
      }

      if (hasNeighbor) {
        candidates.push([r, c]);
      }
    }
  }

  if (!hasPieces) {
    return [[7, 7]];
  }

  return candidates;
}
