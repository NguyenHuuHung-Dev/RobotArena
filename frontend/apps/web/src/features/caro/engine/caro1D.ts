import { AIDifficulty, Board, BOARD_SIZE, Player } from './caroTypes';

export const TOTAL_CELLS = 225; // 15 x 15
export const CENTER_IDX = 7 * BOARD_SIZE + 7; // 112 (vị trí [7, 7])

export const PLAYER_EMPTY = 0;
export const PLAYER_X = 1;
export const PLAYER_O = 2;

const DIR_DELTAS: [number, number][] = [
  [0, 1],   // Ngang: dr=0, dc=1
  [1, 0],   // Dọc: dr=1, dc=0
  [1, 1],   // Chéo chính: dr=1, dc=1
  [1, -1],  // Chéo phụ: dr=1, dc=-1
];

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

export function rowColToIdx(r: number, c: number): number {
  return r * BOARD_SIZE + c;
}

export function idxToRowCol(idx: number): [number, number] {
  return [(idx / BOARD_SIZE) | 0, idx % BOARD_SIZE];
}

/**
 * Chuyển đổi mảng 2D sang mảng 1 chiều phẳng Int8Array(225)
 * Giúp tăng tốc độ truy cập bộ nhớ và tối ưu cache CPU lên 3 - 5 lần
 */
export function board2DTo1D(board: Board): Int8Array {
  const b1D = new Int8Array(TOTAL_CELLS);
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = board[r];
    const offset = r * BOARD_SIZE;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = row[c];
      if (cell === 'X') b1D[offset + c] = PLAYER_X;
      else if (cell === 'O') b1D[offset + c] = PLAYER_O;
      else b1D[offset + c] = PLAYER_EMPTY;
    }
  }
  return b1D;
}

/**
 * Kiểm tra nhanh xem 1 nước đi vừa đánh có thắng (5 quân liên tiếp) trên mảng 1D hay không
 */
export function isWin1D(board: Int8Array, idx: number, playerVal: number): boolean {
  const r = (idx / BOARD_SIZE) | 0;
  const c = idx % BOARD_SIZE;

  for (let d = 0; d < 4; d++) {
    const dr = DIR_DELTAS[d][0];
    const dc = DIR_DELTAS[d][1];
    let count = 1;

    // Chiều xuôi
    let step = 1;
    while (step <= 4) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      if (board[nr * BOARD_SIZE + nc] === playerVal) {
        count++;
        step++;
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
      if (board[nr * BOARD_SIZE + nc] === playerVal) {
        count++;
        step++;
      } else {
        break;
      }
    }

    if (count >= 5) return true;
  }
  return false;
}

/**
 * Đánh giá điểm cục bộ của ô trống `idx` nếu đặt quân `playerVal`
 */
export function evaluatePoint1D(board: Int8Array, idx: number, playerVal: number): number {
  const r = (idx / BOARD_SIZE) | 0;
  const c = idx % BOARD_SIZE;
  let totalScore = 0;

  for (let d = 0; d < 4; d++) {
    const dr = DIR_DELTAS[d][0];
    const dc = DIR_DELTAS[d][1];
    let count = 1;
    let openEnds = 0;

    // Chiều xuôi
    let step = 1;
    while (step <= 4) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
      const val = board[nr * BOARD_SIZE + nc];
      if (val === playerVal) {
        count++;
        step++;
      } else if (val === PLAYER_EMPTY) {
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
      const val = board[nr * BOARD_SIZE + nc];
      if (val === playerVal) {
        count++;
        step++;
      } else if (val === PLAYER_EMPTY) {
        openEnds++;
        break;
      } else {
        break;
      }
    }

    if (count >= 5) {
      totalScore += SCORES.WIN;
    } else if (count === 4) {
      totalScore += openEnds === 2 ? SCORES.OPEN_4 : openEnds === 1 ? SCORES.BLOCKED_4 : 0;
    } else if (count === 3) {
      totalScore += openEnds === 2 ? SCORES.OPEN_3 : openEnds === 1 ? SCORES.BLOCKED_3 : 0;
    } else if (count === 2) {
      totalScore += openEnds === 2 ? SCORES.OPEN_2 : openEnds === 1 ? SCORES.BLOCKED_2 : 0;
    } else if (count === 1 && openEnds === 2) {
      totalScore += SCORES.OPEN_1;
    }
  }

  // Ưu tiên kiểm soát vùng tâm
  totalScore += Math.max(0, 14 - (Math.abs(r - 7) + Math.abs(c - 7)));
  return totalScore;
}

/**
 * Tìm các ô ứng viên lân cận quân cờ trên mảng 1D (dưới 0.1ms)
 */
export function getCandidateMoves1D(board: Int8Array): number[] {
  const flags = new Uint8Array(TOTAL_CELLS);

  for (let idx = 0; idx < TOTAL_CELLS; idx++) {
    if (board[idx] === PLAYER_EMPTY) continue;
    const r = (idx / BOARD_SIZE) | 0;
    const c = idx % BOARD_SIZE;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          const nIdx = nr * BOARD_SIZE + nc;
          if (board[nIdx] === PLAYER_EMPTY) {
            flags[nIdx] = 1;
          }
        }
      }
    }
  }

  const result: number[] = [];
  for (let idx = 0; idx < TOTAL_CELLS; idx++) {
    if (flags[idx] === 1) result.push(idx);
  }
  return result;
}

/**
 * Thuật toán tìm nước đi AI tối ưu hóa bằng mảng 1D phẳng (siêu tốc, phản hồi dưới 1 - 5ms)
 */
