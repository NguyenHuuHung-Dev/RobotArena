import { IRobot, RobotMetadata, IMazeSolverRobot } from './robot';

export interface DefinedRobot {
  metadata: RobotMetadata;
  robot: IRobot;
}

export interface DefinedMazeSolver {
  metadata: RobotMetadata;
  solver: IMazeSolverRobot;
}

/**
 * Helper factory to define an algorithmic maze solving robot.
 * Used by tournament participants in the Monaco Editor or custom files.
 *
 * @example
 * export default defineMazeSolver({
 *   name: 'A-Star Pathfinder',
 *   author: 'Champion',
 *   color: '#38bdf8',
 * }, {
 *   init(config) {
 *     console.log('Maze initialized', config);
 *   },
 *   onStep(sensor) {
 *     // Return next move or target position
 *     return sensor.availableNeighbors[0];
 *   }
 * });
 */
export function defineMazeSolver(
  metadata: RobotMetadata,
  solver: IMazeSolverRobot
): DefinedMazeSolver {
  return {
    metadata,
    solver,
  };
}

/**
 * Helper factory to define a combat robot.
 */
export function defineRobot(
  metadata: RobotMetadata,
  behavior: IRobot
): DefinedRobot {
  return {
    metadata,
    robot: behavior,
  };
}
