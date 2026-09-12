import { Board, Player, AIDifficulty } from './caroTypes';
import { getBestMove1D } from './caro1D';

/**
 * Thuật toán AI cờ Caro tối ưu hóa với mảng 1 chiều Int8Array và Opening Book
 * Thời gian phản hồi: 0ms cho nước khai cuộc, 1-5ms cho nước đi thông thường.
 */
export function getBestMove(
  board: Board,
  aiPlayer: Player,
  difficulty: AIDifficulty = 'medium'
): [number, number] {
  return getBestMove1D(board, aiPlayer, difficulty);
}
