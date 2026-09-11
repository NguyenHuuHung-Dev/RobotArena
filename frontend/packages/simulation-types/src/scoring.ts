/**
 * Maze race performance evaluation for an individual robot.
 */
export interface MazeRaceScore {
  robotId: string;
  robotName: string;
  color: string;
  rank: number;
  hasReachedGoal: boolean;
  ticksToGoal?: number;
  stepsCount: number;
  pathLength: number;
  optimalPathLength: number;
  optimalityRatio: number; // percentage (100% = strictly optimal shortest path)
  nodesExplored: number;
  explorationEfficiency: number; // percentage of visited nodes that are part of final path
}

export interface MazeMatchResult {
  matchId: string;
  mazeDimensions: { rows: number; cols: number };
  optimalPathLength: number;
  rankings: MazeRaceScore[];
}

export interface ScoreBreakdown {
  survivalBonus: number;
  damageDealtScore: number;
  killsScore: number;
  accuracyBonus: number;
  energyEfficiencyBonus: number;
  totalScore: number;
}

export interface MatchScore {
  robotId: string;
  robotName: string;
  rank: number;
  breakdown: ScoreBreakdown;
  shotsFired: number;
  shotsHit: number;
  damageDealt: number;
  damageTaken: number;
  survivalTicks: number;
}

export interface MatchScoringResult {
  matchId: string;
  timestamp: number;
  rankings: MatchScore[];
}
