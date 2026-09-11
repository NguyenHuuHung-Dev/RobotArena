import { ScannedRobotData, DamageEvent, CollisionEvent, MazeSensorReadings, MazeAction } from '@robot-arena/simulation-types';
import { GridPosition, Direction, MazeGrid } from '@robot-arena/shared-types';
import { RobotContext } from './context';

/**
 * Metadata configuration describing the custom robot.
 */
export interface RobotMetadata {
  name: string;
  author?: string;
  version?: string;
  description?: string;
  color?: string;
}

/**
 * Configuration passed to a maze solver before match begins.
 */
export interface MazeInitConfig {
  start: GridPosition;
  goal: GridPosition;
  mazeDimensions: { rows: number; cols: number };
  maze?: MazeGrid;
}

/**
 * Core interface for an algorithmic maze solving robot.
 */
export interface IMazeSolverRobot {
  /**
   * Called when maze match initializes.
   */
  init?(config: MazeInitConfig): void;

  /**
   * Primary step decision hook called at each simulation tick.
   * Return a MazeAction (e.g. { type: 'move_forward' } or { type: 'step_to', target: pos })
   * or directly the next target GridPosition or Direction.
   */
  onStep(sensor: MazeSensorReadings): MazeAction | Direction | GridPosition;
}

/**
 * Legacy interface that combat robots implement.
 */
export interface IRobot {
  init?(context: RobotContext): void;
  onTick(context: RobotContext): void;
  onScannedRobot?(scanned: ScannedRobotData, context: RobotContext): void;
  onHitByProjectile?(event: DamageEvent, context: RobotContext): void;
  onCollision?(event: CollisionEvent, context: RobotContext): void;
}
