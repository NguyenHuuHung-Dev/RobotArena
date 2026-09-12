import { getBestMove1D } from './caro1D';
import { Board, AIDifficulty, Player } from './caroTypes';

export interface CaroWorkerRequest {
  id: number;
  board: Board;
  aiPlayer: Player;
  difficulty: AIDifficulty;
}

export interface CaroWorkerResponse {
  id: number;
  row: number;
  col: number;
}

self.onmessage = (e: MessageEvent<CaroWorkerRequest>) => {
  const { id, board, aiPlayer, difficulty } = e.data;
  const [row, col] = getBestMove1D(board, aiPlayer, difficulty);
  const response: CaroWorkerResponse = { id, row, col };
  self.postMessage(response);
};
