import { Direction, GridPosition } from '@robot-arena/shared-types';

/**
 * Maze solver movement action: step into the adjacent cell in the current heading.
 */
export interface MazeMoveForwardAction {
  type: 'move_forward';
}

/**
 * Maze solver rotation actions.
 */
export interface MazeTurnAction {
  type: 'turn_left' | 'turn_right' | 'turn_around';
}

/**
 * Direct target step (e.g. for algorithms returning next coordinate directly).
 */
export interface MazeStepToAction {
  type: 'step_to';
  target: GridPosition;
}

/**
 * Direct direction step (moves into that cardinal direction).
 */
export interface MazeMoveDirectionAction {
  type: 'move_direction';
  direction: Direction;
}

/**
 * All possible actions an algorithmic maze robot can return.
 */
export type MazeAction =
  | MazeMoveForwardAction
  | MazeTurnAction
  | MazeStepToAction
  | MazeMoveDirectionAction;

/**
 * Direct movement order: drive forward or backward with a target speed.
 */
export interface MoveAction {
  type: 'move';
  speed: number;
}

/**
 * Rotate the robot chassis.
 */
export interface RotateAction {
  type: 'rotate';
  turnRate: number;
}

/**
 * Rotate the robot turret/cannon independently of the chassis.
 */
export interface RotateTurretAction {
  type: 'rotateTurret';
  turnRate: number;
}

/**
 * Aim and sweep the radar sensor.
 */
export interface ScanAction {
  type: 'scan';
  sweepAngle: number;
  range: number;
}

/**
 * Fire the primary weapon/projectile.
 */
export interface ShootAction {
  type: 'shoot';
  firePower: number;
}

/**
 * Activate or deactivate energy defensive shield.
 */
export interface ShieldAction {
  type: 'shield';
  active: boolean;
}

/**
 * Discriminated union of all possible robot actions per tick.
 */
export type RobotAction =
  | MoveAction
  | RotateAction
  | RotateTurretAction
  | ScanAction
  | ShootAction
  | ShieldAction;

/**
 * Set of simultaneous actions returned by a robot for execution during a single simulation tick.
 */
export interface RobotActionBatch {
  robotId: string;
  actions: RobotAction[];
}
