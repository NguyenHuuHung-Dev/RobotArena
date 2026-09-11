import { Vector2D } from '@robot-arena/shared-types';
import {
  RobotAction,
  SensorReadings,
  RadarScanResult,
  ProximitySensorReading,
} from '@robot-arena/simulation-types';
import { clamp } from './math';

/**
 * The execution context passed into the robot's lifecycle callbacks.
 * Allows reading sensor telemetry and enqueuing actions for the tick.
 */
export class RobotContext {
  private _actions: RobotAction[] = [];
  private _sensors: SensorReadings;
  private _tick: number;

  constructor(sensors: SensorReadings, tick: number) {
    this._sensors = sensors;
    this._tick = tick;
  }

  /**
   * Current simulation tick number.
   */
  get tick(): number {
    return this._tick;
  }

  /**
   * Current position of the robot in the arena (x, y).
   */
  get position(): Vector2D {
    return { ...this._sensors.currentPosition };
  }

  /**
   * Current chassis orientation heading in degrees (0 - 360).
   */
  get heading(): number {
    return this._sensors.currentHeading;
  }

  /**
   * Current remaining Hit Points (0 - 100).
   */
  get hp(): number {
    return this._sensors.currentHp;
  }

  /**
   * Current available Energy (0 - 100).
   */
  get energy(): number {
    return this._sensors.currentEnergy;
  }

  /**
   * Proximity sensor readings around the robot body.
   */
  get proximitySensors(): readonly ProximitySensorReading[] {
    return this._sensors.proximitySensors;
  }

  /**
   * Radar scan result from the previous scan, if available.
   */
  get radar(): RadarScanResult | null {
    return this._sensors.radar;
  }

  /**
   * Distance in units directly ahead before intersecting an arena boundary wall.
   */
  get wallDistanceAhead(): number {
    return this._sensors.wallDistanceAhead;
  }

  /**
   * Drive the robot chassis forward or backward.
   * @param speed Value between -1.0 (full reverse) and 1.0 (full speed ahead).
   */
  move(speed: number): this {
    this._actions.push({
      type: 'move',
      speed: clamp(speed, -1.0, 1.0),
    });
    return this;
  }

  /**
   * Turn the robot chassis.
   * @param turnRate Degrees per tick (positive = clockwise, negative = counter-clockwise).
   */
  rotate(turnRate: number): this {
    this._actions.push({
      type: 'rotate',
      turnRate: clamp(turnRate, -45, 45),
    });
    return this;
  }

  /**
   * Rotate the robot's weapon turret independently of the chassis.
   * @param turnRate Degrees per tick (positive = clockwise, negative = counter-clockwise).
   */
  rotateTurret(turnRate: number): this {
    this._actions.push({
      type: 'rotateTurret',
      turnRate: clamp(turnRate, -45, 45),
    });
    return this;
  }

  /**
   * Fire a weapon projectile.
   * @param firePower Energy invested in the shot (typically 1.0 to 10.0). Higher power deals more damage.
   */
  shoot(firePower: number = 2.0): this {
    this._actions.push({
      type: 'shoot',
      firePower: Math.max(0.5, Math.min(10.0, firePower)),
    });
    return this;
  }

  /**
   * Sweep radar across an angle.
   * @param sweepAngle Arc spread in degrees.
   * @param range Maximum detection distance.
   */
  scan(sweepAngle: number = 360, range: number = 600): this {
    this._actions.push({
      type: 'scan',
      sweepAngle: clamp(sweepAngle, 5, 360),
      range: clamp(range, 50, 1200),
    });
    return this;
  }

  /**
   * Enable or disable defensive forcefield shield. Consumes energy over time.
   */
  setShield(active: boolean): this {
    this._actions.push({
      type: 'shield',
      active,
    });
    return this;
  }

  /**
   * Returns and clears the queued actions for this tick.
   */
  flushActions(): RobotAction[] {
    const actions = [...this._actions];
    this._actions = [];
    return actions;
  }
}
