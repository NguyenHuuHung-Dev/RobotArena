import { Vector2D, GridPosition, Direction, MazeCell } from '@robot-arena/shared-types';

/**
 * Sensor readings provided to an algorithmic maze solver robot at each tick.
 */
export interface MazeSensorReadings {
  position: GridPosition;
  direction: Direction;
  currentCell: MazeCell;
  adjacentWalls: {
    north: boolean;
    east: boolean;
    south: boolean;
    west: boolean;
    front: boolean;
    left: boolean;
    right: boolean;
    back: boolean;
  };
  availableDirections: Direction[];
  availableNeighbors: GridPosition[];
  goal: GridPosition;
  manhattanDistanceToGoal: number;
  euclideanDistanceToGoal: number;
  mazeDimensions: {
    rows: number;
    cols: number;
  };
  /**
   * @deprecated BỊ CẤM HOÀN TOÀN (ANTI-CHEAT SANDBOX):
   * Trong giải đấu, robot chỉ khám phá bằng sương mù (Fog of War) và cảm biến cục bộ.
   * Không cung cấp bản đồ toàn cảnh. Robot phải tự xây dựng bộ nhớ (Internal Memory Grid).
   */
  fullMazeMap?: undefined;
}

/**
 * Information detected about a scanned robot in combat arena.
 */
export interface ScannedRobotData {
  id: string;
  name: string;
  position: Vector2D;
  distance: number;
  bearing: number;
  hp: number;
  energy: number;
  velocity: number;
}

/**
 * Result of a radar sweep performed by a robot.
 */
export interface RadarScanResult {
  radarAngle: number;
  sweepAngle: number;
  maxRange: number;
  detectedRobots: ScannedRobotData[];
  detectedObstacles: Array<{
    id: string;
    position: Vector2D;
    distance: number;
  }>;
}

/**
 * Reading from a short-range proximity / ultrasonic sensor.
 */
export interface ProximitySensorReading {
  sensorIndex: number;
  angleOffset: number;
  distanceToObstacle: number;
  detectedType?: 'wall' | 'robot' | 'obstacle' | 'none';
}

/**
 * Complete sensor bundle provided to a combat robot at each tick.
 */
export interface SensorReadings {
  radar: RadarScanResult | null;
  proximitySensors: ProximitySensorReading[];
  wallDistanceAhead: number;
  currentHeading: number;
  currentPosition: Vector2D;
  currentHp: number;
  currentEnergy: number;
}
