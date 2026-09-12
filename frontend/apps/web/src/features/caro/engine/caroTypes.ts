export type Player = 'X' | 'O';
export type CellValue = Player | null;

export type Board = CellValue[][];

export interface Move {
  row: number;
  col: number;
  player: Player;
  timestamp?: number;
}

export type GameMode = 'pve' | 'pvp';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface WinLine {
  cells: [number, number][];
  winner: Player;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  history: Move[];
  winner: Player | null;
  winLine: WinLine | null;
  isDraw: boolean;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  aiPlayer: Player;
  isThinking: boolean;
}

export const BOARD_SIZE = 15;
