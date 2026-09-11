import { Vector2D } from '@robot-arena/shared-types';

export interface CollisionEvent {
  type: 'collision';
  robotId: string;
  colliderType: 'wall' | 'robot' | 'obstacle';
  targetId?: string;
  point: Vector2D;
  damageTaken: number;
}

export interface DamageEvent {
  type: 'damage';
  victimId: string;
  attackerId?: string;
  damageAmount: number;
  remainingHp: number;
  reason: 'projectile' | 'collision' | 'out_of_bounds' | 'hazard';
}

export interface RobotDestroyedEvent {
  type: 'robotDestroyed';
  robotId: string;
  killerId?: string;
  deathTick: number;
  position: Vector2D;
}

export interface MatchStartedEvent {
  type: 'matchStarted';
  matchId: string;
  timestamp: number;
  participatingRobots: string[];
}

export interface MatchEndedEvent {
  type: 'matchEnded';
  matchId: string;
  winnerId?: string;
  finalTick: number;
  reason: 'last_robot_standing' | 'time_limit' | 'score_limit' | 'admin_stop';
}

export interface ProjectileHitEvent {
  type: 'projectileHit';
  projectileId: string;
  shooterId: string;
  targetId?: string;
  location: Vector2D;
  hitType: 'robot' | 'wall' | 'obstacle' | 'shield';
}

/**
 * All possible simulation events triggered during match lifecycle.
 */
export type SimulationEvent =
  | CollisionEvent
  | DamageEvent
  | RobotDestroyedEvent
  | MatchStartedEvent
  | MatchEndedEvent
  | ProjectileHitEvent;
