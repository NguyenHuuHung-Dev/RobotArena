/**
 * Represents a discrete 2D grid position inside a maze.
 */
export interface GridPosition {
  row: number;
  col: number;
}

/**
 * Standard cardinal directions for maze movement.
 */
export type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

/**
 * Wall configuration for a single maze cell.
 * true = wall exists, false = open passage.
 */
export interface MazeWalls {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
}

/**
 * A single cell in the maze grid.
 */
export interface MazeCell {
  row: number;
  col: number;
  walls: MazeWalls;
  isStart?: boolean;
  isGoal?: boolean;
  weight?: number;
}

/**
 * The complete maze grid representation.
 */
export interface MazeGrid {
  rows: number;
  cols: number;
  cells: MazeCell[][];
  start: GridPosition;
  goal: GridPosition;
}

/**
 * State of an algorithmic maze solver robot.
 */
export interface MazeRobotState {
  id: string;
  name: string;
  color: string;
  position: GridPosition;
  direction: Direction;
  pathHistory: GridPosition[];
  exploredCells: GridPosition[];
  stepsCount: number;
  turnsCount: number; // Count of 90-degree sharp turns
  hasReachedGoal: boolean;
  finalPathLength?: number;
  status: 'searching' | 'reached_goal' | 'trapped';
  algorithmType?: 'custom' | 'turn_optimized_astar' | 'astar' | 'bfs' | 'floodfill' | 'wall_follower' | 'dijkstra';
  
  // Continuous sub-pixel positions for 60 FPS buttery smooth animation
  visualX?: number;
  visualY?: number;
  visualAngle?: number; // In radians or degrees
  smoothedTrail?: Vector2D[];
}

/**
 * Discrete tick representation for the maze simulation.
 */
export interface MazeSimulationTick {
  tick: number;
  maze: MazeGrid;
  robots: MazeRobotState[];
  optimalShortestPath?: GridPosition[];
  smoothedOptimalPath?: Vector2D[];
  timestamp?: number;
}

/**
 * Represents the 2D Cartesian coordinate or direction vector.
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Dimensions and boundaries of the battle arena.
 */
export interface ArenaBounds {
  width: number;
  height: number;
}

/**
 * State of a robot in the arena at a specific simulation tick.
 */
export interface RobotState {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  turretDirection?: number;
  hp: number;
  energy: number;
  score: number;
  shieldActive?: boolean;
  isAlive?: boolean;
  color?: string;
  avatarUrl?: string;
}

/**
 * Represents an in-flight projectile fired by a robot.
 */
export interface ProjectileState {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  direction: number;
  speed: number;
  damage: number;
}

/**
 * Represents a static or dynamic obstacle in the arena.
 */
export interface ObstacleState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  destructible?: boolean;
  hp?: number;
}

/**
 * Current lifecycle status of a simulation match.
 */
export type MatchStatus = 'waiting' | 'running' | 'paused' | 'finished' | 'aborted';

/**
 * State of the entire simulation arena at a specific discrete tick.
 */
export interface SimulationTick {
  tick: number;
  robots: RobotState[];
  projectiles?: ProjectileState[];
  obstacles?: ObstacleState[];
  events?: string[];
  timestamp?: number;
}

/**
 * Configuration options for initializing a match.
 */
export interface MatchConfig {
  id: string;
  title: string;
  arena: ArenaBounds;
  maxTicks: number;
  tickRateHz: number;
  robotIds: string[];
}

/**
 * Final outcome and summary statistics of a match.
 */
export interface MatchSummary {
  matchId: string;
  totalTicks: number;
  durationSeconds: number;
  winnerId?: string;
  winnerName?: string;
  scores: Array<{
    robotId: string;
    robotName: string;
    score: number;
    rank: number;
    damageDealt: number;
    kills: number;
  }>;
}
