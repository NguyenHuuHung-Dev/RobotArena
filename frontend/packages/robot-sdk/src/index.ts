export * from './math';
export * from './context';
export * from './robot';
export * from './builder';

// Re-export simulation and shared types for robot authors
export type {
  ScannedRobotData,
  RadarScanResult,
  ProximitySensorReading,
  RobotAction,
  DamageEvent,
  CollisionEvent,
  MazeSensorReadings,
  MazeAction,
  MazeRaceScore,
  MazeMatchResult,
} from '@robot-arena/simulation-types';
export type {
  Vector2D,
  RobotState,
  GridPosition,
  Direction,
  MazeWalls,
  MazeCell,
  MazeGrid,
  MazeRobotState,
  MazeSimulationTick,
} from '@robot-arena/shared-types';