export function getBestMove1D(
  board2D: Board,
  aiPlayer: Player,
  difficulty: AIDifficulty = 'medium'
): [number, number] {
  const board = board2DTo1D(board2D);
  const myVal = aiPlayer === 'X' ? PLAYER_X : PLAYER_O;
  const oppVal = aiPlayer === 'X' ? PLAYER_O : PLAYER_X;

  // 1. Khai cuộc siêu tốc (Opening Book) - 0.00ms
  let totalPieces = 0;
  let firstPieceIdx = -1;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i] !== PLAYER_EMPTY) {
      totalPieces++;
      if (firstPieceIdx === -1) firstPieceIdx = i;
    }
  }

  // Nước đầu tiên khi bàn cờ trống hoàn toàn -> Đánh ngay tâm bàn cờ [7, 7] trong 0ms!
  if (totalPieces === 0) {
    return [7, 7];
  }

  // Nước đầu tiên của AI khi đối thủ vừa đánh 1 nước -> Phản xạ khai cuộc chuẩn Renju trong 0ms!
  if (totalPieces === 1) {
    if (firstPieceIdx === CENTER_IDX) {
      // Đối thủ chiếm tâm [7, 7] -> Đánh góc chéo [8, 8]
      return [8, 8];
    } else {
      // Đối thủ không đánh tâm -> AI chiếm ngay tâm [7, 7]!
      return [7, 7];
    }
  }

  // Nếu là nước thứ 2 của AI và tâm bàn cờ còn trống -> Chiếm ngay tâm
  if (board[CENTER_IDX] === PLAYER_EMPTY && totalPieces <= 3) {
    return [7, 7];
  }

  // 2. Lấy danh sách nước đi ứng viên lân cận
  const candidates = getCandidateMoves1D(board);
  if (candidates.length === 0) {
    return [7, 7];
  }

  // 3. Phản xạ sát thủ (0.1ms):
  // AI có nước thắng ngay 5 quân -> Kết liễu ngay lập tức!
  for (const idx of candidates) {
    board[idx] = myVal;
    const win = isWin1D(board, idx, myVal);
    board[idx] = PLAYER_EMPTY;
    if (win) return idxToRowCol(idx);
  }

  // Đối thủ có nước thắng ngay 5 quân -> Bắt buộc chặn đứng ngay!
  for (const idx of candidates) {
    board[idx] = oppVal;
    const win = isWin1D(board, idx, oppVal);
    board[idx] = PLAYER_EMPTY;
    if (win) return idxToRowCol(idx);
  }

  // 4. Lượng giá nhanh các nước đi ứng viên
  const scoredCandidates = candidates
    .map((idx) => {
      const attack = evaluatePoint1D(board, idx, myVal);
      const defense = evaluatePoint1D(board, idx, oppVal);
      const score = attack + defense * 1.25;
      return { idx, attack, defense, score };
    })
    .sort((a, b) => b.score - a.score);

  // Chặn nguy cơ Open 4 (Tạo 4 mở hoặc chặn đối phương tạo 4 mở)
  const top = scoredCandidates[0];
  if (top.attack >= SCORES.OPEN_4 || top.defense >= SCORES.OPEN_4) {
    return idxToRowCol(top.idx);
  }

  // Chế độ DỄ: Lấy ngẫu nhiên nhẹ trong top 3 nước tốt nhất
  if (difficulty === 'easy') {
    const pick = scoredCandidates[Math.floor(Math.random() * Math.min(3, scoredCandidates.length))];
    return idxToRowCol(pick.idx);
  }

  // Chế độ TRUNG BÌNH: Đánh theo lượng giá Heuristic tốt nhất (~0.5ms)
  if (difficulty === 'medium') {
    return idxToRowCol(top.idx);
  }

  // Chế độ CAO THỦ: Minimax Alpha-Beta tìm kiếm 2 tầng trên top 8 nước nguy hiểm nhất (~2-5ms)
  const topMoves = scoredCandidates.slice(0, 8);
  let bestIdx = topMoves[0].idx;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of topMoves) {
    board[move.idx] = myVal;

    const score = minimax1D(
      board,
      2,
      alpha,
      beta,
      false,
      myVal,
      oppVal,
      move.idx
    );

    board[move.idx] = PLAYER_EMPTY;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = move.idx;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return idxToRowCol(bestIdx);
}

function minimax1D(
  board: Int8Array,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  myVal: number,
  oppVal: number,
  lastIdx: number
): number {
  const lastVal = isMaximizing ? oppVal : myVal;
  if (isWin1D(board, lastIdx, lastVal)) {
    return isMaximizing ? -SCORES.WIN : SCORES.WIN;
  }

  if (depth <= 0) {
    const attack = evaluatePoint1D(board, lastIdx, myVal);
    const defense = evaluatePoint1D(board, lastIdx, oppVal);
    return attack - defense * 1.2;
  }

  const candidates = getCandidateMoves1D(board);
  if (candidates.length === 0) return 0;

  const currentVal = isMaximizing ? myVal : oppVal;
  const otherVal = isMaximizing ? oppVal : myVal;

  const topMoves = candidates
    .map((idx) => ({
      idx,
      score: evaluatePoint1D(board, idx, currentVal) + evaluatePoint1D(board, idx, otherVal) * 1.2,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const m of topMoves) {
      board[m.idx] = myVal;
      const ev = minimax1D(board, depth - 1, alpha, beta, false, myVal, oppVal, m.idx);
      board[m.idx] = PLAYER_EMPTY;

      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of topMoves) {
      board[m.idx] = oppVal;
      const ev = minimax1D(board, depth - 1, alpha, beta, true, myVal, oppVal, m.idx);
      board[m.idx] = PLAYER_EMPTY;

      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}
